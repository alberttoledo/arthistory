# Content Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `apps/carousels` into `apps/hub`, a static content hub: a rollouts board, story pages, a calendar and a channel switcher, alongside the existing carousels, wall and brand views.

**Architecture:** Story data lives in `channels/<channel>/stories/<NN-slug>.json`. A build-time sync script validates the stories and copies them (plus carousel renders and committed web media) into the app. One data module, `src/lib/data.ts`, is the only reader. A local-only `make-media` script encodes web copies of final takes, plus thumbnails and reference images, into each story's committed `mediaDir`.

**Tech Stack:** Next.js 16 static export, React 19, TypeScript, zod 4, vitest, ffmpeg (local media script only).

**Spec:** `docs/superpowers/specs/2026-11-12-content-hub-design.md`

## Global Constraints

- Static export, base path from `PAGES_BASE_PATH`; every asset URL goes through `asset()`.
- Pages site under 1 GB, no file over 100 MB; raw videos under `assets/` are git-ignored, and only `assets/**/web/**` media is committed.
- Times are wall-clock strings `YYYY-MM-DDTHH:mm` in `Europe/Istanbul`, shown as stored and never converted.
- Never mark a final as confirmed unless the owner confirmed it. Guessed finals carry `confirmed: false` and show "unconfirmed".
- Unknown prompts and references render as "Unknown"; nothing is invented.
- Works at 375 px wide; Art History brand tokens.

## Review Focus

- A story whose final take has no web copy yet (raw missing in CI): show the final's details and a "web copy not built" note, not a broken player.
- A take whose `derivedFrom` points at a missing id: show the take's own details; the build must not crash.
- A channel with no stories: the board and calendar show an empty state.
- A post on a date outside the visible month: navigating months finds it; the upcoming list shows it.
- An invalid story file: the sync fails with the file path and the zod issue.

---

### Task 1: Schema, status logic and data module
**Files:** Create `apps/hub/src/lib/schema.ts`, `apps/hub/src/lib/status.ts`, `apps/hub/src/lib/status.test.ts`; Modify `apps/hub/src/lib/data.ts`
**Interfaces:**
- Produces:
  - `Story`, `Piece`, `Take`, `Post` (zod-inferred)
  - `pieceStatus(story: Story, piece: Piece): { state: 'none'|'draft'|'final'|'scheduled'|'published', confirmed: boolean, at?: string }`
  - `finalTake(piece): Take | undefined`
  - `takeLineage(piece, take): Take[]` (child first, root last; stops on a missing id or a cycle)
  - `getChannels()`, `getStories(channel)`, `getStory(channel, slug)`, `asset(path)`, `mediaUrl(story, file)`
- [ ] Write tests:
  - status precedence: published > scheduled > final > draft > none
  - an unconfirmed final reports `confirmed: false`
  - a carousel piece uses its `status`
  - lineage stops on a missing parent and on a cycle
- [ ] Implement, run `npx vitest run apps/hub`, then commit.

### Task 2: Rename the app, sync and media scripts, git hygiene
**Files:** `git mv apps/carousels apps/hub`. Modify `package.json` (name `@cf/hub`), `scripts/sync-content.mjs` (also aggregate stories into `src/data/hub.json` and copy each story's `mediaDir` to `public/media/<slug>/`). Create `scripts/make-media.mjs`. Modify `.gitignore`, `.github/workflows/carousels-pages.yml` → `hub-pages.yml`, and `.claude/launch.json`.
- [ ] `make-media`:
  - each final take with a local raw file → `<mediaDir>/<takeId>.mp4` (H.264, 720 px short side, CRF 26, `+faststart`, AAC 128k) and `<takeId>.jpg` poster
  - each take → `<takeId>.thumb.jpg` (360 px)
  - each ref → `<mediaDir>/refs/<basename>.jpg` (800 px max)
  - skip outputs that are already up to date
- [ ] Ignore `assets/**/*.mp4` except `assets/**/web/**`, then `git rm --cached` the three committed raw videos.
- [ ] Workflow paths add `channels/*/stories/**` and `assets/**/web/**`.

### Task 3: Backfill the 8 Art History stories
**Files:** Create `channels/art-history/stories/0{1..8}-*.json`.
- [ ] Use the takes from `assets/video-index.json`, the teaser captioned renders (`derivedFrom` the raw teaser) and the Seurat reel.
- [ ] Unconfirmed finals: the Arnolfini and Last Supper upscales, the Night Watch Nov 4 upscale, both captioned teasers and the Seurat reel. All carousels are `final`.
- [ ] Prompts: the Hopper teaser (`assets/hopper/self_portrait/prompts.md` prompts 1–2); the Last Supper loop kit prompt, noted as a starting prompt. Everything else "Unknown".
- [ ] Run `make-media`, then sync; the build passes.

### Task 4: Views
**Files:** Create `src/app/ch/[channel]/page.tsx` (board), `src/app/ch/[channel]/calendar/page.tsx`, `src/app/ch/[channel]/s/[story]/page.tsx`, `src/app/carousels/page.tsx` (old gallery); `src/components/Board.tsx`, `Calendar.tsx` (client), `TakeCard.tsx`, `StatusChip.tsx`, `ChannelSwitcher.tsx`. Modify `src/app/page.tsx` (art-history board), `Nav.tsx`, `layout.tsx`, `globals.css`.
- [ ] Board: one row per story, Teaser / Film / Carousel cells with a thumbnail and a chip.
- [ ] Story page: pieces in rollout order, then extras; final player; takes list with "How it was made" (lineage prompts and refs); posts.
- [ ] Calendar: month grid (agenda list under 640 px), a ready-to-schedule list, and the timezone label.
- [ ] Verify in the browser at desktop and 375 px, check with a base-path build, commit, push, and confirm the deploy.
