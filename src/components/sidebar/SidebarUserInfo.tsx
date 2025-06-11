import { LogOut } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { ThemeToggle } from "~/components/theme-toggle";

type SidebarUserInfoProps = {
  session: Session;
  isCollapsed?: boolean;
};

export default function SidebarUserInfo({
  session,
  isCollapsed = false,
}: SidebarUserInfoProps) {
  const userInitials = session.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "?";

  if (isCollapsed) {
    return (
      <div className="border-t border-[rgba(5,81,206,0.12)] p-4 dark:border-[rgba(255,255,255,0.12)]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0551CE] text-xs font-medium text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:shadow-[0_1px_3px_rgba(91,155,213,0.2)]"
            title={session.user?.name ?? "Unknown User"}
          >
            {userInitials}
          </div>
          <ThemeToggle />
          <button
            onClick={() => signOut()}
            className="cursor-pointer rounded p-1 text-[#4C5461]/70 transition-all duration-200 hover:bg-[rgba(5,81,206,0.06)] hover:text-[#0551CE] dark:text-[#B0B7C3]/70 dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:text-[#5B9BD5]"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-[rgba(5,81,206,0.12)] p-4 dark:border-[rgba(255,255,255,0.12)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0551CE] text-xs font-medium text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:shadow-[0_1px_3px_rgba(91,155,213,0.2)]">
            {userInitials}
          </div>
          <div>
            <div className="text-xs font-medium text-[#4C5461] dark:text-[#E5E5E5]">
              {session.user?.name ?? "Unknown User"}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <ThemeToggle />
          <button
            onClick={() => signOut()}
            className="cursor-pointer rounded p-1 text-[#4C5461]/70 transition-all duration-200 hover:bg-[rgba(5,81,206,0.06)] hover:text-[#0551CE] dark:text-[#B0B7C3]/70 dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:text-[#5B9BD5]"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
