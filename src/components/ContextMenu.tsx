import { Pencil, Pin, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { forwardRef, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

type ContextMenuProps = {
  show: boolean;
  x: number;
  y: number;
  conversationId: string | null;
  isPinned: boolean;
  onPin: (conversationId: string) => void;
  onRename: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  onClose: () => void;
};

const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  (
    {
      show,
      x,
      y,
      conversationId,
      isPinned,
      onPin,
      onRename,
      onDelete,
      onClose,
    },
    ref,
  ) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
      if (!show) {
        setShowDeleteDialog(false);
      }
    }, [show]);

    if (!show) return null;

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
      if (conversationId) {
        try {
          const res = await fetch(`/api/conversations/${conversationId}`, {
            method: "DELETE",
          });

          if (res.ok) {
            onDelete(conversationId);
            if (params.id === conversationId) {
              router.push("/");
            }
          } else {
            console.error("Failed to delete conversation");
          }
        } catch (error) {
          console.error("Error deleting conversation:", error);
        }
      }
      setShowDeleteDialog(false);
      onClose();
    };

    const handleDeleteCancel = () => {
      setShowDeleteDialog(false);
    };

    const handleRename = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (conversationId) {
        onRename(conversationId);
      }
      onClose();
    };

    const handlePin = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (conversationId) {
        try {
          const res = await fetch(`/api/conversations/${conversationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPinned: !isPinned }),
          });

          if (res.ok) {
            onPin(conversationId);
          } else {
            console.error("Failed to pin/unpin conversation");
          }
        } catch (error) {
          console.error("Error pinning/unpinning conversation:", error);
        }
      }
      onClose();
    };

    return (
      <>
        <div
          ref={ref}
          className="fixed z-50 rounded border shadow-[0_4px_12px_rgba(5,81,206,0.2)]"
          style={{
            left: x,
            top: y,
            backgroundColor: "#F7F7F2",
            borderColor: "rgba(5,81,206,0.12)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRename}
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
            onClick={handlePin}
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
            onClick={handleDeleteClick}
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

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] shadow-[0_4px_12px_rgba(5,81,206,0.2)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-medium text-[#4C5461]">
                Delete Conversation?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[#4C5461] opacity-80">
                This action cannot be undone. This will permanently delete the
                conversation and remove all its messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel
                onClick={handleDeleteCancel}
                className="border border-[rgba(5,81,206,0.12)] bg-transparent text-[#4C5461] shadow-[0_1px_3px_rgba(5,81,206,0.1)] transition-all duration-200 hover:-translate-y-[0.5px] hover:bg-[rgba(5,81,206,0.05)] hover:shadow-[0_2px_4px_rgba(5,81,206,0.15)]"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="border border-[#dc2626] bg-[#dc2626] text-[#F7F7F2] shadow-[0_1px_3px_rgba(220,38,38,0.2)] transition-all duration-200 hover:-translate-y-[0.5px] hover:bg-[#b91c1c] hover:shadow-[0_2px_4px_rgba(220,38,38,0.3)]"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
);

ContextMenu.displayName = "ContextMenu";

export default ContextMenu;
