# f2b-web

灵境云 **官网 + 控制台 + BFF**（仓内 monorepo + 产品插件）。

## 结构

```text
apps/web/                 # Next.js：路由、营销页、BFF route handlers
packages/
  ui/                     # @f2b/ui 设计系统组件
  console-shell/          # @f2b/console-shell 顶栏/侧栏 + 插件合并
  bff-core/               # @f2b/bff-core 上游 proxy（仅服务端）
plugins/
  sandbox/                # @f2b/plugin-sandbox 导航注册
```

插件挂载：`apps/web/src/plugins/registry.ts` → `ConsoleShell plugins={consolePlugins}`。

## 本地开发

需先启动 [f2b-sandbox](https://github.com/f2b-dev/f2b-sandbox)，或用 [f2b-infra](https://github.com/f2b-dev/f2b-infra) compose / `dev-host.sh`。

```bash
# terminal 1
cd ../f2b-sandbox && F2B_SANDBOX_BACKEND=fake pnpm dev

# terminal 2
cd ../f2b-web
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm dev
```

http://localhost:3000 — 沙箱列表/创建/终端走 BFF → sandbox。

## 新增产品插件

见 [plugins/sandbox/README.md](./plugins/sandbox/README.md)。

## 硬约束

- 浏览器不持有数据面管理密钥
- UI：Tailwind v4 + shadcn 风格 + lucide；无 antd
- 对外文案不写腾讯 / CubeSandbox

Apache-2.0
