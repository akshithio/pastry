import { Copy, Edit } from "lucide-react";
import { useRef } from "react";
import type { ExtendedMessage } from "~/types/chat";
import AttachmentRenderer from "./AttachmentRenderer";

interface UserMessageProps {
  message: ExtendedMessage;
  messageIndex: number;
  isOwner: boolean;
  isReadOnly: boolean;
  editingMessageIndex: number | null;
  editingMessageContent: string;
  isSavingEdit: boolean;
  copiedUserMessageId: string | null;
  onEditMessage: (messageIndex: number) => void;
  onCancelEdit: () => void;
  onEditingContentChange: (content: string) => void;
  onEditSubmit: () => Promise<void>;
  onEditKeyPress: (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => Promise<void>;
  onCopyUserMessage: (
    messageContent: string,
    messageId: string,
  ) => Promise<void>;
}

export default function UserMessage({
  message,
  messageIndex,
  isOwner,
  isReadOnly,
  editingMessageIndex,
  editingMessageContent,
  isSavingEdit,
  copiedUserMessageId,
  onEditMessage,
  onCancelEdit,
  onEditingContentChange,
  onEditSubmit,
  onEditKeyPress,
  onCopyUserMessage,
}: UserMessageProps) {
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const attachments = message.experimental_attachments ?? message.attachments;

  if (editingMessageIndex === messageIndex) {
    return (
      <div className="flex justify-start">
        <div className="w-full max-w-4xl">
          {attachments && <AttachmentRenderer attachments={attachments} />}
          <div className="space-y-2">
            <textarea
              ref={editTextareaRef}
              value={editingMessageContent}
              onChange={(e) => onEditingContentChange(e.target.value)}
              onKeyDown={onEditKeyPress}
              className="w-full resize-none rounded-lg border border-[#E1E5E9] bg-white px-4 py-3 text-[#4C5461] placeholder-[#9CA3AF] shadow-sm outline-none focus:border-[#0551CE] focus:ring-1 focus:ring-[#0551CE] dark:border-[#374151] dark:bg-[#1F2937] dark:text-[#E5E5E5] dark:placeholder-[#6B7280] dark:focus:border-[#5B9BD5] dark:focus:ring-[#5B9BD5]"
              rows={Math.max(2, editingMessageContent.split("\n").length)}
              disabled={isSavingEdit}
              placeholder="Edit your message..."
              style={{
                minHeight: "3rem",
                maxHeight: "200px",
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={onCancelEdit}
                disabled={isSavingEdit}
                className="cursor-pointer rounded-md border border-[#E1E5E9] bg-white px-3 py-1.5 text-sm text-[#4C5461] transition-colors hover:bg-[#F3F4F6] disabled:opacity-50 dark:border-[#374151] dark:bg-[#1F2937] dark:text-[#E5E5E5] dark:hover:bg-[#374151]"
              >
                Cancel
              </button>
              <button
                onClick={onEditSubmit}
                disabled={isSavingEdit}
                className="cursor-pointer rounded-md bg-[#0551CE] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#044bb8] disabled:opacity-50 dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
              >
                {isSavingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex justify-end">
      <div className="max-w-[80%]">
        {attachments && attachments.length > 0 && (
          <AttachmentRenderer attachments={attachments} />
        )}
        {message.content?.trim() && (
          <div className="auth-clean-shadow overflow-hidden rounded-lg bg-[#0551CE] px-4 py-2 break-words text-[#F7F7F2] dark:bg-[#5B9BD5] dark:text-[#1a1a1a]">
            {message.content}
          </div>
        )}

        {isOwner && !isReadOnly && (
          <div className="mt-2.5 flex justify-start gap-3 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onCopyUserMessage(message.content, message.id)}
              className="flex cursor-pointer items-center gap-1 text-xs text-[#4C5461] transition-colors hover:text-[#0551CE] dark:text-[#B0B7C3] dark:hover:text-[#5B9BD5]"
            >
              <Copy className="h-3 w-3" />
              {copiedUserMessageId === message.id ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => onEditMessage(messageIndex)}
              className="flex cursor-pointer items-center gap-1 text-xs text-[#4C5461] transition-colors hover:text-[#0551CE] dark:text-[#B0B7C3] dark:hover:text-[#5B9BD5]"
            >
              <Edit className="h-3 w-3" />
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
