"use client";

import { GitBranch, Pin, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saans } from "~/utils/fonts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

type Conversation = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isBranched?: boolean;
};

type ConversationListProps = {
  conversations: Conversation[];
  onConversationClick: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onPin?: (id:string) => Promise<void>;
  conversationToRenameId: string | null;
  setConversationToRenameId: (id: string | null) => void;
};

export default function ConversationList({
  conversations,
  onConversationClick,
  onContextMenu,
  onRename,
  onPin,
  conversationToRenameId,
  setConversationToRenameId,
}: ConversationListProps) {
  const [localConversations, setLocalConversations] = useState(conversations);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  const sortedConversations = [...localConversations].sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return a.isPinned ? -1 : 1;
  });

  useEffect(() => {
    if (conversationToRenameId) {
      setRenamingId(conversationToRenameId);
      const conversation = localConversations.find(
        (c) => c.id === conversationToRenameId,
      );
      if (conversation) {
        setRenameValue(conversation.title);
      }
    } else {
      setRenamingId(null);
      setRenameValue("");
    }
  }, [conversationToRenameId, localConversations]);

  const handleRename = (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      setRenameValue("");
      setConversationToRenameId(null);
      return;
    }
    onRename(id, renameValue);
    setLocalConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, title: renameValue, updatedAt: new Date().toISOString() }
          : c,
      ),
    );
  };

  const startRenaming = (conversation: Conversation) => {
    setConversationToRenameId(conversation.id);
  };

  const handlePinClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onPin) {
      await onPin(id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      try {
        const res = await fetch(`/api/conversations/${deleteTargetId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setLocalConversations((prev) =>
            prev.filter((c) => c.id !== deleteTargetId),
          );
          if (params.id === deleteTargetId) {
            router.push("/");
          }
        } else {
          console.error("Failed to delete conversation");
        }
      } catch (error) {
        console.error("Error deleting conversation:", error);
      }
    }
    setShowDeleteDialog(false);
    setDeleteTargetId(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeleteTargetId(null);
  };

  const handleMouseEnter = (
    convId: string,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    setHoveredId(convId);
    e.currentTarget.style.backgroundColor = "rgba(5,81,206,0.04)";
    if (document.documentElement.classList.contains("dark")) {
      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setHoveredId(null);
    e.currentTarget.style.backgroundColor = "transparent";
  };

  const handleTitleMouseEnter = (convId: string) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipVisible(convId);
    }, 800);
  };

  const handleTitleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setTooltipVisible(null);
  };

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`${saans.className} flex-1 overflow-y-auto font-medium`}>
      <div className="p-2">
        <div className="mb-2 px-2 py-1 text-base text-[#8B9BAE] dark:text-[#B0B7C3]">
          Threads
        </div>
        {sortedConversations.map((conv) => (
          <div
            key={conv.id}
            className="group relative mb-1 cursor-pointer rounded bg-transparent px-2 py-2 text-[#4C5461] transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(5,81,206,0.08)] dark:text-[#E5E5E5] dark:hover:shadow-[0_2px_4px_rgba(91,155,213,0.08)]"
            onClick={() => onConversationClick(conv.id)}
            onContextMenu={(e) => onContextMenu(e, conv.id)}
            onDoubleClick={() => startRenaming(conv)}
            onMouseEnter={(e) => handleMouseEnter(conv.id, e)}
            onMouseLeave={handleMouseLeave}
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
                className="w-full rounded border border-[rgba(5,81,206,0.2)] bg-transparent px-1 py-0.5 text-[#4C5461] outline-none dark:border-[rgba(255,255,255,0.2)] dark:text-[#E5E5E5]"
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="relative min-w-0 flex-1">
                  <div
                    className="truncate pr-2 font-medium"
                    onMouseEnter={() => handleTitleMouseEnter(conv.id)}
                    onMouseLeave={handleTitleMouseLeave}
                  >
                    {conv.isBranched && (
                      <GitBranch className="mr-1 inline-block h-4 w-4 text-[#0551CE] dark:text-[#5B9BD5]" />
                    )}
                    {conv.title}
                  </div>

                  {tooltipVisible === conv.id && (
                    <div
                      className="absolute top-full left-1/2 z-50 mt-2 max-w-xs -translate-x-1/2 scale-100 transform rounded bg-[#4C5461] px-2 py-1 text-xs whitespace-nowrap text-[#F7F7F2] opacity-100 shadow-[0_4px_8px_rgba(5,81,206,0.2)] transition-all duration-200 ease-in-out dark:bg-[#E5E5E5] dark:text-[#1a1a1a] dark:shadow-[0_4px_8px_rgba(91,155,213,0.2)]"
                      style={{
                        animation: "tooltipFadeIn 0.2s ease-out",
                      }}
                    >
                      {conv.title}
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  {conv.isPinned && hoveredId !== conv.id && (
                    <Pin className="h-3 w-3 flex-shrink-0 translate-x-8 text-[#8B9BAE] dark:text-[#B0B7C3]" />
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
                      className={`rounded p-1 transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(5,81,206,0.15)] dark:hover:shadow-[0_2px_4px_rgba(91,155,213,0.15)] ${
                        conv.isPinned
                          ? "bg-[rgba(5,81,206,0.1)] dark:bg-[rgba(91,155,213,0.1)]"
                          : "bg-[rgba(5,81,206,0.05)] dark:bg-[rgba(255,255,255,0.05)]"
                      }`}
                      title={conv.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin
                        className={`h-3 w-3 ${
                          conv.isPinned ? "fill-current" : ""
                        } ${
                          conv.isPinned
                            ? "text-[#0551CE] dark:text-[#5B9BD5]"
                            : "text-[#8B9BAE] dark:text-[#B0B7C3]"
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, conv.id)}
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
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] shadow-[0_4px_12px_rgba(5,81,206,0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medium text-[#4C5461]">
              Delete Conversation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#4C5461] opacity-80">
              This action cannot be undone. This will permanently delete the
              conversation and remove all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              className="border border-[rgba(5,81,206,0.12)] bg-transparent text-[#4C5461] shadow-[0_1px_3px_rgba(5,81,206,0.1)] transition-all duration-200 hover:-translate-y-[0.5px] hover:bg-[rgba(5,81,206,0.05)] hover:shadow-[0_2px_4px_rgba(5,81,206,0.15)]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="border border-[#dc2626] bg-[#dc2626] text-[#F7F7F2] shadow-[0_1px_3px_rgba(220,38,38,0.2)] transition-all duration-200 hover:-translate-y-[0.5px] hover:bg-[#b91c1c] hover:shadow-[0_2px_4px_rgba(220,38,38,0.3)]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
