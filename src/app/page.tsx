"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { saans } from "~/utils/fonts";

import AuthScreen from "~/components/AuthScreen";
import ChatInput, {
  type Attachment,
  type ModelName,
} from "~/components/chat/ChatInput";
import CommandMenu from "~/components/CommandMenu";
import LandingContent from "~/components/LandingContent";
import Sidebar from "~/components/sidebar/Sidebar";
import { useConversationEvents } from "~/hooks/useConversationEvents";
import { useSidebarCollapse } from "~/hooks/useSidebarCollapse";
import { type Conversation } from "~/types/conversations";

import { useStreamingStatus } from "~/hooks/useStreamingStatus";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<ModelName>("Gemini 2.0 Flash");
  const [isLoading, setIsLoading] = useState(false);

  const { isSidebarCollapsed, handleToggleSidebarCollapse, isHydrated } =
    useSidebarCollapse();

  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const { setStreaming, isStreaming } = useStreamingStatus();

  const isConversationStreamingFn = useCallback(
    (conversationId: string) => {
      return isStreaming(conversationId);
    },
    [isStreaming],
  );

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
    (conversation: Conversation) => {
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversation.id ? conversation : conv)),
      );
    },
    [],
  );

  const handleConversationDeleted = useCallback(
    (conversationId: string) => {
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId),
      );
      setStreaming(conversationId, false);
    },
    [setStreaming],
  );

  const handleStreamingStatusChange = useCallback(
    (convId: string, isStreamingFlag: boolean) => {
      setStreaming(convId, isStreamingFlag);
    },
    [setStreaming],
  );

  useConversationEvents({
    onConversationCreated: handleConversationCreated,
    onConversationUpdated: handleConversationUpdated,
    onConversationDeleted: handleConversationDeleted,
    onStreamingStatusChange: handleStreamingStatusChange,
  });

  useEffect(() => {
    if (session) {
      const fetchConversations = async () => {
        try {
          const response = await fetch("/api/conversations");
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          const data = (await response.json()) as unknown;
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
    if (session && pathname === "/" && chatInputRef.current) {
      const timeouts = [100, 200, 300].map((delay) =>
        setTimeout(() => {
          if (chatInputRef.current && pathname === "/") {
            chatInputRef.current.focus();
          }
        }, delay),
      );

      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
  }, [session, pathname, isHydrated]);

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

  const handleSendMessage = async (
    e?: React.FormEvent,
    options?: { experimental_attachments?: Attachment[] },
  ) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Thread",
          model: selectedModel,
        }),
      });

      if (res.ok) {
        const newConversation = (await res.json()) as Conversation;

        sessionStorage.setItem(`pendingMessage_${newConversation.id}`, message);

        if (
          options?.experimental_attachments &&
          options.experimental_attachments.length > 0
        ) {
          sessionStorage.setItem(
            `pendingAttachments_${newConversation.id}`,
            JSON.stringify(options.experimental_attachments),
          );
        }

        router.push(`/chat/${newConversation.id}`);
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
        setConversations={setConversations}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isConversationStreaming={isConversationStreamingFn}
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
