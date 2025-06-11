"use client";

import { useChat } from "@ai-sdk/react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { hasLatex } from "~/components/chat/MarkdownRenderer";
import { saans } from "~/utils/fonts";

import { useSidebarCollapse } from "~/hooks/useSidebarCollapse";

import AuthScreen from "~/components/AuthScreen";
import ChatMainArea from "~/components/chat/ChatMainArea";
import CommandMenu from "~/components/CommandMenu";
import Sidebar from "~/components/sidebar/Sidebar";

import { MODEL_CONFIG, type ModelName } from "~/model_config";

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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = params.id as string;

  const modelFromUrl = searchParams.get("model") as ModelName | null;
  const [selectedModel, setSelectedModel] = useState<ModelName>(
    modelFromUrl && modelFromUrl in MODEL_CONFIG ? modelFromUrl : "Pixtral 12B",
  );

  useEffect(() => {
    const modelParam = searchParams.get("model") as ModelName | null;
    if (modelParam && modelParam in MODEL_CONFIG) {
      setSelectedModel(modelParam);
    }
  }, [searchParams]);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);

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
    onFinish: (message, { usage, finishReason }) => {
      console.log("Chat finished:", {
        messageLength: message.content.length,
        usage,
        finishReason,
        hasLatex: hasLatex(message.content),
      });

      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    },
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const [conversationToRenameId, setConversationToRenameId] = useState<
    string | null
  >(null);

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const { isSidebarCollapsed, handleToggleSidebarCollapse, isHydrated } =
    useSidebarCollapse();

  useEffect(() => {
    if (session) {
      void fetch("/api/conversations").then(async (res) => {
        const data = (await res.json()) as Conversation[];
        if (Array.isArray(data)) {
          setConversations(data);
        } else {
          setConversations([]);
        }
      });
    }
  }, [session]);

  useEffect(() => {
    if (conversationId) {
      void fetch(`/api/conversations/${conversationId}`).then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as unknown as Conversation;
          setConversation(data);
        } else {
          console.error("Failed to fetch conversation details.");
          setConversation(null);
        }
      });
    }
  }, [conversationId]);

  useEffect(() => {
    const initialPrompt = searchParams.get("initialPrompt");
    if (
      initialPrompt &&
      messages.length === 0 &&
      !isLoading &&
      conversationId
    ) {
      const event = {
        target: { value: initialPrompt },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(event);
      setTimeout(() => handleSubmit(), 0);
    }
  }, [
    conversationId,
    messages,
    searchParams,
    isLoading,
    handleInputChange,
    handleSubmit,
  ]);

  useEffect(() => {
    if (conversationId && conversation) {
      const loadMessages = async () => {
        try {
          const res = await fetch(
            `/api/conversations/${conversationId}/messages`,
          );
          if (res.ok) {
            const existingMessages: Message[] = await res.json();
            if (existingMessages.length > 0) {
              setMessages(existingMessages);
            }
          }
        } catch (error) {
          console.error("Failed to load existing messages:", error);
        }
      };
      if (messages.length === 0) {
        void loadMessages();
      }
    }
  }, [conversationId, conversation, setMessages, messages.length]);

  useEffect(() => {
    if (conversationId && conversation) {
      const loadMessages = async () => {
        try {
          const res = await fetch(
            `/api/conversations/${conversationId}/messages`,
          );
          if (res.ok) {
            const existingMessages: Message[] = await res.json();
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

  useEffect(() => {
    if (conversation && !isLoading) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [conversation, conversationId, isLoading]);

  const handleBranchConversation = async (upToMessageIndex: number) => {
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
          })),
        }),
      });

      if (res.ok) {
        const newConversation = (await res.json()) as Conversation;
        setConversations((prev) => [newConversation, ...prev]);
        router.push(`/chat/${newConversation.id}`);
      } else {
        console.error("Failed to create branch conversation");
      }
    } catch (error) {
      console.error("Error creating branch conversation:", error);
    }
  };

  const handleConversationClick = (clickedConversationId: string) => {
    router.push(`/chat/${clickedConversationId}`);
  };

  const handleDeleteConversation = (deletedConversationId: string) => {
    setConversations((prev) =>
      prev.filter((c) => c.id !== deletedConversationId),
    );

    if (deletedConversationId === conversationId) {
      router.push("/");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleRegenerate = () => {
    void reload();
  };

  const handleStopGeneration = () => {
    stop();
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

  const handleModelSelect = (model: ModelName) => {
    setSelectedModel(model);
  };

  const isOwner = session?.user?.id && conversation?.userId === session.user.id;

  if (status === "loading" || !isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F2] dark:bg-[#1a1a1a]">
        <div className="text-[#4C5461] dark:text-[#B0B7C3]">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!conversation) {
    return (
      <div
        className={`flex h-screen ${saans.className} auth-grid-bg relative bg-[#F7F7F2] text-sm font-medium dark:bg-[#1a1a1a]`}
      >
        <div className="auth-grid-lines pointer-events-none absolute inset-0"></div>
        <CommandMenu conversations={conversations} />

        <Sidebar
          session={session}
          conversations={conversations}
          onConversationClick={handleConversationClick}
          onDeleteConversation={handleDeleteConversation}
          conversationToRenameId={conversationToRenameId}
          setConversationToRenameId={setConversationToRenameId}
          setConversations={setConversations}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
        />

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

      <CommandMenu conversations={conversations} />

      <Sidebar
        session={session}
        conversations={conversations}
        onConversationClick={handleConversationClick}
        onDeleteConversation={handleDeleteConversation}
        conversationToRenameId={conversationToRenameId}
        setConversationToRenameId={setConversationToRenameId}
        setConversations={setConversations}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      <ChatMainArea
        conversation={conversation}
        messages={messages}
        input={input}
        isLoading={isLoading}
        error={error}
        selectedModel={selectedModel}
        isOwner={isOwner}
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
      />
    </div>
  );
}
