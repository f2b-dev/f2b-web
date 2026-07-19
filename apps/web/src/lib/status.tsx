import { Badge } from "@/components/ui/badge";
import { cn } from "./utils";

export type SandboxStatus =
  | "provisioning"
  | "running"
  | "paused"
  | "succeeded"
  | "failed"
  | "killed"
  | string;

const STATUS_META: Record<string, { label: string; className: string }> = {
  running: {
    label: "运行中",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  provisioning: {
    label: "创建中",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  paused: {
    label: "已暂停",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  succeeded: {
    label: "已完成",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
  failed: {
    label: "失败",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  killed: {
    label: "已销毁",
    className: "border-slate-200 bg-slate-50 text-slate-500",
  },
};

export function SandboxStatusTag({
  status,
  className,
}: {
  status: SandboxStatus;
  className?: string;
}) {
  const m = STATUS_META[status] ?? {
    label: status,
    className: "border-slate-200 bg-slate-50 text-slate-600",
  };
  return (
    <Badge variant="outline" className={cn(m.className, className)}>
      {m.label}
    </Badge>
  );
}
