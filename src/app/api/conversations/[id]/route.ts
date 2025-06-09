import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";

// Replace your GET method with this:
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const conversation = await db.conversation.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true,
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
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

// PATCH method to update conversation (rename, pin/unpin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params; // Await params first
    const body = (await req.json()) as { title?: string; isPinned?: boolean };

    // Build update data object dynamically
    const updateData: { title?: string; isPinned?: boolean; updatedAt: Date } =
      {
        updatedAt: new Date(),
      };

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.isPinned !== undefined) {
      updateData.isPinned = body.isPinned;
    }

    const conversation = await db.conversation.update({
      where: {
        id: id, // Use the awaited id
        userId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE method to delete conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params; // Await params first

    // First delete all messages in the conversation
    await db.message.deleteMany({
      where: { conversationId: id }, // Use the awaited id
    });

    // Then delete the conversation
    await db.conversation.delete({
      where: {
        id: id, // Use the awaited id
        userId: session.user.id,
      },
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
