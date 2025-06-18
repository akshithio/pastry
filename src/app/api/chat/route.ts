import { streamText, tool, type CoreMessage } from "ai";
import Exa from "exa-js";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { broadcastToUser } from "~/app/api/conversations/events/route";
import type { ModelName } from "~/model_config";
import {
  MODEL_CONFIG,
  modelCanReason,
  modelSupportsTools,
} from "~/model_config";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";
import {
  createConversation,
  getConversation,
  getConversationWithMessages,
  handleTitleGeneration,
} from "~/services/conversation-services";
import {
  createAssistantMessage,
  createUserMessage,
  processMessagesForAI,
  updateMessageWithReasoning,
} from "~/services/message-services";
import { createAIModel, DEFAULT_SYSTEM_PROMPT } from "~/utils/ai-model-factory";
import { type RequestBody } from "~/utils/chat-utils";
import { generatePersonalizedSystemPrompt } from "~/utils/systemPromptGenerator";

interface Attachment {
  name: string;
  contentType: string;
  url: string;
  processedText?: string;
  content?: string;
}

interface EnhancedRequestBody extends RequestBody {
  experimental_attachments?: Attachment[];
}

async function getUserPreferences(userId: string) {
  try {
    const preferences = await db.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      return null;
    }

    return {
      userName: preferences.userName,
      userRole: preferences.userRole,
      traits: preferences.traits,
      additionalInfo: preferences.additionalInfo,
      disableComments: preferences.disableComments,
    };
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return null;
  }
}

const exa = new Exa(process.env.EXA_API_KEY);

const webSearch = tool({
  description:
    "Search the web for up-to-date information on current events, recent developments, or factual information",
  parameters: z.object({
    query: z.string().min(1).max(100).describe("The search query"),
  }),
  execute: async ({ query }) => {
    try {
      const { results } = await exa.searchAndContents(query, {
        livecrawl: "always",
        numResults: 5,
        text: true,
        highlights: true,
      });

      return results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.text?.slice(0, 2000) || "",
        publishedDate: result.publishedDate,
        highlights: result.highlights,
      }));
    } catch (error) {
      console.error("Web search error:", error);
      return [
        {
          title: "Search Error",
          url: "",
          content: "Unable to perform web search at this time.",
          publishedDate: null,
          highlights: [],
        },
      ];
    }
  },
});

function enhanceMessageWithPDFContent(
  content: string,
  attachments: Attachment[] = [],
): string {
  if (!attachments || !Array.isArray(attachments)) {
    return content || "";
  }

  const pdfAttachments = attachments.filter((att) => {
    if (!att || typeof att !== "object") return false;
    return (
      att.contentType === "application/pdf" &&
      (att.processedText ?? att.content)
    );
  });

  if (pdfAttachments.length === 0) {
    return content ?? "";
  }

  let enhancedContent = content || "";
  if (enhancedContent.trim()) {
    enhancedContent += "\n\n";
  }

  pdfAttachments.forEach((pdf) => {
    try {
      const pdfContent = pdf.content ?? pdf.processedText ?? "";
      if (pdfContent.trim()) {
        enhancedContent += `--- PDF Document: ${pdf.name || "Unknown"} ---\n${pdfContent}\n--- End of PDF Document ---\n\n`;
      }
    } catch (error) {
      console.error(`Error processing PDF ${pdf.name}:`, error);
    }
  });

  return enhancedContent.trim();
}

