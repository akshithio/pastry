import { Paperclip } from "lucide-react";
import React from "react";

interface AttachmentDropZoneProps {
  remainingMB: number;
  maxTotalFileSize: number;
}

const AttachmentDropZone: React.FC<AttachmentDropZoneProps> = ({
  remainingMB,
}) => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center border-2 border-dashed border-[#0551CE] bg-[rgba(5,81,206,0.08)] backdrop-blur-sm dark:border-[#5B9BD5] dark:bg-[rgba(91,155,213,0.08)]">
      <div className="flex items-center text-[#0551CE] dark:text-[#5B9BD5]">
        <Paperclip className="h-4 w-4" />
        <span className="ml-2 text-base font-medium">Drop files here</span>
      </div>
      <span className="text-xs font-medium">
        [Images and PDFs Supported - {remainingMB.toFixed(1)}MB remaining]
      </span>
    </div>
  );
};

export default AttachmentDropZone;
