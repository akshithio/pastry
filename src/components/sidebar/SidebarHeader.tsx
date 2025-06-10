"use client";

import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { family } from "~/utils/fonts";

export default function SidebarHeader() {
  const router = useRouter();

  return (
    <div className="border-b border-[rgba(5,81,206,0.12)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1
          className={`cursor-pointer font-medium ${family.className} text-[#0551CE] transition-colors`}
          onClick={() => router.push("/")}
        >
          🍰 Pastry
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer rounded p-1 text-[#4C5461]/70 transition-all duration-200 hover:bg-[rgba(5,81,206,0.06)] hover:text-[#0551CE]"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
      <button
        className="auth-clean-shadow w-full cursor-pointer border border-[#0551CE] bg-[#0551CE] px-3 py-2 text-left font-medium text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#044bb8] hover:shadow-[0_4px_8px_rgba(5,81,206,0.3)]"
        onClick={() => router.push("/")}
      >
        New Chat
      </button>
    </div>
  );
}
