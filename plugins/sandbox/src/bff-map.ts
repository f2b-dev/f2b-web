/**
 * 沙箱产品 BFF 路由清单（文档与校验用）。
 * 实际 Next Route Handlers 仍在 apps/web/src/app/api/**；
 * 本表描述「浏览器路径 → 上游」契约，便于新增路由时对齐。
 */

export type BffRouteEntry = {
  /** 同源 BFF 路径（Next app router，含动态段写法） */
  bff: string;
  /** HTTP 方法 */
  methods: readonly string[];
  /** 上游路径模板（f2b-sandbox 或 f2b-tunnel） */
  upstream: string;
  /** 代理实现 */
  via: "proxyToSandbox" | "proxySseToSandbox" | "proxyToTunnel";
  /** 是否注入 admin token（仅密钥管理） */
  admin?: boolean;
  note?: string;
};

/** AI 沙箱相关 BFF（含密钥/模板/用量；隧道独立 upstream） */
export const sandboxBffRoutes: readonly BffRouteEntry[] = [
  {
    bff: "/api/sandboxes",
    methods: ["GET", "POST"],
    upstream: "/v1/sandboxes",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/sandboxes/[id]",
    methods: ["GET", "PATCH", "DELETE"],
    upstream: "/v1/sandboxes/{id}",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/sandboxes/[id]/pause",
    methods: ["POST"],
    upstream: "/v1/sandboxes/{id}/pause",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/sandboxes/[id]/resume",
    methods: ["POST"],
    upstream: "/v1/sandboxes/{id}/resume",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/sandboxes/[id]/commands",
    methods: ["POST"],
    upstream: "/v1/sandboxes/{id}/commands",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/sandboxes/[id]/commands/stream",
    methods: ["POST"],
    upstream: "/v1/sandboxes/{id}/commands/stream",
    via: "proxySseToSandbox",
    note: "SSE 透传，不缓冲 body",
  },
  {
    bff: "/api/sandboxes/[id]/files",
    methods: ["GET", "POST", "DELETE"],
    upstream: "/v1/sandboxes/{id}/files",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/sandboxes/[id]/files/mkdir",
    methods: ["POST"],
    upstream: "/v1/sandboxes/{id}/files/mkdir",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/sandboxes/[id]/files/rename",
    methods: ["POST"],
    upstream: "/v1/sandboxes/{id}/files/rename",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/templates",
    methods: ["GET"],
    upstream: "/v1/templates",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/usage",
    methods: ["GET"],
    upstream: "/v1/usage",
    via: "proxyToSandbox",
  },
  {
    bff: "/api/keys",
    methods: ["GET", "POST"],
    upstream: "/v1/api-keys",
    via: "proxyToSandbox",
    admin: true,
  },
  {
    bff: "/api/keys/[id]",
    methods: ["DELETE"],
    upstream: "/v1/api-keys/{id}",
    via: "proxyToSandbox",
    admin: true,
  },
  {
    bff: "/api/tunnels",
    methods: ["GET", "POST"],
    upstream: "/v1/tunnels",
    via: "proxyToTunnel",
    note: "上游为 f2b-tunnel，非 sandbox",
  },
  {
    bff: "/api/tunnels/[id]",
    methods: ["GET", "DELETE"],
    upstream: "/v1/tunnels/{id}",
    via: "proxyToTunnel",
  },
] as const;
