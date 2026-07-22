"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AppWindow,
  Globe,
  GlobeLock,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@f2b/ui";
import { Card, CardContent } from "@f2b/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@f2b/ui";
import {
  formatDuration,
  killSandbox,
  listSandboxes,
  type ApiSandbox,
} from "@/lib/sandbox-api";
import { SandboxStatusTag } from "@/lib/status";
import { Alert, AlertDescription } from "@f2b/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@f2b/ui";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "running", label: "运行中" },
  { value: "paused", label: "已暂停" },
  { value: "provisioning", label: "创建中" },
  { value: "killed", label: "已销毁" },
  { value: "failed", label: "失败" },
  { value: "running,paused,provisioning", label: "活动中" },
];

function isTerminal(status: string) {
  return (
    status === "killed" || status === "failed" || status === "succeeded"
  );
}

export default function SandboxesPage() {
  const [rows, setRows] = useState<ApiSandbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listSandboxes(
        statusFilter === "all" ? undefined : { status: statusFilter },
      );
      setRows(list);
      setSelected((prev) => {
        const ids = new Set(list.map((r) => r.id));
        return new Set([...prev].filter((id) => ids.has(id)));
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const killableSelected = useMemo(
    () =>
      rows.filter((r) => selected.has(r.id) && !isTerminal(r.status)),
    [rows, selected],
  );

  const allVisibleSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onKillOne(id: string) {
    if (!confirm(`销毁沙箱 ${id}？`)) return;
    setBusyId(id);
    setError(null);
    try {
      await killSandbox(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function onBulkKill() {
    if (killableSelected.length === 0) return;
    if (
      !confirm(
        `销毁选中的 ${killableSelected.length} 个活动沙箱？终态项会跳过。`,
      )
    ) {
      return;
    }
    setBulkBusy(true);
    setError(null);
    const failures: string[] = [];
    try {
      for (const r of killableSelected) {
        try {
          await killSandbox(r.id);
        } catch (e) {
          failures.push(
            `${r.id}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
      if (failures.length) {
        setError(`部分销毁失败：${failures.join("; ")}`);
      }
      setSelected(new Set());
      await load();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">AI 沙箱</h1>
          <p className="text-sm text-muted-foreground">
            经 BFF 代理至 f2b-sandbox：创建、命令、文件、销毁。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => void load()}
            disabled={loading || bulkBusy}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button asChild variant="secondary">
            <Link href="/console/templates">
              <AppWindow className="h-4 w-4" />
              模板
            </Link>
          </Button>
          <Button asChild>
            <Link href="/console/sandboxes/new">
              <Plus className="h-4 w-4" />
              创建沙箱
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="destructive"
          size="sm"
          disabled={bulkBusy || killableSelected.length === 0}
          onClick={() => void onBulkKill()}
        >
          <Trash2 className="h-3.5 w-3.5" />
          销毁选中
          {killableSelected.length > 0 ? ` (${killableSelected.length})` : ""}
        </Button>
        <span className="text-xs text-muted-foreground">
          {rows.length} 条
          {selected.size > 0 ? ` · 已选 ${selected.size}` : ""}
        </span>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {error.includes("无法加载") || error.includes("fetch")
              ? `无法加载沙箱列表：${error}。请确认 f2b-sandbox 已启动（默认 :13287），且 F2B_SANDBOX_URL 正确。`
              : error}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {loading && rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              加载中…
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "还没有沙箱"
                : "当前筛选下没有沙箱"}
              <Button asChild>
                <Link href="/console/sandboxes/new">
                  <Plus className="h-4 w-4" />
                  创建沙箱
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-brand"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="全选"
                    />
                  </TableHead>
                  <TableHead>名称 / ID</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>模板</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>网络</TableHead>
                  <TableHead>后端</TableHead>
                  <TableHead>区域</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead className="w-20 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-brand"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        aria-label={`选择 ${r.id}`}
                      />
                    </TableCell>
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
                    <TableCell className="font-mono text-xs">
                      {r.template}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.cpu} · {r.memory}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs">
                        {r.allowInternetAccess ? (
                          <>
                            <Globe className="h-3.5 w-3.5 text-emerald-600" />
                            公网
                          </>
                        ) : (
                          <>
                            <GlobeLock className="h-3.5 w-3.5 text-muted-foreground" />
                            隔离
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.backend}
                    </TableCell>
                    <TableCell className="text-xs">{r.region}</TableCell>
                    <TableCell className="text-xs">
                      {formatDuration(r.durationSec)}
                    </TableCell>
                    <TableCell className="text-xs">{r.projectId}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-muted-foreground hover:text-destructive"
                        disabled={
                          isTerminal(r.status) ||
                          busyId === r.id ||
                          bulkBusy
                        }
                        title={
                          isTerminal(r.status) ? "已是终态" : "销毁"
                        }
                        onClick={() => void onKillOne(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
