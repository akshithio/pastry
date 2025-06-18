"use client";

import { useChat } from "@ai-sdk/react";
import { type Message } from "ai";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { saans } from "~/utils/fonts";

import { useConversationEvents } from "~/hooks/useConversationEvents";
import { useSidebarCollapse } from "~/hooks/useSidebarCollapse";
import { useStreamingStatus } from "~/hooks/useStreamingStatus";

import { useChatHandlers } from "~/hooks/useChatHandlers";
import { useConversationData } from "~/hooks/useConversationData";
import { useMessageManagement } from "~/hooks/useMessageManagement";

import AuthScreen from "~/components/AuthScreen";
import ChatMainArea from "~/components/chat/ChatMainArea";
import CommandMenu from "~/components/CommandMenu";
import Sidebar from "~/components/sidebar/Sidebar";
import { useWebSearchStatus } from "~/components/WebSearchIndicator";
import { MODEL_CONFIG, type ModelName } from "~/model_config";
import type { Attachment, ExtendedMessage } from "~/types/chat";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [selectedModel, setSelectedModel] = useState<ModelName>("Pixtral 12B");
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const { setStreaming, isStreaming } = useStreamingStatus();

  const { searchStatus, handleStreamData, resetSearchStatus } =
    useWebSearchStatus();

  const [currentReasoning, setCurrentReasoning] = useState<string>("");
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);

  const {
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
  } = useConversationData();

  const { isSidebarCollapsed, handleToggleSidebarCollapse, isHydrated } =
    useSidebarCollapse();

  const isOwner = session?.user?.id && conversation?.userId === session.user.id;
  const isPublicReadOnlyMode = conversation?.isPublic && !isOwner;

  const {
    handleChatFinish,
    handleChatError,
    handleSubmitWithAttachments,
    handleKeyPress,
    handleRegenerate,
    handleStopGeneration,
  } = useChatHandlers(
    conversationId,
    setConversations,
    setConversation,
    chatInputRef,
    isPublicReadOnlyMode,
  );

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
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
    onError: handleChatError,
    onFinish: (message, options) => {
      console.log("=== onFinish callback started ===");

      setIsReasoningStreaming(false);

      const finalReasoning = options?.reasoning || currentReasoning;

      if (finalReasoning && finalReasoning.trim()) {
        console.log(
          "🧠 Setting final reasoning:",
          finalReasoning.substring(0, 100),
        );

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          const lastMessageIndex = updatedMessages.length - 1;

          if (
            lastMessageIndex >= 0 &&
            updatedMessages[lastMessageIndex].role === "assistant"
          ) {
            console.log("✅ Updating last assistant message with reasoning");
            updatedMessages[lastMessageIndex] = {
              ...updatedMessages[lastMessageIndex],
              reasoning: finalReasoning,
            } as any;
          }

          return updatedMessages;
        });

        setCurrentReasoning(finalReasoning);
      } else {
        console.log("❌ No reasoning available, clearing state");
        setCurrentReasoning("");
      }

      handleChatFinish(message, options);
    },
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    console.log("🌊 Processing data array:", data.length, "items");

    const latestData = data[data.length - 1];

    if (!latestData) return;

    try {
      let processedData = latestData;

      if (typeof latestData === "string") {
        try {
          processedData = JSON.parse(latestData);
        } catch (parseError) {
          console.log("Could not parse string data:", latestData);
          return;
        }
      }

      if (processedData && typeof processedData === "object") {
        const item = processedData as {
          type?: string;
          toolCalls?: any[];
          toolResults?: any[];
          reasoning?: string;
          text?: string;
          textDelta?: string;
          fullReasoning?: string;
        };

        if (item.type === "reasoning") {
          console.log("🧠 Processing reasoning chunk");

          if (item.fullReasoning) {
            console.log(
              "🧠 Using full reasoning from backend:",
              item.fullReasoning.length,
              "chars",
            );
            setCurrentReasoning(item.fullReasoning);
          } else if (item.textDelta) {
            console.log("🧠 Accumulating reasoning delta:", item.textDelta);
            setCurrentReasoning((prev) => {
              const newReasoning = prev + item.textDelta;
              console.log("🧠 Updated reasoning length:", newReasoning.length);
              return newReasoning;
            });
          }

          setIsReasoningStreaming(true);
        }

        if (item.reasoning && item.type !== "reasoning") {
          console.log(
            "🧠 Processing complete reasoning:",
            item.reasoning.substring(0, 100),
          );
          setCurrentReasoning(item.reasoning);
          setIsReasoningStreaming(false);
        }

        if (item.type === "text" || item.type === "finish") {
          console.log("📝 Text completion detected");
          setIsReasoningStreaming(false);
        }

        if (
          item.type === "tool-call" ||
          item.type === "tool-result" ||
          item.toolCalls ||
          item.toolResults ||
          item.type === "step-finish"
        ) {
          handleStreamData(processedData);
        }
      }
    } catch (error) {
      console.error("❌ Error processing data item:", error);
    }
  }, [data, handleStreamData]);

  const {
    editingMessageIndex,
    editingMessageContent,
    copiedMessageId,
    setEditingMessageContent,
    handleEditMessage,
    handleSaveEditedMessage,
    handleCancelEdit,
    handleCopyResponse,
    handleRetryMessage,
  } = useMessageManagement(
    conversationId,
    conversation,
    messages,
    setMessages,
    isLoading,
    append,
    reload,
  );

  useEffect(() => {
    setStreaming(conversationId, isLoading);
  }, [isLoading, conversationId, setStreaming]);

  useEffect(() => {
    if (isLoading) {
      resetSearchStatus();

      setIsReasoningStreaming(false);
    } else {
      setIsReasoningStreaming(false);
    }
  }, [isLoading, resetSearchStatus]);

  const isConversationStreamingFn = (conversationId: string) => {
    return isStreaming(conversationId);
  };

  const handleStreamingStatusChange = (
    convId: string,
    isStreamingFlag: boolean,
  ) => {
    setStreaming(convId, isStreamingFlag);
  };

  useConversationEvents({
    onConversationCreated: handleConversationCreated,
    onConversationUpdated: handleConversationUpdated,
    onConversationDeleted: handleConversationDeleted,
    onStreamingStatusChange: handleStreamingStatusChange,
  });

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
  }, [conversation?.title, conversation?.id, conversation]);

  useEffect(() => {
    if (conversation) {
      const model = conversation.model;
      if (model && Object.keys(MODEL_CONFIG).includes(model)) {
        setSelectedModel(model as ModelName);
      }
    }
  }, [conversation]);

  const handleSubmit = async (
    e?: React.FormEvent,
    options?: { experimental_attachments?: Attachment[] },
  ) => {
    setCurrentReasoning("");
    setIsReasoningStreaming(false);

    await handleSubmitWithAttachments(
      originalHandleSubmit,
      input,
      setInput,
      append,
      e,
      options,
    );
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

  if (conversationLoaded && conversationNotFound) {
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
            isConversationStreaming={isConversationStreamingFn}
          />
        )}

        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-[#4C5461] dark:text-[#B0B7C3]">
              Conversation not found
            </div>
            <button
              onClick={() => (window.location.href = "/")}
              className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Go to Chat
            </button>
          </div>
        </div>
      </div>
    );
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
            isConversationStreaming={isConversationStreamingFn}
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

  const convertedMessages: ExtendedMessage[] = messages
    .map((msg: Message): ExtendedMessage => {
      const extendedMsg: ExtendedMessage = {
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: msg.createdAt,
        experimental_attachments: (msg as any).experimental_attachments,
        reasoning: (msg as any).reasoning,
      };
      return extendedMsg;
    })
    .filter(
      (msg): msg is ExtendedMessage =>
        msg.role === "user" || msg.role === "assistant",
    );

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
          isConversationStreaming={isConversationStreamingFn}
        />
      )}

      <ChatMainArea
        conversation={conversation}
        conversationId={conversationId}
        messages={convertedMessages}
        input={input}
        isLoading={isLoading}
        error={error ?? null}
        selectedModel={selectedModel}
        isOwner={!!isOwner}
        isReadOnly={isPublicReadOnlyMode}
        chatInputRef={chatInputRef}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        handleKeyPress={(e) => handleKeyPress(e, handleSubmit)}
        handleRegenerate={() => handleRegenerate(reload)}
        handleStopGeneration={() => handleStopGeneration(stop)}
        handleModelSelect={handleModelSelect}
        handleBranchConversation={(index) =>
          handleBranchConversation(index, messages)
        }
        handleRetryMessage={handleRetryMessage}
        handleCopyResponse={handleCopyResponse}
        copiedMessageId={copiedMessageId}
        onUpdateConversationVisibility={handleUpdateConversationVisibility}
        experimental_resume={experimental_resume}
        data={data ?? []}
        setMessages={setMessages}
        autoResume={true}
        editingMessageIndex={editingMessageIndex}
        editingMessageContent={editingMessageContent}
        onEditMessage={handleEditMessage}
        onSaveEditedMessage={handleSaveEditedMessage}
        onCancelEdit={handleCancelEdit}
        onEditingContentChange={setEditingMessageContent}
        searchStatus={searchStatus}
        currentReasoning={currentReasoning}
        isReasoningStreaming={isReasoningStreaming}
      />
    </div>
  );
}