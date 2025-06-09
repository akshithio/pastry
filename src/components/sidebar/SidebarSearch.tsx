import { Search } from "lucide-react";

type SidebarSearchProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export default function SidebarSearch({
  searchQuery,
  setSearchQuery,
}: SidebarSearchProps) {
  return (
    <div className="border-b p-4" style={{ borderColor: "#e2d5c0" }}>
      <div className="relative">
        <Search
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          style={{ color: "#8b7355" }}
        />
        <input
          type="text"
          placeholder="Search your threads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded border px-9 py-2 text-sm outline-none"
          style={{
            backgroundColor: "#ebe0d0",
            borderColor: "#d4c4a8",
            color: "#5a4a37",
          }}
        />
      </div>
    </div>
  );
}
