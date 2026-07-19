import { Box, ChartColumn, KeyRound, LayoutTemplate } from "lucide-react";
import type { ConsolePlugin } from "@f2b/console-shell";

/** 沙箱产品控制台插件：导航 + 面包屑标题 */
export const sandboxPlugin: ConsolePlugin = {
  id: "sandbox",
  productLabel: "AI 沙箱",
  nav: [
    {
      group: "产品与服务",
      items: [
        { href: "/console/sandboxes", label: "AI 沙箱", icon: Box },
        { href: "/console/templates", label: "模板", icon: LayoutTemplate },
        { href: "/console/keys", label: "API 密钥", icon: KeyRound },
        { href: "/console/usage", label: "用量", icon: ChartColumn },
      ],
    },
  ],
  titleFor(pathname) {
    if (pathname.startsWith("/console/sandboxes/new")) return "创建沙箱";
    if (pathname.startsWith("/console/sandboxes/")) return "沙箱详情";
    if (pathname.startsWith("/console/sandboxes")) return "AI 沙箱";
    if (pathname.startsWith("/console/templates")) return "模板";
    if (pathname.startsWith("/console/keys")) return "API 密钥";
    if (pathname.startsWith("/console/usage")) return "用量";
    return null;
  },
};
