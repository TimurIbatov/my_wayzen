import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "WayZen — deploy",
  description: "WayZen API on Vercel + Neon (Phase 1 deploy surface)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          fontFamily: "Outfit, system-ui, sans-serif",
          background:
            "radial-gradient(900px 520px at 12% 88%, rgba(45,212,191,.16), transparent 52%), radial-gradient(820px 520px at 92% 78%, rgba(124,58,237,.18), transparent 50%), #0b1220",
          color: "#e8eef2",
        }}
      >
        {children}
      </body>
    </html>
  );
}
