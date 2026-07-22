import { ConsoleAppShell } from "@/components/console-app-shell";
import { proxyToSandbox } from "@f2b/bff-core";

export const dynamic = "force-dynamic";

async function loadBackendKind(): Promise<string> {
  try {
    const res = await proxyToSandbox("/healthz", { method: "GET" });
    if (!res.ok) return "unreachable";
    const data = (await res.json()) as { backend?: string };
    return data.backend?.trim() || "unknown";
  } catch {
    return "unreachable";
  }
}

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const backend = await loadBackendKind();
  return <ConsoleAppShell backend={backend}>{children}</ConsoleAppShell>;
}
