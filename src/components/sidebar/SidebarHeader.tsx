"use client";

import { Settings, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { family } from "~/utils/fonts";

type SidebarHeaderProps = {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function SidebarHeader({
  isCollapsed = false,
  onToggleCollapse,
}: SidebarHeaderProps) {
  const router = useRouter();

  if (isCollapsed) {
    return (
      <div className="border-b border-[rgba(5,81,206,0.12)] p-4 dark:border-[rgba(255,255,255,0.12)]">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className="cursor-pointer rounded p-1 text-[#4C5461]/70 transition-all duration-200 hover:bg-[rgba(5,81,206,0.06)] hover:text-[#0551CE] dark:text-[#B0B7C3]/70 dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:text-[#5B9BD5]"
            title="Expand sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <button
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-[#0551CE] bg-[#0551CE] text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#044bb8] hover:shadow-[0_4px_8px_rgba(5,81,206,0.3)] dark:border-[#5B9BD5] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:shadow-[0_1px_3px_rgba(91,155,213,0.2)] dark:hover:bg-[#4A8BC7] dark:hover:shadow-[0_4px_8px_rgba(91,155,213,0.3)]"
            onClick={() => router.push("/")}
            title="New Chat"
          >
            <span className="text-xs">+</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[rgba(5,81,206,0.12)] p-4 dark:border-[rgba(255,255,255,0.12)]">
      <div className="mb-4 flex items-center justify-between">
        <h1
          className={`cursor-pointer font-medium ${family.className} text-[#0551CE] transition-colors dark:text-[#5B9BD5]`}
          onClick={() => router.push("/")}
        >
          🍰 Pastry
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer rounded p-1 text-[#4C5461]/70 transition-all duration-200 hover:bg-[rgba(5,81,206,0.06)] hover:text-[#0551CE] dark:text-[#B0B7C3]/70 dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:text-[#5B9BD5]"
            onClick={() => router.push("/settings")}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="cursor-pointer rounded p-1 text-[#4C5461]/70 transition-all duration-200 hover:bg-[rgba(5,81,206,0.06)] hover:text-[#0551CE] dark:text-[#B0B7C3]/70 dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:text-[#5B9BD5]"
              title="Collapse sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <button
        className="auth-clean-shadow w-full cursor-pointer border border-[#0551CE] bg-[#0551CE] px-3 py-2 text-left font-medium text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#044bb8] hover:shadow-[0_4px_8px_rgba(5,81,206,0.3)] dark:border-[#5B9BD5] dark:bg-[#5B9BD5] dark:text-[#1a1a1a] dark:shadow-[0_1px_3px_rgba(91,155,213,0.2)] dark:hover:bg-[#4A8BC7] dark:hover:shadow-[0_4px_8px_rgba(91,155,213,0.3)]"
        onClick={() => router.push("/")}
      >
        New Chat
      </button>
    </div>
  );
}
