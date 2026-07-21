import { proxyToSandbox } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 管理令牌仅服务端；浏览器只打同源 /api/keys */
export async function GET(req: Request) {
  const q = new URL(req.url).search;
  return proxyToSandbox(
    `/v1/api-keys${q}`,
    { method: "GET" },
    { admin: true },
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxyToSandbox(
    "/v1/api-keys",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body || "{}",
    },
    { admin: true },
  );
}
