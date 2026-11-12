import { useMemo } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { TimedScene } from "../../../core/src/episode-props.ts";
import type { WordTiming } from "../../../core/src/schemas.ts";
import { chunkWords } from "../captions.ts";
import { glowShadow } from "./Effects.tsx";
import { useTheme } from "../theme.tsx";

const CARDS = new Set(["title", "text", "list"]);

export const Captions: React.FC<{ words: WordTiming[]; scenes: TimedScene[] }> = ({ words, scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { style, body } = useTheme();
  const c = style.captions;
  const chunks = useMemo(() => chunkWords(words, c.wordsPerChunk), [words, c.wordsPerChunk]);
  const t = frame / fps;
  const chunk = chunks.find((ch) => t >= ch.start && t < ch.end);
  if (!chunk) return null;

  const local = frame - Math.round(chunk.start * fps);
  const pop = spring({ frame: local, fps, config: { damping: 14, stiffness: 180 } });
  const soft = spring({ frame: local, fps, config: { damping: 200 } });
  const enterStyle: React.CSSProperties =
    c.animation === "pop" ? { transform: `scale(${0.85 + 0.15 * pop})` }
    : c.animation === "rise" ? { transform: `translateY(${(1 - soft) * 36}px)`, opacity: soft }
    : c.animation === "fade" ? { opacity: soft }
    : {};
  // Over a card (title/list/quote) captions drop to the bottom and use the card's text color,
  // so they never collide with the card's own type or vanish on a light card.
  const scene = [...scenes].reverse().find((s) => s.startFrame <= frame);
  const onCard = !!scene && CARDS.has(scene.visual.type);
  const position = onCard ? "bottom" : c.position;
  const color = onCard ? style.palette.fg : c.color ?? style.palette.fg;
  const justify = position === "top" ? "flex-start" : position === "center" ? "center" : "flex-end";
  // Over pictures, a soft scrim behind the caption band keeps light captions readable on light images.
  const scrim = onCard ? null : position === "bottom"
    ? "linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.35) 22%, transparent 40%)"
    : position === "top" ? "linear-gradient(to bottom, rgba(0,0,0,.5) 0%, transparent 35%)"
    : "radial-gradient(ellipse 80% 22% at 50% 50%, rgba(0,0,0,.45), transparent 70%)";
  return (
    <>
    {scrim && <AbsoluteFill style={{ background: scrim, pointerEvents: "none" }} />}
    <AbsoluteFill style={{ justifyContent: justify, alignItems: "center", padding: position === "bottom" ? `0 70px ${onCard ? 220 : 380}px` : "300px 70px" }}>
      <div style={{
        fontFamily: body, fontWeight: 800, fontSize: c.size, lineHeight: 1.15, textAlign: "center",
        textTransform: c.uppercase ? "uppercase" : "none",
        ...enterStyle,
        textShadow: [onCard ? null : "0 4px 24px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.9)", style.effects.glow > 0 ? glowShadow(style.effects.glow, style.palette.accent) : null].filter(Boolean).join(", ") || "none",
      }}>
        {chunk.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.05;
          // Typewriter: words appear only once they are spoken.
          if (c.animation === "typewriter" && t < w.start) return <span key={i} style={{ opacity: 0 }}>{w.text}{" "}</span>;
          const hl = c.highlight;
          return (
            <span key={i} style={{
              color: active && hl === "box" ? style.palette.bg : active && hl === "color" ? style.palette.accent : color,
              background: active && hl === "box" ? style.palette.accent : "transparent",
              borderRadius: 12, padding: "0 0.12em",
              textDecoration: active && hl === "underline" ? `underline ${style.palette.accent} 8px` : "none",
              textUnderlineOffset: 14,
            }}>
              {w.text}{" "}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
    </>
  );
};
