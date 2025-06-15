import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth/config";
import type { Conversation } from "@prisma/client";

interface ConversationEvent {
  type:
    | "connected"
    | "conversation_created"
    | "conversation_updated"
    | "conversation_deleted"
    | "conversation_streaming";
  conversation?: Conversation;
  conversationId?: string;
  isStreaming?: boolean;
}

const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      if (!connections.has(session.user.id)) {
        connections.set(session.user.id, new Set());
      }
      connections.get(session.user.id)?.add(controller);

      // Send initial connection message
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: "connected" })}\n\n`,
        ),
      );

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        connections.get(session.user.id)?.delete(controller);
        if (connections.get(session.user.id)?.size === 0) {
          connections.delete(session.user.id);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export function broadcastToUser(userId: string, event: ConversationEvent) {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const message = `data: ${JSON.stringify(event)}\n\n`;
  const encodedMessage = new TextEncoder().encode(message);

  userConnections.forEach((controller) => {
    try {
      controller.enqueue(encodedMessage);
    } catch (error) {
      console.error("Error sending SSE message:", error);
      userConnections.delete(controller);
    }
  });
}
