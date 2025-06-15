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
  streamId?: string,
  isStreaming = false,
) {
  return await db.message.create({
    data: {
      role: "assistant",
      content,
      isStreaming,
      ...(streamId && { streamId }),
      ...(isStreaming && { partialContent: "" }),
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

    if (msg.attachments && msg.attachments.length > 0) {
      const content = [
        { type: "text", text: msg.content },
        ...msg.attachments
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
}
