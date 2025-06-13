import { useEffect, useState } from "react";

export const useLoadingConversations = () => {
  const [loadingConversationIds, setLoadingConversationIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    const storedLoadingIds = sessionStorage.getItem("loadingConversationIds");
    if (storedLoadingIds) {
      try {
        const loadingIds = JSON.parse(storedLoadingIds) as string[];
        setLoadingConversationIds(loadingIds);
      } catch (error) {
        console.error("Failed to parse loading conversation IDs:", error);
      }
    }
  }, []);

  const addLoadingConversation = (conversationId: string) => {
    setLoadingConversationIds((prev) => {
      const newLoadingIds = [...prev, conversationId];
      sessionStorage.setItem(
        "loadingConversationIds",
        JSON.stringify(newLoadingIds),
      );
      return newLoadingIds;
    });
  };

  const removeLoadingConversation = (conversationId: string) => {
    setLoadingConversationIds((prev) => {
      const newLoadingIds = prev.filter((id) => id !== conversationId);
      if (newLoadingIds.length === 0) {
        sessionStorage.removeItem("loadingConversationIds");
      } else {
        sessionStorage.setItem(
          "loadingConversationIds",
          JSON.stringify(newLoadingIds),
        );
      }
      return newLoadingIds;
    });
  };

  return {
    loadingConversationIds,
    addLoadingConversation,
    removeLoadingConversation,
  };
};