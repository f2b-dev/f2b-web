import type { ConsolePlugin, NavSection } from "./types";

/** 合并插件导航：同 group 合并 items，保持首次出现的分组顺序 */
export function mergePluginNav(plugins: ConsolePlugin[]): NavSection[] {
  const order: string[] = [];
  const map = new Map<string, NavSection["items"]>();

  for (const plugin of plugins) {
    for (const section of plugin.nav) {
      if (!map.has(section.group)) {
        order.push(section.group);
        map.set(section.group, []);
      }
      map.get(section.group)!.push(...section.items);
    }
  }

  return order.map((group) => ({
    group,
    items: map.get(group)!,
  }));
}

export function titleFromPlugins(
  plugins: ConsolePlugin[],
  pathname: string,
  fallback = "概览",
): string {
  for (const p of plugins) {
    const t = p.titleFor?.(pathname);
    if (t) return t;
  }
  return fallback;
}
