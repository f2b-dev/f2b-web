"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  Clock3,
  ExternalLink,
  File,
  FolderOpen,
  Globe,
  HardDrive,
  Info,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Terminal,
  Trash2,
  Cpu,
} from "lucide-react";
import { Button } from "@f2b/ui";
import { Card, CardContent } from "@f2b/ui";
import { Input } from "@f2b/ui";
import { Textarea } from "@f2b/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@f2b/ui";
import { Alert, AlertDescription } from "@f2b/ui";
import {
  formatDuration,
  getSandbox,
  killSandbox,
  listFiles,
  pauseSandbox,
  readFile,
  resumeSandbox,
  runCommandStream,
  writeFile,
  type ApiSandbox,
  type FileEntry,
} from "@/lib/sandbox-api";
import {
  closeTunnel,
  createTunnel,
  listTunnels,
  type ApiTunnel,
} from "@/lib/tunnels-api";
import { SandboxStatusTag } from "@/lib/status";

const DEFAULT_DIR = "/home/user";

function parentPath(path: string): string {
  if (!path || path === "/") return "/";
  const trimmed = path.replace(/\/+$/, "") || "/";
  if (trimmed === "/") return "/";
  const idx = trimmed.lastIndexOf("/");
  return idx <= 0 ? "/" : trimmed.slice(0, idx);
}

