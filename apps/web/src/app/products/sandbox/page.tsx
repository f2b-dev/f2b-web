import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Icon, Icons } from "@/components/icons";

export const metadata: Metadata = {
  title: "AI 沙箱",
  description:
    "灵境云自研 AI 沙箱服务：独立内核隔离、命令流、文件系统、模板与开发者 API。",
};

const CAPABILITIES = [
  {
    icon: Icons.zap,
    title: "生命周期",
    desc: "Create / List / Kill；Pause/Resume 已支持（视数据面能力）",
  },
  {
    icon: Icons.terminal,
    title: "命令执行",
    desc: "Shell 与 SSE 流式 stdout/stderr；可选 cwd / env / timeoutMs",
  },
  {
    icon: Icons.folder,
    title: "文件系统",
    desc: "读写（utf8/base64）、列目录、mkdir/rename/delete",
  },
  {
    icon: Icons.template,
    title: "模板",
    desc: "预置模板目录；自定义构建流水线后置",
  },
  {
    icon: Icons.network,
    title: "网络与预览",
    desc: "allowInternetAccess 开关；控制台隧道预览（BFF）",
  },
  {
    icon: Icons.shield,
    title: "隔离",
    desc: "独立执行环境；控制面与数据面分离，浏览器不持管理密钥",
  },
] as const;

export default function SandboxProductPage() {
  return (
    <MarketingShell>
      <section className="section" style={{ paddingTop: 72 }}>
        <div className="section-head">
          <div className="section-label">Product · AI Sandbox</div>
          <h2>AI Agent 的安全执行环境</h2>
          <p>
            每个沙箱是一间独立的 Linux 办公室：跑不可信代码、装依赖、写产物，用完销毁。
            控制台可视化管理，SDK / API 同一套能力，专为 Agent 与自动化流水线设计。
          </p>
        </div>

        <div className="feature-grid" style={{ marginBottom: 40 }}>
          {CAPABILITIES.map((c) => (
            <article key={c.title} className="feature-card">
              <div className="feature-icon">
                <Icon icon={c.icon} size={18} />
              </div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </article>
          ))}
        </div>

        <div className="split-2">
          <div className="card card-pad">
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon={Icons.boxes} size={18} />
              架构位置
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              浏览器与 SDK 只接触灵境云控制面（JWT / API Key 或同源 BFF）。
              数据面凭证仅服务端持有。命令流式输出走 SSE；用量与 API Key 落控制面。
            </p>
            <pre
              className="hero-code"
              style={{
                marginTop: 16,
                borderRadius: 12,
                border: "1px solid #2b303b",
                background: "var(--code-bg)",
              }}
            >{`Client  →  灵境云 Control / BFF  →  沙箱服务
                    │ 鉴权 / 配额 / 审计
                    └─ 用量落库 · 模板元数据`}</pre>
          </div>
          <div className="card card-pad">
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon={Icons.play} size={18} />
              快速体验
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)", lineHeight: 1.8 }}>
              <li>打开控制台 → AI 沙箱 → 创建</li>
              <li>选择模板与网络策略</li>
              <li>在详情页执行命令、浏览文件</li>
              <li>销毁后状态与用量一致</li>
            </ul>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Link href="/console/sandboxes" className="btn btn-primary">
                <Icon icon={Icons.sandbox} size={14} />
                进入控制台
              </Link>
              <Link href="/docs" className="btn btn-secondary">
                <Icon icon={Icons.docs} size={14} />
                阅读文档
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
