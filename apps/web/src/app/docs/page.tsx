import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Icon, Icons } from "@/components/icons";

export const metadata: Metadata = {
  title: "文档",
  description:
    "灵境云开发者文档：AI 沙箱快速开始、产品 API 与 TypeScript / Python SDK。",
};

export default function DocsPage() {
  return (
    <MarketingShell>
      <section className="section" style={{ paddingTop: 72 }}>
        <div className="section-head">
          <div className="section-label">Docs</div>
          <h2>开发者文档</h2>
          <p>
            完整指南与 API 在{" "}
            <a href="https://github.com/f2b-dev/f2b-docs">f2b-docs</a>
            （quickstart · cookbook · OpenAPI）。本页为控制台内速览。
          </p>
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
                本地端口：控制台 <code className="mono">:13200</code> · 沙箱{" "}
                <code className="mono">:13287</code>（见 f2b-infra）
              </li>
              <li>
                打开 <Link href="/console">控制台</Link>，创建并管理 AI 沙箱
              </li>
              <li>
                同源 BFF <code className="mono">/api/sandboxes</code> 或 SDK 直连{" "}
                <code className="mono">/v1</code>：创建 → 命令 → 文件 → 销毁
              </li>
              <li>用量与 API 密钥走控制面；浏览器不持管理密钥</li>
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
              ：控制台与账号体系常驻，沙箱按需创建、用完即毁。开发者通过 REST / SDK
              获得生命周期、命令流、文件系统与模板能力。数据面 kind 以控制台 /{" "}
              <code className="mono">/healthz</code> 的 <code className="mono">backend</code>{" "}
              为准（当前联调多为 <code className="mono">fake</code>）。
            </p>
          </div>
        </div>

        <div className="split-2" style={{ marginTop: 14 }}>
          <div className="card card-pad">
            <h3 id="sdk" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon={Icons.code} size={18} />
              TypeScript SDK
            </h3>
            <pre className="hero-code" style={{ borderRadius: 12, border: "1px solid var(--border)" }}>
{`import { F2bClient, Sandbox } from "@f2b/sdk";

const client = new F2bClient({
  baseUrl: "http://127.0.0.1:13287",
  // apiKey: process.env.F2B_API_KEY,
});
const sbx = await Sandbox.create(client, { template: "base" });
const { stdout } = await sbx.run("echo hello");
await sbx.kill();`}
            </pre>
          </div>
          <div className="card card-pad">
            <h3 id="api" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon={Icons.network} size={18} />
              REST 与契约
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              产品层 REST 前缀 <code className="mono">/v1</code>
              ：生命周期、命令（含 SSE）、文件、模板、用量。OpenAPI 在{" "}
              <code className="mono">f2b-spec</code>
              。可对标常见沙箱 SDK 习惯；以本仓契约与 healthz 为准。
            </p>
            <div className="alert info" style={{ marginTop: 14 }}>
              真 microVM 单节点需 Linux + KVM 与服务端数据面配置；未配置时控制台展示{" "}
              <code className="mono">fake</code>，不宣称已连生产集群。
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
