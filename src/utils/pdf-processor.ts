export interface ProcessedPDF {
  text: string;
  metadata: {
    pages: number;
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export async function processPDF(buffer: Buffer): Promise<ProcessedPDF> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        title: data.info?.Title,
        author: data.info?.Author,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate,
        modificationDate: data.info?.ModDate,
      },
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw new Error("Failed to process PDF file");
  }
}

export function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64Data = dataUrl.split(",")[1];
  if (!base64Data) {
    throw new Error("Invalid data URL format");
  }
  return Buffer.from(base64Data, "base64");
}

export function chunkPDFText(
  text: string,
  maxChunkSize: number = 4000,
): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentChunk.length + trimmedSentence.length + 1 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
    }
    currentChunk += trimmedSentence + ".";
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}
