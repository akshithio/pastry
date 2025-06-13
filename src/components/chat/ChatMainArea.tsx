import { type Message } from "@ai-sdk/react";
import { ArrowDown, Globe, Lock, Share } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatInput from "~/components/chat/ChatInput";
import MarkdownRenderer, {
  latexStyles,
} from "~/components/chat/MarkdownRenderer";
import { useAutoResume } from "~/hooks/useAutoResume";
import { type ModelName } from "~/model_config";
import type { Conversation } from "~/types/conversations";
import { ShareDialog } from "../dialogs/ShareDialog";
import { MessageActions } from "../MessageActions";

interface ChatMainAreaProps {
  conversation: Conversation;
  messages: Message[];
  input: string;
  isLoading: boolean;
  error: Error | null;
  selectedModel: ModelName;
  isOwner: boolean;
  isReadOnly?: boolean;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleRegenerate: () => void;
  handleStopGeneration: () => void;
  handleModelSelect: (model: ModelName) => void;
  handleBranchConversation: (upToMessageIndex: number) => Promise<void>;
  handleRetryMessage: (messageIndex: number) => void;
  handleCopyResponse: (
    messageContent: string,
    messageId: string,
  ) => Promise<void>;
  copiedMessageId: string | null;
  onUpdateConversationVisibility?: (isPublic: boolean) => Promise<void>;
  experimental_resume: () => void;
  data: any[];
  setMessages: (messages: Message[]) => void;
  autoResume?: boolean;
  conversationId: string;
}

