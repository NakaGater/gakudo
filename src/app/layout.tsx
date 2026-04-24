import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Maru_Gothic, Yusei_Magic } from "next/font/google";
import { validateEnv } from "@/lib/env";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-zen-maru-gothic",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

const yuseiMagic = Yusei_Magic({
  variable: "--font-yusei-magic",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "星ヶ丘こどもクラブ",
  description: "子どもたちの笑顔あふれる放課後を — 学童保育管理システム",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "星ヶ丘学童",
  },
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
      <head>
        <link rel="apple-touch-startup-image" href="/splash-1320x2868.png" media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1206x2622.png" media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1170x2532.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-1080x1920.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
