import { type Message as AIMessage } from "@ai-sdk/react";
import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createExtendedMessage,
  isExtendedMessage,
  type Attachment,
  type ExtendedMessage,
} from "~/types/chat";
import AssistantMessage from "./AssistantMessage";
import UserMessage from "./UserMessage";

interface MessagesContainerProps {
  messages: Array<ExtendedMessage | AIMessage>;
  isLoading: boolean;
  error: Error | null;
  isOwner: boolean;
  isReadOnly?: boolean;
  editingMessageIndex: number | null;
  editingMessageContent: string;
  isSavingEdit: boolean;
  copiedMessageId: string | null;
  copiedUserMessageId: string | null;
  onEditMessage: (messageIndex: number) => void;
  onCancelEdit: () => void;
  onEditingContentChange: (content: string) => void;
  onSaveEditedMessage: (
    messageIndex: number,
    newContent: string,
    attachments?: Attachment[],
  ) => Promise<void>;
  onCopyResponse: (messageContent: string, messageId: string) => Promise<void>;
  onCopyUserMessage: (
    messageContent: string,
    messageId: string,
  ) => Promise<void>;
  onRetryMessage: (messageIndex: number) => void;
  onBranchConversation: (upToMessageIndex: number) => Promise<void>;
  onRegenerate: () => void;
}

export default function MessagesContainer({
  messages,
  isLoading,
  error,
  isOwner,
  isReadOnly = false,
  editingMessageIndex,
  editingMessageContent,
  isSavingEdit,
  copiedMessageId,
  copiedUserMessageId,
  onEditMessage,
  onCancelEdit,
  onEditingContentChange,
  onSaveEditedMessage,
  onCopyResponse,
  onCopyUserMessage,
  onRetryMessage,
  onBranchConversation,
  onRegenerate,
}: MessagesContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [wasNearBottomBeforeGeneration, setWasNearBottomBeforeGeneration] =
    useState(true);

  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;
    return (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 100
    );
  };

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setWasNearBottomBeforeGeneration(true);
  };

  const handleEditSubmit = async () => {
    if (editingMessageIndex !== null) {
      try {
        const originalMessage = messages[editingMessageIndex];
        const attachments =
          isExtendedMessage(originalMessage) && originalMessage.attachments
            ? originalMessage.attachments
            : undefined;
        await onSaveEditedMessage(
          editingMessageIndex,
          editingMessageContent,
          attachments,
        );
      } catch (error) {
        console.error("Error saving message:", error);
      } finally {
        onCancelEdit();
      }
    }
  };

  const handleEditKeyPress = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleEditSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit();
    }
  };

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    };
    scrollToBottom();
    const timeouts = [
      setTimeout(scrollToBottom, 50),
      setTimeout(scrollToBottom, 100),
      setTimeout(scrollToBottom, 200),
      setTimeout(scrollToBottom, 500),
    ];
    return () => timeouts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (isLoading) {
      setWasNearBottomBeforeGeneration(isNearBottom());
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading && wasNearBottomBeforeGeneration) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, wasNearBottomBeforeGeneration]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollToBottom(!isNearBottom());
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        ref={messagesContainerRef}
        className="mt-4 min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-4"
      >
        {messages.map((message, index) => {
          const extendedMessage = isExtendedMessage(message)
            ? message
            : createExtendedMessage(message);

          return (
            <div key={extendedMessage.id} className="mx-auto max-w-4xl min-w-0">
              {extendedMessage.role === "user" ? (
                <UserMessage
                  message={extendedMessage}
                  messageIndex={index}
                  isOwner={isOwner}
                  isReadOnly={isReadOnly}
                  editingMessageIndex={editingMessageIndex}
                  editingMessageContent={editingMessageContent}
                  isSavingEdit={isSavingEdit}
                  copiedUserMessageId={copiedUserMessageId}
                  onEditMessage={onEditMessage}
                  onCancelEdit={onCancelEdit}
                  onEditingContentChange={onEditingContentChange}
                  onEditSubmit={handleEditSubmit}
                  onEditKeyPress={handleEditKeyPress}
                  onCopyUserMessage={onCopyUserMessage}
                />
              ) : (
                <AssistantMessage
                  message={extendedMessage}
                  messageIndex={index}
                  isOwner={isOwner}
                  isReadOnly={isReadOnly}
                  isLoading={isLoading}
                  copiedMessageId={copiedMessageId}
                  onCopyResponse={onCopyResponse}
                  onRetryMessage={onRetryMessage}
                  onBranchConversation={onBranchConversation}
                />
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mx-auto max-w-4xl">
            <div className="leading-relaxed text-[#4C5461] dark:text-[#B0B7C3]">
              Thinking...
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isReadOnly && (
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-red-600 text-xs font-medium text-white dark:bg-red-500">
                !
              </div>
              <div className="min-w-0 flex-1">
                <div className="leading-relaxed text-red-600 dark:text-red-400">
                  Error:{" "}
                  {error instanceof Error ? error.message : String(error)}
                </div>
                <button
                  onClick={onRegenerate}
                  className="auth-clean-shadow mt-2 cursor-pointer rounded bg-[#0551CE] px-3 py-1 text-sm text-[#F7F7F2] transition-colors hover:bg-[#044bb8] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollToBottom && !isLoading && (
        <div className="sticky bottom-2 z-20 flex justify-center pb-2">
          <button
            onClick={handleScrollToBottom}
            className="auth-clean-shadow flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#0551CE] text-[#F7F7F2] transition-all hover:bg-[#044bb8] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
            title="Scroll to bottom"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
      )}
    </>
  );
}
