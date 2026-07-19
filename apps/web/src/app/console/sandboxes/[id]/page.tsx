"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  File,
  FolderOpen,
  Globe,
  HardDrive,
  Info,
  Pause,
  Terminal,
  Trash2,
  Cpu,
} from "lucide-react";
import { Button } from "@f2b/ui";
import { Card, CardContent } from "@f2b/ui";
import { Input } from "@f2b/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@f2b/ui";
import { Alert, AlertDescription } from "@f2b/ui";
import {
  formatDuration,
  getSandbox,
  killSandbox,
  listFiles,
  runCommand,
  type ApiSandbox,
} from "@/lib/sandbox-api";
import { SandboxStatusTag } from "@/lib/status";

export default function SandboxDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [sandbox, setSandbox] = useState<ApiSandbox | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cmd, setCmd] = useState("echo hello from lingjing");
  const [log, setLog] = useState("$ # connected via BFF → f2b-sandbox\n");
  const [files, setFiles] = useState<
    { path: string; name: string; type: string; size?: number }[]
  >([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const sb = await getSandbox(params.id);
      setSandbox(sb);
      setLoadError(null);
      if (sb.status === "running" || sb.status === "paused") {
        try {
          setFiles(await listFiles(sb.id));
        } catch {
          setFiles([]);
        }
      }
    } catch (e) {
      setSandbox(null);
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runCmd() {
    const line = cmd.trim();
    if (!line || !sandbox) return;
    setBusy(true);
    setLog((prev) => `${prev}$ ${line}\n`);
    try {
      const result = await runCommand(sandbox.id, line);
      const out =
        (result.stdout || "") +
        (result.stderr || "") +
        (result.exitCode !== 0 ? `\nexit ${result.exitCode}` : "");
      setLog((prev) => `${prev}${out || "(no output)"}\n`);
      setCmd("");
    } catch (e) {
      setLog(
        (prev) =>
          `${prev}error: ${e instanceof Error ? e.message : String(e)}\n`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onKill() {
    if (!sandbox) return;
    if (!confirm(`确定销毁沙箱 ${sandbox.id}？`)) return;
    setBusy(true);
    try {
      const sb = await killSandbox(sandbox.id);
      setSandbox(sb);
      setLog((prev) => `${prev}$ # sandbox killed\n`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (loadError && !sandbox) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-sm text-muted-foreground">
        无法加载沙箱：{loadError}
        <Button asChild>
          <Link href="/console/sandboxes">
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Link>
        </Button>
      </div>
    );
  }

  if (!sandbox) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        加载中…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-lg font-semibold">{sandbox.name}</h1>
            <SandboxStatusTag status={sandbox.status} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {sandbox.id} · {sandbox.region} · {sandbox.template} ·{" "}
            {sandbox.backend}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled title="Pause 后续版本">
            <Pause className="h-4 w-4" />
            暂停
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onKill()}
            disabled={busy || sandbox.status === "killed"}
          >
            <Trash2 className="h-4 w-4" />
            销毁
          </Button>
          <Button asChild variant="secondary">
            <Link href="/console/sandboxes">
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
          </Button>
        </div>
      </div>

      {sandbox.error ? (
        <Alert variant="destructive">
          <AlertDescription>{sandbox.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Cpu} title="规格" value={sandbox.cpu} suffix={sandbox.memory} />
        <Stat
          icon={Globe}
          title="网络"
          value={sandbox.allowInternetAccess ? "公网" : "隔离"}
        />
        <Stat
          icon={Clock3}
          title="已运行"
          value={formatDuration(sandbox.durationSec)}
        />
        <Stat icon={HardDrive} title="项目" value={sandbox.projectId} />
      </div>

      <Card>
        <CardContent className="pt-3">
          <Tabs defaultValue="terminal">
            <TabsList className="w-full">
              <TabsTrigger value="terminal">
                <Terminal className="h-3.5 w-3.5" />
                终端
              </TabsTrigger>
              <TabsTrigger value="files">
                <FolderOpen className="h-3.5 w-3.5" />
                文件
              </TabsTrigger>
              <TabsTrigger value="meta">
                <Info className="h-3.5 w-3.5" />
                元数据
              </TabsTrigger>
            </TabsList>

            <TabsContent value="terminal" className="space-y-3 pt-3">
              <pre className="max-h-80 overflow-auto rounded-md bg-[#0b1220] p-3 font-mono text-xs leading-relaxed text-emerald-100">
                {log}
              </pre>
              <div className="flex gap-2">
                <Input
                  value={cmd}
                  onChange={(e) => setCmd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runCmd();
                  }}
                  placeholder="输入命令，例如 echo hi"
                  disabled={busy || sandbox.status !== "running"}
                  className="font-mono"
                />
                <Button
                  onClick={() => void runCmd()}
                  disabled={busy || sandbox.status !== "running"}
                >
                  运行
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="files" className="pt-3">
              <ul className="divide-y rounded-md border">
                {files.length === 0 ? (
                  <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                    无文件或沙箱未运行
                  </li>
                ) : (
                  files.map((f) => (
                    <li
                      key={f.path}
                      className="flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      {f.type === "dir" ? (
                        <FolderOpen className="h-4 w-4 text-amber-600" />
                      ) : (
                        <File className="h-4 w-4 text-sky-600" />
                      )}
                      <span className="font-mono text-xs">{f.path}</span>
                      {f.size != null ? (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {f.size} B
                        </span>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </TabsContent>

            <TabsContent value="meta" className="pt-3">
              <pre className="overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
                {JSON.stringify(sandbox, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  title,
  value,
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-4">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-sm font-semibold">
            {value}
            {suffix ? (
              <span className="ml-1 font-normal text-muted-foreground">
                {suffix}
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
