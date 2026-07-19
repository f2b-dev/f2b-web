"use client";

import { useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { MOCK_API_KEYS } from "@/lib/mock-data";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(MOCK_API_KEYS);
  const [created, setCreated] = useState<string | null>(null);

  function createKey() {
    const secret = `lj_live_${Math.random().toString(36).slice(2, 10)}${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    const prefix = secret.slice(0, 14);
    setKeys((prev) => [
      {
        id: `key_${Date.now()}`,
        name: `key-${prev.length + 1}`,
        prefix,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        scopes: ["sandboxes:write", "sandboxes:read"],
      },
      ...prev,
    ]);
    setCreated(secret);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">API 密钥</h1>
          <p className="text-sm text-muted-foreground">
            SDK 与 REST 调用鉴权。密钥仅创建时展示一次，服务端只存 hash。
          </p>
        </div>
        <Button onClick={createKey}>
          <Plus className="h-4 w-4" />
          创建密钥
        </Button>
      </div>

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>前缀</TableHead>
                <TableHead>权限</TableHead>
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
                  <TableCell className="font-mono text-xs">{k.prefix}…</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {new Date(k.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto px-0 text-red-600"
                      onClick={() => {
                        if (confirm("确认吊销此密钥？")) {
                          setKeys((prev) => prev.filter((x) => x.id !== k.id));
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      吊销
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
