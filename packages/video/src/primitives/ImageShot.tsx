import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Visual } from "../../../core/src/schemas.ts";
import { useTheme } from "../theme.tsx";

type ImageVisual = Extract<Visual, { type: "image" }>;
interface Props {
  visual: ImageVisual;
  asset: { file: string; width: number; height: number };
  /** frames this shot is on screen, including transition overlap */
  span: number;
}

const ease = Easing.bezier(0.33, 0, 0.2, 1);

/** Camera move over a still: focus point + zoom interpolated from → to, edges never exposed. */
export const ImageShot: React.FC<Props> = ({ visual, asset, span }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const { src, style } = useTheme();
  const depth = style.effects.depth;
  const t = ease(interpolate(frame, [0, Math.max(1, span)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const fx = lerp(visual.from.x, visual.to.x);
  const fy = lerp(visual.from.y, visual.to.y);
  const zoom = lerp(visual.from.zoom, visual.to.zoom);

  const place = (fit: "cover" | "contain", z: number) => {
    const base = fit === "cover"
      ? Math.max(W / asset.width, H / asset.height)
      : Math.min(W / asset.width, H / asset.height);
    const dw = asset.width * base * z;
    const dh = asset.height * base * z;
    const clamp = (v: number, size: number, frameSize: number) =>
      size >= frameSize ? Math.min(0, Math.max(frameSize - size, v)) : (frameSize - size) / 2;
    return {
      width: dw, height: dh,
      left: clamp(W / 2 - fx * dw, dw, W),
      top: clamp(H / 2 - fy * dh, dh, H),
    };
  };

  const img = src(asset.file);
  // Depth: a blurred plate behind the picture moves at half the camera speed (parallax),
  // and the picture itself tilts in 3D toward where the camera is heading.
  const plateZoom = 1.15 + (zoom - visual.from.zoom) * 0.5;
  const tiltY = (fx - 0.5) * -10 * depth + Math.sin(frame / 45) * 2 * depth;
  const tiltX = (fy - 0.5) * 7 * depth + Math.cos(frame / 53) * 1.5 * depth;
  const plate = (blur: number, bright: number) => (
    <Img src={img} style={{ position: "absolute", ...place("cover", plateZoom), filter: `blur(${blur}px) brightness(${bright})` }} />
  );
  if (visual.fit === "contain") {
    const fg = place("contain", zoom);
    return (
      <AbsoluteFill style={{ overflow: "hidden", perspective: 1600 }}>
        {plate(40, 0.45)}
        <Img src={img} style={{
          position: "absolute", ...fg,
          transform: depth > 0 ? `rotateY(${tiltY}deg) rotateX(${tiltX}deg) translateZ(${depth * 40}px)` : undefined,
          boxShadow: `0 ${30 + depth * 40}px ${80 + depth * 60}px rgba(0,0,0,${0.6 + depth * 0.2})`,
        }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden", perspective: 1800 }}>
      {depth > 0 && plate(24, 0.6)}
      <Img src={img} style={{
        position: "absolute", ...place("cover", zoom * (1 + depth * 0.06)),
        transform: depth > 0 ? `rotateY(${tiltY}deg) rotateX(${tiltX}deg)` : undefined,
      }} />
    </AbsoluteFill>
  );
};
