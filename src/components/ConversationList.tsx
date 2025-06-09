import { Pin, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { saans } from "~/utils/fonts";

type Conversation = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
};

type ConversationListProps = {
  conversations: Conversation[];
  onConversationClick: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onPin?: (id: string) => void;
  onDelete?: (id: string) => void;
  conversationToRenameId: string | null;
  setConversationToRenameId: (id: string | null) => void;
};

export default function ConversationList({
  conversations,
  onConversationClick,
  onContextMenu,
  onRename,
  onPin,
  onDelete,
  conversationToRenameId,
  setConversationToRenameId,
}: ConversationListProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  useEffect(() => {
    if (conversationToRenameId) {
      setRenamingId(conversationToRenameId);
      const conversation = conversations.find(
        (c) => c.id === conversationToRenameId,
      );
      if (conversation) {
        setRenameValue(conversation.title);
      }
    } else {
      setRenamingId(null);
      setRenameValue("");
    }
  }, [conversationToRenameId, conversations]);

  const handleRename = (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      setRenameValue("");
      setConversationToRenameId(null);
      return;
    }
    onRename(id, renameValue);
  };

  const startRenaming = (conversation: Conversation) => {
    setConversationToRenameId(conversation.id);
  };

  const handlePinClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onPin?.(id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete?.(id);
  };

  return (
    <div className={`${saans.className} flex-1 overflow-y-auto font-medium`}>
      <div className="p-2">
        <div
          className="mb-2 px-2 py-1 text-base"
          style={{ color: "#8b7355" }}
        >
          Threads
        </div>
        {sortedConversations.map((conv) => (
          <div
            key={conv.id}
            className="group relative mb-1 cursor-pointer rounded px-2 py-2 transition-colors hover:bg-[#e8dcc6]"
            style={{ color: "#5a4a37" }}
            onClick={() => onConversationClick(conv.id)}
            onContextMenu={(e) => onContextMenu(e, conv.id)}
            onDoubleClick={() => startRenaming(conv)}
            onMouseEnter={() => setHoveredId(conv.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {renamingId === conv.id ? (
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRename(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleRename(conv.id);
                  }
                  if (e.key === "Escape") {
                    setRenamingId(null);
                    setRenameValue("");
                    setConversationToRenameId(null);
                  }
                }}
                autoFocus
                className="w-full rounded border-0 outline-none"
                style={{ backgroundColor: "transparent", color: "#5a4a37" }}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="relative min-w-0 flex-1">
                  <div
                    className="truncate pr-2 font-medium"
                    onMouseEnter={() => {
                      setTimeout(() => setTooltipVisible(conv.id), 800);
                    }}
                    onMouseLeave={() => setTooltipVisible(null)}
                  >
                    {conv.title}
                  </div>

                  {tooltipVisible === conv.id && (
                    <div
                      className="absolute top-full left-1/2 z-50 mt-2 max-w-xs -translate-x-1/2 scale-100 transform rounded px-2 py-1 text-xs whitespace-nowrap opacity-100 shadow-lg transition-all duration-200 ease-in-out"
                      style={{
                        backgroundColor: "#2d2d2d",
                        color: "#ffffff",
                        animation: "tooltipFadeIn 0.2s ease-out",
                      }}
                    >
                      {conv.title}
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  {conv.isPinned && hoveredId !== conv.id && (
                    <Pin
                      className="h-3 w-3 flex-shrink-0"
                      style={{ color: "#8b7355" }}
                    />
                  )}

                  <div
                    className={`flex items-center gap-1 transition-all duration-200 ease-in-out ${
                      hoveredId === conv.id
                        ? "translate-x-0 opacity-100"
                        : "translate-x-2 opacity-0"
                    }`}
                  >
                    <button
                      onClick={(e) => handlePinClick(e, conv.id)}
                      className={`rounded p-1 transition-colors hover:bg-[#d4c4a8] ${
                        conv.isPinned ? "bg-[#d4c4a8]" : ""
                      }`}
                      title={conv.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin
                        className={`h-3 w-3 ${
                          conv.isPinned ? "fill-current" : ""
                        }`}
                        style={{ color: "#8b7355" }}
                      />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, conv.id)}
                      className="rounded p-1 transition-colors hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2
                        className="h-3 w-3"
                        style={{ color: "#dc2626" }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CSS for smooth tooltip animation */}
      <style jsx>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
