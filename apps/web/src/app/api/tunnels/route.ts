import { proxyToTunnel } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.toString();
  return proxyToTunnel(`/v1/tunnels${q ? `?${q}` : ""}`, { method: "GET" });
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxyToTunnel("/v1/tunnels", {
    method: "POST",
    body: body || undefined,
  });
}
