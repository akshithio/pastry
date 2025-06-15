import { Globe, Lock, Share } from "lucide-react";
import { useRef, useState } from "react";
import type { Conversation } from "~/types/conversations";

interface ConversationHeaderProps {
  conversation: Conversation;
  isOwner: boolean;
  isReadOnly?: boolean;
  onShareClick: () => void;
}

export default function ConversationHeader({
  conversation,
  isOwner,
  isReadOnly = false,
  onShareClick,
}: ConversationHeaderProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTooltip = (show: boolean) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }

    if (show) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setTooltipVisible(true);
      }, 800);
    } else {
      setTooltipVisible(false);
    }
  };

  return (
    <div className="sticky top-4 flex flex-shrink-0 items-center justify-between px-4">
      <div className="flex cursor-pointer items-center gap-2">
        {conversation?.isPublic ? (
          <div
            className="relative flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
            onMouseEnter={() => handleTooltip(true)}
            onMouseLeave={() => handleTooltip(false)}
          >
            <Globe className="h-3.5 w-3.5" />
            {tooltipVisible && (
              <div className="absolute top-full left-1/2 z-50 mt-2 max-w-xs -translate-x-1/2 rounded bg-[#4C5461] px-2 py-1 text-xs whitespace-nowrap text-[#F7F7F2] shadow-[0_4px_8px_rgba(5,81,206,0.2)] dark:bg-[#E5E5E5] dark:text-[#1a1a1a] dark:shadow-[0_4px_8px_rgba(91,155,213,0.2)]">
                This conversation is public
              </div>
            )}
          </div>
        ) : (
          <div
            className="relative flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            onMouseEnter={() => handleTooltip(true)}
            onMouseLeave={() => handleTooltip(false)}
          >
            <Lock className="h-3.5 w-3.5" />
            {tooltipVisible && (
              <div className="absolute top-full left-1/2 z-50 mt-2 max-w-xs -translate-x-1/2 rounded bg-[#4C5461] px-2 py-1 text-xs whitespace-nowrap text-[#F7F7F2] shadow-[0_4px_8px_rgba(5,81,206,0.2)] dark:bg-[#E5E5E5] dark:text-[#1a1a1a] dark:shadow-[0_4px_8px_rgba(91,155,213,0.2)]">
                This conversation is private
              </div>
            )}
          </div>
        )}
      </div>

      {isOwner && !isReadOnly && (
        <button
          onClick={onShareClick}
          className="flex w-24 cursor-pointer items-center gap-2 border-1 border-solid border-[#044bb8] px-4 py-1.5 text-sm text-[#044bb8] transition-all hover:bg-[#044bb8] hover:text-[#F7F7F2] dark:border-[#5B9BD5] dark:text-[#5B9BD5] dark:hover:bg-[#5B9BD5] dark:hover:text-[#1a1a1a]"
          title="Share this chat"
        >
          <Share className="h-4 w-4" />
          Share
        </button>
      )}
    </div>
  );
}
