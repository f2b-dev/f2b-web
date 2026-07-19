# f2b-web

灵境云 **官网 + 控制台 + BFF**。

## 结构

```text
apps/web/                 # Next.js（当前主实现）
packages/
  bff-core/               # 占位 → 后续抽上游 client
  console-shell/          # 占位 → 后续抽壳与插件注册表
  ui/                     # 占位 → 后续抽设计系统
plugins/
  sandbox/                # 占位说明；沙箱页暂在 apps/web
```

## 本地开发

需先启动 [f2b-sandbox](https://github.com/f2b-dev/f2b-sandbox)：

```bash
# terminal 1
cd ../f2b-sandbox && F2B_SANDBOX_BACKEND=fake pnpm dev

# terminal 2
cd ../f2b-web
cp apps/web/.env.example apps/web/.env.local   # F2B_SANDBOX_URL=http://127.0.0.1:8787
pnpm install
pnpm dev
```

打开 http://localhost:3000 — 控制台沙箱列表/创建/终端走 BFF → sandbox。

## 硬约束

- 浏览器不持有数据面管理密钥
- UI：Tailwind v4 + shadcn 风格 + lucide；无 antd
- 对外文案不写腾讯 / CubeSandbox

Apache-2.0
