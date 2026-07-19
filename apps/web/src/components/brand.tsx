export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="brand-mark"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      灵
    </span>
  );
}

export function BrandLockup({
  subtitle = "F2B-Navo",
}: {
  subtitle?: string;
}) {
  return (
    <div className="brand">
      <BrandMark />
      <div>
        <div className="brand-title">灵境云</div>
        <div className="brand-sub">{subtitle}</div>
      </div>
    </div>
  );
}
