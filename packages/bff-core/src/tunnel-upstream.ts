/**
 * BFF → f2b-tunnel 上游客户端（仅服务端）。
 * 浏览器只走 /api/tunnels*；预览 URL 仍指向 tunnel 的 publicBase（/t/{id}/）。
 */

const DEFAULT_URL = "http://127.0.0.1:8790";

export function tunnelBaseUrl(): string {
  return (
    process.env.F2B_TUNNEL_URL?.replace(/\/$/, "") ||
    process.env.TUNNEL_URL?.replace(/\/$/, "") ||
    DEFAULT_URL
  );
}

function upstreamUrl(path: string): string {
  return `${tunnelBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function unavailableResponse(err: unknown): Response {
  const message =
    err instanceof Error ? err.message : "tunnel upstream unreachable";
  return new Response(
    JSON.stringify({
      error: {
        code: "BACKEND_UNAVAILABLE",
        message: `f2b-tunnel unreachable: ${message}`,
        details: { url: tunnelBaseUrl() },
      },
    }),
    { status: 503, headers: { "content-type": "application/json" } },
  );
}

/** 整包 JSON 代理到 f2b-tunnel */
export async function proxyToTunnel(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  let res: Response;
  try {
    res = await fetch(upstreamUrl(path), {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (err) {
    return unavailableResponse(err);
  }

  const buf = await res.arrayBuffer();
  const out = new Headers();
  const ct = res.headers.get("content-type");
  if (ct) out.set("content-type", ct);
  return new Response(buf, { status: res.status, headers: out });
}
