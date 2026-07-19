/** 浏览器侧调用同源 BFF /api/sandboxes */

export type ApiSandbox = {
  id: string;
  name: string;
  template: string;
  status: string;
  projectId: string;
  backend: string;
  remoteId: string | null;
  allowInternetAccess: boolean;
  timeoutMs: number | null;
  region: string;
  cpu: string;
  memory: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationSec: number;
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

export async function listSandboxes(): Promise<ApiSandbox[]> {
  const data = await parse<{ sandboxes: ApiSandbox[] }>(
    await fetch("/api/sandboxes", { cache: "no-store" }),
  );
  return data.sandboxes ?? [];
}

export async function getSandbox(id: string): Promise<ApiSandbox> {
  const data = await parse<{ sandbox: ApiSandbox }>(
    await fetch(`/api/sandboxes/${encodeURIComponent(id)}`, {
      cache: "no-store",
    }),
  );
  return data.sandbox;
}

export async function createSandbox(body: {
  name?: string;
  template?: string;
  timeoutMs?: number;
  allowInternetAccess?: boolean;
  projectId?: string;
}): Promise<ApiSandbox> {
  const data = await parse<{ sandbox: ApiSandbox }>(
    await fetch("/api/sandboxes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return data.sandbox;
}

export async function killSandbox(id: string): Promise<ApiSandbox> {
  const data = await parse<{ sandbox: ApiSandbox }>(
    await fetch(`/api/sandboxes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
  return data.sandbox;
}

export async function runCommand(
  id: string,
  cmd: string,
): Promise<{ exitCode: number; stdout: string; stderr: string; durationMs: number }> {
  const data = await parse<{
    result: {
      exitCode: number;
      stdout: string;
      stderr: string;
      durationMs: number;
    };
  }>(
    await fetch(`/api/sandboxes/${encodeURIComponent(id)}/commands`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cmd }),
    }),
  );
  return data.result;
}

export async function listFiles(id: string, path = "/home/user") {
  const q = new URLSearchParams({ list: "1", path });
  const data = await parse<{
    entries: { path: string; name: string; type: string; size?: number }[];
  }>(
    await fetch(
      `/api/sandboxes/${encodeURIComponent(id)}/files?${q.toString()}`,
      { cache: "no-store" },
    ),
  );
  return data.entries ?? [];
}

export function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
