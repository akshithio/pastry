import { db } from "~/server/db";
import type { ChatMessage } from "../utils/chat-utils";

export async function createUserMessage(
  userMessage: ChatMessage,
  conversationId: string,
  userId: string,
) {
  console.log(
    "Last message attachments:",
    userMessage.experimental_attachments,
  );

  return await db.message.create({
    data: {
      role: "user",
      content: userMessage.content,
      conversation: {
        connect: {
          id: conversationId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
      ...(userMessage.experimental_attachments &&
        userMessage.experimental_attachments.length > 0 && {
          attachments: {
            create: userMessage.experimental_attachments.map((attachment) => ({
              name: attachment.name,
              contentType: attachment.contentType,
              url: attachment.url,
            })),
          },
        }),
    },
  });
}

export async function createAssistantMessage(
  content: string,
  conversationId: string,
  userId: string,
  streamId: string | null = null,
  isStreaming: boolean = false,
  reasoning?: string,
) {
  return await db.message.create({
    data: {
      role: "assistant",
      content,
      isStreaming,
      streamId,
      reasoning,
      conversation: {
        connect: {
          id: conversationId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export async function updateMessageContent(
  messageId: string,
  content: string,
  isStreaming = false,
  partialContent?: string | null,
) {
  return await db.message.update({
    where: { id: messageId },
    data: {
      content,
      isStreaming,
      ...(partialContent !== undefined && { partialContent }),
    },
  });
}

export async function updatePartialContent(
  messageId: string,
  partialContent: string,
) {
  try {
    await db.message.update({
      where: { id: messageId },
      data: {
        partialContent,
      },
    });
  } catch (error) {
    console.error("Error updating partial content:", error);
  }
}

export function processMessagesForAI(messages: ChatMessage[]) {
  return messages.map((msg) => {
    const attachments =
      msg.experimental_attachments && msg.experimental_attachments.length > 0
        ? msg.experimental_attachments
        : msg.attachments || [];

    let textContent = msg.content || "";

    const imageParts: Array<{ type: "image"; image: string }> = [];

    if (attachments && attachments.length > 0) {
      attachments.forEach((att) => {
        if (!att || typeof att !== "object") return;

        if (att.contentType?.startsWith("image/") && att.url) {
          imageParts.push({ type: "image", image: att.url });
        } else if (att.contentType === "application/pdf") {
          const pdfText = (att.processedText || att.content || "").trim();
          if (pdfText) {
            textContent +=
              `\n\n--- PDF Document: ${att.name || "Unnamed"} ---\n` +
              pdfText +
              "\n--- End of PDF Document ---";
          }
        }
      });
    }

    if (imageParts.length > 0) {
      return {
        role: msg.role,
        content: [{ type: "text", text: textContent }, ...imageParts],
      } as const;
    }

    return {
      role: msg.role,
      content: textContent,
    } as const;
  });
}

export async function updateMessageWithReasoning(
  messageId: string,
  reasoning: string,
) {
  return await db.message.update({
    where: { id: messageId },
    data: {
      reasoning: reasoning,
    },
  });
}
