import { signIn } from "next-auth/react";
import { saans, family } from "~/utils/fonts";

export default function AuthScreen() {
  return (
    <div
      className={`flex min-h-screen items-center justify-center ${saans.className} auth-grid-bg relative bg-[#F7F7F2] font-medium`}
    >
      {/* Grid overlay */}
      <div className="auth-grid-lines pointer-events-none absolute inset-0"></div>

      <div className="auth-clean-shadow mx-4 w-full max-w-md border border-[rgba(5,81,206,0.12)] bg-[#F7F7F2] p-8">
        <div className="mb-6 text-center">
          <h1
            className={`${family.className} mb-2 text-2xl font-medium text-[#4C5461]`}
          >
            🍰 Pastry
          </h1>
        </div>
        <button
          onClick={() => signIn("google")}
          className="w-full cursor-pointer border border-[#0551CE] bg-[#0551CE] px-4 py-2.5 text-sm font-medium text-[#F7F7F2] shadow-[0_1px_3px_rgba(5,81,206,0.2)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#044bb8] hover:shadow-[0_4px_8px_rgba(5,81,206,0.3)]"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
