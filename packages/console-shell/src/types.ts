import type { ComponentType, ReactNode } from "react";

/** 侧栏导航项（插件声明，壳负责渲染） */
export type NavItem = {
  href: string;
  label: string;
  /** lucide 等图标组件 */
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

export type NavSection = {
  group: string;
  items: NavItem[];
};

/** 控制台产品插件契约（V1：导航 + 标题映射） */
export type ConsolePlugin = {
  id: string;
  /** 侧栏分组；同 group 名按注册顺序合并 items */
  nav: NavSection[];
  /** 根据 pathname 返回页眉标题；返回 null 表示不处理 */
  titleFor?: (pathname: string) => string | null;
  /** 顶栏产品名覆盖（可选） */
  productLabel?: string;
};
