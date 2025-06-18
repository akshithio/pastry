import { type NextRequest } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await db.userPreferences.findUnique({
      where: { userId: session.user.id },
    });

    
    if (!preferences) {
      return Response.json({
        userName: session.user.name ?? "",
        userRole: "",
        traits: [],
        additionalInfo: "",
        disableComments: false,
      });
    }

    return Response.json({
      userName: preferences.userName ?? "",
      userRole: preferences.userRole ?? "",
      traits: preferences.traits ?? [],
      additionalInfo: preferences.additionalInfo ?? "",
      disableComments: preferences.disableComments,
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return Response.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userName, userRole, traits, additionalInfo, disableComments } =
      body;

    
    if (userName && userName.length > 50) {
      return Response.json(
        { error: "User name must be 50 characters or less" },
        { status: 400 },
      );
    }

    if (userRole && userRole.length > 100) {
      return Response.json(
        { error: "User role must be 100 characters or less" },
        { status: 400 },
      );
    }

    if (traits && (!Array.isArray(traits) || traits.length > 50)) {
      return Response.json(
        { error: "Traits must be an array with 50 items or less" },
        { status: 400 },
      );
    }

    if (additionalInfo && additionalInfo.length > 3000) {
      return Response.json(
        { error: "Additional info must be 3000 characters or less" },
        { status: 400 },
      );
    }

    
    const preferences = await db.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        userName: userName ?? null,
        userRole: userRole ?? null,
        traits: traits ?? [],
        additionalInfo: additionalInfo ?? null,
        disableComments: disableComments ?? false,
      },
      create: {
        userId: session.user.id,
        userName: userName ?? null,
        userRole: userRole ?? null,
        traits: traits ?? [],
        additionalInfo: additionalInfo ?? null,
        disableComments: disableComments ?? false,
      },
    });

    return Response.json({
      message: "Preferences saved successfully",
      preferences: {
        userName: preferences.userName,
        userRole: preferences.userRole,
        traits: preferences.traits,
        additionalInfo: preferences.additionalInfo,
        disableComments: preferences.disableComments,
      },
    });
  } catch (error) {
    console.error("Error saving user preferences:", error);
    return Response.json(
      { error: "Failed to save preferences" },
      { status: 500 },
    );
  }
}
