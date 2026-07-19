"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Box,
  ChartColumn,
  ChevronRight,
  CircleHelp,
  Cloud,
  Home,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Plus,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "总览",
    items: [{ href: "/console", label: "概览", icon: LayoutDashboard, exact: true }],
  },
  {
    group: "产品与服务",
    items: [
      { href: "/console/sandboxes", label: "AI 沙箱", icon: Box },
      { href: "/console/templates", label: "模板", icon: LayoutTemplate },
      { href: "/console/keys", label: "API 密钥", icon: KeyRound },
      { href: "/console/usage", label: "用量", icon: ChartColumn },
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

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/console") return pathname === "/console";
  return pathname === href || pathname.startsWith(href + "/");
}

function titleFor(pathname: string) {
  if (pathname.startsWith("/console/sandboxes/new")) return "创建沙箱";
  if (pathname.startsWith("/console/sandboxes/")) return "沙箱详情";
  if (pathname.startsWith("/console/sandboxes")) return "AI 沙箱";
  if (pathname.startsWith("/console/templates")) return "模板";
  if (pathname.startsWith("/console/keys")) return "API 密钥";
  if (pathname.startsWith("/console/usage")) return "用量";
  return "概览";
}

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Aliyun-style dark top bar */}
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
            AI 沙箱
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="border-white/15 bg-orange-500/15 text-orange-200 hover:bg-orange-500/15">
            mock · Cube 未连接
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
            <Link href="/console/sandboxes/new">
              <Plus className="h-3.5 w-3.5" />
              创建沙箱
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
              <DropdownMenuItem className="text-red-600">退出登录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3rem)]">
        {/* Light sider */}
        <aside className="sticky top-12 h-[calc(100vh-3rem)] w-[208px] shrink-0 overflow-y-auto border-r border-border bg-white">
          <div className="px-4 pb-2 pt-3 text-xs text-muted-foreground">
            当前项目 · <span className="font-semibold text-foreground">default</span>
          </div>
          <nav className="px-2 pb-6">
            {NAV.map((section) => (
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
              <span className="text-foreground">{titleFor(pathname)}</span>
            </div>
          </div>
          <main className="px-5 pb-8 pt-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
