import { proxyToSandbox } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToSandbox(`/v1/sandboxes/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.text();
  return proxyToSandbox(`/v1/sandboxes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: body || "{}",
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToSandbox(`/v1/sandboxes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
