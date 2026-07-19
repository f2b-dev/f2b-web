"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Cloud,
  Home,
  LayoutDashboard,
  Plus,
  User,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from "@f2b/ui";
import type { ConsolePlugin, NavSection } from "./types";
import { mergePluginNav, titleFromPlugins } from "./registry";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/console") return pathname === "/console";
  return pathname === href || pathname.startsWith(href + "/");
}

const BASE_NAV: NavSection[] = [
  {
    group: "总览",
    items: [
      {
        href: "/console",
        label: "概览",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    group: "帮助",
    items: [
      { href: "/docs", label: "文档", icon: BookOpen },
      { href: "/", label: "返回官网", icon: Home },
    ],
  },
];

export type ConsoleShellProps = {
  children: React.ReactNode;
  /** 已注册产品插件（导航 / 标题） */
  plugins?: ConsolePlugin[];
  /** 顶栏状态徽章文案 */
  statusBadge?: string;
  /** 顶栏主 CTA */
  primaryAction?: { href: string; label: string };
};

export function ConsoleShell({
  children,
  plugins = [],
  statusBadge = "mock · 数据面未连接",
  primaryAction = { href: "/console/sandboxes/new", label: "创建沙箱" },
}: ConsoleShellProps) {
  const pathname = usePathname();
  const productNav = mergePluginNav(plugins);
  // 总览 → 产品插件 → 帮助
  const nav: NavSection[] = [
    ...BASE_NAV.filter((s) => s.group === "总览"),
    ...productNav,
    ...BASE_NAV.filter((s) => s.group === "帮助"),
  ];
  const pageTitle = titleFromPlugins(plugins, pathname, "概览");
  const productLabel =
    plugins.find((p) => p.productLabel)?.productLabel ?? "AI 沙箱";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-slate-800 bg-[#001529] px-4">
        <div className="flex items-center gap-4">
          <Link href="/console" className="flex items-center gap-2 text-white">
            <span className="grid h-7 w-7 place-items-center rounded bg-gradient-to-br from-[#ff6b40] to-[#ff5c33] text-xs font-bold">
              灵
            </span>
            <span className="text-[15px] font-semibold">灵境云</span>
            <span className="text-[13px] text-white/55">控制台</span>
          </Link>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-1.5 text-[13px] text-white/85">
            <Cloud className="h-4 w-4" />
            {productLabel}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="border-white/15 bg-orange-500/15 text-orange-200 hover:bg-orange-500/15">
            {statusBadge}
          </Badge>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-white/75 hover:bg-white/10 hover:text-white"
          >
            <Link href="/docs">
              <CircleHelp className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/75 hover:bg-white/10 hover:text-white"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button asChild size="sm" className="h-7">
            <Link href={primaryAction.href}>
              <Plus className="h-3.5 w-3.5" />
              {primaryAction.label}
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded px-1.5 py-1 text-white/85 hover:bg-white/10">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px]">demo@lingjing</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>账号信息</DropdownMenuItem>
              <DropdownMenuItem>项目管理</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3rem)]">
        <aside className="sticky top-12 h-[calc(100vh-3rem)] w-[208px] shrink-0 overflow-y-auto border-r border-border bg-white">
          <div className="px-4 pb-2 pt-3 text-xs text-muted-foreground">
            当前项目 ·{" "}
            <span className="font-semibold text-foreground">default</span>
          </div>
          <nav className="px-2 pb-6">
            {nav.map((section) => (
              <div key={section.group} className="mb-3">
                <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {section.group}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                          active
                            ? "bg-brand/10 font-medium text-brand"
                            : "text-foreground/80 hover:bg-muted",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="px-5 pt-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link href="/console" className="hover:text-brand">
                控制台
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span>default 项目</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{pageTitle}</span>
            </div>
          </div>
          <main className="px-5 pb-8 pt-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
