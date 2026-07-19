# @f2b/plugin-sandbox

向 `@f2b/console-shell` 注册 **AI 沙箱** 侧栏导航与页眉标题。

## 当前边界

| 能力 | 位置 |
|------|------|
| 导航 / 标题 | 本包 `sandboxPlugin` |
| 页面路由 | `apps/web/src/app/console/sandboxes/*` 等 |
| BFF | `apps/web/src/app/api/sandboxes/*` → `@f2b/bff-core` |

## 如何新增产品插件

1. 在 `plugins/<name>` 导出 `ConsolePlugin`（`id` / `nav` / 可选 `titleFor`）。
2. 在 `apps/web/src/plugins/registry.ts` 的 `consolePlugins` 数组追加。
3. 页面与 BFF 仍可先放在 `apps/web`，稳定后再迁入插件包。

```ts
import type { ConsolePlugin } from "@f2b/console-shell";

export const myPlugin: ConsolePlugin = {
  id: "my-product",
  nav: [{ group: "产品与服务", items: [{ href: "/console/my", label: "我的产品", icon: Box }] }],
};
```
