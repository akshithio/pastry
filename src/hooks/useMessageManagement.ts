import { type Message } from "ai";
import { useEffect, useRef, useState } from "react";
import type { Attachment } from "~/types/chat";
import type { Conversation } from "~/types/conversations";

type MessageWithAttachments = Message & {
  experimental_attachments?: Attachment[];
};

export function useMessageManagement(
  conversationId: string,
  conversation: Conversation,
  messages: Message[],
  setMessages: (messages: Message[]) => void,
  isLoading: boolean,
  append: any,
  reload: any,
) {
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(
    null,
  );
  const [editingMessageContent, setEditingMessageContent] =
    useState<string>("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const hasAutoSentFirstMessage = useRef(false);

  useEffect(() => {
    if (conversationId && conversation) {
      const loadMessages = async () => {
        try {
          const res = await fetch(
            `/api/conversations/${conversationId}/messages`,
          );
          if (res.ok) {
            const existingMessages: unknown = await res.json();
            if (
              Array.isArray(existingMessages) &&
              existingMessages.length > 0
            ) {
              setMessages(existingMessages as Message[]);
            }
          } else {
            console.error("Failed to fetch messages");
          }
        } catch (error) {
          console.error("Failed to load existing messages:", error);
        }
      };

      if (messages.length === 0 && !isLoading) {
        void loadMessages();
      }
    }
  }, [conversationId, conversation, setMessages, messages.length, isLoading]);

  useEffect(() => {
    if (
      conversation &&
      messages.length === 0 &&
      !isLoading &&
      !hasAutoSentFirstMessage.current
    ) {
      const pendingMessage = sessionStorage.getItem(
        `pendingMessage_${conversationId}`,
      );
      const pendingAttachmentsStr = sessionStorage.getItem(
        `pendingAttachments_${conversationId}`,
      );

      if (pendingMessage) {
        hasAutoSentFirstMessage.current = true;

        sessionStorage.removeItem(`pendingMessage_${conversationId}`);
        sessionStorage.removeItem(`pendingAttachments_${conversationId}`);

        let attachments: Attachment[] | undefined;
        if (pendingAttachmentsStr) {
          try {
            attachments = JSON.parse(pendingAttachmentsStr) as Attachment[];
          } catch (error) {
            console.error("Failed to parse pending attachments:", error);
          }
        }

        void append({
          role: "user",
          content: pendingMessage,
          ...(attachments &&
            attachments.length > 0 && {
              experimental_attachments: attachments,
            }),
        });
      }
    }
  }, [conversation, messages, isLoading, append, conversationId]);

  useEffect(() => {
    hasAutoSentFirstMessage.current = false;
  }, [conversationId]);

  const handleEditMessage = (messageIndex: number) => {
    const messageToEdit = messages[messageIndex];
    if (messageToEdit && messageToEdit.role === "user") {
      setEditingMessageIndex(messageIndex);
      setEditingMessageContent(messageToEdit.content);
    }
  };

  const handleSaveEditedMessage = async (
    messageIndex: number,
    newContent: string,
    attachments?: Attachment[],
  ) => {
    if (editingMessageIndex === null) return;

    const originalMessages = [...messages];

    setMessages(
      messages.map((msg, index) => {
        if (index === editingMessageIndex) {
          const updatedMsg: MessageWithAttachments = {
            ...msg,
            content: newContent,
          };
          if (attachments) {
            updatedMsg.experimental_attachments = attachments;
          }
          return updatedMsg as Message;
        }
        return msg;
      }),
    );

    setEditingMessageIndex(null);
    setEditingMessageContent("");

    try {
      await fetch(`/api/messages/${messages[editingMessageIndex]?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent, attachments }),
      });
    } catch (err) {
      console.error("Failed to save edited message:", err);
      setMessages(originalMessages);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setEditingMessageContent("");
  };

  const handleCopyResponse = async (
    messageContent: string,
    messageId: string,
  ) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleRetryMessage = (messageIndex: number) => {
    const messagesToKeep = messages.slice(0, messageIndex);
    setMessages(messagesToKeep);

    setTimeout(() => {
      void reload();
    }, 0);
  };

  return {
    editingMessageIndex,
    editingMessageContent,
    copiedMessageId,
    setEditingMessageContent,
    handleEditMessage,
    handleSaveEditedMessage,
    handleCancelEdit,
    handleCopyResponse,
    handleRetryMessage,
  };
}
