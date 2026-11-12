import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../theme.tsx";

/** Film grain, vignette and color tint — the "finish" that makes each channel feel its own. */
export const Texture: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { style } = useTheme();
  const { grain, vignette, tint } = style.texture;
  return (
    <>
      {tint && <AbsoluteFill style={{ background: tint, mixBlendMode: "soft-light", opacity: 0.6 }} />}
      {vignette > 0 && (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${vignette}) 100%)` }} />
      )}
      {grain > 0 && (
        <AbsoluteFill style={{ opacity: grain, mixBlendMode: "overlay" }}>
          <svg width={width} height={height}>
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 60} />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </AbsoluteFill>
      )}
    </>
  );
};

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { style } = useTheme();
  return (
    <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: style.palette.accent }} />
  );
};

export const Label: React.FC<{ text: string; position: "top" | "center" | "bottom" }> = ({ text, position }) => {
  const frame = useCurrentFrame();
  const { style, body } = useTheme();
  const y = position === "top" ? { top: 170 } : position === "bottom" ? { bottom: 200 } : { top: "45%" };
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, ...y, textAlign: "center",
      opacity: Math.min(1, frame / 10),
      fontFamily: body, fontSize: 34, letterSpacing: "0.3em", textTransform: "uppercase",
      color: style.palette.fg, textShadow: "0 2px 16px rgba(0,0,0,0.8)",
    }}>
      <span style={{
        borderTop: `2px solid ${style.palette.accent}`, borderBottom: `2px solid ${style.palette.accent}`, padding: "12px 24px",
        background: `${style.palette.bg}b3`, backdropFilter: "blur(6px)",
      }}>
        {text}
      </span>
    </div>
  );
};
