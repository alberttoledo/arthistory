# Content Factory

Code-generated video essays (Instagram Reels, 1080×1920) for 5 channels, each with its own style and voice.

## Layout
- `channels/<slug>/` — `channel.json` (voice, audience, goals), `style.json` (palette, fonts, captions, transitions, texture), `series/`, `moodboard/vN/`, `episodes/<id>/`
- `episodes/<id>/` — `episode.json` (status, caption, metrics), `script.md` (one paragraph = one narration beat), `assets.json` (image sources + crops), `scenes.json` (shots timed to beats). Generated: `vo.mp3`, `vo.timeline.json`, `assets/`, `renders/` (final.mp4, cover.jpg, post.txt)
- `packages/core` — schemas, file store, voice providers (macOS `say` now, ElevenLabs when `ELEVENLABS_API_KEY` is set), asset sources (Wikimedia, Met)
- `packages/video` — Remotion composition: image camera moves, title/text cards, starfield, captions, grain/vignette, transitions
- `packages/cli` — `cf` command

## Studio (dashboard)
```
npm run studio     # http://localhost:4321
```
Overview of all channels vs goals, planner (drag reels onto days and stages), channel pages (style editor with live preview, versioned moodboards, series), episode editor (script, scenes, images, caption, stats, one-click voice/images/render), library, analytics and render queue. Everything reads and writes the files under `channels/`.

## Generating with Claude
Generate episodes (one-off or a series, scheduled into the calendar) and Generate style (written brief + moodboard → style.json) use Claude Opus 5.5 through, in order of preference:
1. `ANTHROPIC_API_KEY` in `.env`, or
2. your Claude Code login on this computer (run `claude` once in a terminal and sign in).

```
npm run cf generate <channel> -- --topic "…" --count 5 --start 2026-11-10 --every 1
npm run cf style <channel>
npm run cf make-all <channel>
```

## Make an episode
```
npm run cf new <channel> <id> -- --title "…" --series <series-id>
# write script.md, assets.json, scenes.json
npm run cf make <channel> <id>       # voice → assets → render
npm run cf search wikimedia "query"  # find images
npm run preview                       # Remotion Studio
```
macOS only for now (`say` and `sips`).
