import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { generateText, streamText } from "ai";
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
  provider: "mistral" | "gemini";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    const { messages, stream = true, system, provider } = body;

    // Extract conversation ID from the request headers (useChat sends it automatically)
    const conversationId = req.headers.get("x-vercel-ai-chat-id");

    if (!conversationId) {
      return Response.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
    }

    // Verify conversation belongs to user
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

    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== "user") {
      return Response.json(
        { error: "Invalid message format" },
        { status: 400 },
      );
    }

    // Save user message to database
    await db.message.create({
      data: {
        conversationId: conversationId,
        userId: session.user.id,
        role: "user",
        content: userMessage.content,
      },
    });

    const model =
      provider === "mistral"
        ? mistral("pixtral-12b-2409")
        : google("gemini-2.0-flash");

    if (stream) {
      const result = streamText({
        model,
        system: system ?? "You are a helpful AI assistant.",
        messages: messages, // Pass full conversation history
        onFinish: async (completion) => {
          // Save assistant message to database after streaming completes
          try {
            await db.message.create({
              data: {
                conversationId: conversationId,
                userId: session.user.id,
                role: "assistant",
                content: completion.text,
              },
            });

            // Update conversation's updatedAt timestamp
            await db.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });
          } catch (error) {
            console.error("Error saving assistant message:", error);
          }
        },
        onError({ error }) {
          console.error("Stream error:", error);
        },
      });

      return result.toDataStreamResponse();
    } else {
      const result = await generateText({
        model,
        system: system ?? "You are a helpful AI assistant.",
        messages: messages,
      });

      // Save assistant message to database
      await db.message.create({
        data: {
          conversationId: conversationId,
          userId: session.user.id,
          role: "assistant",
          content: result.text,
        },
      });

      // Update conversation's updatedAt timestamp
      await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return Response.json({
        text: result.text,
        finishReason: result.finishReason,
        usage: result.usage,
      });
    }
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