export default function SandboxDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [sandbox, setSandbox] = useState<ApiSandbox | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cmd, setCmd] = useState("echo hello from lingjing");
  const [log, setLog] = useState(
    "$ # connected via BFF → f2b-sandbox (SSE stream)\n",
  );
  const [cwd, setCwd] = useState(DEFAULT_DIR);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editor, setEditor] = useState("");
  const [editorDirty, setEditorDirty] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [filesBusy, setFilesBusy] = useState(false);
  const [tunnels, setTunnels] = useState<ApiTunnel[]>([]);
  const [tunnelsError, setTunnelsError] = useState<string | null>(null);
  const [tunnelsBusy, setTunnelsBusy] = useState(false);
  const [tunnelPort, setTunnelPort] = useState("3000");
  const [tunnelTarget, setTunnelTarget] = useState("");

  const loadTunnels = useCallback(async (sandboxId: string) => {
    setTunnelsBusy(true);
    setTunnelsError(null);
    try {
      setTunnels(await listTunnels(sandboxId));
    } catch (e) {
      setTunnels([]);
      setTunnelsError(e instanceof Error ? e.message : String(e));
    } finally {
      setTunnelsBusy(false);
    }
  }, []);

  const loadFiles = useCallback(
    async (dir: string) => {
      if (!params.id) return;
      setFilesBusy(true);
      setFilesError(null);
      try {
        const entries = await listFiles(params.id, dir);
        setFiles(entries);
        setCwd(dir);
      } catch (e) {
        setFiles([]);
        setFilesError(e instanceof Error ? e.message : String(e));
      } finally {
        setFilesBusy(false);
      }
    },
    [params.id],
  );

  const load = useCallback(async () => {
    try {
      const sb = await getSandbox(params.id);
      setSandbox(sb);
      setLoadError(null);
      void loadTunnels(sb.id);
      if (sb.status === "running") {
        await loadFiles(cwd);
      } else {
        setFiles([]);
      }
    } catch (e) {
      setSandbox(null);
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, [params.id, loadFiles, loadTunnels, cwd]);

  useEffect(() => {
    void load();
    // 仅 id 变化时全量加载；目录切换走 loadFiles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function openEntry(entry: FileEntry) {
    if (entry.type === "dir") {
      setSelectedPath(null);
      setEditor("");
      setEditorDirty(false);
      await loadFiles(entry.path);
      return;
    }
    setFilesBusy(true);
    setFilesError(null);
    try {
      const file = await readFile(params.id, entry.path);
      setSelectedPath(entry.path);
      setEditor(file.content);
      setEditorDirty(false);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : String(e));
    } finally {
      setFilesBusy(false);
    }
  }

  async function onSaveFile() {
    if (!selectedPath || !sandbox) return;
    setFilesBusy(true);
    setFilesError(null);
    try {
      await writeFile(sandbox.id, selectedPath, editor);
      setEditorDirty(false);
      await loadFiles(cwd);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : String(e));
    } finally {
      setFilesBusy(false);
    }
  }

  async function onCreateFile() {
    const name = newName.trim().replace(/^\/+/, "");
    if (!name || !sandbox) return;
    if (name.includes("..")) {
      setFilesError("文件名不能包含 ..");
      return;
    }
    const path = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
    setFilesBusy(true);
    setFilesError(null);
    try {
      await writeFile(sandbox.id, path, "");
      setNewName("");
      await loadFiles(cwd);
      setSelectedPath(path);
      setEditor("");
      setEditorDirty(false);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : String(e));
    } finally {
      setFilesBusy(false);
    }
  }

  async function runCmd() {
    const line = cmd.trim();
    if (!line || !sandbox) return;
    setBusy(true);
    setLog((prev) => `${prev}$ ${line}\n`);
    let gotChunk = false;
    try {
      const result = await runCommandStream(sandbox.id, line, (ev) => {
        if (ev.type === "stdout" && ev.text) {
          gotChunk = true;
          setLog((prev) => `${prev}${ev.text}`);
        }
        if (ev.type === "stderr" && ev.text) {
          gotChunk = true;
          setLog((prev) => `${prev}${ev.text}`);
        }
      });
      if (!gotChunk) {
        const out = (result.stdout || "") + (result.stderr || "");
        if (out) setLog((prev) => `${prev}${out}`);
      }
      if (result.exitCode !== 0) {
        setLog((prev) => `${prev}\nexit ${result.exitCode}`);
      }
      setLog((prev) => (prev.endsWith("\n") ? prev : `${prev}\n`));
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

  async function onPauseResume() {
    if (!sandbox) return;
    setBusy(true);
    try {
      if (sandbox.status === "running") {
        const sb = await pauseSandbox(sandbox.id);
        setSandbox(sb);
        setLog((prev) => `${prev}$ # sandbox paused\n`);
      } else if (sandbox.status === "paused") {
        const sb = await resumeSandbox(sandbox.id);
        setSandbox(sb);
        setLog((prev) => `${prev}$ # sandbox resumed\n`);
        await loadFiles(cwd);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onCreateTunnel() {
    if (!sandbox) return;
    const port = Number(tunnelPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      setTunnelsError("端口需为 1–65535 的整数");
      return;
    }
    setTunnelsBusy(true);
    setTunnelsError(null);
    try {
      const target = tunnelTarget.trim();
      await createTunnel({
        sandboxId: sandbox.id,
        port,
        name: `port-${port}`,
        projectId: sandbox.projectId,
        ...(target ? { targetUrl: target } : {}),
      });
      setTunnelTarget("");
      await loadTunnels(sandbox.id);
    } catch (e) {
      setTunnelsError(e instanceof Error ? e.message : String(e));
    } finally {
      setTunnelsBusy(false);
    }
  }

  async function onCloseTunnel(id: string) {
    if (!sandbox) return;
    if (!confirm("关闭此预览隧道？")) return;
    setTunnelsBusy(true);
    setTunnelsError(null);
    try {
      await closeTunnel(id);
      await loadTunnels(sandbox.id);
    } catch (e) {
      setTunnelsError(e instanceof Error ? e.message : String(e));
    } finally {
      setTunnelsBusy(false);
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

  const filesInteractive = sandbox.status === "running";

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
          {sandbox.status === "paused" ? (
            <Button
              variant="secondary"
              onClick={() => void onPauseResume()}
              disabled={busy}
            >
              <Play className="h-4 w-4" />
              恢复
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => void onPauseResume()}
              disabled={busy || sandbox.status !== "running"}
            >
              <Pause className="h-4 w-4" />
              暂停
            </Button>
          )}
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
              <TabsTrigger value="tunnels">
                <Globe className="h-3.5 w-3.5" />
                预览
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

            <TabsContent value="files" className="space-y-3 pt-3">
              {!filesInteractive ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {sandbox.status === "paused"
                    ? "沙箱已暂停，恢复后再浏览文件。"
                    : "沙箱未运行，无法浏览文件。"}
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={filesBusy || cwd === "/"}
                      onClick={() => void loadFiles(parentPath(cwd))}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      上级
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={filesBusy}
                      onClick={() => void loadFiles(cwd)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      刷新
                    </Button>
                    <code className="min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-2 py-1.5 font-mono text-xs">
                      {cwd}
                    </code>
                  </div>

                  {filesError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{filesError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="space-y-2">
                      <ul className="max-h-72 divide-y overflow-auto rounded-md border">
                        {files.length === 0 ? (
                          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                            {filesBusy ? "加载中…" : "目录为空"}
                          </li>
                        ) : (
                          files.map((f) => (
                            <li key={f.path}>
                              <button
                                type="button"
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 ${
                                  selectedPath === f.path ? "bg-brand/5" : ""
                                }`}
                                onClick={() => void openEntry(f)}
                                disabled={filesBusy}
                              >
                                {f.type === "dir" ? (
                                  <FolderOpen className="h-4 w-4 shrink-0 text-amber-600" />
                                ) : (
                                  <File className="h-4 w-4 shrink-0 text-sky-600" />
                                )}
                                <span className="truncate font-mono text-xs">
                                  {f.name}
                                </span>
                                {f.size != null ? (
                                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                    {f.size} B
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>

                      <div className="flex gap-2">
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void onCreateFile();
                          }}
                          placeholder="新文件名，如 notes.txt"
                          disabled={filesBusy}
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="secondary"
                          disabled={filesBusy || !newName.trim()}
                          onClick={() => void onCreateFile()}
                        >
                          新建
                        </Button>
                      </div>
                    </div>

                    <div className="flex min-h-72 flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                          {selectedPath ?? "选择文件以预览 / 编辑"}
                        </code>
                        <Button
                          size="sm"
                          disabled={
                            filesBusy || !selectedPath || !editorDirty
                          }
                          onClick={() => void onSaveFile()}
                        >
                          <Save className="h-3.5 w-3.5" />
                          保存
                        </Button>
                      </div>
                      <Textarea
                        value={editor}
                        onChange={(e) => {
                          setEditor(e.target.value);
                          setEditorDirty(true);
                        }}
                        disabled={!selectedPath || filesBusy}
                        placeholder={
                          selectedPath
                            ? "文件内容"
                            : "点击左侧文件打开编辑器"
                        }
                        className="min-h-60 flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="tunnels" className="space-y-3 pt-3">
              <p className="text-sm text-muted-foreground">
                将沙箱端口登记为预览 URL（经 f2b-tunnel 反代）。开发态可填
                targetUrl；默认{" "}
                <code className="text-xs">http://127.0.0.1:&lt;port&gt;</code>
                。
              </p>
              {tunnelsError ? (
                <Alert variant="destructive">
                  <AlertDescription>{tunnelsError}</AlertDescription>
                </Alert>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Input
                  value={tunnelPort}
                  onChange={(e) => setTunnelPort(e.target.value)}
                  placeholder="端口，如 3000"
                  className="w-28 font-mono"
                  disabled={tunnelsBusy}
                />
                <Input
                  value={tunnelTarget}
                  onChange={(e) => setTunnelTarget(e.target.value)}
                  placeholder="可选 targetUrl"
                  className="min-w-[12rem] flex-1 font-mono text-xs"
                  disabled={tunnelsBusy}
                />
                <Button
                  variant="secondary"
                  disabled={tunnelsBusy || sandbox.status === "killed"}
                  onClick={() => void onCreateTunnel()}
                >
                  <Plus className="h-4 w-4" />
                  创建隧道
                </Button>
                <Button
                  variant="secondary"
                  disabled={tunnelsBusy}
                  onClick={() => void loadTunnels(sandbox.id)}
                >
                  <RefreshCw className="h-4 w-4" />
                  刷新
                </Button>
              </div>
              <ul className="divide-y rounded-md border">
                {tunnels.length === 0 ? (
                  <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {tunnelsBusy ? "加载中…" : "暂无隧道"}
                  </li>
                ) : (
                  tunnels.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        :{t.port}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {t.status}
                      </span>
                      <a
                        href={t.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-w-0 flex-1 items-center gap-1 truncate font-mono text-xs text-brand hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        {t.publicUrl}
                      </a>
                      {t.status === "active" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={tunnelsBusy}
                          onClick={() => void onCloseTunnel(t.id)}
                        >
                          关闭
                        </Button>
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
