import type { ArtKind } from "@/lib/themes";

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generative artwork drawn from the theme's colours and seeded by the slide, so every deck gets its own. */
export function Art({ kind, seed, x = 0, y = 0, w = 1280, h = 720, tone = "accent" }: {
  kind: ArtKind; seed: string; x?: number; y?: number; w?: number; h?: number; tone?: "accent" | "onAccent";
}) {
  const r = rng(seed + kind);
  const a = tone === "accent" ? "var(--s-accent)" : "var(--s-bg)";
  const b = tone === "accent" ? "var(--s-accent2)" : "var(--s-text)";
  const els: React.ReactNode[] = [];
  const id = `g${Math.floor(r() * 1e9)}`;

  if (kind === "orbs") {
    for (let i = 0; i < 5; i++) {
      const cx = x + r() * w, cy = y + r() * h, rad = (0.18 + r() * 0.3) * Math.min(w, h);
      els.push(<circle key={i} cx={cx} cy={cy} r={rad} fill={`url(#${id}${i % 2})`} />);
    }
  } else if (kind === "rings") {
    const cx = x + w * (0.45 + r() * 0.3), cy = y + h * (0.35 + r() * 0.3);
    const n = 7 + Math.floor(r() * 4), step = Math.min(w, h) * 0.085;
    for (let i = 1; i <= n; i++) {
      els.push(<circle key={i} cx={cx} cy={cy} r={i * step} fill="none" stroke={i % 3 === 0 ? b : a} strokeWidth={i % 3 === 0 ? 1.5 : 2.5} opacity={0.2 + (i / n) * 0.6} />);
    }
    els.push(<circle key="dot" cx={cx} cy={cy} r={step * 0.45} fill={a} />);
  } else if (kind === "grid") {
    const cell = 44, cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const v = r();
      const px = x + i * cell + cell / 2, py = y + j * cell + cell / 2;
      if (v > 0.93) els.push(<rect key={`${i}-${j}`} x={px - 15} y={py - 15} width={30} height={30} rx={3} fill={v > 0.975 ? b : a} opacity={0.9} />);
      else els.push(<circle key={`${i}-${j}`} cx={px} cy={py} r={1.8} fill={a} opacity={0.45} />);
    }
  } else if (kind === "lines") {
    const n = 16;
    for (let i = 0; i < n; i++) {
      const y0 = y + (h / n) * (i + 0.5);
      const amp = 20 + r() * 70, ph = r() * 6;
      let d = `M ${x} ${y0}`;
      for (let k = 1; k <= 24; k++) {
        const px = x + (w / 24) * k;
        d += ` L ${px.toFixed(1)} ${(y0 + Math.sin(k / 3.2 + ph + i * 0.35) * amp * (k / 24)).toFixed(1)}`;
      }
      els.push(<path key={i} d={d} fill="none" stroke={i % 5 === 0 ? b : a} strokeWidth={i % 5 === 0 ? 3 : 1.5} opacity={0.35 + r() * 0.5} />);
    }
  } else {
    const u = Math.min(w, h) / 4;
    for (let i = 0; i < 9; i++) {
      const gx = x + Math.floor(r() * (w / u)) * u, gy = y + Math.floor(r() * (h / u)) * u;
      const t = r();
      if (t < 0.4) els.push(<rect key={i} x={gx} y={gy} width={u} height={u} fill={i % 3 ? a : b} opacity={0.9} />);
      else if (t < 0.7) els.push(<circle key={i} cx={gx + u / 2} cy={gy + u / 2} r={u / 2} fill={i % 2 ? a : b} opacity={0.9} />);
      else els.push(<path key={i} d={`M ${gx} ${gy + u} A ${u} ${u} 0 0 1 ${gx + u} ${gy} L ${gx + u} ${gy + u} Z`} fill={i % 2 ? b : a} opacity={0.9} />);
    }
  }

  return (
    <svg className="sl-art" viewBox="0 0 1280 720" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}0`}><stop offset="0%" stopColor={a} stopOpacity="0.85" /><stop offset="100%" stopColor={a} stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}1`}><stop offset="0%" stopColor={b} stopOpacity="0.6" /><stop offset="100%" stopColor={b} stopOpacity="0" /></radialGradient>
        <clipPath id={`${id}c`}><rect x={x} y={y} width={w} height={h} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>{els}</g>
    </svg>
  );
}