function convertAttachmentsToContent(
  textContent: string,
  attachments: Attachment[] = [],
): string | Array<{ type: string; text?: string; image?: string }> {
  if (!attachments || !Array.isArray(attachments)) {
    return textContent || "";
  }

  const enhancedText = enhanceMessageWithPDFContent(textContent, attachments);

  const imageAttachments = attachments.filter((att) => {
    if (!att || typeof att !== "object") return false;
    return att.contentType && att.contentType.startsWith("image/") && att.url;
  });

  if (imageAttachments.length === 0) {
    return enhancedText;
  }

  const contentParts: Array<{ type: string; text?: string; image?: string }> =
    [];

  if (enhancedText.trim()) {
    contentParts.push({
      type: "text",
      text: enhancedText,
    });
  }

  imageAttachments.forEach((attachment) => {
    try {
      contentParts.push({
        type: "image",
        image: attachment.url,
      });
    } catch (error) {
      console.error(`Error processing image ${attachment.name}:`, error);
    }
  });

  return contentParts;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return Response.json(
        { error: "conversationId is required" },
        { status: 400 },
      );
    }

    const conversation = await getConversationWithMessages(
      conversationId,
      session.user.id,
    );

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    return Response.json(conversation.messages);
  } catch (error) {
    console.error("API GET /api/chat error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: EnhancedRequestBody;
    try {
      body = (await req.json()) as EnhancedRequestBody;
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const {
      messages,
      provider,
      modelId,
      system,
      experimental_attachments,
      conversationId,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages array is required and cannot be empty" },
        { status: 400 },
      );
    }

    if (!provider || !modelId) {
      return Response.json(
        { error: "Provider and modelId are required" },
        { status: 400 },
      );
    }

    let finalConversationId = conversationId;

    if (finalConversationId) {
      try {
        const conversation = await getConversation(
          finalConversationId,
          session.user.id,
        );
        if (!conversation) {
          return Response.json(
            { error: "Conversation not found" },
            { status: 404 },
          );
        }
      } catch (conversationError) {
        console.error(
          "Error checking existing conversation:",
          conversationError,
        );
        return Response.json(
          { error: "Error checking conversation" },
          { status: 500 },
        );
      }
    } else {
      try {
        const newConversation = await createConversation(session.user.id);
        finalConversationId = newConversation.id;
      } catch (createError) {
        console.error("Error creating new conversation:", createError);
        return Response.json(
          { error: "Error creating conversation" },
          { status: 500 },
        );
      }
    }

    const userMessage = messages.at(-1);
    if (!userMessage || userMessage.role !== "user") {
      return Response.json(
        { error: "Last message must be from user" },
        { status: 400 },
      );
    }

    try {
      await createUserMessage(
        {
          ...userMessage,
          content: enhanceMessageWithPDFContent(
            userMessage.content ?? "",
            experimental_attachments ?? [],
          ),
          experimental_attachments,
        },
        finalConversationId,
        session.user.id,
      );
    } catch (dbError) {
      console.error("Error creating user message in database:", dbError);
      return Response.json(
        { error: "Error saving user message" },
        { status: 500 },
      );
    }

    try {
      const userPreferences = await getUserPreferences(session.user.id);
      const personalizedSystemPrompt = generatePersonalizedSystemPrompt(
        userPreferences,
        system ?? DEFAULT_SYSTEM_PROMPT,
      );
      const model = createAIModel(provider, modelId);
      const processedMessages = processMessagesForAI(messages);

      const coreMessagesForAI: CoreMessage[] = processedMessages.map(
        (msg, index) => {
          if (index === processedMessages.length - 1 && msg.role === "user") {
            const convertedContent = convertAttachmentsToContent(
              msg.content as string,
              experimental_attachments,
            );

            return {
              role: "user",
              content: convertedContent,
            };
          }

          return {
            role: msg.role === "assistant" ? "assistant" : "user",
            content: (msg.content as string) || "",
          };
        },
      );

      const currentModelName = Object.keys(MODEL_CONFIG).find(
        (name) =>
          MODEL_CONFIG[name as ModelName].modelId === modelId &&
          MODEL_CONFIG[name as ModelName].provider === provider,
      ) as ModelName | undefined;

      const supportsTools = currentModelName
        ? modelSupportsTools(currentModelName)
        : false;

      const supportsReasoning = currentModelName
        ? modelCanReason(currentModelName)
        : false;

      if (finalConversationId) {
        broadcastToUser(session.user.id, {
          type: "conversation_streaming",
          conversationId: finalConversationId,
          isStreaming: true,
        });
      }

      let reasoningText = "";
      let finalText = "";

      const streamOptions: any = {
        model,
        system: personalizedSystemPrompt,
        messages: coreMessagesForAI,
        maxSteps: supportsTools ? 3 : 1,

        onChunk({ chunk }) {
          console.log(`📦 Chunk type: ${chunk.type}`);

          if (chunk.type === "reasoning" && supportsReasoning) {
            const chunkText = chunk.textDelta || chunk.text || "";

            if (chunkText) {
              reasoningText += chunkText;
              console.log(
                "🧠 Reasoning accumulated:",
                reasoningText.length,
                "chars",
              );

              if (finalConversationId) {
                // Send both the delta and the full accumulated reasoning
                broadcastToUser(session.user.id, {
                  type: "reasoning_chunk",
                  conversationId: finalConversationId,
                  textDelta: chunkText, // Just this chunk
                  fullReasoning: reasoningText, // Full accumulated reasoning so far
                });
              }
            }
          }

          if (chunk.type === "text-delta") {
            const deltaText = chunk.textDelta || chunk.text || "";
            finalText += deltaText;
          }

          if (
            !["reasoning", "text-delta", "tool-call", "tool-result"].includes(
              chunk.type,
            )
          ) {
            console.log(
              "🔍 Other chunk:",
              chunk.type,
              JSON.stringify(chunk, null, 2),
            );
          }
        },

        async onFinish(event) {
          try {
            console.log("=== API onFinish started ===");

            if (!finalConversationId) {
              console.error("❌ No conversation ID in onFinish");
              return;
            }

            const finalMessageText = event.text || finalText || "";
            const finalReasoning = event.reasoning || reasoningText || "";

            console.log("📝 Final text length:", finalMessageText.length);
            console.log("🧠 Final reasoning length:", finalReasoning.length);

            const assistantMessage = await createAssistantMessage(
              finalMessageText,
              finalConversationId,
              session.user.id,
              null,
              false,
            );

            // Only update with reasoning if we have it and haven't already sent it via chunks
            if (supportsReasoning && finalReasoning.trim()) {
              await updateMessageWithReasoning(
                assistantMessage.id,
                finalReasoning,
              );

              // Send final reasoning complete signal (no need to send the text again)
              broadcastToUser(session.user.id, {
                type: "reasoning_complete",
                conversationId: finalConversationId,
                messageId: assistantMessage.id, // Include message ID for reference
              });
            }

            await handleTitleGeneration(finalConversationId, session.user.id);

            console.log("✅ API onFinish completed successfully");
          } catch (finishError) {
            console.error("❌ Error in onFinish:", finishError);
          } finally {
            if (finalConversationId) {
              broadcastToUser(session.user.id, {
                type: "conversation_streaming",
                conversationId: finalConversationId,
                isStreaming: false,
              });
            }
          }
        },

        async onError(error) {
          console.error("❌ Stream error:", error);

          if (finalConversationId) {
            broadcastToUser(session.user.id, {
              type: "conversation_streaming",
              conversationId: finalConversationId,
              isStreaming: false,
            });
          }
        },
      };

      if (supportsTools) {
        streamOptions.tools = { webSearch };
      }

      const result = await streamText(streamOptions);
      return new Response(result.toDataStream());
    } catch (streamError) {
      console.error("Error in AI streaming setup:", streamError);

      try {
        if (finalConversationId) {
          broadcastToUser(session.user.id, {
            type: "conversation_streaming",
            conversationId: finalConversationId,
            isStreaming: false,
          });
        }
      } catch (broadcastError) {
        console.error(
          "Error stopping broadcast after stream setup error:",
          broadcastError,
        );
      }

      return Response.json(
        {
          error: "Error initializing AI stream",
          details:
            streamError instanceof Error
              ? streamError.message
              : String(streamError),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Critical error in POST /api/chat:", error);

    return Response.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
