import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Icon, Icons } from "@/components/icons";

export const metadata: Metadata = {
  title: "定价",
  description:
    "灵境云定价示意：当前阶段用量可观测；完整账单扣款后置。开发者可本地 / 单机试用。",
};

const PLANS = [
  {
    name: "Developer",
    price: "¥0",
    period: "/ 试用",
    desc: "个人联调与演示（当前主路径）",
    features: [
      "控制台 + BFF + SDK / MCP",
      "Fake 数据面完整生命周期",
      "用量聚合（沙箱时 / 命令）",
      "API Key（明文仅创建一次）",
      "单机并发硬顶可配置",
    ],
    cta: "打开控制台",
    href: "/console",
    featured: false,
  },
  {
    name: "Team",
    price: "规划中",
    period: "",
    desc: "团队与流水线（未开放扣款）",
    features: [
      "按沙箱时长计量（示意）",
      "更高并发与项目维度",
      "预览隧道 / 模板目录",
      "工单支持（规划）",
      "非当前可下单档",
    ],
    cta: "查看用量形态",
    href: "/console/usage",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "定制",
    period: "",
    desc: "专有部署与合规（洽谈）",
    features: [
      "单机 / 私有化 all-in-one",
      "VPC 与审计（规划）",
      "容量分档与 SLA 协商",
      "不承诺未交付的多节点集群",
      "预约沟通",
    ],
    cta: "阅读架构文档",
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
          <h2>先能力后账单</h2>
          <p>
            当前产品以<strong>可验收能力</strong>为主：创建 / 命令 / 文件 / 模板 /
            用量 / 隧道。完整多云扣款与账单
            <strong>未接入</strong>；下表为档位示意，避免超卖未实现能力。
          </p>
        </div>
        <div className="pricing-grid">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={`price-card ${p.featured ? "featured" : ""}`}
            >
              <div>
                <h3>{p.name}</h3>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  {p.desc}
                </p>
              </div>
              <div className="price">
                {p.price}
                <span>{p.period}</span>
              </div>
              <ul>
                {p.features.map((f) => (
                  <li
                    key={f}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
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
          * 控制台「用量」页展示真实聚合；扣款 / 发票后置。并发上限见单机{" "}
          <code>F2B_MAX_CONCURRENT_SANDBOXES</code> 与容量文档，非无限弹性。
        </p>
      </section>
    </MarketingShell>
  );
}
