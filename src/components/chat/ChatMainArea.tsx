import { type Message as AIMessage } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import ChatInput from "~/components/chat/ChatInput";
import ConversationHeader from "~/components/ConversationHeader";
import MessagesContainer from "~/components/MessagesContainer";
import { useAutoResume, type DataPart } from "~/hooks/useAutoResume";
import { type ModelName } from "~/model_config";
import {
  type Attachment,
  type ExtendedMessage,
  type WebSearchStatus,
} from "~/types/chat";
import type { Conversation } from "~/types/conversations";
import { ShareDialog } from "../dialogs/ShareDialog";

interface ChatMainAreaProps {
  conversation: Conversation;
  messages: Array<ExtendedMessage | AIMessage>;
  input: string;
  isLoading: boolean;
  error: Error | null;
  selectedModel: ModelName;
  isOwner: boolean;
  isReadOnly?: boolean;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e?: React.FormEvent,
    options?: { experimental_attachments?: Attachment[] },
  ) => void;
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
  data: DataPart[];
  setMessages: (
    messages:
      | (AIMessage | ExtendedMessage)[]
      | ((
          prev: (AIMessage | ExtendedMessage)[],
        ) => (AIMessage | ExtendedMessage)[]),
  ) => void;
  autoResume?: boolean;
  conversationId: string;
  editingMessageIndex: number | null;
  editingMessageContent: string;
  onEditMessage: (messageIndex: number) => void;
  onSaveEditedMessage: (
    messageIndex: number,
    newContent: string,
    attachments?: Attachment[],
  ) => Promise<void>;
  onCancelEdit: () => void;
  onEditingContentChange: (content: string) => void;
  searchStatus: WebSearchStatus | null;
  currentReasoning?: string;
  isReasoningStreaming?: boolean;
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
  editingMessageIndex,
  editingMessageContent,
  onEditMessage,
  onSaveEditedMessage,
  onCancelEdit,
  onEditingContentChange,
  searchStatus,
  currentReasoning,
  isReasoningStreaming = false,
}: ChatMainAreaProps) {
  useEffect(() => {
    console.log("🧠 REASONING STATE CHANGE:", {
      currentReasoning,
      currentReasoningLength: currentReasoning?.length || 0,
      isReasoningStreaming,
      timestamp: new Date().toISOString(),
    });
  }, [currentReasoning, isReasoningStreaming]);

  useEffect(() => {
    console.log("📊 DATA ARRAY CHANGE:", {
      dataLength: data?.length || 0,
      dataTypes: data?.map((d) => d.type) || [],
      dataContents:
        data?.map((d) => ({
          type: d.type,
          contentLength:
            typeof d.content === "string" ? d.content.length : "not-string",
          contentPreview:
            typeof d.content === "string"
              ? d.content.slice(0, 100) + "..."
              : d.content,
        })) || [],
      timestamp: new Date().toISOString(),
    });
  }, [data]);

  useEffect(() => {
    console.log("💬 MESSAGES CHANGE:", {
      messagesLength: messages.length,
      messagesWithReasoning: messages.map((msg, idx) => ({
        index: idx,
        id: msg.id,
        role: msg.role,
        hasReasoning: !!(msg as any).reasoning,
        reasoningLength: (msg as any).reasoning?.length || 0,
        reasoningPreview: (msg as any).reasoning
          ? (msg as any).reasoning.slice(0, 50) + "..."
          : null,
        contentLength:
          typeof msg.content === "string" ? msg.content.length : "not-string",
      })),
      timestamp: new Date().toISOString(),
    });
  }, [messages]);

  useEffect(() => {
    console.log("⏳ LOADING STATE CHANGE:", {
      isLoading,
      isReasoningStreaming,
      currentReasoningExists: !!currentReasoning,
      timestamp: new Date().toISOString(),
    });
  }, [isLoading, isReasoningStreaming, currentReasoning]);

  console.log("=== ChatMainArea Debug ===", {
    messagesLength: messages.length,
    currentReasoning,
    isReasoningStreaming,
    lastMessage: messages[messages.length - 1],
    lastMessageHasReasoning:
      messages[messages.length - 1] &&
      (messages[messages.length - 1] as any).reasoning,
    dataArray: data,
    dataArrayLength: data?.length || 0,
    lastDataItem: data && data.length > 0 ? data[data.length - 1] : null,

    reasoningDebug: {
      currentReasoningType: typeof currentReasoning,
      currentReasoningTruthy: !!currentReasoning,
      currentReasoningEmpty: currentReasoning === "",
      currentReasoningUndefined: currentReasoning === undefined,
      currentReasoningNull: currentReasoning === null,
    },
    dataDebug: {
      dataIsArray: Array.isArray(data),
      dataHasReasoningChunks:
        data?.some((d) => d.type === "reasoning") || false,
      reasoningChunks: data?.filter((d) => d.type === "reasoning") || [],
    },
  });

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [pendingVisibilityChange, setPendingVisibilityChange] = useState<
    boolean | null
  >(null);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [copiedUserMessageId, setCopiedUserMessageId] = useState<string | null>(
    null,
  );

  useAutoResume({
    autoResume,
    initialMessages: messages,
    experimental_resume,
    data,
    setMessages,
    conversationId,
  });

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

  const handleChatSubmit = (
    e?: React.FormEvent,
    options?: { experimental_attachments?: Attachment[] },
  ) => {
    if (isReadOnly) return;

    if (editingMessageIndex !== null) {
      return;
    }

    console.log("🚀 CHAT SUBMIT:", {
      isLoading,
      editingMessageIndex,
      options,
      timestamp: new Date().toISOString(),
    });

    handleSubmit(e, options);

    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  };

  const handleSaveEditedMessage = async (
    messageIndex: number,
    newContent: string,
    attachments?: Attachment[],
  ) => {
    setIsSavingEdit(true);
    try {
      await onSaveEditedMessage(messageIndex, newContent, attachments);
    } catch (error) {
      console.error("Error saving message:", error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCopyUserMessage = async (
    messageContent: string,
    messageId: string,
  ) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopiedUserMessageId(messageId);
      setTimeout(() => {
        setCopiedUserMessageId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy message to clipboard", err);
    }
  };

  return (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
      <ConversationHeader
        conversation={conversation}
        isOwner={isOwner}
        isReadOnly={isReadOnly}
        onShareClick={handleShareClick}
      />

      <MessagesContainer
        messages={messages}
        isLoading={isLoading}
        error={error}
        searchStatus={searchStatus}
        isOwner={isOwner}
        isReadOnly={isReadOnly}
        editingMessageIndex={editingMessageIndex}
        editingMessageContent={editingMessageContent}
        isSavingEdit={isSavingEdit}
        copiedMessageId={copiedMessageId}
        copiedUserMessageId={copiedUserMessageId}
        currentReasoning={currentReasoning}
        isReasoningStreaming={isReasoningStreaming}
        onEditMessage={onEditMessage}
        onCancelEdit={onCancelEdit}
        onEditingContentChange={onEditingContentChange}
        onSaveEditedMessage={handleSaveEditedMessage}
        onCopyResponse={handleCopyResponse}
        onCopyUserMessage={handleCopyUserMessage}
        onRetryMessage={handleRetryMessage}
        onBranchConversation={handleBranchConversation}
        onRegenerate={handleRegenerate}
      />

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
