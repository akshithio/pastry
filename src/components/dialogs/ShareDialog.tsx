import { Check, ChevronDown, Copy, Globe, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { Conversation } from "~/types/conversations";

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  shareUrlCopied: boolean;
  showVisibilityDropdown: boolean;
  pendingVisibilityChange: boolean | null;
  isUpdatingVisibility: boolean;
  onCopyShareUrl: () => Promise<void>;
  onVisibilityDropdownToggle: () => void;
  onVisibilitySelect: (isPublic: boolean) => void;
  onConfirmVisibilityChange: () => Promise<void>;
}

export function ShareDialog({
  isOpen,
  onOpenChange,
  conversation,
  shareUrlCopied,
  showVisibilityDropdown,
  pendingVisibilityChange,
  isUpdatingVisibility,
  onCopyShareUrl,
  onVisibilityDropdownToggle,
  onVisibilitySelect,
  onConfirmVisibilityChange,
}: ShareDialogProps) {
  const currentVisibility = pendingVisibilityChange ?? conversation?.isPublic;
  const canCopyUrl = currentVisibility;
  const hasVisibilityChanged =
    pendingVisibilityChange !== null &&
    pendingVisibilityChange !== conversation?.isPublic;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] shadow-[0_4px_12px_rgba(5,81,206,0.2)] sm:max-w-md dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:shadow-[0_4px_12px_rgba(91,155,213,0.2)]">
        <DialogHeader>
          <DialogTitle className="font-medium text-[#4C5461] dark:text-[#E5E5E5]">
            Share Conversation
          </DialogTitle>
          <DialogDescription className="text-[#4C5461] opacity-80 dark:text-[#B0B7C3] dark:opacity-80">
            {canCopyUrl
              ? "Anyone with this link can view this conversation."
              : "This conversation is not currently public. Change the privacy setting below to enable sharing."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <div className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border border-[rgba(5,81,206,0.12)] bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-[rgba(255,255,255,0.12)]">
                <input
                  readOnly
                  value={
                    canCopyUrl
                      ? typeof window !== "undefined"
                        ? window.location.href
                        : "URL will be available after page loads"
                      : "URL available only when public"
                  }
                  className={`w-full bg-transparent outline-none ${
                    canCopyUrl
                      ? "text-[#4C5461] dark:text-[#E5E5E5]"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </div>
            </div>

            <button
              onClick={onCopyShareUrl}
              disabled={!canCopyUrl}
              className={`auth-clean-shadow flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                canCopyUrl
                  ? "cursor-pointer bg-[#0551CE] text-[#F7F7F2] hover:bg-[#044bb8] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
                  : "cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
              }`}
            >
              {shareUrlCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex w-full items-center justify-between">
            {/* Integrated Visibility Dropdown */}
            <div className="relative">
              <button
                onClick={onVisibilityDropdownToggle}
                className="flex cursor-pointer items-center gap-1 text-xs text-[#4C5461] opacity-60 transition-opacity hover:opacity-80 dark:text-[#B0B7C3] dark:opacity-60 dark:hover:opacity-80"
                disabled={isUpdatingVisibility}
              >
                {currentVisibility ? (
                  <>
                    <Globe className="h-3 w-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    Private
                  </>
                )}
                <ChevronDown className="h-3 w-3" />
              </button>

              {showVisibilityDropdown && (
                <div className="absolute bottom-full left-0 z-10 mb-1 rounded-md border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] shadow-lg dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a]">
                  <button
                    onClick={() => onVisibilitySelect(true)}
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm whitespace-nowrap text-[#4C5461] hover:bg-[rgba(5,81,206,0.05)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    <Globe className="h-4 w-4" />
                    Public
                  </button>
                  <button
                    onClick={() => onVisibilitySelect(false)}
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm whitespace-nowrap text-[#4C5461] hover:bg-[rgba(5,81,206,0.05)] dark:text-[#E5E5E5] dark:hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    <Lock className="h-4 w-4" />
                    Private
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onConfirmVisibilityChange}
              disabled={!hasVisibilityChanged || isUpdatingVisibility}
              className={`rounded px-4 py-2 text-sm transition-colors ${
                hasVisibilityChanged && !isUpdatingVisibility
                  ? "cursor-pointer bg-[#0551CE] text-[#F7F7F2] hover:bg-[#044bb8] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:hover:bg-[#4A8BC7]"
                  : "cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
              }`}
            >
              {isUpdatingVisibility ? "Updating..." : "Confirm"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
