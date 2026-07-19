import { proxyToSandbox } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 管理令牌仅服务端；浏览器只打同源 /api/keys */
function adminHeaders(init?: HeadersInit): Headers {
  const h = new Headers(init);
  const token =
    process.env.F2B_SANDBOX_ADMIN_TOKEN?.trim() ||
    process.env.F2B_ADMIN_TOKEN?.trim();
  if (token) h.set("x-f2b-admin-token", token);
  return h;
}

export async function GET(req: Request) {
  const q = new URL(req.url).search;
  return proxyToSandbox(`/v1/api-keys${q}`, {
    method: "GET",
    headers: adminHeaders(),
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxyToSandbox("/v1/api-keys", {
    method: "POST",
    headers: adminHeaders({ "content-type": "application/json" }),
    body: body || "{}",
  });
}
