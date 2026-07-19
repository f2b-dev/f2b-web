import { proxyToSandbox } from "@/lib/sandbox-upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).search;
  return proxyToSandbox(`/v1/sandboxes${q}`, { method: "GET" });
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxyToSandbox("/v1/sandboxes", {
    method: "POST",
    body: body || "{}",
  });
}
