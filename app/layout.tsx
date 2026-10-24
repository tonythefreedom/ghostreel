import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist } from "next/font/google";
import "./globals.css";

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

// Digits only (DESIGN.md › Type): every number is Geist with tabular figures.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "GhostReel",
  description: "Your short-form style, performed every day by a virtual human: no face, no shoot, a channel on the side.",
  // For AI assistants: how to use GhostReel and connect its MCP server (public/llms.txt).
  alternates: { types: { "text/markdown": "/llms.txt" } },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pretendard.variable} ${geist.variable}`}>
      <body className="min-h-dvh">
        <div className="mx-auto w-full max-w-[430px] px-5">{children}</div>
      </body>
    </html>
  );
}
