"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@f2b/ui";
import {
  createKey,
  listKeys,
  revokeKey,
  type ApiKeyMeta,
} from "@/lib/keys-api";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setKeys(await listKeys());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate() {
    setBusy(true);
    setError(null);
    try {
      const name = `key-${keys.length + 1}`;
      const { key, secret } = await createKey(name);
      setCreated(secret);
      setKeys((prev) => [key, ...prev.filter((k) => k.id !== key.id)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: string) {
    if (!confirm("确认吊销此密钥？吊销后立即失效。")) return;
    setBusy(true);
    setError(null);
    try {
      await revokeKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">API 密钥</h1>
          <p className="text-sm text-muted-foreground">
            对接 f2b-sandbox · 服务端只存 hash · 明文仅创建时展示一次
          </p>
        </div>
        <Button onClick={() => void onCreate()} disabled={busy || loading}>
          <Plus className="h-4 w-4" />
          创建密钥
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>请求失败</AlertTitle>
          <AlertDescription>
            {error}
            <span className="mt-1 block text-xs opacity-90">
              若 sandbox 开启了{" "}
              <code>F2B_AUTH_MODE=api_key</code>，请在 web 配置{" "}
              <code>F2B_SANDBOX_ADMIN_TOKEN</code>（与 sandbox 的{" "}
              <code>F2B_ADMIN_TOKEN</code> 一致）。
            </span>
          </AlertDescription>
        </Alert>
      )}

      {created && (
        <Alert variant="warning">
          <AlertTitle>请立即复制完整密钥（仅显示一次）</AlertTitle>
          <AlertDescription>
            <code className="mt-1 block break-all rounded bg-white/70 px-2 py-1 font-mono text-xs">
              {created}
            </code>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              加载中…
            </div>
          ) : keys.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              暂无密钥。点击「创建密钥」生成（需 sandbox 可达）。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>前缀</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>最近使用</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-brand" />
                        <span className="font-medium">{k.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {k.keyPrefix}…
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{k.projectId}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {new Date(k.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {k.lastUsedAt
                        ? new Date(k.lastUsedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto px-0 text-red-600"
                        disabled={busy}
                        onClick={() => void onRevoke(k.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        吊销
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
