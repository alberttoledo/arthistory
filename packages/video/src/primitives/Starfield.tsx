import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../theme.tsx";

/** Constellation stick figures in normalized frame coordinates. */
const CONSTELLATIONS: Record<string, { stars: [number, number][]; lines: [number, number][] }> = {
  orion: {
    stars: [[0.32, 0.28], [0.66, 0.31], [0.44, 0.47], [0.5, 0.49], [0.56, 0.51], [0.36, 0.7], [0.68, 0.72]],
    lines: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
  },
  "ursa-major": {
    stars: [[0.15, 0.35], [0.3, 0.38], [0.43, 0.43], [0.55, 0.48], [0.58, 0.62], [0.82, 0.64], [0.84, 0.48]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  leo: {
    stars: [[0.25, 0.62], [0.42, 0.52], [0.5, 0.38], [0.44, 0.27], [0.55, 0.22], [0.72, 0.5], [0.8, 0.63]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 0]],
  },
  scorpius: {
    stars: [[0.7, 0.2], [0.66, 0.3], [0.6, 0.4], [0.55, 0.5], [0.5, 0.6], [0.42, 0.68], [0.32, 0.7], [0.26, 0.62], [0.3, 0.55]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
  },
  cassiopeia: {
    stars: [[0.15, 0.42], [0.33, 0.55], [0.5, 0.44], [0.67, 0.56], [0.85, 0.4]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
};

export const Starfield: React.FC<{ constellation?: string; span: number }> = ({ constellation, span }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const { style } = useTheme();
  const { palette } = style;
  const drift = frame * 0.15;
  const c = constellation ? CONSTELLATIONS[constellation] : undefined;
  const draw = interpolate(frame, [10, Math.max(20, span * 0.6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${palette.muted}33, ${palette.bg} 70%)` }}>
      <svg width={W} height={H}>
        {Array.from({ length: 260 }, (_, i) => {
          const x = random(`x${i}`) * W;
          const y = (random(`y${i}`) * H + drift * (0.3 + random(`d${i}`))) % H;
          const r = 0.6 + random(`r${i}`) ** 3 * 2.6;
          const tw = 0.55 + 0.45 * Math.sin(frame / (8 + random(`t${i}`) * 20) + i);
          return <circle key={i} cx={x} cy={y} r={r} fill={palette.fg} opacity={tw * 0.85} />;
        })}
        {c && (
          <g>
            {c.lines.map(([a, b], i) => {
              const local = Math.min(1, Math.max(0, draw * c.lines.length - i));
              const [x1, y1] = [c.stars[a][0] * W, c.stars[a][1] * H];
              const [x2, y2] = [c.stars[b][0] * W, c.stars[b][1] * H];
              return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * local} y2={y1 + (y2 - y1) * local}
                stroke={palette.accent} strokeWidth={3} opacity={0.8} />;
            })}
            {c.stars.map(([x, y], i) => (
              <circle key={i} cx={x * W} cy={y * H} r={9} fill={palette.accent}
                style={{ filter: `drop-shadow(0 0 14px ${palette.accent})` }}
                opacity={interpolate(frame, [i * 3, i * 3 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
            ))}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
