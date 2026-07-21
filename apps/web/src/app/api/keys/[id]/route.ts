import { proxyToSandbox } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToSandbox(
    `/v1/api-keys/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    { admin: true },
  );
}
