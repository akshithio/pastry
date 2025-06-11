import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  const conversation = await db.conversation.findUnique({
    where: { id: params.id },
    select: { userId: true, isPublic: true },
  });

  if (!conversation) {
    return NextResponse.json([], { status: 404 });
  }

  if (
    !conversation.isPublic &&
    (!session?.user?.id || conversation.userId !== session.user.id)
  ) {
    return NextResponse.json([], { status: 401 });
  }

  try {
    const messages = await db.message.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
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
    const body = (await req.json()) as {
      title: string;
      initialMessages?: Array<{ role: string; content: string }>;
      isBranched?: boolean;
    };
    const { title, initialMessages, isBranched } = body;

    const conversation = await db.conversation.create({
      data: {
        title,
        userId: session.user.id,
        isBranched: isBranched ?? false,
      },
    });

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
