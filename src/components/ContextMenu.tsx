import { Pin, Trash2, Pencil } from "lucide-react"; // Import Pencil icon
import { forwardRef } from "react";

type ContextMenuProps = {
  show: boolean;
  x: number;
  y: number;
  conversationId: string | null;
  isPinned: boolean;
  onPin: () => void;
  onDelete: () => void;
  onRename: () => void; // New prop for rename
};

const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ show, x, y, isPinned, onPin, onDelete, onRename }, ref) => {
    if (!show) return null;

    return (
      <div
        ref={ref}
        className="fixed z-50 rounded border shadow-lg"
        style={{
          left: x,
          top: y,
          backgroundColor: "#ebe0d0",
          borderColor: "#d4c4a8",
        }}
      >
        <button
          onClick={onRename} 
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[#e8dcc6]"
          style={{ color: "#5a4a37" }}
        >
          <Pencil className="h-3 w-3" />
          Rename
        </button>
        <button
          onClick={onPin}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[#e8dcc6]"
          style={{ color: "#5a4a37" }}
        >
          <Pin className="h-3 w-3" />
          {isPinned ? "Unpin" : "Pin"}
        </button>
        <button
          onClick={onDelete}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[#e8dcc6]"
          style={{ color: "#d44444" }}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    );
  },
);

ContextMenu.displayName = "ContextMenu";

export default ContextMenu;
