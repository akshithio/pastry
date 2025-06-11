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
    <div className="border-b border-[rgba(5,81,206,0.12)] p-4 dark:border-[rgba(255,255,255,0.12)]">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#4C5461]/50 dark:text-[#B0B7C3]/50" />
        <input
          type="text"
          placeholder="Search your threads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="auth-clean-shadow w-full border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] px-9 py-2 text-sm text-[#4C5461] transition-all duration-200 outline-none placeholder:text-[#4C5461]/40 focus:border-[#0551CE] focus:shadow-[0_4px_8px_rgba(5,81,206,0.15)] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#2a2a2a] dark:text-[#E5E5E5] dark:placeholder:text-[#B0B7C3]/40 dark:focus:border-[#5B9BD5] dark:focus:shadow-[0_4px_8px_rgba(91,155,213,0.15)]"
        />
      </div>
    </div>
  );
}
