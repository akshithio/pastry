import { Check, Copy, GitBranch, RotateCcw } from "lucide-react";

interface MessageActionsProps {
  messageContent: string;
  messageId: string;
  messageIndex: number;
  isOwner: boolean;
  isReadOnly: boolean;
  isLoading: boolean;
  copiedMessageId: string | null;
  onCopyResponse: (content: string, id: string) => Promise<void>;
  onRetryMessage: (index: number) => void;
  onBranchConversation: (index: number) => Promise<void>;
}

export function MessageActions({
  messageContent,
  messageId,
  messageIndex,
  isOwner,
  isReadOnly,
  isLoading,
  copiedMessageId,
  onCopyResponse,
  onRetryMessage,
  onBranchConversation,
}: MessageActionsProps) {
  const baseButtonClass =
    "flex items-center gap-1 rounded px-2 py-1 text-xs text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.12)] dark:text-[#B0B7C3] dark:hover:bg-[rgba(255,255,255,0.12)]";

  return (
    <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        onClick={() => onCopyResponse(messageContent, messageId)}
        className={baseButtonClass}
        title="Copy response"
      >
        {copiedMessageId === messageId ? (
          <>
            <Check className="h-3 w-3" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            Copy
          </>
        )}
      </button>

      {isOwner && !isReadOnly && (
        <>
          <button
            onClick={() => onRetryMessage(messageIndex)}
            className={baseButtonClass}
            title="Retry response"
            disabled={isLoading}
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
          <button
            onClick={() => onBranchConversation(messageIndex)}
            className={baseButtonClass}
            title="Branch conversation from here"
            disabled={isLoading}
          >
            <GitBranch className="h-3 w-3" />
            Branch
          </button>
        </>
      )}
    </div>
  );
}