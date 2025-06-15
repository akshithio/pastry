import { useCallback, useRef, useState } from "react";

type StreamingStatus = {
  [conversationId: string]: boolean;
};

export const useStreamingStatus = () => {
  const [streamingStatuses, setStreamingStatuses] = useState<StreamingStatus>(
    {},
  );
  const timeoutRefs = useRef<{ [conversationId: string]: NodeJS.Timeout }>({});

  const setStreaming = useCallback(
    (conversationId: string, isStreaming: boolean) => {
      if (timeoutRefs.current[conversationId]) {
        clearTimeout(timeoutRefs.current[conversationId]);
        delete timeoutRefs.current[conversationId];
      }

      if (isStreaming) {
        setStreamingStatuses((prev) => ({ ...prev, [conversationId]: true }));
      } else {
        timeoutRefs.current[conversationId] = setTimeout(() => {
          setStreamingStatuses((prev) => {
            const updated = { ...prev };
            delete updated[conversationId];
            return updated;
          });
          delete timeoutRefs.current[conversationId];
        }, 500);
      }
    },
    [],
  );

  const isStreaming = useCallback(
    (conversationId: string): boolean => {
      return streamingStatuses[conversationId] ?? false;
    },
    [streamingStatuses],
  );

  const clearAll = useCallback(() => {
    Object.values(timeoutRefs.current).forEach(clearTimeout);
    timeoutRefs.current = {};
    setStreamingStatuses({});
  }, []);

  const cleanup = useCallback(() => {
    Object.values(timeoutRefs.current).forEach(clearTimeout);
    timeoutRefs.current = {};
  }, []);

  return {
    setStreaming,
    isStreaming,
    clearAll,
    cleanup,
  };
};
