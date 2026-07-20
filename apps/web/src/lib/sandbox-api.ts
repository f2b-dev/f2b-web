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

export type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export type CommandStreamEvent =
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "result"; result: CommandResult }
  | { type: "error"; code: string; message: string };

export async function runCommand(
  id: string,
  cmd: string,
): Promise<CommandResult> {
  const data = await parse<{ result: CommandResult }>(
    await fetch(`/api/sandboxes/${encodeURIComponent(id)}/commands`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cmd }),
    }),
  );
  return data.result;
}

/**
 * 经 BFF 的 SSE 流式命令。
 * onEvent 在每个 stdout/stderr/result 到达时回调；最终 resolve result。
 */
export async function runCommandStream(
  id: string,
  cmd: string,
  onEvent?: (ev: CommandStreamEvent) => void,
): Promise<CommandResult> {
  const res = await fetch(
    `/api/sandboxes/${encodeURIComponent(id)}/commands/stream`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
      },
      body: JSON.stringify({ cmd }),
    },
  );

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    const msg =
      (data as { error?: { message?: string } })?.error?.message ||
      res.statusText;
    throw new Error(msg);
  }

  const ctype = res.headers.get("content-type") ?? "";
  if (!ctype.includes("text/event-stream")) {
    // 兼容上游降级为 JSON
    const data = (await res.json()) as {
      result?: CommandResult;
      error?: { message?: string };
    };
    if (data.result) return data.result;
    throw new Error(data.error?.message || "expected event-stream");
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let result: CommandResult | null = null;
  let stdout = "";
  let stderr = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const block of parts) {
      const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      const payload = dataLine.slice(6);
      if (payload === "{}") continue;
      let ev: CommandStreamEvent;
      try {
        ev = JSON.parse(payload) as CommandStreamEvent;
      } catch {
        continue;
      }
      if (ev.type === "stdout") stdout += ev.text ?? "";
      if (ev.type === "stderr") stderr += ev.text ?? "";
      if (ev.type === "result") result = ev.result;
      if (ev.type === "error") {
        throw new Error(ev.message || ev.code || "stream error");
      }
      onEvent?.(ev);
    }
  }

  if (!result) {
    result = {
      exitCode: 0,
      stdout,
      stderr,
      durationMs: 0,
    };
  }
  return result;
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
