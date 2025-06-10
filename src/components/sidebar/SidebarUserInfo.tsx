import { LogOut } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";

type SidebarUserInfoProps = {
  session: Session;
};

export default function SidebarUserInfo({ session }: SidebarUserInfoProps) {
  return (
    <div className="border-t border-[rgba(5,81,206,0.12)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0551CE] text-xs font-medium text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)]">
            {session.user?.name
              ? session.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "?"}
          </div>
          <div>
            <div className="text-xs font-medium text-[#4C5461]">
              {session.user?.name ?? "Unknown User"}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="cursor-pointer rounded p-1 text-[#4C5461]/70 transition-all duration-200 hover:bg-[rgba(5,81,206,0.06)] hover:text-[#0551CE]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
