"use client";

import Fuse from "fuse.js";
import type { Session } from "next-auth";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef, useState, useEffect } from "react";
import { Pencil, Pin, Trash2 } from "lucide-react";
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
import ConversationList from "../ConversationList";
import SidebarHeader from "./SidebarHeader";
import SidebarSearch from "./SidebarSearch";
import SidebarUserInfo from "./SidebarUserInfo";

type Conversation = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isBranched?: boolean;
};

type ContextMenuState = {
  show: boolean;
  x: number;
  y: number;
  conversationId: string | null;
};

type SidebarProps = {
  session: Session;
  conversations: Conversation[];
  onConversationClick: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  conversationToRenameId: string | null;
  setConversationToRenameId: (id: string | null) => void;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function Sidebar({
  session,
  conversations,
  onConversationClick,
  onDeleteConversation,
  conversationToRenameId,
  setConversationToRenameId,
  setConversations,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    conversationId: null,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();

  const fuse = useMemo(() => {
    return new Fuse(conversations, {
      keys: ["title"],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      shouldSort: true,
    });
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [searchQuery, fuse, conversations]);

  // Handle clicking outside context menu
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

  // Reset delete dialog when context menu closes
  useEffect(() => {
    if (!contextMenu.show) {
      setShowDeleteDialog(false);
    }
  }, [contextMenu.show]);

  const handleContextMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      conversationId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, conversationId: null });
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contextMenu.conversationId) {
      setConversationToRenameId(contextMenu.conversationId);
    }
    closeContextMenu();
  };

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contextMenu.conversationId) return;

    const conversation = conversations.find(
      (c) => c.id === contextMenu.conversationId,
    );
    if (!conversation) return;

    try {
      const res = await fetch(
        `/api/conversations/${contextMenu.conversationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !conversation.isPinned }),
        },
      );

      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === contextMenu.conversationId
              ? { ...c, isPinned: !c.isPinned }
              : c,
          ),
        );
      } else {
        console.error("Failed to pin/unpin conversation");
      }
    } catch (error) {
      console.error("Error pinning/unpinning conversation:", error);
    }

    closeContextMenu();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contextMenu.conversationId) return;

    try {
      const res = await fetch(
        `/api/conversations/${contextMenu.conversationId}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        onDeleteConversation(contextMenu.conversationId);
        if (params.id === contextMenu.conversationId) {
          router.push("/");
        }
      } else {
        console.error("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }

    setShowDeleteDialog(false);
    closeContextMenu();
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
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
    }

    setConversationToRenameId(null);
  };

  const getIsPinned = (conversationId: string | null) => {
    if (!conversationId) return false;
    const conversation = conversations.find((c) => c.id === conversationId);
    return conversation?.isPinned ?? false;
  };

  return (
    <div
      className={`relative z-10 flex flex-col overflow-x-hidden border-r border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] transition-all duration-300 ease-in-out dark:border-[rgba(255,255,255,0.12)] dark:bg-[#1a1a1a] ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />

      {!isCollapsed && (
        <>
          <SidebarSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <ConversationList
            conversations={filteredConversations}
            onConversationClick={onConversationClick}
            onContextMenu={handleContextMenu}
            onRename={handleUpdateConversationTitle}
            conversationToRenameId={conversationToRenameId}
            setConversationToRenameId={setConversationToRenameId}
          />
        </>
      )}

      <SidebarUserInfo session={session} isCollapsed={isCollapsed} />

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 rounded border shadow-[0_4px_12px_rgba(5,81,206,0.2)]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: "#F7F7F2",
            borderColor: "rgba(5,81,206,0.12)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRename}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-200 first:rounded-t last:rounded-b hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(5,81,206,0.1)]"
            style={{ color: "#4C5461" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(5,81,206,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Pencil className="h-3 w-3" />
            Rename
          </button>
          <button
            onClick={handlePin}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-200 first:rounded-t last:rounded-b hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(5,81,206,0.1)]"
            style={{ color: "#4C5461" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(5,81,206,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Pin className="h-3 w-3" />
            {getIsPinned(contextMenu.conversationId) ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-200 first:rounded-t last:rounded-b hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(220,38,38,0.15)]"
            style={{ color: "#dc2626" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(220,38,38,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}
