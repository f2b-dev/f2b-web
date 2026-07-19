/** 浏览器 → 同源 BFF /api/keys（明文 secret 仅创建响应） */

export type ApiKeyMeta = {
  id: string;
  name: string;
  keyPrefix: string;
  projectId: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
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

export async function listKeys(): Promise<ApiKeyMeta[]> {
  const data = await parse<{ keys: ApiKeyMeta[] }>(
    await fetch("/api/keys", { cache: "no-store" }),
  );
  return data.keys ?? [];
}

export async function createKey(name: string): Promise<{
  key: ApiKeyMeta;
  secret: string;
}> {
  return parse(
    await fetch("/api/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  );
}

export async function revokeKey(id: string): Promise<ApiKeyMeta> {
  const data = await parse<{ key: ApiKeyMeta }>(
    await fetch(`/api/keys/${encodeURIComponent(id)}`, { method: "DELETE" }),
  );
  return data.key;
}
