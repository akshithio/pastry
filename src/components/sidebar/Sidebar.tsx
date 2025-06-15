"use client";

import type { Session } from "next-auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConversationSearch } from "~/hooks/useConversationSearch";
import type { Conversation } from "~/types/conversations";
import ConversationList from "./ConversationList";
import SidebarHeader from "./SidebarHeader";
import SidebarSearch from "./SidebarSearch";
import SidebarUserInfo from "./SidebarUserInfo";

type SidebarProps = {
  session: Session;
  conversations: Conversation[];
  onConversationClick: (id: string) => void;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeConversationId?: string;
  loadingConversationIds?: string[];
  isConversationStreaming?: (conversationId: string) => boolean;
};

export default function Sidebar({
  session,
  conversations,
  onConversationClick,
  setConversations,
  isCollapsed = false,
  onToggleCollapse,
  isConversationStreaming,
  activeConversationId,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(15);
  const [isResizing, setIsResizing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH_PERCENT = 15;
  const MAX_WIDTH_PERCENT = 45;
  const COLLAPSED_WIDTH = 64;
  const STORAGE_KEY = "sidebar-width";

  useEffect(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
      const parsedWidth = parseFloat(savedWidth);
      if (
        parsedWidth >= MIN_WIDTH_PERCENT &&
        parsedWidth <= MAX_WIDTH_PERCENT
      ) {
        setSidebarWidth(parsedWidth);
      }
    }

    setIsInitialized(true);
  }, [MIN_WIDTH_PERCENT, MAX_WIDTH_PERCENT]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, sidebarWidth.toString());
    }
  }, [sidebarWidth, isInitialized]);

  const filteredConversations = useConversationSearch(
    conversations,
    searchQuery,
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const windowWidth = window.innerWidth;
      const newWidthPercent = (e.clientX / windowWidth) * 100;

      const clampedWidth = Math.min(
        Math.max(newWidthPercent, MIN_WIDTH_PERCENT),
        MAX_WIDTH_PERCENT,
      );

      setSidebarWidth(clampedWidth);
    },
    [isResizing, MIN_WIDTH_PERCENT, MAX_WIDTH_PERCENT],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const sidebarStyle = isCollapsed
    ? { width: `${COLLAPSED_WIDTH}px` }
    : { width: `${sidebarWidth}%` };

  const transitionClass =
    isResizing || !isInitialized
      ? ""
      : "transition-all duration-300 ease-in-out";

  if (!isInitialized) {
    return null;
  }

  return (
    <div
      ref={sidebarRef}
      className={`relative z-10 flex flex-col overflow-x-hidden border-r border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] ${transitionClass} dark:border-[rgba(255,255,255,0.12)] dark:bg-[#1a1a1a] ${
        isCollapsed ? "" : "min-w-0"
      }`}
      style={sidebarStyle}
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
            isConversationStreaming={isConversationStreaming}
            setConversations={setConversations}
            activeConversationId={activeConversationId}
          />
        </>
      )}

      <SidebarUserInfo session={session} isCollapsed={isCollapsed} />

      {!isCollapsed && (
        <div
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent transition-colors duration-150 hover:bg-[rgba(5,81,206,0.2)] dark:hover:bg-[rgba(255,255,255,0.2)]"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 right-0 h-8 w-0.5 -translate-y-1/2 bg-[rgba(5,81,206,0.3)] opacity-0 transition-opacity duration-150 hover:opacity-100 dark:bg-[rgba(255,255,255,0.3)]" />
        </div>
      )}
    </div>
  );
}
