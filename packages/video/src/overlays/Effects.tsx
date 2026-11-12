import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import type { ParticleKind } from "../../../core/src/schemas.ts";
import { useTheme } from "../theme.tsx";

/**
 * SVG filter: optional one-axis blur (motion blur) followed by an RGB channel split
 * (chromatic aberration / glitch). Referenced as `filter: url(#id)`.
 */
export const LayerFilter: React.FC<{ id: string; blur?: { x: number; y: number }; split?: number }> = ({ id, blur, split = 0 }) => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation={`${blur?.x ?? 0} ${blur?.y ?? 0}`} result="b" />
      {split > 0.2 ? (
        <>
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={split} result="ro" />
          <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bl" />
          <feOffset in="bl" dx={-split} result="bo" />
          <feBlend in="ro" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="bo" mode="screen" />
        </>
      ) : null}
    </filter>
  </svg>
);

const PARTICLES: Record<Exclude<ParticleKind, "none">, { n: number; size: [number, number]; vx: number; vy: number; soft: number; twinkle: boolean }> = {
  dust: { n: 70, size: [1.5, 4], vx: 0.25, vy: -0.15, soft: 0.4, twinkle: true },
  bokeh: { n: 22, size: [30, 110], vx: 0.15, vy: -0.25, soft: 1, twinkle: false },
  embers: { n: 45, size: [2, 6], vx: 0.3, vy: -1.6, soft: 0.5, twinkle: true },
  stars: { n: 120, size: [1, 3], vx: 0.03, vy: 0.02, soft: 0.2, twinkle: true },
  snow: { n: 90, size: [2, 7], vx: 0.3, vy: 1.4, soft: 0.6, twinkle: false },
};

/** Three particle planes (far / mid / near). Depth widens the speed and blur gap between them. */
export const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const { style } = useTheme();
  const { particles, particleAmount, depth } = style.effects;
  if (particles === "none" || particleAmount <= 0) return null;
  const spec = PARTICLES[particles];
  const color = particles === "embers" ? "#ffad5c" : particles === "bokeh" ? style.palette.accent : style.palette.fg;
  const planes = [
    { speed: 1 - depth * 0.6, scale: 0.6, blur: 0, alpha: 0.6 },
    { speed: 1, scale: 1, blur: depth * 1.5, alpha: 0.8 },
    { speed: 1 + depth * 1.8, scale: 1 + depth * 1.4, blur: depth * 6, alpha: 0.9 },
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: particles === "bokeh" ? "screen" : "normal" }}>
      {planes.map((pl, pi) => (
        <svg key={pi} width={W} height={H} style={{ position: "absolute", filter: pl.blur ? `blur(${pl.blur}px)` : undefined }}>
          {Array.from({ length: Math.round(spec.n * particleAmount / 3) }, (_, i) => {
            const seed = `${particles}${pi}-${i}`;
            const r = (spec.size[0] + random(seed + "s") * (spec.size[1] - spec.size[0])) * pl.scale;
            const x = ((random(seed + "x") * W + frame * spec.vx * pl.speed * 3) % (W + 200) + W + 200) % (W + 200) - 100;
            const y = ((random(seed + "y") * H + frame * spec.vy * pl.speed * 3) % (H + 200) + H + 200) % (H + 200) - 100;
            const tw = spec.twinkle ? 0.5 + 0.5 * Math.sin(frame / (6 + random(seed + "t") * 14) + i) : 1;
            return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={pl.alpha * tw * (particles === "bokeh" ? 0.18 : 0.8)}
              style={spec.soft > 0.5 ? { filter: `blur(${r * 0.15}px)` } : undefined} />;
          })}
        </svg>
      ))}
    </AbsoluteFill>
  );
};

/** Slow drifting warm light, screen-blended. */
export const LightLeaks: React.FC = () => {
  const frame = useCurrentFrame();
  const { style } = useTheme();
  const a = style.effects.lightLeaks;
  if (a <= 0) return null;
  const t = frame / 30;
  const x1 = 20 + Math.sin(t * 0.37) * 30, y1 = 15 + Math.cos(t * 0.23) * 20;
  const x2 = 80 + Math.cos(t * 0.29) * 25, y2 = 85 + Math.sin(t * 0.31) * 15;
  const pulse = 0.75 + 0.25 * Math.sin(t * 0.8);
  return (
    <AbsoluteFill style={{
      mixBlendMode: "screen", opacity: a * 0.7 * pulse, pointerEvents: "none",
      background: `radial-gradient(circle at ${x1}% ${y1}%, rgba(255,140,60,.75), transparent 45%), radial-gradient(circle at ${x2}% ${y2}%, ${style.palette.accent}aa, transparent 40%)`,
    }} />
  );
};

/** Handheld drift for the whole picture (not captions). */
export function useShake(): string | undefined {
  const frame = useCurrentFrame();
  const { style } = useTheme();
  const s = style.effects.shake;
  if (s <= 0) return undefined;
  const t = frame / 30;
  const x = (Math.sin(t * 1.3) + Math.sin(t * 2.9 + 1) * 0.5) * 10 * s;
  const y = (Math.cos(t * 1.1) + Math.sin(t * 3.7 + 2) * 0.4) * 10 * s;
  const r = Math.sin(t * 0.9) * 0.4 * s;
  return `translate(${x}px, ${y}px) rotate(${r}deg) scale(${1 + 0.03 * s})`;
}

export const glowShadow = (glow: number, color: string) =>
  glow > 0 ? `0 0 ${12 + glow * 30}px ${color}${Math.round(glow * 200).toString(16).padStart(2, "0")}` : "none";

export const fadeIn = (frame: number, from: number, len: number) =>
  interpolate(frame, [from, from + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
