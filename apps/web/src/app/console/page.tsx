import Link from "next/link";
import {
  Box,
  ChartColumn,
  Clock3,
  Code2,
  KeyRound,
  Plus,
  Zap,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription } from "@f2b/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@f2b/ui";
import { proxyToSandbox } from "@f2b/bff-core";
import { SandboxStatusTag } from "@/lib/status";
import { formatDuration, type ApiSandbox } from "@/lib/sandbox-api";

export const dynamic = "force-dynamic";

async function loadSandboxes(): Promise<{
  sandboxes: ApiSandbox[];
  error: string | null;
}> {
  try {
    const res = await proxyToSandbox("/v1/sandboxes", { method: "GET" });
    const data = (await res.json()) as {
      sandboxes?: ApiSandbox[];
      error?: { message?: string };
    };
    if (!res.ok) {
      return {
        sandboxes: [],
        error: data.error?.message || `upstream ${res.status}`,
      };
    }
    return { sandboxes: data.sandboxes ?? [], error: null };
  } catch (e) {
    return {
      sandboxes: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export default async function ConsoleDashboardPage() {
  const { sandboxes, error } = await loadSandboxes();
  const running = sandboxes.filter((s) => s.status === "running").length;
  const totalSec = sandboxes.reduce((a, b) => a + (b.durationSec || 0), 0);
  const recent = [...sandboxes]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const stats = [
    {
      title: "运行中沙箱",
      value: String(running),
      suffix: "实例",
      icon: Zap,
      iconClass: "text-emerald-600",
    },
    {
      title: "记录总数",
      value: String(sandboxes.length),
      suffix: "条",
      icon: Box,
      iconClass: "text-sky-600",
    },
    {
      title: "累计时长（记录）",
      value: formatDuration(totalSec),
      icon: Clock3,
      iconClass: "text-violet-600",
    },
    {
      title: "API 密钥",
      value: "管理",
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
            项目 default · 数据来自 f2b-sandbox（BFF）
          </p>
        </div>
        <Button asChild>
          <Link href="/console/sandboxes/new">
            <Plus className="h-4 w-4" />
            创建沙箱
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            无法加载沙箱列表：{error}。请确认 f2b-sandbox 已启动且{" "}
            <code className="text-xs">F2B_SANDBOX_URL</code> 正确。
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{s.title}</div>
                <div className="mt-2 flex items-end gap-2">
                  <Icon className={`h-4 w-4 ${s.iconClass}`} />
                  <span className="text-2xl font-semibold tracking-tight">
                    {s.value}
                  </span>
                  {s.suffix && (
                    <span className="pb-0.5 text-xs text-muted-foreground">
                      {s.suffix}
                    </span>
                  )}
                  {s.href && (
                    <Link
                      href={s.href}
                      className="ml-auto pb-0.5 text-xs text-brand hover:underline"
                    >
                      打开
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
            <Link
              href="/console/sandboxes"
              className="text-xs text-brand hover:underline"
            >
              查看全部 →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                暂无沙箱。
                <Link
                  href="/console/sandboxes/new"
                  className="ml-1 text-brand hover:underline"
                >
                  创建第一个
                </Link>
              </div>
            ) : (
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
                        <Link
                          href={`/console/sandboxes/${r.id}`}
                          className="block hover:text-brand"
                        >
                          <div className="font-medium">{r.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {r.id}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <SandboxStatusTag status={r.status} />
                      </TableCell>
                      <TableCell className="text-sm">{r.template}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDuration(r.durationSec || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
              href="/console/keys"
              className="flex items-start gap-3 rounded-md border border-border p-3 transition hover:border-brand/40 hover:bg-brand/[0.03]"
            >
              <KeyRound className="mt-0.5 h-5 w-5 text-brand" />
              <div>
                <div className="text-sm font-medium">API 密钥</div>
                <div className="text-xs text-muted-foreground">
                  SDK 鉴权 · 明文仅创建一次
                </div>
              </div>
            </Link>
            <Alert variant="info">
              <ChartColumn className="h-4 w-4" />
              <AlertDescription>
                用量页仍为演示聚合；密钥与沙箱列表已接 f2b-sandbox。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
