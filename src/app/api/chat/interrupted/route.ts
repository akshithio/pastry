import { type NextRequest } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return Response.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
    }

    
    const interruptedMessage = await db.message.findFirst({
      where: {
        conversationId: conversationId,
        userId: session.user.id,
        isStreaming: true,
        partialContent: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (interruptedMessage) {
      return Response.json({
        interruptedMessage: {
          id: interruptedMessage.id,
          streamId: interruptedMessage.streamId,
          partialContent: interruptedMessage.partialContent,
          role: interruptedMessage.role,
        },
      });
    }

    return Response.json({ interruptedMessage: null });
  } catch (error) {
    console.error("Error checking for interrupted streams:", error);
    return Response.json(
      { error: "Failed to check interrupted streams" },
      { status: 500 },
    );
  }
}
