import { FileText, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import MarkdownRenderer, {
  latexStyles,
} from "~/components/chat/MarkdownRenderer";
import type { ExtendedMessage } from "~/types/chat";

interface MessagePartsRendererProps {
  parts: ExtendedMessage["parts"];
}

export default function MessagePartsRenderer({
  parts,
}: MessagePartsRendererProps) {
  if (!parts || parts.length === 0) return null;

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <div
              key={index}
              className="prose prose-sm max-w-none overflow-hidden break-words text-[#4C5461] dark:text-[#111]"
            >
              <style dangerouslySetInnerHTML={{ __html: latexStyles }} />
              <div className="overflow-x-auto">
                <MarkdownRenderer>{part.text ?? ""}</MarkdownRenderer>
              </div>
            </div>
          );
        } else if (part.type === "file") {
          const fileUrl = part.file?.url ?? part.url;
          const fileName = part.file?.name ?? part.name ?? "Generated file";
          const mimeType = part.file?.mimeType ?? part.mimeType ?? "";

          if (mimeType.startsWith("image/") && fileUrl) {
            return (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-[rgba(5,81,206,0.12)] dark:border-[rgba(255,255,255,0.12)]"
              >
                <Image
                  src={fileUrl as string}
                  alt={fileName as string}
                  width={512}
                  height={512}
                  className="h-auto max-w-full rounded-lg"
                  style={{ maxHeight: "512px", objectFit: "contain" }}
                />
                <div className="flex items-center gap-2 bg-[#F7F7F2] p-2 text-xs text-[#4C5461] dark:bg-[#2a2a2a] dark:text-[#E5E5E5]">
                  <ImageIcon className="h-4 w-4 text-[#0551CE] dark:text-[#5B9BD5]" />
                  <span className="truncate">{fileName}</span>
                </div>
              </div>
            );
          } else {
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-3 text-sm dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]"
              >
                <FileText className="h-5 w-5 text-[#dc2626] dark:text-[#ef4444]" />
                <span className="text-[#4C5461] dark:text-[#E5E5E5]">
                  {fileName}
                </span>
                <a
                  href={fileUrl as string}
                  download={fileName as string}
                  className="ml-auto text-[#0551CE] hover:text-[#044bb8] dark:text-[#5B9BD5] dark:hover:text-[#4A8BC7]"
                >
                  Download
                </a>
              </div>
            );
          }
        }
        return null;
      })}
    </div>
  );
}
