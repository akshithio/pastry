import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import type { Conversation } from "~/types/conversations";

interface ConversationEvent {
  type:
    | "connected"
    | "conversation_created"
    | "conversation_updated"
    | "conversation_deleted"
    | "conversation_streaming";
  conversation?: Conversation;
  conversationId?: string;
  isStreaming?: boolean;
}

interface UseConversationEventsProps {
  onConversationCreated?: (conversation: Conversation) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onConversationDeleted?: (conversationId: string) => void;
  onStreamingStatusChange?: (
    conversationId: string,
    isStreaming: boolean,
  ) => void;
}

export function useConversationEvents({
  onConversationCreated,
  onConversationUpdated,
  onConversationDeleted,
  onStreamingStatusChange,
}: UseConversationEventsProps) {
  const { data: session } = useSession();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!session?.user?.id || eventSourceRef.current) return;

    console.log("Connecting to conversation events...");

    const eventSource = new EventSource("/api/conversations/events");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connection opened");
      reconnectAttempts.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ConversationEvent = JSON.parse(event.data);

        switch (data.type) {
          case "connected":
            console.log("SSE connection confirmed");
            break;
          case "conversation_created":
            if (data.conversation && onConversationCreated) {
              onConversationCreated(data.conversation);
            }
            break;
          case "conversation_updated":
            if (data.conversation && onConversationUpdated) {
              onConversationUpdated(data.conversation);
            }
            break;
          case "conversation_deleted":
            if (data.conversation && onConversationDeleted) {
              onConversationDeleted(data.conversation.id);
            }
            break;
          case "conversation_streaming":
            if (
              data.conversationId &&
              typeof data.isStreaming === "boolean" &&
              onStreamingStatusChange
            ) {
              onStreamingStatusChange(data.conversationId, data.isStreaming);
            }
            break;
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
      eventSourceRef.current = null;

      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          30000,
        );
        console.log(
          `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`,
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        console.error("Max reconnection attempts reached");
      }
    };
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      console.log("Disconnecting from conversation events...");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttempts.current = 0;
  };

  useEffect(() => {
    if (session?.user?.id) {
      connect();
    } else {
      disconnect();
    }

    return disconnect;
  }, [session?.user?.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
      } else if (session?.user?.id && !eventSourceRef.current) {
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session?.user?.id]);

  return {
    isConnected: !!eventSourceRef.current,
    reconnect: () => {
      disconnect();
      if (session?.user?.id) {
        setTimeout(connect, 100);
      }
    },
  };
}
