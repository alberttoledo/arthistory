# Content Hub — design

Date: 2026-11-12 · Status: draft for approval

## Intent

Turn the carousels site (`apps/carousels`, deployed to GitHub Pages at alberttoledo.github.io/arthistory) into the **content hub** for the channels: one place where the two people running them (the owner and his partner) can see everything that has been generated, which pieces are final and which are published, when each post goes out, and how every video was made.

The current Art History strategy releases each painting as a **three-part rollout**, in this order:

1. **Talking-head teaser:** the painter speaks to camera, for example Hopper or Leonardo (a short AI video with audio).
2. **The film:** the painting comes alive. It's either a 20 s "step inside the painting" loop, or for Nighthawks, a photoreal story film cut from several shots.
3. **The story carousel:** 10 slides on the story behind the painting (already built, see `channels/art-history/carousels/`).

Content is generated in Higgsfield, ChatGPT and code, often inside Claude Code sessions in this project, and it tends to scatter: Downloads, chat sessions, local folders. **Rule: everything is saved in this repo**, and the hub reads from the repo.

## Goals

- **See what was generated:** for each painting, its talking head, film and carousel, with every take listed, drafts included.
- **See what's final:** each piece has exactly one final take (or none yet), and the hub plays the final.
- **See what's published:** each post shows planned or published, with the live post's link once it's out.
- **Content calendar:** posts assigned to a day and time, shown on a calendar, plus a per-painting view of the rollout order.
- **How it was made:** for each video take, the prompt, the model and settings, and the reference images (start frame, crops, character sheets) used to generate it.
- **Channel switcher:** the hub covers all 5 channels (Art History, Great Mystery, City Stories, Astrology, Cookbook). Only Art History has hub content today; the other channels show an empty state.
- **Keep what works now:** the carousel Gallery, Wall, Brand guide and per-carousel viewer with downloads (zip, Save to Photos) stay.

## Non-goals (now)

- **Editing in the browser.** Phase 1 is read-only. Changes are made to the data files in the repo, by Claude in a session or by hand, then pushed. The site redeploys automatically.
- **Accounts or login.** The site stays public for now.
- **Posting to Instagram** or reading metrics from it.
- **Playing draft takes** on the site. Drafts are listed only.
- **Merging with the Studio app** (`apps/studio`, the local Remotion dashboard with its own planner for episodes). They stay separate.

## Anti-goals (would make it a failure even if it works)

- The repo becomes too heavy to push or clone because videos pile up in git.
- A piece shows as final or published when it isn't. The status has to be trustworthy, because they plan posts from it.
- Prompts or references that are guessed or invented. If we don't know how a take was made, it says "unknown".
- The hub is so specific to Art History that adding a channel or a new piece type means rewriting pages.

## Phase 2 (later, design for it but don't build)

- **Firebase plus Google sign-in** for the two of them, so they can edit directly in the hub: drag posts on the calendar, mark final or published.
- **Possibly gating the whole site** behind that sign-in. That means moving off GitHub Pages to a host with a server (for example Vercel).
- To make this cheap, **all data access goes through one data module** (a single place that loads and returns typed content). Pages never read files directly. Swapping repo JSON for Firebase later should only touch that module.

## Constraints

