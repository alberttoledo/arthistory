import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { glowShadow } from "../overlays/Effects.tsx";
import { useTheme } from "../theme.tsx";

interface Props { text: string; attribution?: string }

/** A big quote / statement card; words fade in one by one. */
export const TextCard: React.FC<Props> = ({ text, attribution }) => {
  const frame = useCurrentFrame();
  const { style, display, body } = useTheme();
  const { palette } = style;
  const words = text.split(" ");
  return (
    <AbsoluteFill style={{ background: palette.bg, justifyContent: "center", padding: 100 }}>
      <div style={{ fontFamily: display, color: palette.fg, textShadow: glowShadow(style.effects.glow, palette.accent), fontSize: 92, lineHeight: 1.15 }}>
        {words.map((w, i) => (
          <span key={i} style={{ opacity: interpolate(frame, [i * 2, i * 2 + 10], [0.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            {w}{" "}
          </span>
        ))}
      </div>
      {attribution && (
        <div style={{ fontFamily: body, color: palette.accent, fontSize: 38, marginTop: 50, opacity: interpolate(frame, [words.length * 2, words.length * 2 + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          — {attribution}
        </div>
      )}
    </AbsoluteFill>
  );
};
