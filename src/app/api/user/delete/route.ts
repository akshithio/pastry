import { type NextRequest } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await db.$transaction(async (tx) => {
      await tx.post.deleteMany({
        where: { createdById: userId },
      });

      await tx.userPreferences.deleteMany({
        where: { userId },
      });

      await tx.user.delete({
        where: { id: userId },
      });
    });

    return Response.json(
      {
        message: "Account deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting user account:", error);
    return Response.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
