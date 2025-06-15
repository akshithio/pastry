import { useState } from "react";
import type { AttachmentFile } from "~/types/chat";
import { processPDF, validateFile } from "~/utils/attachmentUtils";

interface UseAttachmentProcessorProps {
  maxAttachments: number;
  maxTotalFileSize: number;
}

export const useAttachmentProcessor = ({
  maxAttachments,
  maxTotalFileSize,
}: UseAttachmentProcessorProps) => {
  const [attachmentFiles, setAttachmentFiles] = useState<AttachmentFile[]>([]);

  const getTotalSize = () =>
    attachmentFiles.reduce((sum, f) => sum + f.size, 0);

  const processFiles = async (fileList: FileList) => {
    const newFiles: AttachmentFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file) continue;

      const error = validateFile(file, getTotalSize(), maxTotalFileSize);
      if (error) {
        alert(error);
        continue;
      }

      if (attachmentFiles.length + newFiles.length >= maxAttachments) {
        alert(`Maximum ${maxAttachments} attachments allowed.`);
        break;
      }

      const isPDF = file.type === "application/pdf";
      const attachment: AttachmentFile = {
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: isPDF ? "pdf" : "image",
        isProcessing: isPDF,
        processedText: isPDF ? undefined : "",
      };

      newFiles.push(attachment);
    }

    setAttachmentFiles((prev) => [...prev, ...newFiles]);

    for (const attachment of newFiles) {
      const updateAttachment = (updates: Partial<AttachmentFile>) => {
        const updated = { ...attachment, ...updates };
        setAttachmentFiles((prev) =>
          prev.map((f) => (f.id === attachment.id ? updated : f)),
        );
        return updated;
      };

      try {
        if (attachment.type === "image") {
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () =>
              reject(new Error("Failed to read image file"));
            reader.readAsDataURL(attachment.file);
          });
          updateAttachment({ preview, isProcessing: false });
        } else if (attachment.type === "pdf") {
          try {
            const processedText = await processPDF(attachment.file);
            updateAttachment({ processedText, isProcessing: false });
          } catch (error) {
            console.error(`Error processing PDF ${attachment.name}:`, error);
            updateAttachment({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to process PDF",
              isProcessing: false,
            });
            continue;
          }
        }
      } catch (error) {
        console.error(`Error processing ${attachment.name}:`, error);
        updateAttachment({
          error:
            error instanceof Error ? error.message : "Failed to process file",
          isProcessing: false,
        });
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachmentFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAttachments = () => {
    setAttachmentFiles([]);
  };

  return {
    attachmentFiles,
    processFiles,
    removeAttachment,
    clearAttachments,
    getTotalSize,
  };
};
