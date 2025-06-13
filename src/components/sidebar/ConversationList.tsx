import { GitBranch, Loader2, Pencil, Pin, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Conversation } from "~/types/conversations";
import { saans } from "~/utils/fonts";
import DeleteConversationDialog from "../dialogs/DeleteConversationDialog";

const sortConversations = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
};

type ConversationListProps = {
  conversations: Conversation[];
  onConversationClick: (id: string) => void;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeConversationId?: string;
  loadingConversationIds?: string[];
};

export default function ConversationList({
  conversations,
  onConversationClick,
  setConversations,
  activeConversationId,
  loadingConversationIds = [],
}: ConversationListProps) {
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    conversationId: string | null;
  }>({ show: false, x: 0, y: 0, conversationId: null });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const params = useParams();

  const apiCall = async (
    conversationId: string,
    method: string,
    body?: object,
  ): Promise<Conversation | { success: true } | null> => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method,
        headers:
          method !== "DELETE"
            ? { "Content-Type": "application/json" }
            : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        if (method === "DELETE") {
          return { success: true };
        }
        return (await res.json()) as Conversation;
      }
      return null;
    } catch (error) {
      console.error(`API call failed:`, error);
      return null;
    }
  };

  const updateConversation = async (
    conversationId: string,
    updates: Partial<Conversation>,
  ) => {
    const result = await apiCall(conversationId, "PATCH", updates);
    if (result && "id" in result) {
      const updatedConversation = result;
      setConversations((prev) =>
        sortConversations(
          prev.map((c) => (c.id === conversationId ? updatedConversation : c)),
        ),
      );
      return true;
    }
    return false;
  };

  const deleteConversation = async (conversationId: string) => {
    const result = await apiCall(conversationId, "DELETE");
    if (result) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (params.id === conversationId) router.push("/");
      return true;
    }
    return false;
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
  };

  const handleContextMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, conversationId });
  };

  const handlePin = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      await updateConversation(conversationId, {
        isPinned: !conversation.isPinned,
      });
    }
    closeContextMenu();
  };

  const handleDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    console.log("handleDelete called with:", conversationId);
    setDeleteTargetId(conversationId);
    setShowDeleteDialog(true);
    if (contextMenu.show) {
      closeContextMenu();
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deleteConversation(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleRename = (
    e: React.MouseEvent,
    conversationId: string,
    fromContext = false,
  ) => {
    e.stopPropagation();
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setRenamingId(conversationId);
      setRenameValue(conversation.title);
    }
    if (fromContext) closeContextMenu();
  };

  const finishRename = async (conversationId: string) => {
    if (renameValue.trim()) {
      await updateConversation(conversationId, { title: renameValue });
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleMouseEnter = (
    convId: string,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    setHoveredId(convId);

    if (convId !== activeConversationId) {
      e.currentTarget.style.backgroundColor =
        document.documentElement.classList.contains("dark")
          ? "rgba(255,255,255,0.04)"
          : "rgba(5,81,206,0.04)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setHoveredId(null);

    const convId = e.currentTarget.getAttribute("data-conversation-id");
    if (convId !== activeConversationId) {
      e.currentTarget.style.backgroundColor = "transparent";
    }
  };

  const handleTooltip = (
    convId: string | null,
    show: boolean,
    event?: React.MouseEvent,
  ) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }

    if (show && convId && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const tooltipX = Math.max(12, rect.left - 20);
      const tooltipY = rect.bottom + 8;

      setTooltipPosition({ x: tooltipX, y: tooltipY });

      tooltipTimeoutRef.current = setTimeout(
        () => setTooltipVisible(convId),
        800,
      );
    } else {
      setTooltipVisible(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        closeContextMenu();
      }
    };

    if (contextMenu.show) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenu.show]);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  const sortedConversations = sortConversations(conversations);
  const contextConversation = conversations.find(
    (c) => c.id === contextMenu.conversationId,
  );
  const deleteTargetConversation = conversations.find(
    (c) => c.id === deleteTargetId,
  );

  return (
    <>
      <div className={`${saans.className} flex-1 overflow-y-auto font-medium`}>
        <div className="p-2">
          <div className="mb-2 px-2 py-1 text-base text-[#8B9BAE] dark:text-[#B0B7C3]">
            Threads
          </div>
          {sortedConversations.map((conv) => {
            const isActiveConversation = conv.id === activeConversationId;
            const isLoading = loadingConversationIds.includes(conv.id);

            return (
              <div
                key={conv.id}
                data-conversation-id={conv.id}
                className={`group relative mb-1 cursor-pointer rounded px-2 py-2 text-[#4C5461] transition-all duration-200 dark:text-[#E5E5E5] ${
                  isActiveConversation
                    ? "border border-[rgba(5,81,206,0.2)] bg-[rgba(5,81,206,0.1)] shadow-[0_2px_4px_rgba(5,81,206,0.12)] dark:border-[rgba(91,155,213,0.2)] dark:bg-[rgba(91,155,213,0.1)] dark:shadow-[0_2px_4px_rgba(91,155,213,0.12)]"
                    : "bg-transparent hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(5,81,206,0.08)] dark:hover:shadow-[0_2px_4px_rgba(91,155,213,0.08)]"
                }`}
                onClick={() => onConversationClick(conv.id)}
                onContextMenu={(e) => handleContextMenu(e, conv.id)}
                onDoubleClick={(e) => handleRename(e, conv.id)}
                onMouseEnter={(e) => handleMouseEnter(conv.id, e)}
                onMouseLeave={handleMouseLeave}
                style={{
                  backgroundColor: isActiveConversation
                    ? document.documentElement.classList.contains("dark")
                      ? "rgba(91,155,213,0.1)"
                      : "rgba(5,81,206,0.1)"
                    : undefined,
                }}
              >
                {renamingId === conv.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => finishRename(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void finishRename(conv.id);
                      }
                      if (e.key === "Escape") cancelRename();
                    }}
                    autoFocus
                    className="w-full rounded border border-[rgba(5,81,206,0.2)] bg-transparent px-1 py-0.5 text-[#4C5461] outline-none dark:border-[rgba(255,255,255,0.2)] dark:text-[#E5E5E5]"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="relative min-w-0 flex-1">
                      <div
                        className={`flex items-center truncate pr-2 font-medium ${
                          isActiveConversation
                            ? "font-semibold text-[#0551CE] dark:text-[#5B9BD5]"
                            : ""
                        }`}
                        onMouseEnter={(e) => handleTooltip(conv.id, true, e)}
                        onMouseLeave={() => handleTooltip(null, false)}
                      >
                        {conv.isBranched && (
                          <GitBranch className="mr-1 inline-block h-4 w-4 text-[#0551CE] dark:text-[#5B9BD5]" />
                        )}
                        <span className="truncate">{conv.title}</span>
                        {isLoading && (
                          <Loader2 className="ml-2 h-3 w-3 animate-spin text-[#8B9BAE] dark:text-[#B0B7C3]" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      {conv.isPinned && hoveredId !== conv.id && (
                        <Pin className="h-3 w-3 flex-shrink-0 translate-x-8 text-[#8B9BAE] dark:text-[#B0B7C3]" />
                      )}

                      <div
                        className={`flex items-center gap-1 transition-all duration-200 ${
                          hoveredId === conv.id
                            ? "translate-x-0 opacity-100"
                            : "translate-x-2 opacity-0"
                        }`}
                      >
                        <button
                          onClick={(e) => handlePin(e, conv.id)}
                          className={`rounded p-1 transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(5,81,206,0.15)] dark:hover:shadow-[0_2px_4px_rgba(91,155,213,0.15)] ${
                            conv.isPinned
                              ? "bg-[rgba(5,81,206,0.1)] dark:bg-[rgba(91,155,213,0.1)]"
                              : "bg-[rgba(5,81,206,0.05)] dark:bg-[rgba(255,255,255,0.05)]"
                          }`}
                          title={conv.isPinned ? "Unpin" : "Pin"}
                        >
                          <Pin
                            className={`h-3 w-3 ${conv.isPinned ? "fill-current text-[#0551CE] dark:text-[#5B9BD5]" : "text-[#8B9BAE] dark:text-[#B0B7C3]"}`}
                          />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, conv.id)}
                          className="rounded bg-[rgba(220,38,38,0.05)] p-1 transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(220,38,38,0.15)] dark:bg-[rgba(239,68,68,0.05)] dark:hover:shadow-[0_2px_4px_rgba(239,68,68,0.15)]"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 text-[#dc2626] dark:text-[#ef4444]" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip positioned relative to viewport */}
      {tooltipVisible && (
        <div
          className="fixed z-[9999] max-w-xs rounded bg-[#4C5461] px-2 py-1 text-xs text-[#F7F7F2] shadow-[0_4px_8px_rgba(5,81,206,0.2)] dark:bg-[#E5E5E5] dark:text-[#1a1a1a] dark:shadow-[0_4px_8px_rgba(91,155,213,0.2)]"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            pointerEvents: "none",
          }}
        >
          {conversations.find((c) => c.id === tooltipVisible)?.title}
        </div>
      )}

      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 rounded border bg-[#F7F7F2] shadow-[0_4px_12px_rgba(5,81,206,0.2)]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            borderColor: "rgba(5,81,206,0.12)",
          }}
        >
          {[
            {
              icon: Pencil,
              label: "Rename",
              onClick: (e: React.MouseEvent) =>
                handleRename(e, contextMenu.conversationId!, true),
            },
            {
              icon: Pin,
              label: contextConversation?.isPinned ? "Unpin" : "Pin",
              onClick: (e: React.MouseEvent) =>
                handlePin(e, contextMenu.conversationId!),
            },
            {
              icon: Trash2,
              label: "Delete",
              onClick: (e: React.MouseEvent) =>
                contextMenu.conversationId &&
                handleDelete(e, contextMenu.conversationId),
              className: "text-[#dc2626]",
            },
          ].map(
            ({ icon: Icon, label, onClick, className = "text-[#4C5461]" }) => (
              <button
                key={label}
                onClick={onClick}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-200 first:rounded-t last:rounded-b hover:-translate-y-[0.5px] hover:bg-[rgba(5,81,206,0.05)] ${className}`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ),
          )}
        </div>
      )}

      <DeleteConversationDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        conversationTitle={deleteTargetConversation?.title}
      />
    </>
  );
}