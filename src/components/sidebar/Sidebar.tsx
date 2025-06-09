import Fuse from "fuse.js";
import type { Session } from "next-auth";
import { useMemo, useState } from "react";
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
};

type SidebarProps = {
  session: Session;
  conversations: Conversation[];
  onConversationClick: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  conversationToRenameId: string | null;
  setConversationToRenameId: (id: string | null) => void;
};

export default function Sidebar({
  session,
  conversations,
  onConversationClick,
  onContextMenu,
  onRename,
  onPin,
  onDelete,
  conversationToRenameId,
  setConversationToRenameId,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div
      className="flex w-64 flex-col border-r"
      style={{ backgroundColor: "#f5f1e8", borderColor: "#e2d5c0" }}
    >
      <SidebarHeader />
      <SidebarSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <ConversationList
        conversations={filteredConversations}
        onConversationClick={onConversationClick}
        onContextMenu={onContextMenu}
        onRename={onRename}
        onPin={onPin}
        onDelete={onDelete}
        conversationToRenameId={conversationToRenameId}
        setConversationToRenameId={setConversationToRenameId}
      />
      <SidebarUserInfo session={session} />
    </div>
  );
}
