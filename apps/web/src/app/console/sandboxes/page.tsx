"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppWindow, Globe, GlobeLock, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDuration,
  listSandboxes,
  type ApiSandbox,
} from "@/lib/sandbox-api";
import { SandboxStatusTag } from "@/lib/status";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SandboxesPage() {
  const [rows, setRows] = useState<ApiSandbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listSandboxes());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">AI 沙箱</h1>
          <p className="text-sm text-muted-foreground">
            经 BFF 代理至 f2b-sandbox：创建、命令、文件、销毁。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void load()} disabled={loading}>
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

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>
            无法加载沙箱列表：{error}。请确认 f2b-sandbox 已启动（默认
            :8787），且 F2B_SANDBOX_URL 正确。
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
              还没有沙箱
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
                  <TableHead>名称 / ID</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>模板</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>网络</TableHead>
                  <TableHead>后端</TableHead>
                  <TableHead>区域</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>项目</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
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
