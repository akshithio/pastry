"use client";

import { useChat } from "@ai-sdk/react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { hasLatex } from "~/components/chat/MarkdownRenderer";
import { saans } from "~/utils/fonts";

import { useConversationEvents } from "~/hooks/useConversationEvents";
import { useLoadingConversations } from "~/hooks/useLoadingConversation";
import { useSidebarCollapse } from "~/hooks/useSidebarCollapse";

import AuthScreen from "~/components/AuthScreen";
import ChatMainArea from "~/components/chat/ChatMainArea";
import CommandMenu from "~/components/CommandMenu";
import Sidebar from "~/components/sidebar/Sidebar";
import type { Message } from "~/types/conversations";

import { MODEL_CONFIG, type ModelName } from "~/model_config";
import type { Conversation } from "~/types/conversations";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const [selectedModel, setSelectedModel] = useState<ModelName>("Pixtral 12B");

  const { loadingConversationIds, removeLoadingConversation } =
    useLoadingConversations();

  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const handleChatFinish = (message, { usage, finishReason }) => {
    console.log("Chat finished:", {
      messageLength: message.content.length,
      usage,
      finishReason,
      hasLatex: hasLatex(message.content),
    });

    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);

    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);

          const updatedConversation = data.find((c) => c.id === conversationId);
          if (updatedConversation) {
            setConversation(updatedConversation);

            if (updatedConversation.title !== "New Thread") {
              removeLoadingConversation(conversationId);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Failed to update conversations after message:", err);
      });
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
    data,
    experimental_resume,
    append,
  } = useChat({
    api: "/api/chat",
    id: conversationId,
    body: {
      provider: MODEL_CONFIG[selectedModel].provider,
      modelId: MODEL_CONFIG[selectedModel].modelId,
      conversationId: conversationId,
    },
    headers: {
      "x-vercel-ai-chat-id": conversationId,
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: handleChatFinish,
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const { isSidebarCollapsed, handleToggleSidebarCollapse, isHydrated } =
    useSidebarCollapse();

  const isOwner = session?.user?.id && conversation?.userId === session.user.id;

  const isPublicReadOnlyMode = conversation?.isPublic && !isOwner;

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
      console.log("Conversation updated via WebSocket:", updatedConversation);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === updatedConversation.id ? updatedConversation : conv,
        ),
      );

      if (updatedConversation.id === conversationId) {
        console.log(
          "Updating current conversation and title:",
          updatedConversation.title,
        );
        setConversation(updatedConversation);
      }
    },
    [conversationId],
  );

  const handleConversationDeleted = useCallback(
    (conversationId: string) => {
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId),
      );

      if (conversationId === params.id) {
        router.push("/");
      }
    },
    [params.id, router],
  );

  const { isConnected } = useConversationEvents({
    onConversationCreated: handleConversationCreated,
    onConversationUpdated: handleConversationUpdated,
    onConversationDeleted: handleConversationDeleted,
  });

  useEffect(() => {
    if (session) {
      const fetchConversations = async () => {
        try {
          const response = await fetch("/api/conversations");
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          const data = await response.json();
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
    console.log("Title effect triggered. Conversation:", conversation);

    if (conversation?.title) {
      console.log("Setting document title to:", conversation.title);
      document.title = conversation.title;
    } else {
      console.log("Setting document title to default: Chat");
      document.title = "Chat";
    }

    return () => {
      document.title = "Chat";
    };
  }, [conversation?.title, conversation?.id]);

  useEffect(() => {
    if (session && !conversation) {
      void fetch(`/api/conversations/${conversationId}`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched conversation:", data);
          setConversation(data);
        }
      });
    }
  }, [session, conversation, conversationId]);

  useEffect(() => {
    if (conversationId) {
      const fetchConversation = async () => {
        try {
          const res = await fetch(`/api/conversations/${conversationId}`);
          if (res.ok) {
            const data = await res.json();
            console.log("Fetched conversation:", data);
            setConversation(data);
          } else if (res.status === 401) {
            console.log("Unauthorized access to conversation");
          } else if (res.status === 404) {
            console.log("Conversation not found");
          }
        } catch (error) {
          console.error("Failed to fetch conversation:", error);
        } finally {
          setConversationLoaded(true);
        }
      };

      void fetchConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversation && loadingConversationIds.includes(conversation.id)) {
      if (conversation.title !== "New Thread") {
        removeLoadingConversation(conversation.id);
      }
    }
  }, [conversation, loadingConversationIds, removeLoadingConversation]);

  useEffect(() => {
    if (conversation) {
      setSelectedModel(conversation.model || "Pixtral 12B");
    }
  }, [conversation]);

  useEffect(() => {
    if (conversationId && conversation) {
      const loadMessages = async () => {
        try {
          const res = await fetch(
            `/api/conversations/${conversationId}/messages`,
          );
          if (res.ok) {
            const existingMessages: Message[] = (await res.json()) as Message[];
            if (existingMessages.length > 0) {
              setMessages(existingMessages);
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

  const hasAutoSentFirstMessage = useRef(false);

  useEffect(() => {
    if (
      conversation &&
      messages.length === 0 &&
      !isLoading &&
      !isPublicReadOnlyMode &&
      !hasAutoSentFirstMessage.current
    ) {
      const pendingMessage = sessionStorage.getItem(
        `pendingMessage_${conversationId}`,
      );

      if (pendingMessage) {
        hasAutoSentFirstMessage.current = true;

        sessionStorage.removeItem(`pendingMessage_${conversationId}`);

        void append({
          role: "user",
          content: pendingMessage,
        });
      }
    }
  }, [
    conversation,
    messages,
    isLoading,
    isPublicReadOnlyMode,
    append,
    conversationId,
  ]);

  useEffect(() => {
    hasAutoSentFirstMessage.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (conversation && !isLoading && !isPublicReadOnlyMode) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [conversation, conversationId, isLoading, isPublicReadOnlyMode]);

  const handleUpdateConversationVisibility = async (
    isPublic: boolean,
  ): Promise<void> => {
    if (!conversation?.id || isPublicReadOnlyMode) {
      throw new Error(
        "No conversation ID available or insufficient permissions",
      );
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
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update conversation visibility",
        );
      }

      const updatedConversation: Conversation =
        (await response.json()) as Conversation;

      setConversation(updatedConversation);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === updatedConversation.id ? updatedConversation : conv,
        ),
      );

      return;
    } catch (error) {
      console.error("Error updating conversation visibility:", error);
      throw error;
    }
  };

  const handleBranchConversation = async (upToMessageIndex: number) => {
    if (!conversation || isPublicReadOnlyMode) return;

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
          })),
        }),
      });

      if (res.ok) {
        const newConversation = (await res.json()) as Conversation;

        router.push(`/chat/${newConversation.id}`);
      } else {
        console.error("Failed to create branch conversation");
      }
    } catch (error) {
      console.error("Error creating branch conversation:", error);
    }
  };

  const handleConversationClick = (clickedConversationId: string) => {
    if (!isPublicReadOnlyMode) {
      router.push(`/chat/${clickedConversationId}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isPublicReadOnlyMode) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleRegenerate = () => {
    if (!isPublicReadOnlyMode) {
      void reload();
    }
  };

  const handleStopGeneration = () => {
    if (!isPublicReadOnlyMode) {
      stop();
    }
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
    if (isPublicReadOnlyMode) return;

    const messagesToKeep = messages.slice(0, messageIndex);
    setMessages(messagesToKeep);

    setTimeout(() => {
      void reload();
    }, 0);
  };

  const handleModelSelect = (model: ModelName) => {
    if (!isPublicReadOnlyMode) {
      setSelectedModel(model);
    }
  };

  if (status === "loading" || !isHydrated || !conversationLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F2] dark:bg-[#1a1a1a]">
        <div className="text-[#4C5461] dark:text-[#B0B7C3]">Loading...</div>
      </div>
    );
  }

  if (!session && conversation && !conversation.isPublic) {
    return <AuthScreen />;
  }

  if (!session && !conversation && conversationLoaded) {
    return <AuthScreen />;
  }

  if (!conversation) {
    return (
      <div
        className={`flex h-screen ${saans.className} auth-grid-bg relative bg-[#F7F7F2] text-sm font-medium dark:bg-[#1a1a1a]`}
      >
        <div className="auth-grid-lines pointer-events-none absolute inset-0"></div>
        <CommandMenu conversations={conversations} />

        {!isPublicReadOnlyMode && session && (
          <Sidebar
            session={session}
            conversations={conversations}
            onConversationClick={handleConversationClick}
            setConversations={setConversations}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebarCollapse}
            loadingConversationIds={loadingConversationIds}
          />
        )}

        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="text-[#4C5461] dark:text-[#B0B7C3]">
            Loading conversation...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen ${saans.className} auth-grid-bg relative bg-[#F7F7F2] text-sm font-medium dark:bg-[#1a1a1a]`}
    >
      <div className="auth-grid-lines pointer-events-none absolute inset-0" />

      {!isPublicReadOnlyMode && <CommandMenu conversations={conversations} />}

      {!isPublicReadOnlyMode && session && (
        <Sidebar
          session={session}
          conversations={conversations}
          onConversationClick={handleConversationClick}
          setConversations={setConversations}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
          activeConversationId={conversationId}
        />
      )}

      <ChatMainArea
        conversation={conversation}
        conversationId={conversationId}
        messages={messages}
        input={input}
        isLoading={isLoading}
        error={error ?? null}
        selectedModel={selectedModel}
        isOwner={!!isOwner}
        isReadOnly={isPublicReadOnlyMode}
        chatInputRef={chatInputRef}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        handleKeyPress={handleKeyPress}
        handleRegenerate={handleRegenerate}
        handleStopGeneration={handleStopGeneration}
        handleModelSelect={handleModelSelect}
        handleBranchConversation={handleBranchConversation}
        handleRetryMessage={handleRetryMessage}
        handleCopyResponse={handleCopyResponse}
        copiedMessageId={copiedMessageId}
        onUpdateConversationVisibility={handleUpdateConversationVisibility}
        experimental_resume={experimental_resume}
        data={data}
        setMessages={setMessages}
        autoResume={true}
      />
    </div>
  );
}
