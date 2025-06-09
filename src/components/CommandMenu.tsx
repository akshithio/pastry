import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import * as Dialog from "@radix-ui/react-dialog";

interface CommandMenuProps {
  conversations?: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
}

export default function CommandMenu({ conversations = [] }: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
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

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-50"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      />

      {/* Command Menu */}
      <div
        className="fixed top-1/2 left-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border shadow-lg"
        role="dialog"
        aria-labelledby="command-menu-title"
        style={{
          backgroundColor: "#f5f1e8",
          borderColor: "#d4c4a8",
        }}
      >
        {/* Hidden title for accessibility using Radix DialogTitle */}
        <VisuallyHidden.Root>
          <Dialog.Title>Command Menu</Dialog.Title>
        </VisuallyHidden.Root>

        <Command
          className="rounded-lg font-mono text-sm"
          style={{ backgroundColor: "#f5f1e8" }}
        >
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full border-0 border-b px-4 py-3 outline-none"
            style={{
              backgroundColor: "transparent",
              borderColor: "#e2d5c0",
              color: "#5a4a37",
            }}
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty
              className="px-4 py-6 text-center"
              style={{ color: "#8b7355" }}
            >
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions">
              <Command.Item
                onSelect={handleNewChat}
                className="flex cursor-pointer items-center gap-3 rounded px-4 py-3 transition-colors hover:bg-gray-100"
                style={{ color: "#5a4a37" }}
              >
                <Plus className="h-4 w-4" />
                <span>New Chat</span>
                <div className="ml-auto text-xs" style={{ color: "#8b7355" }}>
                  ⌘ Shift O
                </div>
              </Command.Item>
            </Command.Group>

            {conversations.length > 0 && (
              <Command.Group heading="Recent Conversations">
                {conversations.slice(0, 5).map((conversation) => (
                  <Command.Item
                    key={conversation.id}
                    value={conversation.title}
                    onSelect={() => handleSelectConversation(conversation.id)}
                    className="flex cursor-pointer items-center gap-3 rounded px-4 py-3 transition-colors hover:bg-gray-100"
                    style={{ color: "#5a4a37" }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <div className="flex-1 truncate">
                      <div className="truncate">{conversation.title}</div>
                      <div className="text-xs" style={{ color: "#8b7355" }}>
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
