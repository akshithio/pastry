import "~/styles/globals.css";

import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import { ThemeProvider } from "~/components/theme-provider";
import { saans } from "~/utils/fonts";

export const metadata: Metadata = {
  title: "Pastry",
  description: "LLM Interfacing",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${saans.variable}`} suppressHydrationWarning>
      <body>
        {" "}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
