/** 产品预置模板目录（非用户 mock 数据） */

export type TemplateRef = {
  id: string;
  /** 创建沙箱时传给 API 的 template 字段 */
  slug: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  popular?: boolean;
};

export const PRODUCT_TEMPLATES: TemplateRef[] = [
  {
    id: "tpl_base",
    slug: "base",
    name: "Base Linux",
    description: "精简 Linux 根文件系统，适合通用命令与脚本执行。",
    image: "lingjing/base:latest",
    tags: ["linux", "shell"],
    popular: true,
  },
  {
    id: "tpl_code",
    slug: "code-interpreter",
    name: "Code Interpreter",
    description: "预装 Python、Node 等，适合 Agent 写代码与分析。",
    image: "lingjing/code-interpreter:latest",
    tags: ["python", "node", "data"],
    popular: true,
  },
  {
    id: "tpl_browser",
    slug: "browser",
    name: "Browser (soon)",
    description: "带无头浏览器的模板，用于页面抓取与 UI 自动化（路线图）。",
    image: "lingjing/browser:preview",
    tags: ["browser", "preview"],
  },
];

/** 用量页演示序列 — 明确为 mock，待 Usage API */
export type UsagePoint = {
  day: string;
  sandboxHours: number;
  commands: number;
};

export const MOCK_USAGE: UsagePoint[] = [
  { day: "07-13", sandboxHours: 2.1, commands: 48 },
  { day: "07-14", sandboxHours: 3.4, commands: 91 },
  { day: "07-15", sandboxHours: 1.2, commands: 33 },
  { day: "07-16", sandboxHours: 4.8, commands: 120 },
  { day: "07-17", sandboxHours: 2.9, commands: 77 },
  { day: "07-18", sandboxHours: 5.6, commands: 142 },
  { day: "07-19", sandboxHours: 1.8, commands: 54 },
];
