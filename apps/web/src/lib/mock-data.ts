export type SandboxStatus =
  | "provisioning"
  | "running"
  | "paused"
  | "succeeded"
  | "failed"
  | "killed";

export type SandboxRecord = {
  id: string;
  name: string;
  template: string;
  status: SandboxStatus;
  region: string;
  cpu: string;
  memory: string;
  internet: boolean;
  createdAt: string;
  durationSec: number;
  project: string;
};

export type TemplateRef = {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  popular?: boolean;
};

export type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  scopes: string[];
};

export type UsagePoint = {
  day: string;
  sandboxHours: number;
  commands: number;
};

export const MOCK_SANDBOXES: SandboxRecord[] = [
  {
    id: "sbx_8f2a1c9e",
    name: "agent-eval-01",
    template: "code-interpreter",
    status: "running",
    region: "cn-hangzhou",
    cpu: "2 vCPU",
    memory: "4 GB",
    internet: true,
    createdAt: "2026-07-19T10:12:00.000Z",
    durationSec: 842,
    project: "default",
  },
  {
    id: "sbx_3b71d0aa",
    name: "ppt-pipeline",
    template: "base",
    status: "paused",
    region: "cn-hangzhou",
    cpu: "1 vCPU",
    memory: "2 GB",
    internet: false,
    createdAt: "2026-07-19T08:40:00.000Z",
    durationSec: 2104,
    project: "default",
  },
  {
    id: "sbx_c0ee9122",
    name: "ci-smoke",
    template: "code-interpreter",
    status: "killed",
    region: "ap-guangzhou",
    cpu: "2 vCPU",
    memory: "4 GB",
    internet: true,
    createdAt: "2026-07-18T22:05:00.000Z",
    durationSec: 96,
    project: "ci",
  },
  {
    id: "sbx_11ad44f0",
    name: "docs-build",
    template: "base",
    status: "failed",
    region: "cn-hangzhou",
    cpu: "1 vCPU",
    memory: "2 GB",
    internet: true,
    createdAt: "2026-07-18T19:20:00.000Z",
    durationSec: 41,
    project: "default",
  },
];

export const MOCK_TEMPLATES: TemplateRef[] = [
  {
    id: "tpl_base",
    name: "Base Linux",
    description: "精简 Debian 根文件系统，适合通用命令与脚本执行。",
    image: "lingjing/base:latest",
    tags: ["linux", "shell"],
    popular: true,
  },
  {
    id: "tpl_code",
    name: "Code Interpreter",
    description: "预装 Python、Node、常用数据科学库，适合 Agent 写代码与分析。",
    image: "lingjing/code-interpreter:latest",
    tags: ["python", "node", "data"],
    popular: true,
  },
  {
    id: "tpl_browser",
    name: "Browser (soon)",
    description: "带无头浏览器的模板，用于页面抓取与 UI 自动化（路线图）。",
    image: "lingjing/browser:preview",
    tags: ["browser", "preview"],
  },
];

export const MOCK_API_KEYS: ApiKeyRecord[] = [
  {
    id: "key_01",
    name: "local-dev",
    prefix: "lj_live_9k2m",
    createdAt: "2026-07-10T04:00:00.000Z",
    lastUsedAt: "2026-07-19T11:02:00.000Z",
    scopes: ["sandboxes:write", "sandboxes:read"],
  },
  {
    id: "key_02",
    name: "ci-bot",
    prefix: "lj_live_c8pq",
    createdAt: "2026-07-12T09:30:00.000Z",
    lastUsedAt: "2026-07-18T22:01:00.000Z",
    scopes: ["sandboxes:write"],
  },
];

export const MOCK_USAGE: UsagePoint[] = [
  { day: "07-13", sandboxHours: 2.1, commands: 48 },
  { day: "07-14", sandboxHours: 3.4, commands: 91 },
  { day: "07-15", sandboxHours: 1.2, commands: 33 },
  { day: "07-16", sandboxHours: 4.8, commands: 120 },
  { day: "07-17", sandboxHours: 2.9, commands: 77 },
  { day: "07-18", sandboxHours: 5.6, commands: 142 },
  { day: "07-19", sandboxHours: 1.8, commands: 54 },
];

export const MOCK_FILES = [
  { path: "/workspace/main.py", size: "2.4 KB", kind: "file" as const },
  { path: "/workspace/report.md", size: "8.1 KB", kind: "file" as const },
  { path: "/workspace/data/", size: "—", kind: "dir" as const },
  { path: "/workspace/data/sample.csv", size: "14 KB", kind: "file" as const },
  { path: "/tmp/agent.log", size: "1.1 KB", kind: "file" as const },
];

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function getSandbox(id: string): SandboxRecord | undefined {
  return MOCK_SANDBOXES.find((s) => s.id === id);
}
