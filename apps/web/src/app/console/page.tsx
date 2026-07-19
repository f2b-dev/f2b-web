import Link from "next/link";
import {
  Box,
  ChartColumn,
  Clock3,
  Code2,
  FlaskConical,
  KeyRound,
  Plus,
  Zap,
} from "lucide-react";
import { Button } from "@f2b/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@f2b/ui";
import { Alert, AlertDescription } from "@f2b/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@f2b/ui";
import {
  MOCK_SANDBOXES,
  MOCK_USAGE,
  formatDuration,
} from "@/lib/mock-data";
import { SandboxStatusTag } from "@/lib/status";

export default function ConsoleDashboardPage() {
  const running = MOCK_SANDBOXES.filter((s) => s.status === "running").length;
  const totalHours = MOCK_USAGE.reduce((a, b) => a + b.sandboxHours, 0);
  const commands = MOCK_USAGE.reduce((a, b) => a + b.commands, 0);
  const recent = [...MOCK_SANDBOXES].slice(0, 4);

  const stats = [
    {
      title: "运行中沙箱",
      value: String(running),
      suffix: "实例",
      icon: Zap,
      iconClass: "text-emerald-600",
    },
    {
      title: "近 7 日沙箱时",
      value: totalHours.toFixed(1),
      icon: Clock3,
      iconClass: "text-sky-600",
    },
    {
      title: "近 7 日命令",
      value: String(commands),
      icon: Code2,
      iconClass: "text-violet-600",
    },
    {
      title: "API 密钥",
      value: "2",
      href: "/console/keys",
      icon: KeyRound,
      iconClass: "text-brand",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">概览</h1>
          <p className="text-sm text-muted-foreground">
            项目 default · 区域 cn-hangzhou · mock 数据演示
          </p>
        </div>
        <Button asChild>
          <Link href="/console/sandboxes/new">
            <Plus className="h-4 w-4" />
            创建沙箱
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{s.title}</div>
                <div className="mt-2 flex items-end gap-2">
                  <Icon className={`h-4 w-4 ${s.iconClass}`} />
                  <span className="text-2xl font-semibold tracking-tight">{s.value}</span>
                  {s.suffix && (
                    <span className="pb-0.5 text-xs text-muted-foreground">{s.suffix}</span>
                  )}
                  {s.href && (
                    <Link href={s.href} className="ml-auto pb-0.5 text-xs text-brand hover:underline">
                      管理
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>最近沙箱</CardTitle>
            <Link href="/console/sandboxes" className="text-xs text-brand hover:underline">
              查看全部 →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>模板</TableHead>
                  <TableHead>时长</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link href={`/console/sandboxes/${r.id}`} className="block hover:text-brand">
                        <div className="font-medium">{r.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{r.id}</div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <SandboxStatusTag status={r.status} />
                    </TableCell>
                    <TableCell className="text-sm">{r.template}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDuration(r.durationSec)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>产品入口</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/console/sandboxes"
              className="flex items-start gap-3 rounded-md border border-border p-3 transition hover:border-brand/40 hover:bg-brand/[0.03]"
            >
              <Box className="mt-0.5 h-5 w-5 text-brand" />
              <div>
                <div className="text-sm font-medium">AI 沙箱</div>
                <div className="text-xs text-muted-foreground">
                  生命周期 · 终端 · 文件 · 模板
                </div>
              </div>
            </Link>
            <Link
              href="/docs"
              className="flex items-start gap-3 rounded-md border border-border p-3 transition hover:border-violet-300 hover:bg-violet-50/40"
            >
              <FlaskConical className="mt-0.5 h-5 w-5 text-violet-600" />
              <div>
                <div className="text-sm font-medium">Agent Lab</div>
                <div className="text-xs text-muted-foreground">
                  任务编排演示（fake / local）
                </div>
              </div>
            </Link>
            <Alert variant="info">
              <ChartColumn className="h-4 w-4" />
              <AlertDescription>
                当前控制台列表为演示数据；创建与命令可通过 Control API / SDK 走真实沙箱后端。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
