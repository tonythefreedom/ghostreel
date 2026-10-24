import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist } from "next/font/google";
import { LangProvider } from "@/components/Lang";
import { TopBar } from "@/components/TopBar";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/words";
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

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: t("brand", lang),
    description: t("metaDescription", lang),
    // For AI assistants: how to use GhostReel and connect its MCP server (public/llms.txt).
    alternates: { types: { "text/markdown": "/llms.txt" } },
  };
}

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${pretendard.variable} ${geist.variable}`}>
      <body className="min-h-dvh">
        <LangProvider lang={lang}>
          <div className="mx-auto w-full max-w-[430px] px-5">
            <TopBar />
            {children}
          </div>
        </LangProvider>
      </body>
    </html>
  );
}
