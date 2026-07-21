/** 本地兜底（仅离线/测试）；生产控制台走 GET /v1/templates */

export type CatalogTemplate = {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  popular?: boolean;
};

export const PRODUCT_TEMPLATES: CatalogTemplate[] = [
  {
    id: "base",
    name: "Base Linux",
    description: "精简 Linux 根文件系统，适合通用命令与脚本执行。",
    image: "lingjing/base:latest",
    tags: ["linux", "shell"],
    popular: true,
  },
  {
    id: "code-interpreter",
    name: "Code Interpreter",
    description: "预装 Python、Node 等，适合 Agent 写代码与分析。",
    image: "lingjing/code-interpreter:latest",
    tags: ["python", "node", "data"],
    popular: true,
  },
  {
    id: "browser",
    name: "Browser (soon)",
    description: "带无头浏览器的模板，用于页面抓取与 UI 自动化（路线图）。",
    image: "lingjing/browser:preview",
    tags: ["browser", "preview"],
  },
];
