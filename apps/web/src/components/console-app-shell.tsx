"use client";

import { ConsoleShell } from "@f2b/console-shell";
import { consolePlugins } from "@/plugins/registry";

export function ConsoleAppShell({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell
      plugins={consolePlugins}
      statusBadge="fake · BFF → sandbox"
    >
      {children}
    </ConsoleShell>
  );
}
