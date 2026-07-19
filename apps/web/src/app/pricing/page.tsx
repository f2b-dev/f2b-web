import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Icon, Icons } from "@/components/icons";

export const metadata: Metadata = {
  title: "定价",
  description: "灵境云定价：按沙箱时长与规格计费，开发者免费额度起步。",
};

const PLANS = [
  {
    name: "Developer",
    price: "¥0",
    period: "/ 月起",
    desc: "个人试用与本地联调",
    features: ["每月 20 沙箱小时", "2 并发沙箱", "社区模板", "API Key × 2", "社区支持"],
    cta: "免费开始",
    href: "/console",
    featured: false,
  },
  {
    name: "Team",
    price: "按量",
    period: " · 预付费",
    desc: "团队 Agent 与流水线",
    features: [
      "按 vCPU·时计费",
      "20 并发沙箱",
      "私有模板",
      "项目与角色",
      "工单支持",
    ],
    cta: "联系开通",
    href: "/console",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "定制",
    period: "",
    desc: "专有云 / 自托管",
    features: ["专属集群", "VPC 与审计", "SLA", "合规支持", "Cube 联合部署"],
    cta: "预约沟通",
    href: "/docs",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="section" style={{ paddingTop: 72 }}>
        <div className="section-head">
          <div className="section-label">Pricing</div>
          <h2>简单透明，按执行付费</h2>
          <p>控制面常驻免费；沙箱按运行时长与规格计量。以下为 V1 示意价，上线前可调整。</p>
        </div>
        <div className="pricing-grid">
          {PLANS.map((p) => (
            <article key={p.name} className={`price-card ${p.featured ? "featured" : ""}`}>
              <div>
                <h3>{p.name}</h3>
                <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>{p.desc}</p>
              </div>
              <div className="price">
                {p.price}
                <span>{p.period}</span>
              </div>
              <ul>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon icon={Icons.check} size={14} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`btn ${p.featured ? "btn-primary" : "btn-secondary"}`}
              >
                {p.cta}
                <Icon icon={Icons.chevronRight} size={14} />
              </Link>
            </article>
          ))}
        </div>
        <p style={{ marginTop: 28, color: "var(--muted)", fontSize: 13 }}>
          * 示意定价。真实账单将基于 UsageEvent（时长、规格）聚合；控制台用量页可预览计量形态。
        </p>
      </section>
    </MarketingShell>
  );
}
