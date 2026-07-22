"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  Clock3,
  Download,
  ExternalLink,
  File,
  FolderOpen,
  FolderPlus,
  Globe,
  HardDrive,
  Info,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Terminal,
  Trash2,
  Upload,
  Cpu,
} from "lucide-react";
import { Button } from "@f2b/ui";
import { Card, CardContent } from "@f2b/ui";
import { Input } from "@f2b/ui";
import { Textarea } from "@f2b/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@f2b/ui";
import { Alert, AlertDescription } from "@f2b/ui";
import {
  deleteFile,
  formatDuration,
  formatIdleRemaining,
  formatRelativeTime,
  getSandbox,
  killSandbox,
  listFiles,
  mkdir,
  pauseSandbox,
  readFile,
  renameFile,
  resumeSandbox,
  runCommandStream,
  updateSandbox,
  writeFile,
  type ApiSandbox,
  type FileEntry,
} from "@/lib/sandbox-api";
import { ConsoleLoading } from "@/components/console-empty";
import {
  closeTunnel,
  createTunnel,
  listTunnels,
  type ApiTunnel,
} from "@/lib/tunnels-api";
import { SandboxStatusTag } from "@/lib/status";

const DEFAULT_DIR = "/home/user";
/** 控制台编辑器按文本打开的体积上限；更大走 base64 下载提示 */
const TEXT_OPEN_MAX_BYTES = 512 * 1024;

function parentPath(path: string): string {
  if (!path || path === "/") return "/";
  const trimmed = path.replace(/\/+$/, "") || "/";
  if (trimmed === "/") return "/";
  const idx = trimmed.lastIndexOf("/");
  return idx <= 0 ? "/" : trimmed.slice(0, idx);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function looksBinary(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 8192);
  let suspicious = 0;
  for (let i = 0; i < n; i++) {
    const c = bytes[i]!;
    if (c === 0) return true;
    // 控制字符（保留 \t \n \r）
    if (c < 9 || (c > 13 && c < 32)) suspicious++;
  }
  return n > 0 && suspicious / n > 0.1;
}

