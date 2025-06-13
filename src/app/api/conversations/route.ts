import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";
import { broadcastToUser } from "./events/route";

export async function GET(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 });
  }

  try {
    const conversations = await db.conversation.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      title,
      initialMessages,
      isBranched,
      isPublic,
      model,
      initialMessage,
    } = (await req.json()) as {
      title: string;
      initialMessages?: Array<{ role: string; content: string }>;
      isBranched?: boolean;
      isPublic?: boolean;
      model?: string;
      initialMessage?: string;
    };

    const conversation = await db.conversation.create({
      data: {
        title: title || "New Thread",
        userId: session.user.id,
        isBranched: isBranched ?? false,
        isPublic: isPublic ?? false,
        model: model ?? "Pixtral 12B",
      },
    });

    broadcastToUser(session.user.id, {
      type: "conversation_created",
      conversation: conversation,
    });

    if (initialMessage) {
      await db.message.create({
        data: {
          content: initialMessage,
          role: "user",
          userId: session.user.id,
          conversationId: conversation.id,
        },
      });

      const chatApiUrl = new URL("/api/chat", req.url);
      fetch(chatApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: initialMessage }],
          conversationId: conversation.id,
          provider: "mistral",
          modelId: model ?? "pixtral-12b-2409",
          stream: true,
        }),
      }).catch((err) => {
        console.error("Failed to trigger initial AI response:", err);
      });
    }

    if (initialMessages && initialMessages.length > 0) {
      await db.message.createMany({
        data: initialMessages.map((msg) => ({
          content: msg.content,
          role: msg.role,
          userId: session.user.id,
          conversationId: conversation.id,
        })),
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, title } = (await req.json()) as {
      conversationId: string;
      title: string;
    };

    const updatedConversation = await db.conversation.update({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      data: {
        title,
      },
    });

    broadcastToUser(session.user.id, {
      type: "conversation_updated",
      conversation: updatedConversation,
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
