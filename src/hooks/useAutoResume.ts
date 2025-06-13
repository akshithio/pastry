import { type Message } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

export type DataPart = {
  type: "append-message";
  message: string;
};

interface UseAutoResumeProps {
  autoResume: boolean;
  initialMessages: Message[];
  experimental_resume: () => void;
  data: DataPart[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  conversationId: string;
}

export function useAutoResume({
  autoResume,
  initialMessages,
  experimental_resume,
  data,
  setMessages,
  conversationId,
}: UseAutoResumeProps) {
  const hasResumed = useRef(false);
  const resumeAttempted = useRef(false);

  useEffect(() => {
    if (!autoResume || resumeAttempted.current || !conversationId) {
      return;
    }

    resumeAttempted.current = true;

    const lastMessage = initialMessages[initialMessages.length - 1];

    const shouldResume =
      lastMessage &&
      (lastMessage.role === "user" ||
        (lastMessage.role === "assistant" &&
          (!lastMessage.content ||
            lastMessage.content.trim() === "" ||
            lastMessage.content === "Thinking...")));

    if (shouldResume && !hasResumed.current) {
      hasResumed.current = true;

      const timer = setTimeout(() => {
        fetch(
          `/api/chat?conversationId=${encodeURIComponent(conversationId)}`,
          {
            method: "GET",
            headers: {
              Accept: "text/event-stream",
              "Cache-Control": "no-cache",
            },
          },
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
          })
          .then((response) => {
            const reader = response.body?.getReader();
            if (reader) {
              return processStreamResponse(
                reader,
                setMessages,
                initialMessages,
              );
            }
          })
          .catch((error) => {
            console.error("Failed to resume conversation:", error);

            if (experimental_resume) {
              try {
                experimental_resume();
              } catch (resumeError) {
                console.error("Experimental resume also failed:", resumeError);
              }
            }
          });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    autoResume,
    initialMessages,
    conversationId,
    experimental_resume,
    setMessages,
  ]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const dataPart = data[0] as DataPart;
    if (dataPart.type === "append-message") {
      try {
        const message = JSON.parse(dataPart.message) as Message;
        setMessages((prevMessages: Message[]) => {
          const newMessages = [...prevMessages];
          const existingIndex = newMessages.findIndex(
            (m) => m.id === message.id,
          );

          if (existingIndex >= 0) {
            newMessages[existingIndex] = message;
          } else {
            newMessages.push(message);
          }

          return newMessages;
        });
      } catch (error) {
        console.error("Error parsing message data:", error);
      }
    }
  }, [data, setMessages]);
}

async function processStreamResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
  initialMessages: Message[],
) {
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }

            const data = JSON.parse(dataStr) as DataPart;
            if (data.type === "append-message") {
              const message = JSON.parse(data.message) as Message;

              setMessages((prevMessages: Message[]) => {
                const newMessages = [...prevMessages];
                const existingIndex = newMessages.findIndex(
                  (m) => m.id === message.id,
                );

                if (existingIndex >= 0) {
                  newMessages[existingIndex] = {
                    ...newMessages[existingIndex],
                    content: message.content,
                  };
                } else {
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (
                    lastMsg &&
                    lastMsg.role === "assistant" &&
                    (lastMsg.content === "Thinking..." ||
                      lastMsg.content === "")
                  ) {
                    newMessages[newMessages.length - 1] = message;
                  } else {
                    newMessages.push(message);
                  }
                }

                return newMessages;
              });
            }
          } catch (error) {
            console.error("Error parsing stream data:", error, "Line:", line);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing stream:", error);
  } finally {
    reader.releaseLock();
  }
}