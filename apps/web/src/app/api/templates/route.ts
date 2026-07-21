import { proxyToSandbox } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return proxyToSandbox("/v1/templates", { method: "GET" });
}
