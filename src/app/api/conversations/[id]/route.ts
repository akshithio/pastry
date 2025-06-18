import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";
import { broadcastToUser } from "../events/route";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const { params } = context;
  const session = await auth();

  try {
    const conversation = await db.conversation.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (conversation.isPublic) {
      return NextResponse.json(conversation);
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (conversation.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      title?: string;
      isPinned?: boolean;
      deleteMessagesAfterIndex?: number;
    };

    const conversation = await db.conversation.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (conversation.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (body.deleteMessagesAfterIndex !== undefined) {
      const messages = await db.message.findMany({
        where: {
          conversationId: params.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const messagesToDelete = messages.slice(
        body.deleteMessagesAfterIndex + 1,
      );

      if (messagesToDelete.length > 0) {
        await db.message.deleteMany({
          where: {
            id: {
              in: messagesToDelete.map((msg) => msg.id),
            },
          },
        });
      }
    }

    const updateData: { title?: string; isPinned?: boolean; updatedAt?: Date } =
      {};
    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    if (body.isPinned !== undefined) {
      updateData.isPinned = body.isPinned;
    }

    updateData.updatedAt = conversation.updatedAt;

    const updatedConversation = await db.conversation.update({
      where: {
        id: params.id,
      },
      data: updateData,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversation = await db.conversation.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (conversation.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.conversation.delete({
      where: {
        id: params.id,
      },
    });

    broadcastToUser(session.user.id, {
      type: "conversation_deleted",
      conversation: conversation,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}