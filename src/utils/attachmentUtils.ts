import type { Attachment, AttachmentFile } from "~/types/chat";

export const unicodeToBase64 = (str: string): string => {
  try {
    const utf8Bytes = new TextEncoder().encode(str);
    const binaryString = Array.from(utf8Bytes, (byte) =>
      String.fromCharCode(byte),
    ).join("");
    return btoa(binaryString);
  } catch (error) {
    console.error("Error encoding to base64:", error);

    const latin1Only = str.replace(/[^\x00-\xFF]/g, "?");
    return btoa(latin1Only);
  }
};

export const processPDF = async (file: File): Promise<string> => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const response = await fetch("/api/process-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataUrl,
            filename: file.name,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errorData?.error ?? "Failed to process PDF");
        }

        const result = (await response.json()) as {
          success: boolean;
          data?: { text: string };
        };

        if (!result.success || !result.data?.text) {
          throw new Error("Invalid response from PDF processor");
        }

        resolve(result.data.text);
      } catch (error) {
        console.error("PDF processing error:", error);
        reject(
          error instanceof Error ? error : new Error("Failed to process PDF"),
        );
      }
    };

    reader.onerror = () => {
      console.error("FileReader error");
      reject(new Error("Failed to read PDF file"));
    };

    reader.readAsDataURL(file);
  });
};

export const convertToAISDKAttachments = (
  files: AttachmentFile[],
): Attachment[] => {
  console.log("🔄 Converting files to AI SDK attachments:", files.length);

  return files
    .filter((f) => {
      const hasContent = f.type === "pdf" ? f.processedText : f.preview;
      console.log(
        `  - File ${f.name}: type=${f.type}, hasContent=${!!hasContent}`,
      );
      return hasContent;
    })
    .map((f) => {
      console.log(`  - Processing file: ${f.name} (${f.type})`);

      if (f.type === "pdf" && f.processedText) {
        console.log(
          `    - PDF with ${f.processedText.length} chars of processed text`,
        );

        const attachment: Attachment = {
          name: f.name,
          contentType: f.file.type,
          url: `data:text/plain;base64,${unicodeToBase64(f.processedText)}`,
          processedText: f.processedText,
          content: f.processedText,
        };

        console.log(
          `    - Created PDF attachment with content length: ${attachment.content?.length}`,
        );
        return attachment;
      }

      if (f.preview) {
        console.log(`    - Image with preview URL`);
        return {
          name: f.name,
          contentType: f.file.type,
          url: f.preview,
        };
      }

      console.log(`    - Other file type, using base64 encoding`);
      return {
        name: f.name,
        contentType: f.file.type,
        url:
          f.preview ??
          `data:text/plain;base64,${unicodeToBase64(f.processedText ?? "")}`,
      };
    });
};

export const validateFile = (
  file: File,
  currentSize: number,
  maxTotalFileSize: number,
) => {
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/json",
  ];
  if (!validTypes.includes(file.type)) {
    return "Only images, PDFs, and text files are supported.";
  }
  const maxBytes = maxTotalFileSize * 1024 * 1024;
  if (currentSize + file.size > maxBytes) {
    const remaining = ((maxBytes - currentSize) / (1024 * 1024)).toFixed(1);
    return `File too large. ${remaining}MB remaining.`;
  }
  return null;
};
