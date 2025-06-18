import { ChevronDown, ChevronRight, Lightbulb, Zap } from "lucide-react";
import { useState } from "react";
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

  reasoning?: string;
  isReasoningStreaming?: boolean;
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
  reasoning,
  isReasoningStreaming = false,
}: AssistantMessageProps) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);

  const messageReasoning = reasoning || (message as any).reasoning;
  const hasReasoning = messageReasoning && messageReasoning.trim().length > 0;

  console.log("=== AssistantMessage Debug ===", {
    messageIndex,
    messageId: message.id,
    messageKeys: Object.keys(message),
    messageReasoning: (message as any).reasoning,
    propReasoning: reasoning,
    isReasoningStreaming,
    hasReasoning: !!((message as any).reasoning || reasoning),
  });

  return (
    <div className="group overflow-hidden">
      <div className="mt-4 max-w-none overflow-hidden break-words">
        {/* Reasoning Section - Show above main content */}
        {hasReasoning && (
          <div className="mb-4">
            <button
              onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
              className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left transition-all hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900 cursor-pointer"
            >
              <div className="flex flex-1 items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-white">
                  <Lightbulb className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {isReasoningStreaming ? "Thinking..." : "View reasoning"}
                </span>
                {isReasoningStreaming && (
                  <div className="flex gap-1">
                    <div className="h-1 w-1 animate-bounce rounded-full bg-amber-600 [animation-delay:-0.3s]"></div>
                    <div className="h-1 w-1 animate-bounce rounded-full bg-amber-600 [animation-delay:-0.15s]"></div>
                    <div className="h-1 w-1 animate-bounce rounded-full bg-amber-600"></div>
                  </div>
                )}
              </div>
              <div className="text-amber-600 dark:text-amber-400">
                {isReasoningExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </button>

            {isReasoningExpanded && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Reasoning Process
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-amber-900 dark:text-amber-100">
                    <style dangerouslySetInnerHTML={{ __html: latexStyles }} />
                    <div className="overflow-x-auto">
                      <MarkdownRenderer>{messageReasoning}</MarkdownRenderer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
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
