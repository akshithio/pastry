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

type DeleteConversationDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  conversationTitle?: string;
};

export default function DeleteConversationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  conversationTitle,
}: DeleteConversationDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] shadow-[0_4px_12px_rgba(5,81,206,0.2)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-medium text-[#4C5461]">
            Delete Conversation?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#4C5461] opacity-80">
            {conversationTitle
              ? `This will permanently delete "${conversationTitle}" and remove all its messages. This action cannot be undone.`
              : "This action cannot be undone. This will permanently delete the conversation and remove all its messages."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={handleCancel}
            className="cursor-pointer border border-[rgba(5,81,206,0.12)] bg-transparent text-[#4C5461]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="cursor-pointer border border-[#dc2626] bg-[#dc2626] text-[#F7F7F2]"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
