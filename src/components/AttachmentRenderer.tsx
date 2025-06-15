import { FileText, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import type { Attachment } from "~/types/chat";

interface AttachmentRendererProps {
  attachments: Attachment[];
}

export default function AttachmentRenderer({
  attachments,
}: AttachmentRendererProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className="relative flex items-center gap-2 rounded-md border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-2 text-xs dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]"
        >
          {attachment.contentType?.startsWith("image/") ? (
            <div className="flex items-center gap-2">
              <Image
                src={attachment.url}
                alt={attachment.name ?? ""}
                width={32}
                height={32}
                className="h-8 w-8 rounded object-cover"
              />
              <ImageIcon className="h-4 w-4 text-[#0551CE] dark:text-[#5B9BD5]" />
            </div>
          ) : (
            <FileText className="h-4 w-4 text-[#dc2626] dark:text-[#ef4444]" />
          )}
          <span className="max-w-[120px] truncate text-[#4C5461] dark:text-[#E5E5E5]">
            {attachment.name ?? "Uploaded file"}
          </span>
        </div>
      ))}
    </div>
  );
}
