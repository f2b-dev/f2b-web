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

export async function proxyToSandbox(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${sandboxBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: "no-store",
    });
  } catch (err) {
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

  // 透传状态与 body
  const buf = await res.arrayBuffer();
  const headers = new Headers();
  const ct = res.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  return new Response(buf, { status: res.status, headers });
}
