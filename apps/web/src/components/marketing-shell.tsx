import Link from "next/link";
import { BrandLockup } from "./brand";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt">
      <header className="mkt-nav">
        <Link href="/">
          <BrandLockup />
        </Link>
        <nav className="mkt-nav-links" aria-label="主导航">
          <Link href="/products/sandbox">产品</Link>
          <Link href="/pricing">定价</Link>
          <Link href="/docs">文档</Link>
          <Link href="/console">控制台</Link>
        </nav>
        <div className="mkt-nav-actions">
          <Link href="/docs" className="btn btn-ghost btn-sm">
            开发者文档
          </Link>
          <Link href="/console" className="btn btn-primary btn-sm">
            进入控制台
          </Link>
        </div>
      </header>
      {children}
      <footer className="mkt-footer">
        <div className="mkt-footer-inner">
          <div>
            <BrandLockup subtitle="AI Sandbox Cloud" />
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 14, maxWidth: 280 }}>
              给每个 Agent 一间用完即焚的 Linux 办公室。安全隔离 · 秒级弹性 ·
              E2B 兼容 API。
            </p>
          </div>
          <div>
            <h4>产品</h4>
            <Link href="/products/sandbox">AI 沙箱</Link>
            <Link href="/console/templates">模板市场</Link>
            <Link href="/docs">文档</Link>
          </div>
          <div>
            <h4>开发者</h4>
            <Link href="/docs">快速开始</Link>
            <Link href="/docs#sdk">TypeScript SDK</Link>
            <Link href="/docs#api">REST API</Link>
          </div>
          <div>
            <h4>公司</h4>
            <Link href="/pricing">定价</Link>
            <Link href="/console">控制台</Link>
            <Link href="/docs">联系与支持</Link>
          </div>
        </div>
        <div className="mkt-footer-bottom">
          <span>© {new Date().getFullYear()} 灵境云 F2B-Navo</span>
          <span>自研 AI 沙箱 · 安全执行云</span>
        </div>
      </footer>
    </div>
  );
}
