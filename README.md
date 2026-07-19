# f2b-web

灵境云 **官网 + 控制台壳 + BFF + 产品插件**。

## 目标目录（规划）

```text
f2b-web/
  apps/web/                 # Next App
  packages/
    console-shell/          # 顶栏、侧栏、插件注册表
    ui/                     # 设计系统
    bff-core/               # 会话、上游 client
  plugins/
    sandbox/                # 沙箱产品插件 → 代理 f2b-sandbox
    keys/
    usage/
```

实现将从现有 Nova `apps/web` 迁出。当前为空仓骨架。

- 沙箱 API：https://github.com/f2b-dev/f2b-sandbox
- 契约：https://github.com/f2b-dev/f2b-spec
