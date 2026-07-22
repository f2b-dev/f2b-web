# @f2b/plugin-sandbox

向 `@f2b/console-shell` 注册 **AI 沙箱** 侧栏导航与页眉标题；并维护 **BFF 路由清单**（`sandboxBffRoutes`）。

## 当前边界

| 能力 | 位置 |
|------|------|
| 导航 / 标题 | 本包 `sandboxPlugin` |
| BFF 路径契约 | 本包 `sandboxBffRoutes`（`src/bff-map.ts`） |
| 页面路由 | `apps/web/src/app/console/sandboxes/*` 等 |
| BFF 实现 | `apps/web/src/app/api/**` → `@f2b/bff-core` |

**V1 不做**：把 Next `page.tsx` / `route.ts` 迁入插件包；不做远程动态加载。

## 如何新增产品插件

1. 在 `plugins/<name>` 导出 `ConsolePlugin`（`id` / `nav` / 可选 `titleFor` / `productLabel`）。
2. 在 `apps/web/src/plugins/registry.ts` 的 `consolePlugins` 数组 **append**。
3. 页面与 BFF 仍先放在 `apps/web`。
4. 浏览器侧只打同源 `/api/*`，禁止管理密钥进 client。

```ts
import type { ConsolePlugin } from "@f2b/console-shell";
import { Box } from "lucide-react";

export const myPlugin: ConsolePlugin = {
  id: "my-product",
  nav: [
    {
      group: "产品与服务",
      items: [{ href: "/console/my", label: "我的产品", icon: Box }],
    },
  ],
};
```

## 如何新增 BFF 路由（沙箱上游）

以「沙箱详情 PATCH 延期」同类操作为例：

### 1. 上游已有契约

确认 `f2b-sandbox` `/v1/...` 与 `f2b-spec` 已支持；本地可对 sandbox 直连冒烟。

### 2. 写 Next Route Handler

路径：`apps/web/src/app/api/<资源>/route.ts`（动态段用 `[id]` 目录）。

```ts
// apps/web/src/app/api/sandboxes/[id]/example/route.ts
import { proxyToSandbox } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.text();
  return proxyToSandbox(
    `/v1/sandboxes/${encodeURIComponent(id)}/example`,
    { method: "POST", body: body || "{}" },
  );
}
```

| 场景 | 使用 |
|------|------|
| JSON 缓冲代理 | `proxyToSandbox(path, init)` |
| 命令 SSE | `proxySseToSandbox(path, init)` |
| 隧道服务 | `proxyToTunnel(path, init)`（`F2B_TUNNEL_URL`） |
| API Key 管理 | `proxyToSandbox(..., { admin: true })` |

### 3. 登记清单

在 `plugins/sandbox/src/bff-map.ts` 的 `sandboxBffRoutes` **追加一行**（`bff` / `methods` / `upstream` / `via`）。

### 4. 校验

```bash
pnpm check:bff-map   # 清单 ↔ apps/web route.ts 双向对齐
bash scripts/ci-guards.sh
# 有联调环境时
F2B_WEB_URL=http://127.0.0.1:13200 pnpm e2e:bff
```

### 5. 文档

更新 f2b-docs `architecture/bff` 路由表（与清单一致）。

## 环境变量（仅 web 服务端）

| 变量 | 用途 |
|------|------|
| `F2B_SANDBOX_URL` | sandbox 上游 |
| `F2B_SANDBOX_API_KEY` | `auth=api_key` 时 BFF 注入 |
| `F2B_SANDBOX_ADMIN_TOKEN` / `F2B_ADMIN_TOKEN` | `/api/keys*` |
| `F2B_TUNNEL_URL` | 隧道上游 |

浏览器与 `packages/ui` / `console-shell` **禁止**持有上述密钥或 `CUBE_*`。
