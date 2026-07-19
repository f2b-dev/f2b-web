import { proxyToSandbox } from "@f2b/bff-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function adminHeaders(): Headers {
  const h = new Headers();
  const token =
    process.env.F2B_SANDBOX_ADMIN_TOKEN?.trim() ||
    process.env.F2B_ADMIN_TOKEN?.trim();
  if (token) h.set("x-f2b-admin-token", token);
  return h;
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToSandbox(`/v1/api-keys/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
}
