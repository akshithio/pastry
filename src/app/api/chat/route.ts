import { streamText, type CoreMessage } from "ai";

import { type NextRequest } from "next/server";
import { broadcastToUser } from "~/app/api/conversations/events/route";
import { auth } from "~/server/auth/config";

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
} from "~/services/message-services";
import { createAIModel, DEFAULT_SYSTEM_PROMPT } from "~/utils/ai-model-factory";
import { type RequestBody } from "~/utils/chat-utils";

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

function enhanceMessageWithPDFContent(
  content: string,
  attachments: Attachment[] = [],
): string {
  const pdfAttachments = attachments.filter(
    (att) =>
      att.contentType === "application/pdf" &&
      (att.processedText ?? att.content),
  );

  if (pdfAttachments.length === 0) {
    return content;
  }

  let enhancedContent = content;
  if (content) {
    enhancedContent += "\n\n";
  }

  pdfAttachments.forEach((pdf) => {
    const pdfContent = pdf.content ?? pdf.processedText ?? "";
    enhancedContent += `--- PDF Document: ${pdf.name} ---\n${pdfContent}\n--- End of PDF Document ---\n\n`;
  });

  return enhancedContent.trim();
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
    console.error(
      "API GET /api/chat error:",
      error instanceof Error ? error.message : String(error),
    );
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

    const body = (await req.json()) as EnhancedRequestBody;
    const {
      messages,
      provider,
      modelId,
      system,
      experimental_attachments,
      conversationId,
    } = body;

    let finalConversationId = conversationId;

    if (finalConversationId) {
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
    } else {
      const newConversation = await createConversation(session.user.id);
      finalConversationId = newConversation.id;
    }

    const userMessage = messages.at(-1);
    if (!userMessage || userMessage.role !== "user") {
      return Response.json(
        { error: "Invalid message format" },
        { status: 400 },
      );
    }

    const content = enhanceMessageWithPDFContent(
      userMessage.content,
      experimental_attachments ?? [],
    );

    await createUserMessage(
      {
        ...userMessage,
        content,
        experimental_attachments,
      },
      finalConversationId,
      session.user.id,
    );

    const model = createAIModel(provider, modelId);

    const processedMessages = processMessagesForAI(messages);

    const coreMessagesForAI: CoreMessage[] = processedMessages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content as string,
    }));

    if (coreMessagesForAI.length > 0) {
      coreMessagesForAI.at(-1)!.content = content;
    }

    broadcastToUser(session.user.id, {
      type: "conversation_streaming",
      conversationId: finalConversationId,
      isStreaming: true,
    });

    const result = await streamText({
      model,
      system: system ?? DEFAULT_SYSTEM_PROMPT,
      messages: coreMessagesForAI,
      async onFinish(event) {
        try {
          if (!finalConversationId) {
            console.error("Conversation ID is missing after stream finish.");
            return;
          }
          await createAssistantMessage(
            event.text,
            finalConversationId,
            session.user.id,
          );
          await handleTitleGeneration(finalConversationId, session.user.id);
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
    });

    return new Response(result.toDataStream());
  } catch (error) {
    console.error(
      "API POST /api/chat error:",
      error instanceof Error ? error.message : String(error),
    );
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
