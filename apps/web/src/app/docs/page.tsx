import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Icon, Icons } from "@/components/icons";

export const metadata: Metadata = {
  title: "文档",
  description:
    "灵境云开发者文档：AI 沙箱快速开始、Control API 与 TypeScript SDK。",
};

export default function DocsPage() {
  return (
    <MarketingShell>
      <section className="section" style={{ paddingTop: 72 }}>
        <div className="section-head">
          <div className="section-label">Docs</div>
          <h2>开发者文档</h2>
          <p>V1 文档站雏形。完整 API 参考将随 Control API 与 SDK 包发布同步补齐。</p>
        </div>

        <div className="split-2">
          <div className="card card-pad">
            <h3
              id="quickstart"
              style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}
            >
              <Icon icon={Icons.zap} size={18} />
              快速开始
            </h3>
            <ol style={{ color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 18 }}>
              <li>
                克隆本仓库，<code className="mono">pnpm install && pnpm dev</code>
              </li>
              <li>
                打开 <Link href="/console">控制台</Link>，创建并管理 AI 沙箱
              </li>
              <li>
                调用 <code className="mono">/api/sandboxes</code> 或{" "}
                <code className="mono">@f2b/sdk</code>：创建 → 执行命令 → 读写文件 → 销毁
              </li>
              <li>在控制台查看用量与 API 密钥（演示环境可用 mock 数据）</li>
            </ol>
          </div>
          <div className="card card-pad">
            <h3
              id="architecture"
              style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}
            >
              <Icon icon={Icons.boxes} size={18} />
              架构
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <strong>灵境云</strong>是面向 AI Agent 的<strong>安全执行云</strong>
              ：控制台与账号体系常驻，沙箱按秒创建、用完即毁。开发者通过 REST / SDK
              获得生命周期、命令流、文件系统与模板能力；企业侧可对接密钥、配额与用量。
            </p>
          </div>
        </div>

        <div className="split-2" style={{ marginTop: 14 }}>
          <div className="card card-pad">
            <h3 id="sdk" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon={Icons.code} size={18} />
              TypeScript SDK（预览）
            </h3>
            <pre className="hero-code" style={{ borderRadius: 12, border: "1px solid var(--border)" }}>
{`import { Sandbox } from '@lingjing/sdk'

const sandbox = await Sandbox.create({
  apiKey: process.env.LINGJING_API_KEY!,
  template: 'code-interpreter',
})

const { stdout } = await sandbox.commands.run('echo hello')
const bytes = await sandbox.files.read('/workspace/out.txt')
await sandbox.kill()`}
            </pre>
          </div>
          <div className="card card-pad">
            <h3 id="api" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon={Icons.network} size={18} />
              REST 与 E2B
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Control API 提供沙箱生命周期 / 命令 / 文件的产品层 REST。
              CubeAPI 侧保持 E2B 兼容子集；对外文档会标注兼容范围。
              设置 base URL + API Key 后，可尽量复用熟悉的沙箱 SDK 习惯。
            </p>
            <div className="alert info" style={{ marginTop: 14 }}>
              当前仓库仍以 mock 控制台 + 既有 Agent runtime 为主；Sandbox Control API 与{" "}
              <code className="mono">runtime-cube</code> 在下一阶段落地。
            </div>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Link href="/console" className="btn btn-primary">
            <Icon icon={Icons.dashboard} size={14} />
            打开控制台体验
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
