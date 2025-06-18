import {
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function HistoryTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/conversations");

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  const filterByTimeframe = (conversation) => {
    if (selectedTimeframe === "all") return true;

    const now = new Date();
    const conversationDate = new Date(conversation.updatedAt);
    const diffInDays = Math.floor(
      (now - conversationDate) / (1000 * 60 * 60 * 24),
    );

    switch (selectedTimeframe) {
      case "today":
        return diffInDays === 0;
      case "week":
        return diffInDays <= 7;
      case "month":
        return diffInDays <= 30;
      default:
        return true;
    }
  };

  const filteredHistory = conversations
    .filter(filterByTimeframe)
    .filter((conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const handleDeleteConversation = async (conversationId) => {
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId),
      );
    } catch (err) {
      console.error("Error deleting conversation:", err);
      alert("Failed to delete conversation. Please try again.");
    }
  };

  const handleExportHistory = async () => {
    try {
      const dataStr = JSON.stringify(conversations, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `conversation-history-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting history:", err);
      alert("Failed to export history. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Work in Progress Warning */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 text-white">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Work in Progress
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This tab is currently under development and functionality may not
              work as expected.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-medium text-[#4C5461] dark:text-[#E5E5E5]">
          History & Sync
        </h2>
        <p className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
          Manage your conversation history and sync settings across devices.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute top-3 left-3 h-4 w-4 text-[#4C5461]/50 dark:text-[#B0B7C3]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] py-3 pr-4 pl-10 text-[#4C5461] transition-colors outline-none focus:border-[#0551CE] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:focus:border-[#5B9BD5]"
            placeholder="Search conversations..."
          />
        </div>

        <div className="flex gap-2">
          {["all", "today", "week", "month"].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`cursor-pointer px-3 py-1 text-sm capitalize transition-colors ${
                selectedTimeframe === timeframe
                  ? "bg-[#0551CE] text-[#F7F7F2] dark:bg-[#5B9BD5] dark:text-[#1a1a1a]"
                  : "border border-[rgba(5,81,206,0.12)] text-[#4C5461] hover:bg-[rgba(5,81,206,0.05)] dark:border-[rgba(255,255,255,0.12)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]"
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation History */}
      <div className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
        <div className="border-b border-[rgba(5,81,206,0.08)] p-6 pb-4 dark:border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-[#4C5461] dark:text-[#E5E5E5]">
              Recent Conversations
            </h3>
            <div className="flex gap-2">
              <button
                onClick={fetchConversations}
                disabled={loading}
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-1 text-sm text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.05)] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={handleExportHistory}
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-1 text-sm text-[#4C5461] transition-colors hover:bg-[rgba(5,81,206,0.05)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(5,81,206,0.2)] hover:scrollbar-thumb-[rgba(5,81,206,0.3)] dark:scrollbar-thumb-[rgba(255,255,255,0.2)] dark:hover:scrollbar-thumb-[rgba(255,255,255,0.3)] max-h-96 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center">
              <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-[#4C5461]/50 dark:text-[#B0B7C3]/50" />
              <p className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                Loading conversations...
              </p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <span className="text-red-600 dark:text-red-400">!</span>
              </div>
              <p className="mb-2 text-red-600 dark:text-red-400">
                Error loading conversations
              </p>
              <p className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                {error}
              </p>
              <button
                onClick={fetchConversations}
                className="mt-3 rounded bg-[#0551CE] px-4 py-2 text-sm text-white hover:bg-[#0551CE]/90 dark:bg-[#5B9BD5] dark:hover:bg-[#5B9BD5]/90"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-6 pt-4">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex cursor-pointer items-center justify-between border border-[rgba(5,81,206,0.08)] p-4 transition-colors hover:bg-[rgba(5,81,206,0.02)] dark:border-[rgba(255,255,255,0.08)] dark:hover:bg-[rgba(255,255,255,0.02)]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
                          {conversation.title}
                        </div>
                        {conversation.isPinned && (
                          <span className="rounded bg-[#0551CE] px-2 py-0.5 text-xs text-white dark:bg-[#5B9BD5] dark:text-[#1a1a1a]">
                            Pinned
                          </span>
                        )}
                        {conversation.isPublic && (
                          <span className="rounded bg-green-500 px-2 py-0.5 text-xs text-white">
                            Public
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                        Model: {conversation.model || "Unknown"}
                      </div>
                      <div className="text-xs text-[#4C5461]/50 dark:text-[#B0B7C3]/50">
                        {formatDate(conversation.updatedAt)} • Created{" "}
                        {formatDate(conversation.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                      className="ml-4 cursor-pointer rounded p-2 text-[#4C5461]/50 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-[#B0B7C3]/50 dark:hover:bg-red-900 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <Clock className="mx-auto mb-4 h-12 w-12 text-[#4C5461]/30 dark:text-[#B0B7C3]/30" />
                  <p className="text-[#4C5461]/70 dark:text-[#B0B7C3]/70">
                    {searchQuery || selectedTimeframe !== "all"
                      ? "No conversations found matching your criteria."
                      : "No conversation history yet."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
