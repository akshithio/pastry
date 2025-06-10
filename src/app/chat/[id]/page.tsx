"use client";

import { useChat } from "@ai-sdk/react";
import { Check, Copy, GitBranch, Play, RotateCcw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MarkdownRenderer, {
  hasLatex,
  latexStyles,
} from "~/components/chat/MarkdownRenderer";
import { saans } from "~/utils/fonts";

import AuthScreen from "~/components/AuthScreen";
import ChatInput, {
  MODEL_CONFIG,
  type ModelName,
} from "~/components/chat/ChatInput";
import CommandMenu from "~/components/CommandMenu";
import ContextMenu from "~/components/ContextMenu";
import Sidebar from "~/components/sidebar/Sidebar";

type Conversation = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  streamId?: string;
  partialContent?: string;
};

type ContextMenuState = {
  show: boolean;
  x: number;
  y: number;
  conversationId: string | null;
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

  const [interruptedMessage, setInterruptedMessage] = useState<Message | null>(
    null,
  );
  const [isResuming, setIsResuming] = useState(false);

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
      conversationId: conversationId,
      resumeStreamId: interruptedMessage?.streamId,
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

      setInterruptedMessage(null);
      setIsResuming(false);

      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    },
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    conversationId: null,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);

  const [conversationToRenameId, setConversationToRenameId] = useState<
    string | null
  >(null);

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (session) {
      void fetch("/api/conversations").then(async (res) =>
        setConversations((await res.json()) as Conversation[]),
      );
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

  useEffect(() => {
    if (conversationId) {
      void fetch(`/api/conversations/${conversationId}`).then(async (res) => {
        if (res.ok) {
          setConversation((await res.json()) as Conversation);
        } else {
          console.error("Failed to fetch conversation details.");
          setConversation(null);
        }
      });
    }
  }, [conversationId]);

  useEffect(() => {
    const checkForInterruptedStreams = async () => {
      if (!conversationId || !session) return;

      try {
        const response = await fetch(
          `/api/chat/interrupted?conversationId=${conversationId}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.interruptedMessage) {
            setInterruptedMessage(data.interruptedMessage);
          }
        }
      } catch (error) {
        console.error("Error checking for interrupted streams:", error);
      }
    };

    void checkForInterruptedStreams();
  }, [conversationId, session]);

  useEffect(() => {
    const initialPrompt = searchParams.get("initialPrompt");
    if (
      initialPrompt &&
      messages.length === 0 &&
      !isLoading &&
      conversationId
    ) {
      const syntheticEvent: React.FormEvent<HTMLFormElement> = {
        preventDefault: () => {
          // empty line to prevent synthetic behavior
        },
      } as React.FormEvent<HTMLFormElement>;
      handleInputChange({
        target: { value: initialPrompt },
      } as React.ChangeEvent<HTMLTextAreaElement>);
      setTimeout(() => handleSubmit(syntheticEvent), 0);
    }
  }, [
    conversationId,
    messages,
    searchParams,
    isLoading,
    handleInputChange,
    handleSubmit,
  ]);

  const handleChatSubmit = (e?: React.FormEvent) => {
    handleSubmit(e);

    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  };

  const handleResumeStream = async () => {
    if (!interruptedMessage?.streamId) return;

    setIsResuming(true);

    try {
      const response = await fetch("/api/chat/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vercel-ai-chat-id": conversationId,
        },
        body: JSON.stringify({
          streamId: interruptedMessage.streamId,
          conversationId: conversationId,
          provider: MODEL_CONFIG[selectedModel].provider,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const messageIndex = messages.findIndex(
          (m) => m.id === interruptedMessage.id,
        );
        if (messageIndex !== -1) {
          let accumulatedContent = interruptedMessage.partialContent ?? "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.choices?.[0]?.delta?.content) {
                    accumulatedContent += data.choices[0].delta.content;

                    setMessages((prevMessages) =>
                      prevMessages.map((msg, idx) =>
                        idx === messageIndex
                          ? { ...msg, content: accumulatedContent }
                          : msg,
                      ),
                    );
                  }
                } catch (e) {
                  console.log("error occurred");
                  console.log(e);
                }
              }
            }
          }
        }

        setInterruptedMessage(null);
      }
    } catch (error) {
      console.error("Error resuming stream:", error);
    } finally {
      setIsResuming(false);
    }
  };

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

    const branchTitle = `[BRANCH] ${conversation.title}`;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: branchTitle,

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

  const handleRenameConversationFromContextMenu = () => {
    if (contextMenu.conversationId) {
      setConversationToRenameId(contextMenu.conversationId);
    }
    setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
  };

  const handleUpdateConversationTitle = async (
    id: string,
    newTitle: string,
  ) => {
    if (!newTitle.trim()) {
      setConversationToRenameId(null);
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
      if (id === conversationId) {
        setConversation((prev) => (prev ? { ...prev, title: newTitle } : null));
      }
    }
    setConversationToRenameId(null);
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    contextConversationId: string,
  ) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      conversationId: contextConversationId,
    });
  };

  const handlePinConversation = async () => {
    if (!contextMenu.conversationId) return;
    const contextConversation = conversations.find(
      (c) => c.id === contextMenu.conversationId,
    );
    if (!contextConversation) return;

    const res = await fetch(`/api/conversations/${contextConversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !contextConversation.isPinned }),
    });

    if (res.ok) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === contextConversation.id ? { ...c, isPinned: !c.isPinned } : c,
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

      if (contextMenu.conversationId === conversationId) {
        router.push("/");
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
  };

  const getIsPinned = (contextConversationId: string | null) => {
    if (!contextConversationId) return false;
    const contextConversation = conversations.find(
      (c) => c.id === contextConversationId,
    );
    return contextConversation?.isPinned ?? false;
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

  const handleRetryMessage = () => {
    void reload();
  };

  const handleModelSelect = (model: ModelName) => {
    setSelectedModel(model);
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

  if (!conversation) {
    return (
      <div
        className={`flex h-screen ${saans.className} auth-grid-bg relative bg-[#F7F7F2] text-sm font-medium`}
      >
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
          onContextMenu={handleContextMenu}
          onRename={handleUpdateConversationTitle}
          onPin={handlePinConversation}
          onDelete={handleDeleteConversation}
          conversationToRenameId={conversationToRenameId}
          setConversationToRenameId={setConversationToRenameId}
        />

        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="text-[#4C5461]">Loading conversation...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen ${saans.className} auth-grid-bg relative bg-[#F7F7F2] text-sm font-medium`}
    >
      <div className="auth-grid-lines pointer-events-none absolute inset-0" />

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
        onContextMenu={handleContextMenu}
        onPin={handlePinConversation}
        onDelete={handleDeleteConversation}
        onRename={handleUpdateConversationTitle}
        conversationToRenameId={conversationToRenameId}
        setConversationToRenameId={setConversationToRenameId}
      />

      <div className="relative z-10 flex flex-1 flex-col">
        {interruptedMessage && (
          <div className="mx-auto max-w-4xl px-4 pt-4">
            <div className="auth-clean-shadow flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span className="text-sm text-amber-800">
                  Generation was interrupted. You can continue from where it
                  left off.
                </span>
              </div>
              <button
                onClick={handleResumeStream}
                disabled={isResuming}
                className="flex items-center gap-1 rounded bg-amber-600 px-3 py-1 text-sm text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                <Play className="h-3 w-3" />
                {isResuming ? "Resuming..." : "Resume"}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div key={message.id} className="mx-auto max-w-4xl">
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div className="auth-clean-shadow max-w-[80%] overflow-hidden rounded-lg bg-[#0551CE] px-4 py-2 break-words text-[#F7F7F2]">
                    <MarkdownRenderer>{message.content}</MarkdownRenderer>
                  </div>
                </div>
              ) : (
                <div className="group overflow-hidden">
                  <div className="prose prose-sm max-w-none overflow-hidden break-words text-[#4C5461]">
                    <style dangerouslySetInnerHTML={{ __html: latexStyles }} />
                    <MarkdownRenderer>
                      {message.id === interruptedMessage?.id &&
                      interruptedMessage.partialContent
                        ? interruptedMessage.partialContent
                        : message.content}
                    </MarkdownRenderer>

                    <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() =>
                          handleCopyResponse(message.content, message.id)
                        }
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.12)]"
                        title="Copy response"
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRetryMessage()}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.12)]"
                        title="Retry response"
                        disabled={isLoading}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </button>
                      <button
                        onClick={() => handleBranchConversation(index)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.12)]"
                        title="Branch conversation from here"
                        disabled={isLoading}
                      >
                        <GitBranch className="h-3 w-3" />
                        Branch
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="mx-auto max-w-4xl">
              <div className="leading-relaxed text-[#4C5461]">
                {isResuming ? "Resuming generation..." : "Thinking..."}
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-4xl">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-red-600 text-xs font-medium text-white">
                  !
                </div>
                <div className="flex-1">
                  <div className="leading-relaxed text-red-600">
                    Error: {error.message}
                  </div>
                  <button
                    onClick={handleRegenerate}
                    className="auth-clean-shadow mt-2 rounded bg-[#0551CE] px-3 py-1 text-sm text-[#F7F7F2] transition-colors hover:bg-[#044bb8]"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          ref={chatInputRef}
          message={input}
          onMessageChange={handleInputChange}
          onSendMessage={handleChatSubmit}
          onKeyPress={handleKeyPress}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
          showModelSelector={true}
          onStopGeneration={handleStopGeneration}
          placeholder="Type your message here..."
          disabled={false}
        />
      </div>
    </div>
  );
}
