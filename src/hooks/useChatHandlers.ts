import { type Message as AIMessage, type FinishReason } from "ai";
import type {
  Message,
  CreateMessage,
  ChatRequestOptions,
} from 'ai';
import { useCallback, useEffect } from "react";
import { hasLatex } from "~/components/chat/MarkdownRenderer";
import { useStreamingStatus } from "~/hooks/useStreamingStatus";
import type { Attachment } from "~/types/chat";
import type { Conversation } from "~/types/conversations";

export function useChatHandlers(
  conversationId: string,
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>,
  setConversation: React.Dispatch<React.SetStateAction<Conversation | null>>,
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>,
  isPublicReadOnlyMode: boolean,
) {
  const { setStreaming } = useStreamingStatus();

  const handleChatFinish = useCallback(
    (message: AIMessage, { finishReason }: { finishReason: FinishReason }) => {
      console.log("Chat finished:", {
        messageLength: message.content.length,
        finishReason,
        hasLatex: hasLatex(message.content),
      });

      setStreaming(conversationId, false);

      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);

      void fetch("/api/conversations")
        .then((res) => res.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) {
            setConversations(data as Conversation[]);

            const updatedConversation = (data as Conversation[]).find(
              (c) => c.id === conversationId,
            );
            if (updatedConversation) {
              setConversation(updatedConversation);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to update conversations after message:", err);
        });
    },
    [
      conversationId,
      setStreaming,
      chatInputRef,
      setConversations,
      setConversation,
    ],
  );

  const handleChatError = useCallback(
    (error: Error) => {
      console.error("Chat error:", error);
      setStreaming(conversationId, false);
    },
    [conversationId, setStreaming],
  );

  const handleSubmitWithAttachments = useCallback(
    async (
      originalHandleSubmit: (e?: React.FormEvent) => void,
      input: string,
      setInput: (value: string) => void,
      append: (
      message: Message | CreateMessage,
      chatRequestOptions?: ChatRequestOptions,
    ) => Promise<string | null | undefined>,
      e?: React.FormEvent,
      options?: { experimental_attachments?: Attachment[] },
    ) => {
      if (isPublicReadOnlyMode) return;
      e?.preventDefault();

      const attachments = options?.experimental_attachments;
      const messageContent = input.trim();

      if (attachments && attachments.length > 0) {
        setStreaming(conversationId, true);
        try {
          await append({
            role: "user",
            content: messageContent,
            experimental_attachments: attachments,
          });
          setInput("");
        } catch (error) {
          console.error("Error sending message with attachments:", error);
          setStreaming(conversationId, false);
        }
      } else {
        originalHandleSubmit(e);
      }
    },
    [conversationId, setStreaming, isPublicReadOnlyMode],
  );

  const handleKeyPress = useCallback(
    (
      e: React.KeyboardEvent<HTMLTextAreaElement>,
      handleSubmit: (e?: React.FormEvent) => void,
    ) => {
      if (e.key === "Enter" && !e.shiftKey && !isPublicReadOnlyMode) {
        e.preventDefault();
        void handleSubmit(e);
      }
    },
    [isPublicReadOnlyMode],
  );

  const handleRegenerate = useCallback(
    (reload: () => void) => {
      if (!isPublicReadOnlyMode) {
        void reload();
      }
    },
    [isPublicReadOnlyMode],
  );

  const handleStopGeneration = useCallback(
    (stop: () => void) => {
      if (!isPublicReadOnlyMode) {
        stop();
      }
    },
    [isPublicReadOnlyMode],
  );

  // Focus chat input when appropriate
  useEffect(() => {
    if (!isPublicReadOnlyMode) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [conversationId, isPublicReadOnlyMode, chatInputRef]);

  return {
    handleChatFinish,
    handleChatError,
    handleSubmitWithAttachments,
    handleKeyPress,
    handleRegenerate,
    handleStopGeneration,
  };
}
