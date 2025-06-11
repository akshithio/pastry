import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { nanoid } from "nanoid";
import { type NextRequest } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  stream?: boolean;
  system?: string;
  provider: "mistral" | "google" | "anthropic" | "openai";
  modelId: string;
  conversationId?: string;
  resumeStreamId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    const {
      messages,
      stream = true,
      system,
      provider,
      modelId,
      conversationId,
      resumeStreamId,
    } = body;

    const finalConversationId =
      conversationId ?? req.headers.get("x-vercel-ai-chat-id");

    if (!finalConversationId) {
      return Response.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: finalConversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    if (resumeStreamId) {
      const existingMessage = await db.message.findFirst({
        where: {
          streamId: resumeStreamId,
          userId: session.user.id,
          conversationId: finalConversationId,
        },
      });

      if (!existingMessage) {
        return Response.json({ error: "Stream not found" }, { status: 404 });
      }

      return Response.json(
        { error: "Stream resume not implemented" },
        { status: 501 },
      );
    }

    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== "user") {
      return Response.json(
        { error: "Invalid message format" },
        { status: 400 },
      );
    }

    await db.message.create({
      data: {
        conversationId: finalConversationId,
        userId: session.user.id,
        role: "user",
        content: userMessage.content,
      },
    });

    let model;
    switch (provider) {
      case "mistral":
        model = mistral(modelId);
        break;
      case "google":
        model = google(modelId);
        break;
      default:
        return Response.json(
          { error: `Unsupported provider: ${provider}` },
          { status: 400 },
        );
    }

    if (stream) {
      const streamId = nanoid();
      let assistantMessageId: string | null = null;
      let accumulatedText = "";

      const result = streamText({
        model,
        system:
          system ??
          "You are a highly capable AI assistant focused on providing helpful, accurate, and well-structured responses. Adapt your communication style to match the user's needs - be concise for simple questions and comprehensive for complex topics. For technical requests, provide clean code with clear explanations and best practices. For creative tasks, be original and engaging while meeting the user's specific requirements. Always strive for accuracy and acknowledge when you're uncertain about information. Break down complex problems into clear steps, ask for clarification when requests are ambiguous, and focus on understanding the user's underlying goals rather than just their literal request. Maintain a friendly, professional tone while being direct and practical in your assistance.",
        messages: messages,

        onStart: async () => {
          try {
            const assistantMessage = await db.message.create({
              data: {
                conversationId: finalConversationId,
                userId: session.user.id,
                role: "assistant",
                content: "",
                isStreaming: true,
                streamId: streamId,
                partialContent: "",
              },
            });
            assistantMessageId = assistantMessage.id;
          } catch (error) {
            console.error("Error creating initial assistant message:", error);
          }
        },

        onChunk: async ({ chunk }) => {
          if (assistantMessageId && chunk.type === "text-delta") {
            accumulatedText += chunk.textDelta;
            try {
              await db.message.update({
                where: { id: assistantMessageId },
                data: {
                  partialContent: accumulatedText,
                },
              });
            } catch (error) {
              console.error("Error updating partial content:", error);
            }
          }
        },

        onFinish: async (completion) => {
          console.log("RAW AI RESPONSE:", JSON.stringify(completion, null, 2));

          try {
            if (assistantMessageId) {
              await db.message.update({
                where: { id: assistantMessageId },
                data: {
                  content: completion.text,
                  isStreaming: false,
                  partialContent: null,
                },
              });
            } else {
              await db.message.create({
                data: {
                  conversationId: finalConversationId,
                  userId: session.user.id,
                  role: "assistant",
                  content: completion.text,
                  isStreaming: false,
                  streamId: streamId,
                },
              });
            }

            await db.conversation.update({
              where: { id: finalConversationId },
              data: { updatedAt: new Date() },
            });
          } catch (error) {
            console.error("Error saving assistant message:", error);
          }
        },

        onError: async ({ error }) => {
          console.error("Stream error:", error);

          if (assistantMessageId) {
            try {
              await db.message.update({
                where: { id: assistantMessageId },
                data: {
                  isStreaming: false,
                },
              });
            } catch (dbError) {
              console.error("Error updating message on stream error:", dbError);
            }
          }
        },
      });

      return result.toDataStreamResponse();
    }
    // else {
    //   const result = await generateText({
    //     model,
    //     system: system ?? "You are a helpful AI assistant.",
    //     messages: messages,
    //   });

    //   console.log("RAW AI RESPONSE:", JSON.stringify(result, null, 2));

    //   await db.message.create({
    //     data: {
    //       conversationId: finalConversationId,
    //       userId: session.user.id,
    //       role: "assistant",
    //       content: result.text,
    //       isStreaming: false,
    //     },
    //   });

    //   await db.conversation.update({
    //     where: { id: finalConversationId },
    //     data: { updatedAt: new Date() },
    //   });

    //   return Response.json({
    //     text: result.text,
    //     finishReason: result.finishReason,
    //     usage: result.usage,
    //   });
    // }
  } catch (error) {
    console.error(
      "API route error:",
      error instanceof Error ? error.message : String(error),
    );
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
