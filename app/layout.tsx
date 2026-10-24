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
  title: "고스트릴 GhostReel",
  description: "내 숏폼 감각을 사람처럼 출연하는 가상 캐릭터에 입혀, 얼굴도 촬영도 없이 매일 올라가는 채널을 부업으로.",
};

export const viewport: Viewport = {
  themeColor: "#0D0B1A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh">
        <div className="mx-auto w-full max-w-[430px] px-4">{children}</div>
      </body>
    </html>
  );
}
