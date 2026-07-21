import { proxyToTunnel } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToTunnel(`/v1/tunnels/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToTunnel(`/v1/tunnels/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
