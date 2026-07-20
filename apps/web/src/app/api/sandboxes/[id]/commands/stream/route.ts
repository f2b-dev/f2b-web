import { proxySseToSandbox } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** 同源 SSE：/api/sandboxes/:id/commands/stream → sandbox /v1/.../commands/stream */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.text();
  return proxySseToSandbox(
    `/v1/sandboxes/${encodeURIComponent(id)}/commands/stream`,
    { method: "POST", body: body || "{}" },
  );
}
