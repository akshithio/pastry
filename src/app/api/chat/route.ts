import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { createDataStream, generateText, streamText } from "ai";
import { nanoid } from "nanoid";
import { type NextRequest } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";
import { broadcastToUser } from "../conversations/events/route";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  experimental_attachments?: Array<{
    name: string;
    contentType: string;
    url: string;
  }>;
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

async function saveStreamId(
  conversationId: string,
  streamId: string,
  userId: string,
) {
  try {
    await db.streamTracker.create({
      data: {
        streamId,
        conversationId,
        userId,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Error saving stream ID:", error);
  }
}

async function updateStreamStatus(streamId: string, status: string) {
  try {
    await db.streamTracker.update({
      where: { streamId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating stream status:", error);
  }
}

async function getOngoingMessage(conversationId: string) {
  try {
    return await db.message.findFirst({
      where: {
        conversationId,
        isStreaming: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting ongoing message:", error);
    return null;
  }
}

async function generateConversationTitle(
  userMessage: string,
  assistantResponse: string,
) {
  try {
    const model = mistral("pixtral-12b-2409");

    const result = await generateText({
      model,
      system: `You are a conversation title generator. Your task is to create concise, descriptive titles for conversations based on the user's initial message and the AI's response.

Rules:
- Generate titles that are 2-6 words long
- Focus on the main topic or task discussed
- Be specific and descriptive
- Use sentence case (capitalize first word and proper nouns only)
- Don't use quotes, punctuation, or "about" in titles
- Make it clear what the conversation is about at a glance

Examples:
- User asks about React hooks → "React hooks tutorial"
- User asks for recipe → "Chocolate cake recipe"
- User asks coding question → "JavaScript array methods"
- User asks for help with math → "Calculus derivatives explained"`,
      messages: [
        {
          role: "user",
          content: `Generate a title for this conversation:

User message: "${userMessage}"

AI response: "${assistantResponse.slice(0, 500)}..."

Respond with only the title, nothing else.`,
        },
      ],
      maxTokens: 20,
      temperature: 0.3,
    });

    const title = result.text.trim().replace(/["""]/g, "");
    return title;
  } catch (error) {
    console.error("Error generating title:", error);
    return null;
  }
}

async function updateConversationTitleAndBroadcast(
  conversationId: string,
  newTitle: string,
  userId: string,
) {
  try {
    const updatedConversation = await db.conversation.update({
      where: { id: conversationId },
      data: { title: newTitle },
    });

    console.log("Updated conversation title to:", newTitle);
    console.log("Broadcasting conversation update to user:", userId);

    broadcastToUser(userId, {
      type: "conversation_updated",
      conversation: updatedConversation,
    });

    console.log("Broadcast sent successfully");
    return updatedConversation;
  } catch (error) {
    console.error("Failed to update conversation title:", error);
    throw error;
  }
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

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const ongoingMessage = await getOngoingMessage(conversationId);

    if (ongoingMessage?.partialContent) {
      const streamWithPartialContent = createDataStream({
        execute: (buffer) => {
          buffer.writeData({
            type: "append-message",
            message: JSON.stringify({
              id: ongoingMessage.id,
              role: "assistant",
              content: ongoingMessage.partialContent ?? "",
            }),
          });
        },
      });

      return new Response(streamWithPartialContent, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const recentMessage = await db.message.findFirst({
      where: {
        conversationId,
        role: "assistant",
        isStreaming: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentMessage) {
      const streamWithMessage = createDataStream({
        execute: (buffer) => {
          buffer.writeData({
            type: "append-message",
            message: JSON.stringify({
              id: recentMessage.id,
              role: "assistant",
              content: recentMessage.content,
            }),
          });
        },
      });

      return new Response(streamWithMessage, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const emptyDataStream = createDataStream({
      execute: () => {},
    });

    return new Response(emptyDataStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("GET route error:", error);
    return Response.json({ error: "Failed to resume stream" }, { status: 500 });
  }
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
      include: {
        messages: {
          where: {
            content: {
              not: "__STREAM_TRACKER__",
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== "user") {
      return Response.json(
        { error: "Invalid message format" },
        { status: 400 },
      );
    }

    const userMessageData = await db.message.create({
      data: {
        conversationId: finalConversationId,
        userId: session.user.id,
        role: "user",
        content: userMessage.content,

        attachments: userMessage.experimental_attachments
          ? JSON.stringify(userMessage.experimental_attachments)
          : null,
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

    const processedMessages = messages.map((msg) => {
      if (
        msg.experimental_attachments &&
        msg.experimental_attachments.length > 0
      ) {
        const content = [
          { type: "text", text: msg.content },
          ...msg.experimental_attachments
            .filter((att) => att.contentType.startsWith("image/"))
            .map((att) => ({
              type: "image" as const,
              image: att.url,
            })),
        ];

        return {
          role: msg.role,
          content,
        };
      }

      return {
        role: msg.role,
        content: msg.content,
      };
    });

    if (stream) {
      const streamId = nanoid();
      let assistantMessageId: string | null = null;
      let accumulatedText = "";

      await saveStreamId(finalConversationId, streamId, session.user.id);

      const result = streamText({
        model,
        system:
          system ??
          "You are a highly capable AI assistant focused on providing helpful, accurate, and well-structured responses. When users share images, analyze them carefully and provide detailed, relevant information. For documents, extract and summarize key information. Adapt your communication style to match the user's needs - be concise for simple questions and comprehensive for complex topics.",
        messages: processedMessages,

        async onStart() {
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

        async onChunk({ chunk }) {
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

        async onFinish(completion) {
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

            await updateStreamStatus(streamId, "completed");

            const currentConversation = await db.conversation.findUnique({
              where: { id: finalConversationId },
              include: { messages: true },
            });

            if (
              currentConversation &&
              currentConversation.title === "New Thread"
            ) {
              const userMessages = currentConversation.messages.filter(
                (m) => m.role === "user",
              );
              const assistantMessages = currentConversation.messages.filter(
                (m) => m.role === "assistant",
              );

              if (userMessages.length === 1 && assistantMessages.length === 1) {
                const newTitle = await generateConversationTitle(
                  userMessages[0]!.content,
                  assistantMessages[0]!.content,
                );

                if (newTitle) {
                  await updateConversationTitleAndBroadcast(
                    finalConversationId,
                    newTitle,
                    session.user.id,
                  );
                } else {
                  await db.conversation.update({
                    where: { id: finalConversationId },
                    data: { updatedAt: new Date() },
                  });
                }
              } else {
                await db.conversation.update({
                  where: { id: finalConversationId },
                  data: { updatedAt: new Date() },
                });
              }
            } else {
              await db.conversation.update({
                where: { id: finalConversationId },
                data: { updatedAt: new Date() },
              });
            }
          } catch (error) {
            console.error("Error saving assistant message:", error);
            await updateStreamStatus(streamId, "failed");
          }
        },
        async onError({ error }) {
          console.error("Stream error:", error);

          await updateStreamStatus(streamId, "failed");

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

    const completion = await generateText({
      model,
      system:
        system ??
        "You are a highly capable AI assistant focused on providing helpful, accurate, and well-structured responses. When users share images, analyze them carefully and provide detailed, relevant information. For documents, extract and summarize key information.",
      messages: processedMessages,
    });

    await db.message.create({
      data: {
        conversationId: finalConversationId,
        userId: session.user.id,
        role: "assistant",
        content: completion.text,
        isStreaming: false,
      },
    });

    await db.conversation.update({
      where: { id: finalConversationId },
      data: { updatedAt: new Date() },
    });

    const currentConversation = await db.conversation.findUnique({
      where: { id: finalConversationId },
      include: { messages: true },
    });

    if (currentConversation && currentConversation.title === "New Thread") {
      const userMessages = currentConversation.messages.filter(
        (m) => m.role === "user",
      );
      const assistantMessages = currentConversation.messages.filter(
        (m) => m.role === "assistant",
      );

      if (userMessages.length === 1 && assistantMessages.length === 1) {
        const newTitle = await generateConversationTitle(
          userMessages[0]!.content,
          assistantMessages[0]!.content,
        );

        if (newTitle) {
          await updateConversationTitleAndBroadcast(
            finalConversationId,
            newTitle,
            session.user.id,
          );
        }
      }
    }

    return Response.json({ text: completion.text });
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