function triggerBrowserDownload(
  filename: string,
  bytes: Uint8Array,
  mime = "application/octet-stream",
) {
  // 拷贝到独立 ArrayBuffer，避免 SharedArrayBuffer 类型不兼容 BlobPart
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download.bin";
  a.click();
  URL.revokeObjectURL(url);
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
  /** 文件浏览器 cwd */
  const [cwd, setCwd] = useState(DEFAULT_DIR);
  /** 终端命令 cwd（可与文件浏览器分开） */
  const [termCwd, setTermCwd] = useState(DEFAULT_DIR);
  const [termEnvText, setTermEnvText] = useState("");
  /** 命令级超时（秒）；空 = 不传 timeoutMs */
  const [termTimeoutSec, setTermTimeoutSec] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editor, setEditor] = useState("");
  const [editorDirty, setEditorDirty] = useState(false);
  /** 当前选中文件为二进制：不进文本编辑器，仅下载/覆盖上传 */
  const [editorBinary, setEditorBinary] = useState(false);
  const [binarySize, setBinarySize] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [filesBusy, setFilesBusy] = useState(false);
  const [tunnels, setTunnels] = useState<ApiTunnel[]>([]);
  const [tunnelsError, setTunnelsError] = useState<string | null>(null);
  const [tunnelsBusy, setTunnelsBusy] = useState(false);
  const [tunnelPort, setTunnelPort] = useState("3000");
  const [tunnelTarget, setTunnelTarget] = useState("");
  const [extendMin, setExtendMin] = useState("30");
  const [metaBusy, setMetaBusy] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaKey, setMetaKey] = useState("");
  const [metaVal, setMetaVal] = useState("");
  /** 相对时间 / 空闲倒计时刷新锚点 */
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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
      setEditorBinary(false);
      setBinarySize(null);
      await loadFiles(entry.path);
      return;
    }
    setFilesBusy(true);
    setFilesError(null);
    try {
      // 先 base64 读，判定文本/二进制
      const file = await readFile(params.id, entry.path, {
        encoding: "base64",
      });
      const bytes = base64ToBytes(file.content);
      setSelectedPath(entry.path);
      setEditorDirty(false);
      if (bytes.length > TEXT_OPEN_MAX_BYTES || looksBinary(bytes)) {
        setEditorBinary(true);
        setBinarySize(bytes.length);
        setEditor("");
      } else {
        setEditorBinary(false);
        setBinarySize(null);
        setEditor(new TextDecoder("utf-8").decode(bytes));
      }
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : String(e));
    } finally {
      setFilesBusy(false);
    }
  }

  async function onSaveFile() {
    if (!selectedPath || !sandbox || editorBinary) return;
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

  async function onDownloadPath(path: string) {
    if (!sandbox) return;
    setFilesBusy(true);
    setFilesError(null);
    try {
      const file = await readFile(sandbox.id, path, { encoding: "base64" });
      const bytes = base64ToBytes(file.content);
      const name = path.split("/").filter(Boolean).pop() || "download.bin";
      triggerBrowserDownload(name, bytes);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : String(e));
    } finally {
      setFilesBusy(false);
    }
  }

  async function onUploadFiles(list: FileList | null) {
    if (!list?.length || !sandbox) return;
    setFilesBusy(true);
    setFilesError(null);
    try {
      for (const file of Array.from(list)) {
        if (file.name.includes("..") || file.name.includes("/")) {
          throw new Error(`非法文件名: ${file.name}`);
        }
        const path = cwd === "/" ? `/${file.name}` : `${cwd}/${file.name}`;
        const buf = new Uint8Array(await file.arrayBuffer());
        const b64 = bytesToBase64(buf);
        await writeFile(sandbox.id, path, b64, { encoding: "base64" });
      }
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
      setEditorBinary(false);
      setBinarySize(null);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : String(e));
    } finally {
      setFilesBusy(false);
    }
  }

  async function onMkdir() {
    const name = newName.trim().replace(/^\/+/, "");
    if (!name || !sandbox) return;
    if (name.includes("..") || name.includes("/")) {
      setFilesError("目录名不能包含 / 或 ..");
      return;
    }
    const path = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
    setFilesBusy(true);
    setFilesError(null);
    try {
      await mkdir(sandbox.id, path);
      setNewName("");
      await loadFiles(cwd);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : String(e));
    } finally {
      setFilesBusy(false);
    }
  }

  async function onRenameEntry(entry: FileEntry) {
    if (!sandbox) return;
    const next = window.prompt(`重命名 ${entry.name}`, entry.name);
    if (next == null) return;
    const name = next.trim().replace(/^\/+/, "");
    if (!name || name === entry.name) return;
    if (name.includes("..") || name.includes("/")) {
      setFilesError("新名称不能包含 / 或 ..");
      return;
    }
    const to = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
    setFilesBusy(true);
    setFilesError(null);
    try {
      await renameFile(sandbox.id, entry.path, to);
      if (selectedPath === entry.path) {
        setSelectedPath(to);
      } else if (selectedPath?.startsWith(entry.path + "/")) {
        setSelectedPath(selectedPath.replace(entry.path, to));
      }
      await loadFiles(cwd);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : String(e));
    } finally {
      setFilesBusy(false);
    }
  }

  async function onDeleteEntry(entry: FileEntry) {
    if (!sandbox) return;
    const label =
      entry.type === "dir"
        ? `递归删除目录 ${entry.path}？`
        : `删除文件 ${entry.path}？`;
    if (!confirm(label)) return;
    setFilesBusy(true);
    setFilesError(null);
    try {
      await deleteFile(sandbox.id, entry.path, {
        recursive: entry.type === "dir",
      });
      if (selectedPath === entry.path || selectedPath?.startsWith(entry.path + "/")) {
        setSelectedPath(null);
        setEditor("");
        setEditorDirty(false);
        setEditorBinary(false);
        setBinarySize(null);
      }
      await loadFiles(cwd);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : String(e));
    } finally {
      setFilesBusy(false);
    }
  }

  function parseTermEnv(text: string): Record<string, string> | undefined {
    const env: Record<string, string> = {};
    for (const raw of text.split(/\n|,/)) {
      const line = raw.trim();
      if (!line) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k) env[k] = v;
    }
    return Object.keys(env).length ? env : undefined;
  }

  async function runCmd() {
    const line = cmd.trim();
    if (!line || !sandbox) return;
    setBusy(true);
    const env = parseTermEnv(termEnvText);
    const runCwd = termCwd.trim() || DEFAULT_DIR;
    const sec = Number(termTimeoutSec);
    const timeoutMs =
      Number.isFinite(sec) && sec > 0 ? Math.round(sec * 1000) : undefined;
    const timeoutHint =
      timeoutMs != null ? `  # timeoutMs=${timeoutMs}` : "";
    setLog((prev) => `${prev}$ ${line}${timeoutHint}\n`);
    let gotChunk = false;
    try {
      const result = await runCommandStream(
        sandbox.id,
        line,
        (ev) => {
          if (ev.type === "stdout" && ev.text) {
            gotChunk = true;
            setLog((prev) => `${prev}${ev.text}`);
          }
          if (ev.type === "stderr" && ev.text) {
            gotChunk = true;
            setLog((prev) => `${prev}${ev.text}`);
          }
        },
        {
          cwd: runCwd,
          ...(env ? { env } : {}),
          ...(timeoutMs != null ? { timeoutMs } : {}),
        },
      );
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

  const isActive =
    sandbox?.status === "running" ||
    sandbox?.status === "paused" ||
    sandbox?.status === "provisioning";

  async function onExtendTimeout() {
    if (!sandbox || !isActive) return;
    const min = Number(extendMin);
    if (!Number.isFinite(min) || min <= 0) {
      setMetaError("请输入正数分钟");
      return;
    }
    setMetaBusy(true);
    setMetaError(null);
    try {
      const sb = await updateSandbox(sandbox.id, {
        timeoutMs: Math.round(min * 60_000),
      });
      setSandbox(sb);
    } catch (e) {
      setMetaError(e instanceof Error ? e.message : String(e));
    } finally {
      setMetaBusy(false);
    }
  }

  async function onClearTimeout() {
    if (!sandbox || !isActive) return;
    setMetaBusy(true);
    setMetaError(null);
    try {
      const sb = await updateSandbox(sandbox.id, { timeoutMs: null });
      setSandbox(sb);
    } catch (e) {
      setMetaError(e instanceof Error ? e.message : String(e));
    } finally {
      setMetaBusy(false);
    }
  }

  async function onAddMetadata() {
    if (!sandbox || !isActive) return;
    const k = metaKey.trim();
    if (!k) {
      setMetaError("metadata 键不能为空");
      return;
    }
    setMetaBusy(true);
    setMetaError(null);
    try {
      const sb = await updateSandbox(sandbox.id, {
        metadata: { [k]: metaVal },
      });
      setSandbox(sb);
      setMetaKey("");
      setMetaVal("");
    } catch (e) {
      setMetaError(e instanceof Error ? e.message : String(e));
    } finally {
      setMetaBusy(false);
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
    return <ConsoleLoading rows={6} className="py-16" />;
  }

  const filesInteractive = sandbox.status === "running";
  const lastActiveIso =
    sandbox.lastActiveAt ?? sandbox.startedAt ?? sandbox.createdAt;
  const idleLeft = formatIdleRemaining(sandbox, nowMs);

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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
        <Stat
          icon={Clock3}
          title="最近活动"
          value={formatRelativeTime(lastActiveIso, nowMs)}
          suffix={
            idleLeft
              ? idleLeft === "已到期"
                ? "空闲已到期"
                : `剩余 ${idleLeft}`
              : undefined
          }
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
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    工作目录 cwd
                  </label>
                  <Input
                    value={termCwd}
                    onChange={(e) => setTermCwd(e.target.value)}
                    placeholder="/home/user"
                    disabled={busy || sandbox.status !== "running"}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    环境变量（KEY=VAL，逗号或换行分隔）
                  </label>
                  <Input
                    value={termEnvText}
                    onChange={(e) => setTermEnvText(e.target.value)}
                    placeholder="FOO=bar,BAZ=1"
                    disabled={busy || sandbox.status !== "running"}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    超时（秒，可选）
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={1800}
                    value={termTimeoutSec}
                    onChange={(e) => setTermTimeoutSec(e.target.value)}
                    placeholder="空=默认"
                    disabled={busy || sandbox.status !== "running"}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
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
                            <li
                              key={f.path}
                              className="flex items-center gap-1 pr-1"
                            >
                              <button
                                type="button"
                                className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 ${
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
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
                                disabled={filesBusy}
                                title="重命名"
                                onClick={() => void onRenameEntry(f)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                                disabled={filesBusy}
                                title="删除"
                                onClick={() => void onDeleteEntry(f)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </li>
                          ))
                        )}
                      </ul>

                      <div className="flex flex-wrap gap-2">
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void onCreateFile();
                          }}
                          placeholder="新文件/目录名"
                          disabled={filesBusy}
                          className="min-w-[8rem] flex-1 font-mono text-xs"
                        />
                        <Button
                          variant="secondary"
                          disabled={filesBusy || !newName.trim()}
                          onClick={() => void onMkdir()}
                          title="新建目录"
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                          目录
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={filesBusy || !newName.trim()}
                          onClick={() => void onCreateFile()}
                        >
                          新建
                        </Button>
                        <label className="inline-flex">
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            disabled={filesBusy}
                            onChange={(e) => {
                              void onUploadFiles(e.target.files);
                              e.target.value = "";
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={filesBusy}
                            asChild
                          >
                            <span>
                              <Upload className="h-3.5 w-3.5" />
                              上传
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>

                    <div className="flex min-h-72 flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                          {selectedPath ?? "选择文件以预览 / 编辑"}
                        </code>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={filesBusy || !selectedPath}
                          title="下载（base64）"
                          onClick={() =>
                            selectedPath && void onDownloadPath(selectedPath)
                          }
                        >
                          <Download className="h-3.5 w-3.5" />
                          下载
                        </Button>
                        <Button
                          size="sm"
                          disabled={
                            filesBusy ||
                            !selectedPath ||
                            editorBinary ||
                            !editorDirty
                          }
                          onClick={() => void onSaveFile()}
                        >
                          <Save className="h-3.5 w-3.5" />
                          保存
                        </Button>
                      </div>
                      {editorBinary && selectedPath ? (
                        <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                          <File className="h-8 w-8 text-sky-600" />
                          <div>
                            二进制或过大文件
                            {binarySize != null
                              ? `（${binarySize.toLocaleString()} B）`
                              : ""}
                            ，不支持文本编辑。
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                            <Button
                              size="sm"
                              disabled={filesBusy}
                              onClick={() => void onDownloadPath(selectedPath)}
                            >
                              <Download className="h-3.5 w-3.5" />
                              下载
                            </Button>
                            <label className="inline-flex">
                              <input
                                type="file"
                                className="hidden"
                                disabled={filesBusy}
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  if (!f || !sandbox || !selectedPath) return;
                                  setFilesBusy(true);
                                  setFilesError(null);
                                  try {
                                    const buf = new Uint8Array(
                                      await f.arrayBuffer(),
                                    );
                                    await writeFile(
                                      sandbox.id,
                                      selectedPath,
                                      bytesToBase64(buf),
                                      { encoding: "base64" },
                                    );
                                    setBinarySize(buf.length);
                                    await loadFiles(cwd);
                                  } catch (err) {
                                    setFilesError(
                                      err instanceof Error
                                        ? err.message
                                        : String(err),
                                    );
                                  } finally {
                                    setFilesBusy(false);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={filesBusy}
                                asChild
                              >
                                <span>
                                  <Upload className="h-3.5 w-3.5" />
                                  覆盖上传
                                </span>
                              </Button>
                            </label>
                          </div>
                        </div>
                      ) : (
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
                      )}
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

            <TabsContent value="meta" className="space-y-4 pt-3">
              {metaError ? (
                <Alert variant="destructive">
                  <AlertDescription>{metaError}</AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <Card>
                  <CardContent className="space-y-3 pt-4">
                    <div className="text-sm font-medium">空闲超时（滑动）</div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        窗口{" "}
                        <span className="font-medium text-foreground">
                          {sandbox.timeoutMs == null
                            ? "未设置"
                            : `${Math.round(sandbox.timeoutMs / 60_000)} 分钟`}
                        </span>
                        {sandbox.timeoutMs != null ? (
                          <span className="font-mono">
                            {" "}
                            （{sandbox.timeoutMs} ms）
                          </span>
                        ) : null}
                      </p>
                      <p>
                        最近活动{" "}
                        <span
                          className="font-medium text-foreground"
                          title={lastActiveIso}
                        >
                          {formatRelativeTime(lastActiveIso, nowMs)}
                        </span>
                        <span className="ml-1 font-mono text-[11px] opacity-80">
                          {lastActiveIso}
                        </span>
                      </p>
                      {idleLeft ? (
                        <p
                          className={
                            idleLeft === "已到期"
                              ? "font-medium text-amber-700"
                              : "font-medium text-foreground"
                          }
                        >
                          {idleLeft === "已到期"
                            ? "空闲已到期，reaper 将回收"
                            : `距回收约 ${idleLeft}`}
                        </p>
                      ) : (
                        <p>未设置空闲窗口时不会因超时自动销毁。</p>
                      )}
                      <p>命令与文件操作成功后会自动保活（刷新 lastActiveAt）。</p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          空闲窗口（分钟）
                        </label>
                        <Input
                          className="w-28"
                          type="number"
                          min={1}
                          value={extendMin}
                          onChange={(e) => setExtendMin(e.target.value)}
                          disabled={!isActive || metaBusy}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => void onExtendTimeout()}
                        disabled={!isActive || metaBusy}
                      >
                        <Clock3 className="h-3.5 w-3.5" />
                        应用
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void onClearTimeout()}
                        disabled={!isActive || metaBusy}
                      >
                        取消超时
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-3 pt-4">
                    <div className="text-sm font-medium">Metadata</div>
                    <p className="text-xs text-muted-foreground">
                      键值浅合并；仅 string。活动沙箱可改。
                    </p>
                    <ul className="max-h-28 space-y-1 overflow-auto font-mono text-xs">
                      {Object.keys(sandbox.metadata ?? {}).length === 0 ? (
                        <li className="text-muted-foreground">（空）</li>
                      ) : (
                        Object.entries(sandbox.metadata ?? {}).map(([k, v]) => (
                          <li key={k}>
                            <span className="text-muted-foreground">{k}=</span>
                            {v}
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        className="w-28"
                        placeholder="key"
                        value={metaKey}
                        onChange={(e) => setMetaKey(e.target.value)}
                        disabled={!isActive || metaBusy}
                      />
                      <Input
                        className="min-w-[8rem] flex-1"
                        placeholder="value"
                        value={metaVal}
                        onChange={(e) => setMetaVal(e.target.value)}
                        disabled={!isActive || metaBusy}
                      />
                      <Button
                        size="sm"
                        onClick={() => void onAddMetadata()}
                        disabled={!isActive || metaBusy}
                      >
                        合并
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
