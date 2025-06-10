import { Pin, Trash2, Pencil } from "lucide-react";
import { forwardRef } from "react";

type ContextMenuProps = {
  show: boolean;
  x: number;
  y: number;
  conversationId: string | null;
  isPinned: boolean;
  onPin: () => void;
  onDelete: () => void;
  onRename: () => void;
};

const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ show, x, y, isPinned, onPin, onDelete, onRename }, ref) => {
    if (!show) return null;

    return (
      <div
        ref={ref}
        className="fixed z-50 rounded border shadow-[0_4px_12px_rgba(5,81,206,0.2)]"
        style={{
          left: x,
          top: y,
          backgroundColor: "#F7F7F2",
          borderColor: "rgba(5,81,206,0.12)",
        }}
      >
        <button
          onClick={onRename}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-200 first:rounded-t last:rounded-b hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(5,81,206,0.1)]"
          style={{ color: "#4C5461" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(5,81,206,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Pencil className="h-3 w-3" />
          Rename
        </button>
        <button
          onClick={onPin}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-200 first:rounded-t last:rounded-b hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(5,81,206,0.1)]"
          style={{ color: "#4C5461" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(5,81,206,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Pin className="h-3 w-3" />
          {isPinned ? "Unpin" : "Pin"}
        </button>
        <button
          onClick={onDelete}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-200 first:rounded-t last:rounded-b hover:-translate-y-[0.5px] hover:shadow-[0_2px_4px_rgba(220,38,38,0.15)]"
          style={{ color: "#dc2626" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(220,38,38,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
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
