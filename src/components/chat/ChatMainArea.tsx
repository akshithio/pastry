import { type Message } from "@ai-sdk/react";
import {
  Check,
  Copy,
  GitBranch,
  Globe,
  Lock,
  RotateCcw,
  Share,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatInput from "~/components/chat/ChatInput";
import MarkdownRenderer, {
  latexStyles,
} from "~/components/chat/MarkdownRenderer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { type ModelName } from "~/model_config";

type Conversation = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isBranched?: boolean;
  isPublic?: boolean;
};

interface ChatMainAreaProps {
  conversation: Conversation;
  messages: Message[];
  input: string;
  isLoading: boolean;
  error: Error | null;
  selectedModel: ModelName;
  isOwner: boolean;
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
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
}

export default function ChatMainArea({
  conversation,
  messages,
  input,
  isLoading,
  error,
  selectedModel,
  isOwner,
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
}: ChatMainAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;

    const isNearBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 100;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleChatSubmit = (e?: React.FormEvent) => {
    handleSubmit(e);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  };

  const handleShareClick = () => {
    setShowShareDialog(true);
    setShareUrlCopied(false);
  };

  const handleCopyShareUrl = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy share URL: ", err);
    }
  };

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      <button
        onClick={handleShareClick}
        className="sticky top-4 mr-8 ml-auto flex w-24 cursor-pointer items-center gap-2 border-1 border-solid border-[#044bb8] px-4 py-1.5 text-sm text-[#044bb8] transition-all hover:bg-[#044bb8] hover:text-[#F7F7F2] dark:border-[#5B9BD5] dark:text-[#5B9BD5] dark:hover:bg-[#5B9BD5] dark:hover:text-[#1a1a1a]"
        title="Share this chat"
      >
        <Share className="h-4 w-4" />
        Share
      </button>

      {/* Messages Area */}
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={message.id} className="mx-auto max-w-4xl">
            {message.role === "user" ? (
              <div className="flex justify-end">
                <div className="auth-clean-shadow max-w-[80%] overflow-hidden rounded-lg bg-[#0551CE] px-4 py-2 break-words text-[#F7F7F2] dark:bg-[#5B9BD5] dark:text-[#1a1a1a]">
                  {message.content}
                </div>
              </div>
            ) : (
              <div className="group overflow-hidden">
                <div className="prose prose-sm mt-4 max-w-none overflow-hidden break-words text-[#4C5461] dark:text-[#111]">
                  <style dangerouslySetInnerHTML={{ __html: latexStyles }} />
                  <MarkdownRenderer>{message.content}</MarkdownRenderer>
                  {isOwner && (
                    <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() =>
                          handleCopyResponse(message.content, message.id)
                        }
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.12)] dark:text-[#B0B7C3] dark:hover:bg-[rgba(255,255,255,0.12)]"
                        title="Copy response"
                      >
                        {copiedMessageId === message.id ? (
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
                      <button
                        onClick={() => handleRetryMessage(index)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.12)] dark:text-[#B0B7C3] dark:hover:bg-[rgba(255,255,255,0.12)]"
                        title="Retry response"
                        disabled={isLoading}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </button>
                      <button
                        onClick={() => handleBranchConversation(index)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.12)] dark:text-[#B0B7C3] dark:hover:bg-[rgba(255,255,255,0.12)]"
                        title="Branch conversation from here"
                        disabled={isLoading}
                      >
                        <GitBranch className="h-3 w-3" />
                        Branch
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div className="mx-auto max-w-4xl">
            <div className="leading-relaxed text-[#4C5461] dark:text-[#B0B7C3]">
              Thinking...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-red-600 text-xs font-medium text-white dark:bg-red-500">
                !
              </div>
              <div className="flex-1">
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

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] shadow-[0_4px_12px_rgba(5,81,206,0.2)] sm:max-w-md dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:shadow-[0_4px_12px_rgba(91,155,213,0.2)]">
          <DialogHeader>
            <DialogTitle className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
              Share Conversation
            </DialogTitle>
            <DialogDescription className="text-[#4C5461] opacity-80 dark:text-[#B0B7C3] dark:opacity-80">
              Anyone with this link can view this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <div className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border border-[rgba(5,81,206,0.12)] bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-[rgba(255,255,255,0.12)]">
                <input
                  readOnly
                  value={
                    typeof window !== "undefined" ? window.location.href : ""
                  }
                  className="w-full bg-transparent text-[#4C5461] outline-none dark:text-[#E5E5E5]"
                />
              </div>
            </div>
            <button
              onClick={handleCopyShareUrl}
              className="auth-clean-shadow flex items-center gap-2 rounded-lg bg-[#0551CE] px-3 py-2 text-sm text-[#F7F7F2] transition-all hover:bg-[#044bb8] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
            >
              {shareUrlCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <DialogFooter className="sm:justify-start">
            <div className="flex items-center text-xs text-[#4C5461] opacity-60 dark:text-[#B0B7C3] dark:opacity-60">
              {conversation?.isPublic ? (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  Private
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}