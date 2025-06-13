import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id },
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
      where: { conversationId: id },
      include: {
        attachments: true,
      },
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { userId: true, isPublic: true },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  if (!conversation.isPublic && conversation.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      role: string;
      content: string;
      isStreaming?: boolean;
      streamId?: string;
      partialContent?: string;
      attachments?: Array<{
        name: string;
        contentType: string;
        url: string;
        size?: number;
      }>;
    };

    const {
      role,
      content,
      isStreaming,
      streamId,
      partialContent,
      attachments,
    } = body;

    const message = await db.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          role,
          content,
          isStreaming: isStreaming ?? false,
          streamId,
          partialContent,
          userId: session.user.id,
          conversationId,
        },
        include: {
          attachments: true,
        },
      });

      if (attachments && attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: attachments.map((attachment) => ({
            messageId: newMessage.id,
            name: attachment.name,
            contentType: attachment.contentType,
            url: attachment.url,
            size: attachment.size,
          })),
        });

        return await tx.message.findUnique({
          where: { id: newMessage.id },
          include: {
            attachments: true,
          },
        });
      }

      return newMessage;
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
