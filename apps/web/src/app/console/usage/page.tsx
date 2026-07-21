import { ChartColumn, Clock3, Code2 } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@f2b/ui";
import { proxyToSandbox } from "@f2b/bff-core";

export const dynamic = "force-dynamic";

type UsageDay = {
  day: string;
  sandboxHours: number;
  commands: number;
  durationMs: number;
};

type UsageSummary = {
  days: number;
  totalDurationMs: number;
  totalSandboxHours: number;
  totalCommands: number;
  byDay: UsageDay[];
};

async function loadUsage(): Promise<{
  usage: UsageSummary | null;
  error: string | null;
}> {
  try {
    const res = await proxyToSandbox("/v1/usage?days=7", { method: "GET" });
    const data = (await res.json()) as {
      usage?: UsageSummary;
      error?: { message?: string };
    };
    if (!res.ok) {
      return {
        usage: null,
        error: data.error?.message || `upstream ${res.status}`,
      };
    }
    return { usage: data.usage ?? null, error: null };
  } catch (e) {
    return {
      usage: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export default async function UsagePage() {
  const { usage, error } = await loadUsage();
  const byDay = usage?.byDay ?? [];
  const maxH = Math.max(...byDay.map((u) => u.sandboxHours), 0.001);
  const totalH = usage?.totalSandboxHours ?? 0;
  const totalCmd = usage?.totalCommands ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">用量</h1>
        <p className="text-sm text-muted-foreground">
          近 7 日沙箱存活时长与命令次数（UTC 日聚合 · 来自{" "}
          <code className="text-xs">GET /v1/usage</code>）。
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>无法加载用量：{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">近 7 日沙箱时</div>
            <div className="mt-2 flex items-end gap-2">
              <Clock3 className="h-4 w-4 text-sky-600" />
              <span className="text-2xl font-semibold">{totalH.toFixed(3)}</span>
              <span className="pb-0.5 text-xs text-muted-foreground">h</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">近 7 日命令</div>
            <div className="mt-2 flex items-end gap-2">
              <Code2 className="h-4 w-4 text-violet-600" />
              <span className="text-2xl font-semibold">{totalCmd}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">账单</div>
            <div className="mt-2 flex items-end gap-2">
              <ChartColumn className="h-4 w-4 text-brand" />
              <span className="text-2xl font-semibold">—</span>
              <span className="pb-0.5 text-xs text-muted-foreground">
                计费未接入
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartColumn className="h-4 w-4" />
            沙箱时（近 7 日）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {byDay.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无用量数据</p>
          ) : (
            <div className="flex h-[180px] items-end gap-2.5">
              {byDay.map((u) => (
                <div
                  key={u.day}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    title={`${u.sandboxHours.toFixed(4)}h · ${u.commands} cmds`}
                    className="w-full min-h-1 rounded"
                    style={{
                      height: `${Math.max((u.sandboxHours / maxH) * 140, u.commands > 0 || u.durationMs > 0 ? 4 : 1)}px`,
                      background:
                        "linear-gradient(180deg, #FF5C33, rgba(255,138,76,0.55))",
                    }}
                  />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {u.day.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期 (UTC)</TableHead>
                <TableHead>沙箱时</TableHead>
                <TableHead>命令数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byDay.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    暂无数据；创建并销毁沙箱、执行命令后会出现在此。
                  </TableCell>
                </TableRow>
              ) : (
                byDay.map((u) => (
                  <TableRow key={u.day}>
                    <TableCell className="font-mono text-xs">{u.day}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {u.sandboxHours.toFixed(4)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {u.commands}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
