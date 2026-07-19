import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "灵境云 F2B-Navo — AI Agent 安全执行云",
    template: "%s · 灵境云",
  },
  description:
    "灵境云（F2B-Navo）提供自研 AI 沙箱云服务：用完即焚的隔离执行环境，跑代码、敲命令、读写文件。开发者友好 API，云厂商级控制台体验。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
