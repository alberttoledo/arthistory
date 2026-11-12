import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, useCurrentFrame } from "remotion";
import type { EpisodeProps, TimedScene } from "../../core/src/episode-props.ts";
import { Captions } from "./overlays/Captions.tsx";
import { LayerFilter, LightLeaks, Particles, useShake } from "./overlays/Effects.tsx";
import { Label, ProgressBar, Texture } from "./overlays/Texture.tsx";
import { ImageShot } from "./primitives/ImageShot.tsx";
import { ListCard } from "./primitives/ListCard.tsx";
import { Starfield } from "./primitives/Starfield.tsx";
import { TextCard } from "./primitives/TextCard.tsx";
import { TitleCard } from "./primitives/TitleCard.tsx";
import { makeSrc, ThemeContext, useFont, type Theme } from "./theme.tsx";
import { enter } from "./transitions.ts";

const MissingAsset: React.FC<{ name: string }> = ({ name }) => (
  <AbsoluteFill style={{ background: "repeating-linear-gradient(45deg, #2a2a2a 0 40px, #333 40px 80px)", justifyContent: "center", alignItems: "center" }}>
    <div style={{ color: "#ddd", fontSize: 48, fontFamily: "sans-serif" }}>image “{name}” not downloaded</div>
  </AbsoluteFill>
);

const Visual: React.FC<{ scene: TimedScene; span: number; assets: EpisodeProps["assets"] }> = ({ scene, span, assets }) => {
  const v = scene.visual;
  switch (v.type) {
    case "image": {
      const asset = assets[v.asset];
      // Renders refuse to start without assets (see render.ts); the live preview shows a placeholder.
      if (!asset) return <MissingAsset name={v.asset} />;
      return <ImageShot visual={v} asset={asset} span={span} />;
    }
    case "title": return <TitleCard kicker={v.kicker} text={v.text} sub={v.sub} />;
    case "text": return <TextCard text={v.text} attribution={v.attribution} />;
    case "list": return <ListCard title={v.title} items={v.items} span={span} />;
    case "starfield": return <Starfield constellation={v.constellation} span={span} />;
  }
};

const SceneLayer: React.FC<{ scene: TimedScene; index: number; overlap: number; props: EpisodeProps }> = ({ scene, index, overlap, props }) => {
  const frame = useCurrentFrame();
  const { motion, effects } = props.style;
  const name = index === 0 ? "cut" : scene.transition ?? motion.transitions[(index - 1) % motion.transitions.length];
  const entering = frame < overlap;
  const e = entering ? enter(name, overlap > 0 ? frame / overlap : 1, effects.motionBlur, frame) : { style: {} };
  const ca = effects.chromaticAberration * 5;
  const split = Math.max(ca, e.split ?? 0);
  const needsFilter = !!e.blur || split > 0.2;
  const id = `fx-${index}`;
  const span = scene.durationFrames + overlap * 2;
  return (
    <AbsoluteFill style={{ background: props.style.palette.bg, ...e.style, filter: needsFilter ? `url(#${id})` : e.style.filter }}>
      {needsFilter && <LayerFilter id={id} blur={e.blur} split={split} />}
      <Visual scene={scene} span={span} assets={props.assets} />
      {scene.overlay && <Label text={scene.overlay.text} position={scene.overlay.position} />}
      {e.flash && <AbsoluteFill style={{ background: e.flash.color, opacity: e.flash.opacity, mixBlendMode: e.flash.color === "#ffffff" ? "normal" : "screen" }} />}
    </AbsoluteFill>
  );
};

const Picture: React.FC<{ props: EpisodeProps }> = ({ props }) => {
  const shake = useShake();
  const half = Math.round(props.style.motion.transitionFrames / 2);
  return (
    <AbsoluteFill style={{ transform: shake }}>
      {props.scenes.map((scene, i) => {
        // Each scene starts half a transition early and ends half a transition late, so neighbours overlap.
        const from = Math.max(0, scene.startFrame - (i === 0 ? 0 : half));
        const lead = scene.startFrame - from;
        const isLast = i === props.scenes.length - 1;
        return (
          <Sequence key={i} from={from} durationInFrames={scene.durationFrames + lead + (isLast ? 0 : half)}>
            <SceneLayer scene={scene} index={i} overlap={lead * 2} props={props} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const Episode: React.FC<EpisodeProps> = (props) => {
  const { style } = props;
  const display = useFont(style.fonts.display);
  const body = useFont(style.fonts.body);
  const theme: Theme = useMemo(() => ({ style, display, body, src: makeSrc(props.assetBase) }), [style, display, body, props.assetBase]);

  return (
    <ThemeContext.Provider value={theme}>
      <AbsoluteFill style={{ background: style.palette.bg, overflow: "hidden" }}>
        <Picture props={props} />
        <LightLeaks />
        <Particles />
        <Texture />
        <Captions words={props.words} scenes={props.scenes} />
        {style.progressBar && <ProgressBar />}
        {props.vo && <Audio src={theme.src(props.vo)} />}
      </AbsoluteFill>
    </ThemeContext.Provider>
  );
};
