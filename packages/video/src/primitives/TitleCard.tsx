import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { glowShadow } from "../overlays/Effects.tsx";
import { useTheme } from "../theme.tsx";

interface Props { kicker?: string; text: string; sub?: string }

export const TitleCard: React.FC<Props> = ({ kicker, text, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { style, display, body } = useTheme();
  const { palette } = style;
  const rise = (delay: number) => {
    const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
    return { opacity: s, transform: `translateY(${(1 - s) * 40}px)` };
  };
  const words = text.split(" ");
  return (
    <AbsoluteFill style={{ background: palette.bg, justifyContent: "center", alignItems: "center", padding: 90 }}>
      <div style={{ textAlign: "center" }}>
        {kicker && (
          <div style={{ ...rise(0), fontFamily: body, color: palette.accent, fontSize: 34, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 40 }}>
            {kicker}
          </div>
        )}
        <div style={{ fontFamily: display, color: palette.fg, textShadow: glowShadow(style.effects.glow, palette.accent), fontSize: 118, lineHeight: 1.05 }}>
          {words.map((w, i) => (
            <span key={i} style={{ display: "inline-block", marginRight: "0.25em", ...rise(4 + i * 3) }}>{w}</span>
          ))}
        </div>
        {sub && (
          <div style={{ ...rise(10 + words.length * 3), fontFamily: body, color: palette.muted, fontSize: 40, marginTop: 44 }}>
            {sub}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
