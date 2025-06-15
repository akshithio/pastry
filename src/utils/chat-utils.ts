import { mistral } from "@ai-sdk/mistral";
import { generateText } from "ai";
import { broadcastToUser } from "~/app/api/conversations/events/route";
import { db } from "~/server/db";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  experimental_attachments?: Array<{
    name: string;
    contentType: string;
    url: string;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    contentType: string;
    url: string;
    messageId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface RequestBody {
  messages: ChatMessage[];
  stream?: boolean;
  system?: string;
  provider: "mistral" | "google" | "anthropic" | "openai";
  modelId: string;
  conversationId?: string;
  resumeStreamId?: string;
}

export async function saveStreamId(
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

export async function updateStreamStatus(streamId: string, status: string) {
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

export async function getOngoingMessage(conversationId: string) {
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

export async function generateConversationTitle(
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

export async function updateConversationTitleAndBroadcast(
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
