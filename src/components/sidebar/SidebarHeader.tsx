import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SidebarHeader() {
  const router = useRouter();

  return (
    <div className="border-b p-4" style={{ borderColor: "#e2d5c0" }}>
      <div className="mb-4 flex items-center justify-between">
        <h1
          className="cursor-pointer font-medium"
          style={{ color: "#5a4a37" }}
          onClick={() => router.push("/")}
        >
          🍰 Pastry
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer rounded p-1 transition-colors"
            style={{ color: "#6b5b47" }}
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
      <button
        className="w-full cursor-pointer rounded border px-3 py-2 text-left font-medium transition-colors"
        style={{
          backgroundColor: "#d4c4a8",
          color: "#5a4a37",
          borderColor: "#c4b49d",
        }}
        onClick={() => router.push("/")}
      >
        New Chat
      </button>
    </div>
  );
}
