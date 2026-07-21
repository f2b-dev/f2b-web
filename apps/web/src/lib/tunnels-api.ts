/** 浏览器侧调用同源 BFF /api/tunnels → f2b-tunnel */

export type ApiTunnel = {
  id: string;
  name: string;
  sandboxId: string;
  port: number;
  projectId: string;
  status: string;
  publicUrl: string;
  targetUrl: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  closedAt: string | null;
};

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as { error?: { message?: string } })?.error?.message ||
      res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export async function listTunnels(sandboxId?: string): Promise<ApiTunnel[]> {
  const q = sandboxId
    ? `?sandboxId=${encodeURIComponent(sandboxId)}`
    : "";
  const data = await parse<{ tunnels: ApiTunnel[] }>(
    await fetch(`/api/tunnels${q}`, { cache: "no-store" }),
  );
  return data.tunnels ?? [];
}

export async function createTunnel(input: {
  sandboxId: string;
  port: number;
  name?: string;
  targetUrl?: string;
  projectId?: string;
  ttlSec?: number;
}): Promise<ApiTunnel> {
  const data = await parse<{ tunnel: ApiTunnel }>(
    await fetch("/api/tunnels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return data.tunnel;
}

export async function closeTunnel(id: string): Promise<ApiTunnel> {
  const data = await parse<{ tunnel: ApiTunnel }>(
    await fetch(`/api/tunnels/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
  return data.tunnel;
}
