import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";
import { broadcastToUser } from "../../events/route";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { isPublic } = (await req.json()) as { isPublic: boolean };

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

    const updatedConversation = await db.conversation.update({
      where: {
        id: params.id,
      },
      data: {
        isPublic,
      },
    });

    broadcastToUser(session.user.id, {
      type: "conversation_updated",
      conversation: updatedConversation,
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error("Error updating conversation visibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}