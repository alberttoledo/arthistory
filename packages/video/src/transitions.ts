import type { CSSProperties } from "react";
import { Easing, interpolate, random } from "remotion";
import type { TransitionName } from "../../core/src/schemas.ts";

const ease = Easing.bezier(0.65, 0, 0.35, 1);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export interface Enter {
  style: CSSProperties;
  /** directional blur in px (rendered as an SVG filter so it can be one-axis) */
  blur?: { x: number; y: number };
  /** white or warm flash drawn above the scene */
  flash?: { opacity: number; color: string };
  /** RGB split in px, for glitch */
  split?: number;
}

/**
 * How a scene enters over the previous one. p goes 0 → 1 across the overlap.
 * `mb` (0..1) is the channel's motion blur strength.
 */
export function enter(name: TransitionName, rawP: number, mb: number, frame: number): Enter {
  const p = ease(clamp01(rawP));
  const speed = Math.sin(clamp01(rawP) * Math.PI); // 0 → 1 → 0, peak velocity mid-move
  const k = 0.25 + mb * 1.5;
  switch (name) {
    case "cut":
      return { style: {} };
    case "crossfade":
      return { style: { opacity: p } };
    case "zoom":
      return {
        style: { opacity: interpolate(p, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }), transform: `scale(${interpolate(p, [0, 1], [1.4, 1])})` },
        blur: { x: speed * 18 * k, y: speed * 18 * k },
      };
    case "zoom-out":
      return {
        style: { opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }), transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})` },
        blur: { x: speed * 14 * k, y: speed * 14 * k },
      };
    case "whip":
      return { style: { transform: `translateX(${interpolate(p, [0, 1], [100, 0])}%)` }, blur: { x: speed * 60 * k, y: 0 } };
    case "push":
      return { style: { transform: `translateX(${interpolate(p, [0, 1], [100, 0])}%)`, boxShadow: "-40px 0 80px rgba(0,0,0,.5)" }, blur: { x: speed * 25 * k, y: 0 } };
    case "slide-up":
      return { style: { transform: `translateY(${interpolate(p, [0, 1], [100, 0])}%)` }, blur: { x: 0, y: speed * 50 * k } };
    case "wipe":
      return { style: { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` } };
    case "iris":
      return { style: { clipPath: `circle(${p * 120}% at 50% 50%)` } };
    case "flash":
      return { style: { opacity: rawP < 0.5 ? 0 : 1 }, flash: { opacity: Math.max(0, 1 - Math.abs(rawP - 0.5) * 2.4), color: "#ffffff" } };
    case "film-burn":
      return {
        style: { opacity: interpolate(rawP, [0.3, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) },
        flash: { opacity: Math.max(0, 1 - Math.abs(rawP - 0.45) * 2.2) * 0.9, color: "#ffb15c" },
      };
    case "blur":
      return { style: { opacity: p }, blur: { x: (1 - p) * 40, y: (1 - p) * 40 } };
    case "glitch": {
      // Stepped jitter: hold for 2 frames at a time so it reads as digital, not wobbly.
      const step = Math.floor(frame / 2);
      const on = rawP < 0.85;
      const dx = on ? (random(`gx${step}`) - 0.5) * 120 * (1 - p) : 0;
      return {
        style: { opacity: rawP < 0.15 ? 0 : 1, transform: `translateX(${dx}px)`, clipPath: on && random(`gc${step}`) > 0.5 ? `inset(${random(`gt${step}`) * 30}% 0 ${random(`gb${step}`) * 30}% 0)` : undefined },
        split: on ? 14 * (1 - p) + 4 : 0,
      };
    }
  }
}