export default function ChatMainArea({
  conversation,
  conversationId,
  messages,
  input,
  isLoading,
  error,
  selectedModel,
  isOwner,
  isReadOnly = false,
  chatInputRef,
  handleInputChange,
  handleSubmit,
  handleKeyPress,
  handleRegenerate,
  handleStopGeneration,
  handleModelSelect,
  handleBranchConversation,
  handleRetryMessage,
  handleCopyResponse,
  copiedMessageId,
  onUpdateConversationVisibility,
  experimental_resume,
  data,
  setMessages,
  autoResume = true,
}: ChatMainAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [pendingVisibilityChange, setPendingVisibilityChange] = useState<
    boolean | null
  >(null);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [wasNearBottomBeforeGeneration, setWasNearBottomBeforeGeneration] =
    useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useAutoResume({
    autoResume,
    initialMessages: messages,
    experimental_resume,
    data,
    setMessages,
    conversationId,
  });

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

  const handleShareClick = () => {
    if (isReadOnly) return;
    setShowShareDialog(true);
    setShareUrlCopied(false);
    setPendingVisibilityChange(null);
    setShowVisibilityDropdown(false);
  };

  const handleCopyShareUrl = async () => {
    const currentVisibility = pendingVisibilityChange ?? conversation?.isPublic;
    if (!currentVisibility) return;

    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy share URL: ", err);
    }
  };

  const handleVisibilitySelect = (isPublic: boolean) => {
    if (isReadOnly) return;
    setPendingVisibilityChange(isPublic);
    setShowVisibilityDropdown(false);
  };

  const handleConfirmVisibilityChange = async () => {
    console.log("Confirming visibility change:", pendingVisibilityChange);
    console.log(
      "onUpdateConversationVisibility exists:",
      !!onUpdateConversationVisibility,
    );

    if (
      pendingVisibilityChange === null ||
      !onUpdateConversationVisibility ||
      isReadOnly
    )
      return;

    setIsUpdatingVisibility(true);
    try {
      console.log("Calling onUpdateConversationVisibility...");
      await onUpdateConversationVisibility(pendingVisibilityChange);
      console.log("Successfully updated visibility");
      setPendingVisibilityChange(null);
      setShowShareDialog(false);
    } catch (err) {
      console.error("Failed to update conversation visibility:", err);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleChatSubmit = (e?: React.FormEvent) => {
    if (isReadOnly) return;
    handleSubmit(e);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  };

  const renderChatMessage = (message: Message, messageIndex: number) => {
    if (message.role === "user") {
      return (
        <div className="flex justify-end">
          <div className="auth-clean-shadow max-w-[80%] overflow-hidden rounded-lg bg-[#0551CE] px-4 py-2 break-words text-[#F7F7F2] dark:bg-[#5B9BD5] dark:text-[#1a1a1a]">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div className="group overflow-hidden">
        <div className="prose prose-sm mt-4 max-w-none overflow-hidden break-words text-[#4C5461] dark:text-[#111]">
          <style dangerouslySetInnerHTML={{ __html: latexStyles }} />
          <div className="overflow-x-auto">
            <MarkdownRenderer>{message.content}</MarkdownRenderer>
          </div>

          <MessageActions
            messageContent={message.content}
            messageId={message.id}
            messageIndex={messageIndex}
            isOwner={isOwner}
            isReadOnly={isReadOnly}
            isLoading={isLoading}
            copiedMessageId={copiedMessageId}
            onCopyResponse={handleCopyResponse}
            onRetryMessage={handleRetryMessage}
            onBranchConversation={handleBranchConversation}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Integrated Conversation Header */}
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
            onClick={handleShareClick}
            className="flex w-24 cursor-pointer items-center gap-2 border-1 border-solid border-[#044bb8] px-4 py-1.5 text-sm text-[#044bb8] transition-all hover:bg-[#044bb8] hover:text-[#F7F7F2] dark:border-[#5B9BD5] dark:text-[#5B9BD5] dark:hover:bg-[#5B9BD5] dark:hover:text-[#1a1a1a]"
            title="Share this chat"
          >
            <Share className="h-4 w-4" />
            Share
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="mt-4 min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-4"
      >
        {messages.map((message, index) => (
          <div key={message.id} className="mx-auto max-w-4xl min-w-0">
            {renderChatMessage(message, index)}
          </div>
        ))}

        {/* Integrated Loading Indicator */}
        {isLoading && (
          <div className="mx-auto max-w-4xl">
            <div className="leading-relaxed text-[#4C5461] dark:text-[#B0B7C3]">
              Thinking...
            </div>
          </div>
        )}

        {/* Integrated Error Message */}
        {error && !isReadOnly && (
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-red-600 text-xs font-medium text-white dark:bg-red-500">
                !
              </div>
              <div className="min-w-0 flex-1">
                <div className="leading-relaxed text-red-600 dark:text-red-400">
                  Error: {error.message}
                </div>
                <button
                  onClick={handleRegenerate}
                  className="auth-clean-shadow mt-2 rounded bg-[#0551CE] px-3 py-1 text-sm text-[#F7F7F2] transition-colors hover:bg-[#044bb8] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Integrated Scroll to Bottom Button */}
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

      {/* Chat Input */}
      {!isReadOnly && (
        <div className="flex-shrink-0">
          <ChatInput
            ref={chatInputRef}
            message={input}
            onMessageChange={(msg) => {
              if (typeof msg === "string") {
                handleInputChange({
                  target: { value: msg },
                } as React.ChangeEvent<HTMLTextAreaElement>);
              } else {
                handleInputChange(msg);
              }
            }}
            onSendMessage={handleChatSubmit}
            onKeyPress={handleKeyPress}
            isLoading={isLoading}
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
            showModelSelector={true}
            onStopGeneration={handleStopGeneration}
            placeholder="Type your message here..."
            disabled={!isOwner}
          />
        </div>
      )}

      {!isReadOnly && (
        <ShareDialog
          isOpen={showShareDialog}
          onOpenChange={setShowShareDialog}
          conversation={conversation}
          shareUrlCopied={shareUrlCopied}
          showVisibilityDropdown={showVisibilityDropdown}
          pendingVisibilityChange={pendingVisibilityChange}
          isUpdatingVisibility={isUpdatingVisibility}
          onCopyShareUrl={handleCopyShareUrl}
          onVisibilityDropdownToggle={() =>
            setShowVisibilityDropdown(!showVisibilityDropdown)
          }
          onVisibilitySelect={handleVisibilitySelect}
          onConfirmVisibilityChange={handleConfirmVisibilityChange}
        />
      )}
    </div>
  );
}
