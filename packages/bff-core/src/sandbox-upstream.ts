/**
 * BFF → f2b-sandbox 上游客户端（仅服务端）。
 * 浏览器永不直连数据面管理地址与密钥。
 */

const DEFAULT_URL = "http://127.0.0.1:8787";

export function sandboxBaseUrl(): string {
  return (
    process.env.F2B_SANDBOX_URL?.replace(/\/$/, "") ||
    process.env.SANDBOX_URL?.replace(/\/$/, "") ||
    DEFAULT_URL
  );
}

function upstreamUrl(path: string): string {
  return `${sandboxBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
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

/** 整包 JSON 代理（缓冲 body） */
export async function proxyToSandbox(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(upstreamUrl(path), {
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: "no-store",
    });
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
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(upstreamUrl(path), {
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        accept: "text/event-stream",
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: "no-store",
    });
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
