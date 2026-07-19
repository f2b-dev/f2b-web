import { ConsoleAppShell } from "@/components/console-app-shell";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleAppShell>{children}</ConsoleAppShell>;
}
