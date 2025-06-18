import { FileText, ImageIcon, X } from "lucide-react";
import Image from "next/image";
import React from "react";
import type { AttachmentFile } from "~/types/chat";

interface AttachmentPreviewProps {
  attachments: AttachmentFile[];
  onRemove: (id: string) => void;
  maxAttachments: number;
  maxTotalFileSize: number;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  onRemove,
  maxAttachments,
  maxTotalFileSize,
}) => {
  const getTotalSize = () => attachments.reduce((sum, f) => sum + f.size, 0);

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024,
      sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (attachments.length === 0) return null;

  const totalSize = getTotalSize();

  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-center justify-between text-xs text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
        <span>
          Attachments ({attachments.length}/{maxAttachments})
        </span>
        <span>
          {formatSize(totalSize)} / {maxTotalFileSize}MB
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="relative flex items-center gap-2 border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-2 text-xs dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]"
          >
            {att.type === "image" ? (
              <div className="flex items-center gap-2">
                {att.preview && (
                  <Image
                    src={att.preview}
                    alt={att.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-cover"
                  />
                )}
                <ImageIcon className="h-4 w-4 text-[#0551CE] dark:text-[#5B9BD5]" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#dc2626] dark:text-[#ef4444]" />
                {att.isProcessing && (
                  <div className="h-2 w-2 animate-spin rounded-full border-t border-[#0551CE] dark:border-[#5B9BD5]" />
                )}
              </div>
            )}
            <div className="flex flex-col">
              <span className="max-w-[120px] truncate text-[#4C5461] dark:text-[#E5E5E5]">
                {att.name}
              </span>
              <span className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                {att.isProcessing
                  ? "Processing..."
                  : att.error
                    ? "Error"
                    : formatSize(att.size)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(att.id)}
              className="absolute -top-1 -right-1 cursor-pointer bg-[#dc2626] p-1 text-white hover:bg-[#b91c1c] dark:bg-[#ef4444] dark:hover:bg-[#dc2626]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentPreview;
