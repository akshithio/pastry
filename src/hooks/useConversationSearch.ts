import Fuse from "fuse.js";
import { useMemo } from "react";
import type { Conversation } from "~/types/conversations";

const sortConversations = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
};

export const useConversationSearch = (
  conversations: Conversation[],
  searchQuery: string,
) => {
  const sortedConversations = useMemo(() => {
    return sortConversations(conversations);
  }, [conversations]);

  const fuse = useMemo(() => {
    return new Fuse(sortedConversations, {
      keys: ["title"],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      shouldSort: true,
    });
  }, [sortedConversations]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedConversations;
    }

    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [searchQuery, fuse, sortedConversations]);

  return filteredConversations;
};
