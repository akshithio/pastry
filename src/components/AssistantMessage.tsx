import MarkdownRenderer, {
  latexStyles,
} from "~/components/chat/MarkdownRenderer";
import { MessageActions } from "~/components/MessageActions";
import type { ExtendedMessage } from "~/types/chat";
import MessagePartsRenderer from "./MessagePartsRenderer";

interface AssistantMessageProps {
  message: ExtendedMessage;
  messageIndex: number;
  isOwner: boolean;
  isReadOnly: boolean;
  isLoading: boolean;
  copiedMessageId: string | null;
  onCopyResponse: (messageContent: string, messageId: string) => Promise<void>;
  onRetryMessage: (messageIndex: number) => void;
  onBranchConversation: (upToMessageIndex: number) => Promise<void>;
}

export default function AssistantMessage({
  message,
  messageIndex,
  isOwner,
  isReadOnly,
  isLoading,
  copiedMessageId,
  onCopyResponse,
  onRetryMessage,
  onBranchConversation,
}: AssistantMessageProps) {
  return (
    <div className="group overflow-hidden">
      <div className="mt-4 max-w-none overflow-hidden break-words">
        {/* Render message parts if they exist (for models that support structured parts) */}
        {message.parts && message.parts.length > 0 ? (
          <MessagePartsRenderer parts={message.parts} />
        ) : (
          <div className="prose prose-sm max-w-none overflow-hidden break-words text-[#4C5461] dark:text-[#111]">
            <style dangerouslySetInnerHTML={{ __html: latexStyles }} />
            <div className="overflow-x-auto">
              <MarkdownRenderer>{message.content}</MarkdownRenderer>
            </div>
          </div>
        )}

        <MessageActions
          messageContent={message.content}
          messageId={message.id}
          messageIndex={messageIndex}
          isOwner={isOwner}
          isReadOnly={isReadOnly}
          isLoading={isLoading}
          copiedMessageId={copiedMessageId}
          onCopyResponse={onCopyResponse}
          onRetryMessage={onRetryMessage}
          onBranchConversation={onBranchConversation}
        />
      </div>
    </div>
  );
}
