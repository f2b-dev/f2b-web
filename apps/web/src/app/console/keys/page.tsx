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
  Input,
  Label,
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
import { ConsoleEmpty, ConsoleLoading } from "@/components/console-empty";
import { formatRelativeTime } from "@/lib/sandbox-api";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nameInput, setNameInput] = useState("");

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
      const trimmed = nameInput.trim();
      const name =
        trimmed ||
        `key-${new Date().toISOString().slice(0, 10)}-${keys.length + 1}`;
      const { key, secret } = await createKey(name);
      setCreated(secret);
      setNameInput("");
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
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[12rem] flex-1 space-y-1.5">
            <Label htmlFor="key-name">密钥名称</Label>
            <Input
              id="key-name"
              placeholder="例如 ci-bot、本地调试"
              value={nameInput}
              maxLength={64}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={busy || loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") void onCreate();
              }}
            />
            <p className="text-[11px] text-muted-foreground">
              留空则自动生成名称；便于区分环境与机器人。
            </p>
          </div>
          <Button onClick={() => void onCreate()} disabled={busy || loading}>
            <Plus className="h-4 w-4" />
            创建密钥
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>请求失败</AlertTitle>
          <AlertDescription>
            {error}
            <span className="mt-1 block text-xs opacity-90">
              若 sandbox 开启了 <code>F2B_AUTH_MODE=api_key</code>，请在 web 配置{" "}
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
            <ConsoleLoading rows={3} />
          ) : keys.length === 0 ? (
            <ConsoleEmpty
              icon={KeyRound}
              title="还没有 API 密钥"
              description="填写名称后点击「创建密钥」。明文 secret 仅创建响应展示一次。"
              action={
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void onCreate()}
                >
                  <Plus className="h-4 w-4" />
                  创建密钥
                </Button>
              }
            />
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
                      <span title={new Date(k.createdAt).toLocaleString()}>
                        {formatRelativeTime(k.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {k.lastUsedAt ? (
                        <span title={new Date(k.lastUsedAt).toLocaleString()}>
                          {formatRelativeTime(k.lastUsedAt)}
                        </span>
                      ) : (
                        "—"
                      )}
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
