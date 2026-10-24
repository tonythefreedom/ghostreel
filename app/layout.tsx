import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GhostReel",
  description: "Your short-form style, performed every day by a virtual human: no face, no shoot, a channel on the side.",
};

export const viewport: Viewport = {
  themeColor: "#0D0B1A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pretendard.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh">
        <div className="mx-auto w-full max-w-[430px] px-4">{children}</div>
      </body>
    </html>
  );
}
