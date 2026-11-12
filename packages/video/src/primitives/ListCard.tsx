import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { glowShadow } from "../overlays/Effects.tsx";
import { useTheme } from "../theme.tsx";

/** Ingredients, clues, steps: items tick in one by one across the shot. */
export const ListCard: React.FC<{ title: string; items: string[]; span: number }> = ({ title, items, span }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { style, display, body } = useTheme();
  const { palette } = style;
  // Spread item entrances over the first 75% of the shot so the last one lands while it's still being read.
  const step = Math.max(4, (span * 0.75 - 10) / items.length);
  return (
    <AbsoluteFill style={{ background: palette.bg, padding: "260px 100px", justifyContent: "flex-start" }}>
      <div style={{ fontFamily: display, color: palette.fg, textShadow: glowShadow(style.effects.glow, palette.accent), fontSize: 96, lineHeight: 1, marginBottom: 60,
        opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }) }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {items.map((item, i) => {
          const s = spring({ frame: frame - 10 - i * step, fps, config: { damping: 200 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 28, opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: palette.accent, flex: "none", transform: "translateY(-6px)" }} />
              <span style={{ fontFamily: body, color: palette.fg, fontSize: 56, lineHeight: 1.2 }}>{item}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
