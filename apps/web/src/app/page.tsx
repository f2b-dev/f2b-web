import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Icon, Icons } from "@/components/icons";

const FEATURES = [
  {
    icon: Icons.zap,
    title: "秒级沙箱生命周期",
    desc: "Create / Connect / Kill，可选 Pause/Resume。用完即毁，成本可归因到每次执行。",
  },
  {
    icon: Icons.terminal,
    title: "命令与文件一等公民",
    desc: "流式 stdout/stderr、读写上传下载，Agent 工具链直接对接，无需再包一层 shell 胶水。",
  },
  {
    icon: Icons.template,
    title: "模板可复用",
    desc: "Base Linux、Code Interpreter 预置开箱；后续可接自定义镜像与 Tag 流水线。",
  },
  {
    icon: Icons.network,
    title: "网络策略可控",
    desc: "一键开关公网访问；细粒度域名/IP 白名单在路线图中，满足企业合规。",
  },
  {
    icon: Icons.code,
    title: "熟悉的沙箱 API 形态",
    desc: "REST / SDK 对齐常见沙箱开发习惯，降低迁移或双写成本；以本仓契约与 healthz 为准。",
  },
  {
    icon: Icons.dashboard,
    title: "云厂商级控制台",
    desc: "项目、密钥、用量、审计入口齐全——不是聊天 demo，是可运营的基础设施产品。",
  },
] as const;

export default function HomePage() {
  return (
    <MarketingShell>
      <section className="mkt-hero">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot">
              <Icon icon={Icons.sparkles} size={12} />
            </span>
            云厂商级 AI 沙箱基础设施
          </div>
          <h1>
            给每个 Agent
            <br />
            <span className="grad">一间用完即焚的 Linux 办公室</span>
          </h1>
          <p className="lead">
            灵境云（F2B-Navo）提供<strong>自研 AI 沙箱服务</strong>：为每个
            Agent 准备独立、用完即焚的 Linux 执行环境——跑代码、敲命令、读写文件、受控上网。
            开发者用 SDK，团队用控制台，企业可自托管。
          </p>
          <div className="mkt-cta-row">
            <Link href="/console" className="btn btn-primary btn-lg">
              打开控制台
              <Icon icon={Icons.chevronRight} size={16} />
            </Link>
            <Link href="/docs" className="btn btn-secondary btn-lg">
              <Icon icon={Icons.docs} size={16} />
              查看文档
            </Link>
          </div>
          <div className="trust-row">
            <span>
              <Icon icon={Icons.shield} size={14} /> 独立内核隔离
            </span>
            <span>
              <Icon icon={Icons.code} size={14} /> 开发者友好 API
            </span>
            <span>
              <Icon icon={Icons.boxes} size={14} /> 秒级创建与销毁
            </span>
            <span>
              <Icon icon={Icons.zap} size={14} /> 毫秒级冷启动
            </span>
          </div>
        </div>

        <div className="hero-panel" aria-hidden>
          <div className="hero-panel-bar">
            <div className="dots">
              <i />
              <i />
              <i />
            </div>
            <div className="label">quickstart.ts</div>
          </div>
          <pre className="hero-code">{`import { Sandbox } from '@lingjing/sdk'

// 60 秒跑通：创建 → 命令 → 文件 → 销毁
const sbx = await Sandbox.create({
  template: 'code-interpreter',
  timeoutMs: 300_000,
})

const r = await sbx.commands.run('python -c "print(40+2)"')
console.log(r.stdout) // 42

await sbx.files.write('/workspace/out.txt', 'ok')
await sbx.kill()`}</pre>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="section-label">Why 灵境云</div>
          <h2>为 Agent 场景设计的执行云</h2>
          <p>
            控制面常驻，数据面按秒弹性。不用为每个任务养长驻机器，也不用把危险代码跑在业务进程里。
          </p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature-card">
              <div className="feature-icon">
                <Icon icon={f.icon} size={18} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="section-label">Products</div>
          <h2>产品矩阵</h2>
          <p>首发 AI 沙箱；后续产品线将挂在同一控制台与账号体系下。</p>
        </div>
        <div className="product-matrix">
          <article className="product-card primary">
            <span className="pill live">Live · V1</span>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon={Icons.sandbox} size={18} />
              AI 沙箱
            </h3>
            <p>
              面向 Agent 与自动化流水线的安全执行环境：一键创建与销毁、流式命令、文件读写与可复用模板，
              把不可信代码关在沙箱里跑完即走。
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/products/sandbox" className="btn btn-primary btn-sm">
                了解产品
                <Icon icon={Icons.chevronRight} size={14} />
              </Link>
              <Link href="/console/sandboxes" className="btn btn-secondary btn-sm">
                <Icon icon={Icons.boxes} size={14} />
                管理沙箱
              </Link>
            </div>
          </article>
          <article className="product-card soon">
            <span className="pill soon">Soon</span>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon={Icons.lab} size={18} />
              Agent Runtime
            </h3>
            <p>托管 Agent 循环与工具编排，与沙箱深度集成。当前可在控制台 Agent Lab 预览。</p>
          </article>
          <article className="product-card soon">
            <span className="pill soon">Soon</span>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon icon={Icons.template} size={18} />
              模板市场
            </h3>
            <p>团队共享镜像与环境快照，一键拉起标准化运行时。</p>
          </article>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div
          className="card card-pad"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            background:
              "radial-gradient(600px 200px at 0% 50%, rgba(255,92,51,0.12), transparent 60%), #fff",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, letterSpacing: "-0.03em" }}>
              60 秒创建你的第一个沙箱
            </h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              控制台可视化操作，或一行 SDK。无 KVM 环境也可完整演示 mock 流程。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/console/sandboxes/new" className="btn btn-primary">
              <Icon icon={Icons.plus} size={14} />
              立即创建
            </Link>
            <Link href="/pricing" className="btn btn-secondary">
              查看定价
              <Icon icon={Icons.chevronRight} size={14} />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
