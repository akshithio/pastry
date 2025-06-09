import { signIn } from "next-auth/react";

export default function AuthScreen() {
  return (
    <div
      className="flex min-h-screen items-center justify-center font-mono"
      style={{ backgroundColor: "#f5f1e8" }}
    >
      <div
        className="mx-4 w-full max-w-md rounded border p-8 shadow-sm"
        style={{ backgroundColor: "#ebe0d0", borderColor: "#d4c4a8" }}
      >
        <div className="mb-6 text-center">
          <h1
            className="mb-2 text-2xl font-medium"
            style={{ color: "#5a4a37" }}
          >
            🍰 Pastry
          </h1>
          <p className="text-sm" style={{ color: "#8b7355" }}>
            Bring Your Own Key AI Platform
          </p>
        </div>
        <button
          onClick={() => signIn("google")}
          className="w-full cursor-pointer rounded border px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "#5a4a37",
            color: "#f5f1e8",
            borderColor: "#5a4a37",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#4a3a27";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#5a4a37";
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
