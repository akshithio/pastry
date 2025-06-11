"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saans } from "~/utils/fonts";

import AuthScreen from "~/components/AuthScreen";
import ChatInput, { type ModelName } from "~/components/chat/ChatInput";
import CommandMenu from "~/components/CommandMenu";
import LandingContent from "~/components/LandingContent";
import Sidebar from "~/components/sidebar/Sidebar";
import { useSidebarCollapse } from "~/hooks/useSidebarCollapse";

type Conversation = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isBranched?: boolean;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<ModelName>("Gemini 2.0 Flash");
  const [isLoading, setIsLoading] = useState(false);

  const { isSidebarCollapsed, handleToggleSidebarCollapse, isHydrated } =
    useSidebarCollapse();

  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const [conversationToRenameId, setConversationToRenameId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (session) {
      const fetchConversations = async () => {
        try {
          const response = await fetch("/api/conversations");
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          try {
            const data: unknown = await response.json();
            if (Array.isArray(data)) {
              setConversations(data as Conversation[]);
            } else {
              console.error("Received data is not an array:", data);
              setConversations([]);
            }
          } catch (jsonError) {
            console.error("Failed to parse JSON:", jsonError);
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
    if (session && chatInputRef.current) {
      const timeoutId = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [session]);

  const handleMessageChange = (
    e: string | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    if (typeof e === "string") {
      setMessage(e);
    } else {
      setMessage(e.target.value);
    }
  };

  const handleFillMessage = (promptMessage: string) => {
    setMessage(promptMessage);
    chatInputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: message.length > 50 ? message.slice(0, 50) + "..." : message,
        }),
      });

      if (res.ok) {
        const newConversation = (await res.json()) as Conversation;

        router.push(
          `/chat/${newConversation.id}?initialPrompt=${encodeURIComponent(message)}&model=${encodeURIComponent(selectedModel)}`,
        );
      } else {
        throw new Error("Failed to create new conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsLoading(false);
      setMessage("");
    }
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  };

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

      <div className="relative z-10 flex flex-1 flex-col">
        <LandingContent
          userName={session.user?.name ?? "User"}
          onSendMessage={handleFillMessage}
          isLoading={isLoading}
        />

        <ChatInput
          ref={chatInputRef}
          message={message}
          onMessageChange={handleMessageChange}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          showModelSelector={true}
        />
      </div>
    </div>
  );
}
