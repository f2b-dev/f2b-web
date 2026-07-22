"use client";

import { ConsoleShell } from "@f2b/console-shell";
import { consolePlugins } from "@/plugins/registry";

export function ConsoleAppShell({
  children,
  backend = "unknown",
}: {
  children: React.ReactNode;
  /** 来自 healthz.backend；勿写死为已连真集群 */
  backend?: string;
}) {
  const kind = backend.trim() || "unknown";
  const badge =
    kind === "unreachable"
      ? "sandbox 不可达 · BFF"
      : `${kind} · BFF → sandbox`;

  return (
    <ConsoleShell plugins={consolePlugins} statusBadge={badge}>
      {children}
    </ConsoleShell>
  );
}
