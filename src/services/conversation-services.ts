import { db } from "~/server/db";

export async function createConversation(userId: string) {
  return db.conversation.create({
    data: {
      userId,
      title: "New Thread",
    },
  });
}
import {
  generateConversationTitle,
  updateConversationTitleAndBroadcast,
} from "../utils/chat-utils";

export async function getConversationWithMessages(
  conversationId: string,
  userId: string,
) {
  return await db.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      messages: {
        where: {
          content: {
            not: "__STREAM_TRACKER__",
          },
        },
        orderBy: { createdAt: "asc" },

        include: {
          attachments: true,
        },
      },
    },
  });
}

export async function getConversation(conversationId: string, userId: string) {
  return await db.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
  });
}

export async function updateConversationTimestamp(conversationId: string) {
  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function handleTitleGeneration(
  conversationId: string,
  userId: string,
) {
  try {
    const currentConversation = await db.conversation.findUnique({
      where: { id: conversationId },
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
            conversationId,
            newTitle,
            userId,
          );
        } else {
          await updateConversationTimestamp(conversationId);
        }
      } else {
        await updateConversationTimestamp(conversationId);
      }
    } else {
      await updateConversationTimestamp(conversationId);
    }
  } catch (error) {
    console.error("Error in title generation:", error);
    await updateConversationTimestamp(conversationId);
  }
}
