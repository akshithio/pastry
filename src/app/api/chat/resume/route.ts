import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { type NextRequest } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";

interface ResumeRequestBody {
  streamId: string;
  conversationId: string;
  provider: "mistral" | "gemini";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ResumeRequestBody;
    const { streamId, conversationId, provider } = body;

    
    const interruptedMessage = await db.message.findFirst({
      where: {
        streamId: streamId,
        conversationId: conversationId,
        userId: session.user.id,
        isStreaming: true,
      },
    });

    if (!interruptedMessage) {
      return Response.json(
        { error: "Interrupted message not found" },
        { status: 404 },
      );
    }

    
    const messages = await db.message.findMany({
      where: {
        conversationId: conversationId,
        userId: session.user.id,
        createdAt: {
          lte: interruptedMessage.createdAt,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    
    const chatMessages = messages
      .filter((msg) => msg.id !== interruptedMessage.id) 
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    
    const systemPrompt = `Continue the following response from where it left off. Here's what was already generated:

${interruptedMessage.partialContent ?? ""}

Continue naturally from this point without repeating the content above.`;

    const model =
      provider === "mistral"
        ? mistral("pixtral-12b-2409")
        : google("gemini-2.0-flash");

    let accumulatedText = interruptedMessage.partialContent ?? "";

    const result = streamText({
      model,
      system: systemPrompt,
      messages: chatMessages,

      onChunk: async ({ chunk }) => {
        
        if (chunk.type === "text-delta") {
          accumulatedText += chunk.textDelta;
          try {
            await db.message.update({
              where: { id: interruptedMessage.id },
              data: {
                partialContent: accumulatedText,
              },
            });
          } catch (error) {
            console.error(
              "Error updating partial content during resume:",
              error,
            );
          }
        }
      },

      onFinish: async () => {
        try {
          
          await db.message.update({
            where: { id: interruptedMessage.id },
            data: {
              content: accumulatedText,
              isStreaming: false,
              partialContent: null,
            },
          });

          
          await db.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });
        } catch (error) {
          console.error("Error finalizing resumed message:", error);
        }
      },

      onError: async ({ error }) => {
        console.error("Resume stream error:", error);
        
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error resuming stream:", error);
    return Response.json({ error: "Failed to resume stream" }, { status: 500 });
  }
}
