import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

type SidebarUserInfoProps = {
  session: Session;
};

export default function SidebarUserInfo({ session }: SidebarUserInfoProps) {
  return (
    <div className="border-t p-4" style={{ borderColor: "#e2d5c0" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
            style={{ backgroundColor: "#8b7355", color: "#f5f1e8" }}
          >
            {session.user?.name
              ? session.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "?"}
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: "#5a4a37" }}>
              {session.user?.name ?? "Unknown User"}
            </div>
            <div className="text-xs" style={{ color: "#8b7355" }}>
              Free
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="cursor-pointer rounded p-1 transition-colors"
          style={{ color: "#6b5b47" }}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
