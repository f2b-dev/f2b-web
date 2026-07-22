import { proxyToSandbox } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.text();
  return proxyToSandbox(
    `/v1/sandboxes/${encodeURIComponent(id)}/files/mkdir`,
    { method: "POST", body: body || "{}" },
  );
}
