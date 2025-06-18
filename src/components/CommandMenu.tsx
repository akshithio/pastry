import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Command } from "cmdk";
import { MessageSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Conversation } from "~/types/conversations";
import { saans } from "~/utils/fonts";

interface CommandMenuProps {
  conversations?: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
}

export default function CommandMenu({ conversations = [] }: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNewChat = () => {
    router.push("/");
    setOpen(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
    setOpen(false);
  };

  const handleAskAsNewChat = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.length > 50 ? input.slice(0, 50) + "..." : input,
        }),
      });
      if (res.ok) {
        const newConversation = (await res.json()) as Conversation;

        sessionStorage.setItem(`pendingMessage_${newConversation.id}`, input);

        router.push(`/chat/${newConversation.id}`);
        setOpen(false);
        setInput("");
      } else {
        console.error("Failed to create new conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-50"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50" />

      {/* Command Menu */}
      <div
        className="fixed top-1/2 left-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] shadow-[0_4px_12px_rgba(5,81,206,0.15)] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:shadow-[0_4px_12px_rgba(91,155,213,0.15)]"
        role="dialog"
        aria-labelledby="command-menu-title"
      >
        <VisuallyHidden.Root>
          <Dialog.Title>Command Menu</Dialog.Title>
        </VisuallyHidden.Root>

        <Command
          className={`rounded bg-[#F7F7F2] dark:bg-[#2a2a2a] ${saans.className} text-sm font-medium`}
        >
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full border-0 border-b border-[rgba(5,81,206,0.12)] bg-transparent px-4 py-3 text-[#4C5461] outline-none placeholder:text-[#8B9BAE] dark:border-[rgba(255,255,255,0.12)] dark:text-[#E5E5E5] dark:placeholder:text-[#888]"
            value={input}
            onValueChange={setInput}
            onKeyDown={(e) => {
              if (
                input.trim() &&
                e.key === "Enter" &&
                !e.shiftKey &&
                document.querySelector("[data-cmdk-empty]")
              ) {
                e.preventDefault();
                void handleAskAsNewChat();
              }
            }}
            disabled={loading}
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty
              className="px-4 py-6 text-center text-[#8B9BAE] dark:text-[#888]"
              data-cmdk-empty
            >
              {input.trim() ? (
                <button
                  className="rounded bg-[rgba(5,81,206,0.08)] px-4 py-2 font-medium text-[#0551CE] hover:bg-[rgba(5,81,206,0.15)] focus:ring-2 focus:ring-[#0551CE] focus:outline-none disabled:opacity-60 dark:bg-[rgba(91,155,213,0.15)] dark:text-[#5B9BD5] dark:hover:bg-[rgba(91,155,213,0.25)] dark:focus:ring-[#5B9BD5]"
                  onClick={() => {
                    void handleAskAsNewChat();
                  }}
                  disabled={loading}
                  tabIndex={0}
                >
                  Ask &quot;{input}&quot; as a new chat
                </button>
              ) : (
                "No results found."
              )}
            </Command.Empty>

            <Command.Group heading="Actions">
              <Command.Item
                onSelect={handleNewChat}
                className="flex cursor-pointer items-center gap-3 rounded px-4 py-3 text-[#4C5461] transition-all duration-200 hover:-translate-y-[0.5px] hover:bg-[rgba(5,81,206,0.05)] hover:shadow-[0_2px_4px_rgba(5,81,206,0.1)] data-[selected=true]:bg-[rgba(5,81,206,0.08)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(91,155,213,0.1)] dark:hover:shadow-[0_2px_4px_rgba(91,155,213,0.1)] dark:data-[selected=true]:bg-[rgba(91,155,213,0.15)]"
              >
                <Plus className="h-4 w-4" />
                <span>New Chat</span>
                <div className="ml-auto text-xs text-[#8B9BAE] dark:text-[#888]">
                  ⌘ Shift O
                </div>
              </Command.Item>
            </Command.Group>

            {conversations.length > 0 && (
              <Command.Group heading="Recent Conversations">
                {conversations.slice(0, 5).map((conversation) => (
                  <Command.Item
                    key={conversation.id}
                    value={`${conversation.id} ${conversation.title}`}
                    onSelect={() => handleSelectConversation(conversation.id)}
                    className="flex cursor-pointer items-center gap-3 rounded px-4 py-3 text-[#4C5461] transition-all duration-200 hover:-translate-y-[0.5px] hover:bg-[rgba(5,81,206,0.05)] hover:shadow-[0_2px_4px_rgba(5,81,206,0.1)] data-[selected=true]:bg-[rgba(5,81,206,0.08)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(91,155,213,0.1)] dark:hover:shadow-[0_2px_4px_rgba(91,155,213,0.1)] dark:data-[selected=true]:bg-[rgba(91,155,213,0.15)]"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <div className="flex-1 truncate">
                      <div className="truncate">{conversation.title}</div>
                      <div className="text-xs text-[#8B9BAE] dark:text-[#888]">
                        {new Date(conversation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </Command.Dialog>
  );
}