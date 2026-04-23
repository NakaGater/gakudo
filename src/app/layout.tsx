import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Maru_Gothic, Yusei_Magic } from "next/font/google";
import { validateEnv } from "@/lib/env";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
});

const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-zen-maru-gothic",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
});

const yuseiMagic = Yusei_Magic({
  variable: "--font-yusei-magic",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "星ヶ丘こどもクラブ",
  description: "子どもたちの笑顔あふれる放課後を — 学童保育管理システム",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  validateEnv();

  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${zenMaruGothic.variable} ${yuseiMagic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
