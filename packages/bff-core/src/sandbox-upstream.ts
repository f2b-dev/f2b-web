/**
 * BFF → f2b-sandbox 上游客户端（仅服务端）。
 * 浏览器永不直连数据面管理地址与密钥。
 */

const DEFAULT_URL = "http://127.0.0.1:13287";

export function sandboxBaseUrl(): string {
  return (
    process.env.F2B_SANDBOX_URL?.replace(/\/$/, "") ||
    process.env.SANDBOX_URL?.replace(/\/$/, "") ||
    DEFAULT_URL
  );
}

/**
 * 产品 API 上游密钥（auth=api_key 时 BFF 注入）。
 * 优先级：F2B_SANDBOX_API_KEY → F2B_BFF_API_KEY
 */
export function sandboxApiKey(): string | undefined {
  return (
    process.env.F2B_SANDBOX_API_KEY?.trim() ||
    process.env.F2B_BFF_API_KEY?.trim() ||
    undefined
  );
}

/**
 * 管理端点令牌（创建/列表/吊销 API Key）。
 * 优先级：F2B_SANDBOX_ADMIN_TOKEN → F2B_ADMIN_TOKEN
 */
export function sandboxAdminToken(): string | undefined {
  return (
    process.env.F2B_SANDBOX_ADMIN_TOKEN?.trim() ||
    process.env.F2B_ADMIN_TOKEN?.trim() ||
    undefined
  );
}

function upstreamUrl(path: string): string {
  return `${sandboxBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 合并调用方 headers，并注入服务端上游凭证（不覆盖已有同名头） */
export function withUpstreamAuth(
  init?: HeadersInit,
  opts?: { admin?: boolean },
): Headers {
  const h = new Headers(init);
  if (opts?.admin) {
    const admin = sandboxAdminToken();
    if (admin && !h.has("x-f2b-admin-token")) {
      h.set("x-f2b-admin-token", admin);
    }
  }
  const key = sandboxApiKey();
  if (key && !h.has("authorization") && !h.has("x-api-key")) {
    h.set("authorization", `Bearer ${key}`);
  }
  return h;
}

function unavailableResponse(err: unknown): Response {
  const message =
    err instanceof Error ? err.message : "sandbox upstream unreachable";
  return new Response(
    JSON.stringify({
      error: {
        code: "BACKEND_UNAVAILABLE",
        message: `f2b-sandbox unreachable: ${message}`,
        details: { url: sandboxBaseUrl() },
      },
    }),
    { status: 503, headers: { "content-type": "application/json" } },
  );
}

function mergeInit(init?: RequestInit, opts?: { admin?: boolean }): RequestInit {
  const headers = withUpstreamAuth(
    {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
    opts,
  );
  return { ...init, headers, cache: "no-store" };
}

/** 整包 JSON 代理（缓冲 body） */
export async function proxyToSandbox(
  path: string,
  init?: RequestInit,
  opts?: { admin?: boolean },
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(upstreamUrl(path), mergeInit(init, opts));
  } catch (err) {
    return unavailableResponse(err);
  }

  const buf = await res.arrayBuffer();
  const headers = new Headers();
  const ct = res.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  return new Response(buf, { status: res.status, headers });
}

/**
 * SSE 透传：不缓冲 body，把上游 ReadableStream 原样交给浏览器。
 * 用于 `POST .../commands/stream`。
 */
export async function proxySseToSandbox(
  path: string,
  init?: RequestInit,
  opts?: { admin?: boolean },
): Promise<Response> {
  let res: Response;
  try {
    const merged = mergeInit(init, opts);
    const headers = new Headers(merged.headers);
    if (!headers.has("accept")) headers.set("accept", "text/event-stream");
    res = await fetch(upstreamUrl(path), { ...merged, headers });
  } catch (err) {
    return unavailableResponse(err);
  }

  // 上游错误（JSON）仍整包返回
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok || !ct.includes("text/event-stream") || !res.body) {
    const buf = await res.arrayBuffer();
    const headers = new Headers();
    if (ct) headers.set("content-type", ct);
    return new Response(buf, { status: res.status, headers });
  }

  const headers = new Headers({
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
  });
  return new Response(res.body, { status: res.status, headers });
}
