import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth/config";
import {
  chunkPDFText,
  dataUrlToBuffer,
  processPDF,
} from "~/utils/pdf-processor";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dataUrl, filename } = await req.json();

    if (!dataUrl?.startsWith("data:application/pdf")) {
      return NextResponse.json(
        { error: "Invalid PDF data URL" },
        { status: 400 },
      );
    }

    const buffer = dataUrlToBuffer(dataUrl);

    const processedPDF = await processPDF(buffer);

    const chunks = chunkPDFText(processedPDF.text, 8000);

    return NextResponse.json({
      success: true,
      data: {
        filename,
        text: processedPDF.text,
        chunks,
        metadata: processedPDF.metadata,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("PDF processing error:", error);
    return NextResponse.json(
      {
        error: "Failed to process PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    supportedTypes: ["application/pdf"],
    maxFileSize: "10MB",
    features: ["text-extraction", "metadata-extraction", "chunking"],
  });
}
