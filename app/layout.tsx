import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "青时 · 专注学习助手",
  description: "轻量、清新的番茄专注计时与学习复盘工具",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "青时 · 专注学习助手",
    description: "把注意力，留给重要的事。",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "青时专注学习助手" }],
  },
  twitter: { card: "summary_large_image", title: "青时 · 专注学习助手", description: "把注意力，留给重要的事。", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
