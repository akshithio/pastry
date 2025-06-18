import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth/config";
import { db } from "~/server/db";

const ENCRYPTION_KEY =
  process.env.API_KEY_ENCRYPTION_KEY ?? "your-32-char-secret-key-here!!!";

// Ensure the encryption key is exactly 32 bytes for AES-256
const getEncryptionKey = (): Buffer => {
  const key = ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32);
  return Buffer.from(key, "utf8");
};

function encryptApiKey(apiKey: string): string {
  const algorithm = "aes-256-cbc";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16); // Generate random IV

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Prepend IV to encrypted data (IV + encrypted data)
  return iv.toString("hex") + ":" + encrypted;
}

function decryptApiKey(encryptedApiKey: string): string {
  const algorithm = "aes-256-cbc";
  const key = getEncryptionKey();

  // Split IV and encrypted data
  const parts = encryptedApiKey.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { openRouterApiKey: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasApiKey: !!user.openRouterApiKey,
      maskedKey: user.openRouterApiKey
        ? `sk-or-${"*".repeat(20)}${user.openRouterApiKey.slice(-4)}`
        : null,
    });
  } catch (error) {
    console.error("Error fetching API key status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 },
      );
    }

    if (!apiKey.startsWith("sk-or-")) {
      return NextResponse.json(
        { error: "Invalid OpenRouter API key format" },
        { status: 400 },
      );
    }

    const encryptedApiKey = encryptApiKey(apiKey);

    await db.user.update({
      where: { id: session.user.id },
      data: { openRouterApiKey: encryptedApiKey },
    });

    return NextResponse.json({
      success: true,
      message: "API key saved successfully",
      hasApiKey: true,
      maskedKey: `sk-or-${"*".repeat(20)}${apiKey.slice(-4)}`,
    });
  } catch (error) {
    console.error("Error saving API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { openRouterApiKey: null },
    });

    return NextResponse.json({
      success: true,
      message: "API key removed successfully",
      hasApiKey: false,
    });
  } catch (error) {
    console.error("Error removing API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function getUserApiKey(userId: string): Promise<string | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { openRouterApiKey: true },
    });

    if (!user?.openRouterApiKey) {
      return null;
    }

    return decryptApiKey(user.openRouterApiKey);
  } catch (error) {
    console.error("Error retrieving user API key:", error);
    return null;
  }
}