- **Hosting:** GitHub Pages, from the public repo `alberttoledo/arthistory`. The site is a static export (`output: "export"`) with no server and must work under the `/arthistory` base path. The existing workflow is `.github/workflows/carousels-pages.yml`.
- **Stack:** the existing `apps/carousels` Next.js 16 app (React 19, TypeScript) in the npm-workspace monorepo. Rename or rebrand it as the hub (package and folder name are the builder's call), and update the workflow and `.claude/launch.json` to match.
- **Size limits:** the Pages site must stay under 1 GB, and no file may be over 100 MB. Draft videos are already about 0.5 GB.
- **Phone use:** both people use it on phones, so every view must work at 375 px wide.
- **Brand:** the hub uses the Art History brand already in the app (gallery black `#0d0b09`, cream `#f3ead8`, gold `#d4af37`; Cormorant Garamond, Newsreader, IBM Plex Mono; see the Brand tab and `channels/art-history/brand/`).
- **Public repo:** nothing secret in data files. The repo and site are public.

## Decisions made with the owner

- All content lives in this repo. Anything found elsewhere (Downloads) is copied in. This has been done for the current videos; see `assets/video-index.json`.
- The site plays **final takes only.** Drafts stay on disk in the repo folder but are **not committed** (git-ignored), and the hub lists them by name with their details, without playback.
- Phase 1 is read-only. Editing comes later with Firebase and Google sign-in.
- The site is public for now.
- There's a channel switcher, with Art History the only channel filled in.
- The hub shows prompts and reference images for each video generation.

## Content model (decided shape; exact field names are the builder's)

- **Channel**, for example `art-history`.
- **Story:** one painting's rollout. Fields: slug, title, artist, year, museum, plus the three pieces. Other channels will have stories of their own.
- **Piece:** one of `talking-head`, `film`, `carousel`. A film has a kind: `loop`, `story-film` or `reel` (Seurat's Remotion essay is a reel).
- **Take:** one generated attempt of a video piece. Fields:
  - file path, resolution, duration, generated date
  - tool or model (for example "Seedance 2.5 on Higgsfield", "FLUX.3 Upscale")
  - prompt text
  - settings
  - reference image paths
  - source (for example the Higgsfield id or original download name)
  - note
  - `final: true|false`
  - A piece with several shots (the Nighthawks story film) has takes per shot plus one final edit.
- **Post:** one scheduled or published Instagram post of a piece. Fields: platform (Instagram for now), planned date and time, status (`planned` | `published`), published URL, caption (the carousel caption already exists in `carousel.json`).

**Calls made during the builder check (Claude's, for the owner to check):**

- **Pieces are a list, not three fixed slots.** Each piece has a role (`teaser`, `film`, `carousel`), and the rollout names which piece fills each role. The board shows one column per role. Other pieces, such as Nighthawks' step-inside loops alongside its story film, appear on the story page as extra pieces. This also keeps other channels free to use different roles.
- **Processed versions are takes linked to their parent** with an optional `derivedFrom` take id, plus a `process` label (for example "FLUX.3 Upscale" or "Remotion captions"). "How it was made" shows the take's own process and walks up to the original generation's prompt and references. **The final take is the file that gets posted.** For talking heads, that's the captioned render (`assets/<painting>/.../renders/teaser_v1_captioned.mp4`), not the raw clip.
- **Carousels have a status** in the story file (`draft` | `final`), because built doesn't mean approved.
- **Times are stored with an explicit timezone** and shown in it: `Europe/Istanbul` by default (the owner's Mac), so both people see the same day and hour.
- **Draft takes get their details and a small thumbnail stored** with the story data, because draft files are git-ignored and missing in CI.
- **Git hygiene:** ignore raw videos under `assets/` (for example `assets/**/*.mp4`, with an exception for the committed web copies). Remove from git the three raw videos committed in the first commit (`assets/hopper/old_version/shot08_final_720.mp4`, `assets/hopper/self_portrait/teaser_v1.mp4`, `assets/nightwatch/example_motion_ref.mp4`), keeping them on disk.
- **Another session is producing captioned teasers** right now (`assets/*/…/renders/teaser_v1_captioned.mp4`, `packages/video/src/Root.tsx`). The hub must pick up new takes from the story files, not from a hard-coded list.

Carousels keep their current source (`channels/art-history/carousels/<NN-slug>/`). The story links to its carousel; don't duplicate its data.

**Data files:** one JSON file per story, in the repo, readable and editable by hand and by Claude, for example `channels/art-history/stories/<slug>.json`, validated with zod (already a dependency) at build time. Exact location and layout are the builder's call, but they must be easy to edit in a session ("mark the Arnolfini loop as published, link X").

## Media handling

- **Raw takes** live at `assets/<painting>/video/` (24 files indexed in `assets/video-index.json`, with source names and notes). Raw videos are git-ignored.
- **Final takes:** for each, make a web copy (H.264 MP4, about 720p, sized to stream on phones, faststart) plus a poster frame, committed at a stable path. The build copies them into the site.
- **Reference images:** small ones (start frames, painting crops, character sheets) are committed and shown as thumbnails. Full-size scans over about 2 MB get a downsized copy for the site.

## Views

1. **Channel switcher:** in the header, on every view.
2. **Rollouts board** (home for a channel): one row per story (painting), with columns for Teaser, Film and Carousel. Each cell shows a thumbnail and a status chip: none / draft / final / scheduled (with date) / published. This answers "what's generated, what's final, what's out" at a glance.
3. **Story page:**
   - the painting header
   - the three pieces in rollout order
   - each piece's final take, playable, or the carousel viewer
   - the list of all takes with their details, and a "how it was made" panel per take: prompt, model and settings, reference image thumbnails
   - the piece's posts
4. **Calendar:** month view (week view on phones). Posts sit on their days and times, coloured by piece type, and link to the story. Unscheduled final pieces are listed beside it as "ready to schedule".
5. **Carousels Gallery and Wall, Brand, carousel viewer:** kept as they are, reached from the story page and the navigation.

## Backfill (part of this build)

- Create story files for the 8 Art History paintings (01–08), matching the carousel numbering, with what's known today:
  - the takes in `assets/video-index.json`
  - the Seurat reel at `channels/art-history/episodes/001-seurat-monkey/renders/final.mp4`
  - the 8 carousels
- **Final takes are NOT guessed.** Mark none as final unless the owner confirms. Exception, flagged for the owner's review: the 1080p upscales are likely finals (Arnolfini, Night Watch, Last Supper).
- **Prompts and references:** fill in from sources that exist, and mark everything else "unknown". Sources:
  - `assets/lastsupper/seedance_prompt.txt`
  - `workspace/output/nighthawks_asset_sheets.md`
  - the `assets/<painting>/` folders (start frames, ref crops, sheets)
  - the Higgsfield generation history, if it can be read through the Higgsfield MCP without spending credits
- **Posts:** start empty. Nothing is published yet as far as we know; the owner will supply dates.

## Left to the builder

- Package and folder naming, routing and URL structure, component structure.
- How the data module is organised, as long as it is the only place that reads content and it returns typed data.
- The web-copy encoding settings and poster selection.
- Calendar library or hand-built (keep the static export and the bundle reasonable).
- Empty-state design for channels without stories.
