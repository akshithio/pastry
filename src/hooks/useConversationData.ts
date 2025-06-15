import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Conversation, Message } from "~/types/conversations";

export function useConversationData() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [conversationNotFound, setConversationNotFound] = useState(false);

  useEffect(() => {
    if (session) {
      const fetchConversations = async () => {
        try {
          const response = await fetch("/api/conversations");
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          const data: unknown = await response.json();
          if (Array.isArray(data)) {
            setConversations(data as Conversation[]);
          } else {
            console.error("Received data is not an array:", data);
            setConversations([]);
          }
        } catch (error) {
          console.error("Failed to fetch conversations:", error);
          setConversations([]);
        }
      };

      void fetchConversations();
    }
  }, [session]);

  useEffect(() => {
    if (conversationId) {
      const fetchConversation = async () => {
        try {
          const res = await fetch(`/api/conversations/${conversationId}`);
          if (res.ok) {
            const data: unknown = await res.json();
            console.log("Fetched conversation:", data);
            setConversation(data as Conversation);
            setConversationNotFound(false);
          } else if (res.status === 401) {
            console.log("Unauthorized access to conversation");
            setConversationNotFound(false);
          } else if (res.status === 404) {
            console.log("Conversation not found");
            setConversationNotFound(true);
          }
        } catch (error) {
          console.error("Failed to fetch conversation:", error);
          setConversationNotFound(true);
        } finally {
          setConversationLoaded(true);
        }
      };

      void fetchConversation();
    }
  }, [conversationId]);

  const handleUpdateConversationVisibility = async (
    isPublic: boolean,
  ): Promise<void> => {
    if (!conversation?.id) {
      throw new Error("No conversation ID available");
    }

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/visibility`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isPublic,
          }),
        },
      );

      if (!response.ok) {
        const errorData: unknown = await response.json();
        const error =
          errorData && typeof errorData === "object" && "error" in errorData
            ? (errorData as { error: string }).error
            : "Failed to update conversation visibility";
        throw new Error(error);
      }

      const updatedConversation: unknown = await response.json();

      setConversation(updatedConversation as Conversation);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === (updatedConversation as Conversation).id
            ? (updatedConversation as Conversation)
            : conv,
        ),
      );
    } catch (error) {
      console.error("Error updating conversation visibility:", error);
      throw error;
    }
  };

  const handleBranchConversation = async (
    upToMessageIndex: number,
    messages: Message[],
  ) => {
    if (!conversation) return;

    const messagesToBranch = messages.slice(0, upToMessageIndex + 1);
    const branchTitle = conversation.title;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: branchTitle,
          isBranched: true,
          initialMessages: messagesToBranch.map((msg) => ({
            role: msg.role,
            content: msg.content,
            experimental_attachments: msg.experimental_attachments,
          })),
        }),
      });

      if (res.ok) {
        const newConversation: unknown = await res.json();
        void router.push(`/chat/${(newConversation as Conversation).id}`);
      } else {
        console.error("Failed to create branch conversation");
      }
    } catch (error) {
      console.error("Error creating branch conversation:", error);
    }
  };

  const handleConversationCreated = useCallback(
    (conversation: Conversation) => {
      setConversations((prev) => {
        const exists = prev.some((conv) => conv.id === conversation.id);
        if (exists) return prev;
        return [conversation, ...prev];
      });
    },
    [],
  );

  const handleConversationUpdated = useCallback(
    (updatedConversation: Conversation) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === updatedConversation.id ? updatedConversation : conv,
        ),
      );

      if (updatedConversation.id === conversationId) {
        setConversation(updatedConversation);
      }
    },
    [conversationId],
  );

  const handleConversationDeleted = useCallback(
    (deletedConversationId: string) => {
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== deletedConversationId),
      );

      if (deletedConversationId === conversationId) {
        router.push("/");
      }
    },
    [conversationId, router],
  );

  const handleConversationClick = (clickedConversationId: string) => {
    router.push(`/chat/${clickedConversationId}`);
  };

  return {
    conversationId,
    conversations,
    conversation,
    conversationLoaded,
    conversationNotFound,
    setConversations,
    setConversation,
    handleUpdateConversationVisibility,
    handleBranchConversation,
    handleConversationCreated,
    handleConversationUpdated,
    handleConversationDeleted,
    handleConversationClick,
  };
}
