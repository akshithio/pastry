export default function ThemeTestPage() {
  return (
    <div className="bg-background-pattern min-h-screen font-sans text-[#2E2C2B]">
      <header className="border-b border-[#DFDFDF] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          Pastry Theme Test (Zed-inspired)
        </h1>
        <p className="text-[#5A5A5A]">
          Subtle grain, modern depth, high-contrast clarity
        </p>
      </header>

      <main className="space-y-6 p-6">
        <section className="rounded-xl border border-[#E1E1E1] bg-white/90 p-4 shadow backdrop-blur-sm">
          <h2 className="text-lg font-medium">Input Field</h2>
          <input
            className="mt-2 w-full rounded-md border border-[#D4D4D4] bg-[#FDFDFD] p-2 placeholder-[#888] shadow-inner focus:ring-2 focus:ring-[#3B82F6] focus:outline-none"
            placeholder="Type something..."
          />
        </section>

        <section className="rounded-xl border border-[#E1E1E1] bg-white/90 p-4 shadow backdrop-blur-sm">
          <h2 className="text-lg font-medium">Buttons</h2>
          <div className="mt-2 flex flex-wrap gap-4">
            <button className="rounded-md bg-[#3B82F6] px-4 py-2 text-white shadow transition hover:shadow-md">
              Primary
            </button>
            <button className="rounded-md border border-[#CCC] bg-white px-4 py-2 text-[#1A1A1A] shadow-sm transition hover:shadow-md">
              Secondary
            </button>
            <button className="rounded-md border border-[#DADADA] bg-[#EDEDED] px-4 py-2 text-[#1A1A1A] transition hover:shadow-md">
              Tertiary
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-[#E1E1E1] bg-white/90 p-4 shadow backdrop-blur-sm">
          <h2 className="text-lg font-medium">Assistant Card</h2>
          <div className="mt-2 rounded-lg border border-[#DDDDDD] bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-[#3B82F6]">Pastry Bot</h3>
            <p className="mt-1 text-[#5A5A5A]">
              Hey! I'm styled like Zed — sharp, elegant, but simple.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
