"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saans } from "~/utils/fonts";

import AuthScreen from "~/components/AuthScreen";
import ChatInput, { type ModelName } from "~/components/chat/ChatInput";
import CommandMenu from "~/components/CommandMenu";
import ContextMenu from "~/components/ContextMenu";
import LandingContent from "~/components/LandingContent";
import Sidebar from "~/components/sidebar/Sidebar";

type Conversation = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
};

type ContextMenuState = {
  show: boolean;
  x: number;
  y: number;
  conversationId: string | null;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<ModelName>("Gemini 2.0 Flash");
  const [isLoading, setIsLoading] = useState(false);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    conversationId: null,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // NEW: Ref for the chat input to enable auto-focus
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // NEW STATE: To control which conversation is currently being renamed (inline)
  const [conversationToRenameId, setConversationToRenameId] = useState<
    string | null
  >(null);

  // Fetch conversations on mount or when session changes
  useEffect(() => {
    if (session) {
      void fetch("/api/conversations").then(async (res) =>
        setConversations((await res.json()) as Conversation[]),
      );
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
      }
    };

    if (contextMenu.show) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenu.show]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // NEW: Handle filling the input from landing content prompts
  const handleFillMessage = (promptMessage: string) => {
    setMessage(promptMessage);
    // Focus the input after filling the message
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
        // Pass the selected model as a URL parameter
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
    router.push(`/chat/${conversationId}`); // Navigate to the existing chat
  };

  // MODIFIED: handleRenameConversation for ContextMenu (triggers inline edit)
  const handleRenameConversationFromContextMenu = () => {
    if (contextMenu.conversationId) {
      setConversationToRenameId(contextMenu.conversationId); // Set the ID to trigger inline edit
    }
    setContextMenu({ show: false, x: 0, y: 0, conversationId: null }); // Close context menu
  };

  // This is the actual API call for renaming, triggered by ConversationList's onRename
  const handleUpdateConversationTitle = async (
    id: string,
    newTitle: string,
  ) => {
    if (!newTitle.trim()) {
      setConversationToRenameId(null); // Exit rename mode if empty
      return;
    }

    const res = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
      );
    }
    setConversationToRenameId(null); // Exit rename mode after successful update
  };

  const handleContextMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      conversationId,
    });
  };

  const handlePinConversation = async () => {
    if (!contextMenu.conversationId) return;
    const conversation = conversations.find(
      (c) => c.id === contextMenu.conversationId,
    );
    if (!conversation) return;

    const res = await fetch(`/api/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !conversation.isPinned }),
    });

    if (res.ok) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, isPinned: !c.isPinned } : c,
        ),
      );
    }
    setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
  };

  const handleDeleteConversation = async () => {
    if (!contextMenu.conversationId) return;
    const res = await fetch(
      `/api/conversations/${contextMenu.conversationId}`,
      {
        method: "DELETE",
      },
    );

    if (res.ok) {
      setConversations((prev) =>
        prev.filter((c) => c.id !== contextMenu.conversationId),
      );
    }
    setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
  };

  const getIsPinned = (conversationId: string | null) => {
    if (!conversationId) return false;
    const conversation = conversations.find((c) => c.id === conversationId);
    return conversation?.isPinned ?? false;
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F2]">
        <div className="text-[#4C5461]">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div
      className={`flex h-screen ${saans.className} auth-grid-bg relative bg-[#F7F7F2] text-sm font-medium`}
    >
      {/* Grid overlay */}
      <div className="auth-grid-lines pointer-events-none absolute inset-0"></div>

      <CommandMenu conversations={conversations} />

      <ContextMenu
        ref={contextMenuRef}
        show={contextMenu.show}
        x={contextMenu.x}
        y={contextMenu.y}
        conversationId={contextMenu.conversationId}
        isPinned={getIsPinned(contextMenu.conversationId)}
        onPin={handlePinConversation}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversationFromContextMenu}
      />

      <Sidebar
        session={session}
        conversations={conversations}
        onConversationClick={handleConversationClick}
        onPin={handlePinConversation}
        onDelete={handleDeleteConversation}
        onContextMenu={handleContextMenu}
        onRename={handleUpdateConversationTitle}
        conversationToRenameId={conversationToRenameId}
        setConversationToRenameId={setConversationToRenameId}
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
