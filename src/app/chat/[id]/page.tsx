"use client";

import { useChat } from "@ai-sdk/react";
import "katex/dist/katex.min.css";
import {
  Check,
  ChevronDown,
  Copy,
  GitBranch,
  Plus,
  RotateCcw,
  Send,
  StopCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import AuthScreen from "~/components/AuthScreen";
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

const latexStyles = `
  .katex-display {
    overflow-x: auto !important;
    overflow-y: hidden !important;
    max-width: 100% !important;
    margin: 1rem 0 !important;
    padding: 0.5rem 0;
  }
  
  .katex {
    font-size: 0.9em !important;
  }
  
  .katex-display > .katex {
    white-space: nowrap !important;
    max-width: none !important;
  }
  
  .katex-display::-webkit-scrollbar {
    height: 4px;
  }
  
  .katex-display::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }
  
  .katex-display::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }
  
  .markdown-content {
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
  }
`;

type ContextMenuState = {
  show: boolean;
  x: number;
  y: number;
  conversationId: string | null;
};

const hasLatex = (text: string): boolean => {
  const inlineMath = /\$[^$\n]+\$/g;
  const displayMath = /\$\$[\s\S]+?\$\$/g;
  const latexCommands = /\\[a-zA-Z]+/g;

  return (
    inlineMath.test(text) || displayMath.test(text) || latexCommands.test(text)
  );
};

const MODEL_CONFIG = {
  "Gemini 2.0 Flash": { provider: "gemini" as const },
  "Pixtral 12B": { provider: "mistral" as const },
};

type ModelName = keyof typeof MODEL_CONFIG;

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = params.id as string;

  const [selectedModel, setSelectedModel] = useState<ModelName>("Pixtral 12B");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
  } = useChat({
    api: "/api/chat",
    id: conversationId,
    body: {
      provider: MODEL_CONFIG[selectedModel].provider,
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversations on mount or when session changes
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

  // Handle model dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };

    if (showModelDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showModelDropdown]);

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
    const initialPrompt = searchParams.get("initialPrompt");
    if (
      initialPrompt &&
      messages.length === 0 &&
      !isLoading &&
      conversationId
    ) {
      const syntheticEvent: React.FormEvent<HTMLFormElement> = {
        preventDefault: () => {
          // intentionally left blank for synthetic event
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

  // NEW: Branch conversation function
  const handleBranchConversation = async (upToMessageIndex: number) => {
    if (!conversation) return;

    // Get messages up to and including the specified index
    const messagesToBranch = messages.slice(0, upToMessageIndex + 1);

    // Create branch title
    const branchTitle = `[BRANCH] ${conversation.title}`;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: branchTitle,
          // Include the messages to be copied
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
    setShowModelDropdown(false);
  };

  const MarkdownRenderer = ({ children }: { children: string }) => {
    const messageHasLatex = hasLatex(children);

    return (
      <ReactMarkdown
        remarkPlugins={messageHasLatex ? [remarkMath] : []}
        rehypePlugins={messageHasLatex ? [rehypeKatex] : []}
        components={{
          code: ({ node, inline, className, children, ...props }) => {
            return (
              <code
                className={`${
                  inline
                    ? "rounded bg-gray-200 px-1 py-0.5"
                    : "block rounded bg-gray-100 p-2"
                } font-mono text-xs`}
                {...props}
              >
                {children}
              </code>
            );
          },
          span: ({ node, className, children, ...props }) => {
            if (className?.includes("katex")) {
              return (
                <span
                  className={`${className} text-sm`}
                  style={{ fontSize: "1em" }}
                  {...props}
                >
                  {children}
                </span>
              );
            }
            return (
              <span className={className} {...props}>
                {children}
              </span>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    );
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!conversation) {
    return (
      <div
        className="flex h-screen font-mono text-sm"
        style={{ backgroundColor: "#f5f1e8" }}
      >
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

        <div
          className="flex flex-1 items-center justify-center"
          style={{ color: "#5a4a37" }}
        >
          Loading conversation...
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen font-mono text-sm"
      style={{ backgroundColor: "#f5f1e8" }}
    >
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

      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div key={message.id} className="mx-auto max-w-3xl">
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div
                    className="max-w-[80%] overflow-hidden rounded-lg px-4 py-2 break-words"
                    style={{
                      backgroundColor: "#8b7355",
                      color: "#f5f1e8",
                    }}
                  >
                    <MarkdownRenderer>{message.content}</MarkdownRenderer>
                  </div>
                </div>
              ) : (
                <div
                  className="group overflow-hidden"
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                >
                  <div className="overflow-hidden break-words">
                    <style dangerouslySetInnerHTML={{ __html: latexStyles }} />
                    <MarkdownRenderer>{message.content}</MarkdownRenderer>

                    <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() =>
                          handleCopyResponse(message.content, message.id)
                        }
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-gray-200"
                        style={{ color: "#8b7355" }}
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
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-gray-200"
                        style={{ color: "#8b7355" }}
                        title="Retry response"
                        disabled={isLoading}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </button>
                      <button
                        onClick={() => handleBranchConversation(index)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-gray-200"
                        style={{ color: "#8b7355" }}
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
            <div className="mx-auto max-w-3xl">
              <div style={{ color: "#8b7355" }} className="leading-relaxed">
                Thinking...
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-3xl">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-medium"
                  style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                >
                  !
                </div>
                <div className="flex-1">
                  <div style={{ color: "#dc2626" }} className="leading-relaxed">
                    Error: {error.message}
                  </div>
                  <button
                    onClick={handleRegenerate}
                    className="mt-2 rounded px-3 py-1 text-sm transition-colors"
                    style={{
                      backgroundColor: "#8b7355",
                      color: "#f5f1e8",
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4" style={{ borderColor: "#e2d5c0" }}>
          <div className="mx-auto max-w-3xl">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full resize-none rounded border p-3 pr-12 outline-none"
                  style={{
                    backgroundColor: "#ebe0d0",
                    borderColor: "#d4c4a8",
                    color: "#5a4a37",
                  }}
                  rows={Math.min(input.split("\n").length, 4)}
                  disabled={isLoading}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="cursor-pointer rounded p-2 transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: input.trim() ? "#5a4a37" : "#8b7355",
                        color: "#f5f1e8",
                      }}
                    >
                      <StopCircle className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="cursor-pointer rounded p-2 transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: input.trim() ? "#5a4a37" : "#8b7355",
                        color: "#f5f1e8",
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div
                  className="mt-2 flex items-center justify-between text-xs"
                  style={{ color: "#8b7355" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-gray-200"
                        style={{ color: "#8b7355" }}
                      >
                        <span>{selectedModel}</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>

                      {showModelDropdown && (
                        <div
                          className="absolute bottom-full left-0 mb-2 min-w-[180px] rounded border shadow-lg"
                          style={{
                            backgroundColor: "#f5f1e8",
                            borderColor: "#d4c4a8",
                          }}
                        >
                          {Object.keys(MODEL_CONFIG).map((model) => (
                            <button
                              key={model}
                              type="button"
                              onClick={() =>
                                handleModelSelect(model as ModelName)
                              }
                              className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-gray-100 ${
                                selectedModel === model ? "font-medium" : ""
                              }`}
                              style={{
                                color:
                                  selectedModel === model
                                    ? "#5a4a37"
                                    : "#8b7355",
                                backgroundColor:
                                  selectedModel === model
                                    ? "#ebe0d0"
                                    : "transparent",
                              }}
                            >
                              {model}
                              <div className="text-xs opacity-60">
                                {MODEL_CONFIG[model as ModelName].provider}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="rounded p-1">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
