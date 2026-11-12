# Seedance 2.0 / 2.5 prompting guidance: cinematic camera, macro detail, depth/parallax, image-to-video from flat artwork

Research date: 2026-11-04. Note on sourcing: the official BytePlus ModelArk prompt guides for both Seedance 2.0 and 2.5 exist, but their body text is rendered client-side and could not be fetched (only page titles and nav were retrievable). Most findings below are therefore from platform guides (Higgsfield, Runway, fal, CapCut, Kapwing) and expert blogs, which mostly claim to build on the official guidance. Treat anything marked "third-party" as tested practice, not ByteDance spec.

## 1. What official and platform guides recommend (structure, length, camera terms, timestamps, @ syntax, multi-shot, limits, resolution)

### Takeaway
Use cinematic shot-list vocabulary, one clearly stated camera move per shot/beat, explicit role assignment for every reference (@Image1 / @Video1 / @Audio1), and a timeline with continuous timestamps for longer clips. In 2.0, write flowing prose. In 2.5, use structured labeled blocks. No official length limit exists. Experts land on short prompts (about 60–100 words for 2.0 single shots) and add sections only to fix specific failures.

### Cited Findings
**Official docs (existence only)**
- BytePlus ModelArk hosts a "Dreamina Seedance 2.0 series prompt guide" under Best practices (last updated 23 Apr 2026), plus a separate "Dreamina Seedance 2.5 prompt guide" and "Seedance 2.5 tutorial". The body content could not be retrieved — [BytePlus docs](https://docs.byteplus.com/docs/ModelArk/2222480); [BytePlus 2.0 prompt guide (zh)](https://docs.byteplus.com/zh-CN/docs/modelark/seedance-2-0-prompt-guide); [BytePlus 2.5 prompt guide](https://docs.byteplus.com/en/docs/ModelArk/seedance-2-5-prompt-guide)
- One expert blog says ByteDance published its official 2.0 prompt guide in March 2026 and calls it useful mainly "as a reference dictionary". The official team reportedly said there is *no recommended prompt length* — [heyuan110, 11 Jul 2026](https://www.heyuan110.com/posts/ai/2026-07-11-seedance-2-prompt-guide/)
- ModelArk API model ID `dreamina-seedance-2-0-260128`. Resolution values reported as 480p/720p/1080p/4k (third-party tutorial) — [DataCamp](https://www.datacamp.com/zh/tutorial/seedance-2-0-api-guide)

**Higgsfield (official platform guidance)**
- Camera terms the model reads directly: "dolly in, truck left, arc shot, push in, pull back wide, handheld follow, crane up, orbital move". Use them "exactly as you would in a shot list" — [Higgsfield, Generating with Seedance 2.0, 24 Jun 2026](https://higgsfield.ai/blog/generating-with-seedance-2-0)
- Recommended order: subject + action → setting + lighting → camera move → mood/style. Principle: "More specific prompts, not more iterations." — [Higgsfield tutorial](https://higgsfield.ai/blog/generating-with-seedance-2-0)
- Workflow: "Start with image-to-video before text-to-video". Use a sharp, front-facing, well-lit reference. Keep the first generation under 8 s, start at 720p, and move to 1080p (about 2x credits) only after motion is validated. Native audio adds about 50–100% cost — [Higgsfield tutorial](https://higgsfield.ai/blog/generating-with-seedance-2-0); [Higgsfield help center](https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-seedance)
- Higgsfield's UI uses role tags @character, @style, @motion ("replicates camera behavior from a short video clip") and @audio, rather than @image/@video. Advice: "Start with one or two references and add more" — [Higgsfield tutorial](https://higgsfield.ai/blog/generating-with-seedance-2-0)
- Pro tip: say explicitly what the camera is *not* doing, because Seedance otherwise may default to cutting between angles. Example: "no cuts, no zoom, natural head movement". Shot structure goes up front, with a closing line like "Total: 15s / 6 shots / 16:9". Timed animation segments: "0–3s: WIDE SHOT from @image", "3–6s", ... and "@image is the first keyframe and style reference" — [Higgsfield Seedance prompting guide, 13 Apr 2026](https://higgsfield.ai/blog/seedance-prompting-guide)

**fal (API schema, Seedance 2.0 reference-to-video)**
- Refer to inputs as `@Image1`, `@Video1`, `@Audio1`. Limits: ≤9 images (≤30 MB each), ≤3 videos (MP4/MOV, **combined 2–15 s**, <50 MB total, about 480p–720p input resolution), ≤3 audio (combined ≤15 s). "Total files across all modalities must not exceed 12." Audio requires at least one image or video. Duration `auto` or 4–15 s. Resolution 480p/720p/1080p/4k. Aspect ratio auto, 21:9, 16:9, 4:3, 1:1, 3:4, 9:16 — [fal API page](https://fal.ai/models/bytedance/seedance-2.0/reference-to-video/api)

**CapCut / Dreamina (Seedance 2.0 Mini)**
- Write subject, action, *one* camera framing+move, environment/light, and intended end composition as separate phrases. Keep the camera instruction distinct from subject action ("a subject crossing the frame is not a pan"). For push-ins, describe the start and end shot size. A push-in and a zoom can look alike, so describe the framing change. Words like "smooth/handheld" are "optional creative cues rather than dependable controls". "No wording guarantees an exact physical camera path." — [CapCut, 16 Aug 2026](https://www.capcut.com/create/seedance-2-0-mini-camera-control-tips)

**Expert (2.0)**
- Budget "60–100 words total". Adherence decays by position: a prompt with "eight requirements typically honors four or five". Trimming below 100 words is the first debugging step — [heyuan110](https://www.heyuan110.com/posts/ai/2026-07-11-seedance-2-prompt-guide/)
- "Every reference needs a stated job". Unassigned refs bleed lighting and framing into the shot — [heyuan110](https://www.heyuan110.com/posts/ai/2026-07-11-seedance-2-prompt-guide/)
- Without a camera description, "Seedance defaults to subtle motion, which can feel flat" — via search snippet of [Picsart Seedance 2.0 prompts](https://picsart.com/blog/seedance-2-0-prompts/) (snippet, not fully verified)

**Seedance 2.5 structure**
- A 2.5 prompt has four parts: asset-binding list, one-sentence summary, timeline, closing consistency notes. Timeline fields: format, subject, action, environment, camera, look, timing, audio, constraints. Timestamps should be continuous integer-second segments with no gaps ("gaps are left ungoverned"). Default beat about 6–8 s. Timestamps are "pacing guidance, not frame-exact cut points". Describe visuals positively and use negatives only for subtitles/audio ("No subtitles") — [Runway Seedance 2.5 guide, 25 Sep 2026](https://runway.com/resources/seedance-2-5-prompt-guide)
- Kapwing (2.5): use labeled sections (CAMERA, CONTINUITY). Tie camera moves to events ("pans only after the door opens"). Beats of about 8–10 s minimum, and don't script every second. Start short and add sections only when a failure appears. The API has no negative-prompt field, so write constraints in text — [Kapwing, 21 Aug 2026](https://www.kapwing.com/resources/how-to-prompt-seedance-2-5-a-guide-for-ai-video-creators/)

### Inferences
- For painting fly-throughs, a robust 2.0 template is: [reference role line] + [one sentence on the scene as a real 3D space] + [single camera move with start→end framing] + [depth layers / texture to reveal] + [constraints: no cuts, no zoom-crop, no text]. Keep it ≤100 words.
- "Zoom" should be avoided as a word (see Q3). "Dolly in / push in / crane / arc" plus start and end shot size is the vocabulary all guides converge on.

### Gaps
- The verbatim text of ByteDance's official 2.0 and 2.5 prompt guides could not be retrieved (JS-rendered). Exact official templates, camera term list, and official length advice are unverified.
- OpenRouter's Seedance model page and blog were not checked, and Replicate was not checked.

## 2. Reference videos for camera-motion replication, first/last frame control, limits

### Takeaway
Yes. Seedance 2.0 natively accepts up to 3 reference videos (combined 2–15 s) and copies camera motion when prompted, e.g. "follow all camera movements from @Video1; do not copy its subject". First/last-frame (keyframe) control exists and is the reliable way to pin the opening and closing images. Prose descriptions of the end frame drift. Seedance 2.5 raises the limits to 50 refs (30 images, 10 videos ≤30 s combined, 10 audio).

### Cited Findings
- Pattern: "Use @Video1 as the camera movement reference. Use @Image1 as the new subject." — via search summary of [Luma Labs guide](https://lumalabs.ai/learning-center/articles/how-to-prompt-seedance-2.0) (page returned 404 on fetch, so unverified directly)
- Kapwing (2.0): say what the clip should *not* contribute, e.g. guide the slow tracking camera but don't copy the subject — via search summary of [Kapwing 2.0 guide](https://www.kapwing.com/resources/how-to-use-seedance-2-0-a-guide-for-ai-video-creators/)
- "Text is best for spatial decisions. Reference video is best for temporal decisions." A clean reference clip "can do more for motion quality than another fifty words" — via search summary of [invideo guide](https://invideo.io/blog/seedance-2-0-prompt-guide/)
- To copy a move: "follow all camera movements from @video1". Keep reference strength about 70–80% (90–100% gives "cardboard" characters, <60% gives identity drift). Identifiable real faces are blocked — [heyuan110](https://www.heyuan110.com/posts/ai/2026-07-11-seedance-2-prompt-guide/)
- Higgsfield @motion "replicates camera behavior from a short video clip". First-and-last-frame is used to generate transition shots between clips — [Higgsfield tutorial](https://higgsfield.ai/blog/generating-with-seedance-2-0)
- 2.0 limits: 9 images + 3 videos + 3 audio, ≤12 files, video combined 2–15 s — [fal](https://fal.ai/models/bytedance/seedance-2.0/reference-to-video/api); EvoLink and JAI report the same 15 s combined cap — [JAI portal](https://www.jaiportal.com/model/seedance-2-0-fast-reference-to-video)
- 2.5 limits: "30 images (up to 4K), 10 videos (30s combined), 10 audio clips (30s combined)", up to 50 total. Modes: Reference, Keyframe, Edit, Extend. "Keyframe mode provides reliable first and last frame control". Describing the opening/closing image only in prose leaves it to inference — [Runway, 25 Sep 2026](https://runway.com/resources/seedance-2-5-prompt-guide); limits confirmed by [Kapwing 2.5](https://www.kapwing.com/resources/how-to-prompt-seedance-2-5-a-guide-for-ai-video-creators/)
- Chaining: "Use @Image1 as the exact opening state" (previous clip's last frame) and don't repeat completed actions — [Kapwing 2.5](https://www.kapwing.com/resources/how-to-prompt-seedance-2-5-a-guide-for-ai-video-creators/)
- Caveat: CapCut says not to assume image references preserve camera position or path between generations — [CapCut](https://www.capcut.com/create/seedance-2-0-mini-camera-control-tips)
- Some tools offer drawing a motion path on the reference image as guidance — via search summary of third-party guides (source not individually verified)

### Inferences
- For "inside the painting" shots, a strong recipe is a short real or 3D-rendered camera-move clip (e.g. a Blender dolly through a parallax layer stack, or a phone push-in over a textured surface) as @Video1 for motion only, with the artwork or a photoreal keyframe as @Image1 for content. This hands the temporal/3D path to the video and keeps the text short.
- For a precise end state (e.g. macro on a specific brushstroke or fabric fold), use first+last frame mode with a generated macro end-frame rather than describing it.

### Gaps
- No independent quantitative test of how faithfully Seedance replicates complex camera paths (e.g. FPV or orbit + dolly) was found. Quality claims are anecdotal.
- No source documents how reference-video resolution (capped at about 720p input on fal) affects motion fidelity.

## 3. Why image-to-video from paintings looks like "zooming into a flat picture," and fixes

### Takeaway
The flat look appears when the model treats the image as a plane and applies uniform scale (a zoom/crop) instead of moving a camera through 3D space. Parallax only appears when near and far elements move at different rates. Fixes: ask for a physical camera move ("dolly/push/crane/arc", never "zoom"), name the foreground/midground/background layers and what passes the lens, and keep motion modest. Source images (or keyframes) with clear depth separation help, and so does a reference video carrying real 3D motion. No ByteDance-official source addresses this directly.

### Cited Findings
- A zoom is a digital crop-and-scale. A dolly physically moves the camera, changes perspective lines, and creates parallax (foreground moves faster than background). Precise example: "slow dolly forward, keeping the building centered, foreground elements passing by on both sides" vs vague "move closer to the building". Instruction stack: primary camera motion + desired depth effect + atmospheric cue (fog/haze) for volumetric depth — [CrePal, advanced camera motion prompts](https://crepal.ai/blog/?p=8162) (vendor blog)
- Lower motion strength, restrict movement to the camera rather than the subject, and use anti-morph constraints. A modest move reads as depth better than an ambitious rotation. Flat art with no clear foreground/background "gives the model little to separate" — [CrePal 3D guide](https://crepal.ai/image-to-video/3d) (vendor)
- Seedance-specific (third-party): naming "foreground" and "background" separately triggers layered motion. Without explicit layer instructions, the model applies uniform motion to the whole frame. Combine parallax with a slow camera drift. Default I2V template: "slow cinematic orbit around the subject, gentle parallax depth, fog drifting naturally ... while preserving original lighting and mood" — [martini.art Seedance 2 I2V](https://martini.art/en/how-to/animate-images/seedance-2); [muapi Seedance 2.1 I2V](https://muapi.ai/playground/seedance-2.1-image-to-video) (vendor pages; 2.1 naming unverified)
- Don't redescribe a new scene that ignores the reference. Focus the prompt on motion. Generate 3–4 Fast drafts to find the motion direction, then re-run the winner at Standard/Pro — [seedance.tv I2V workflow, 2026](https://www.seedance.tv/blog/seedance-miricanvas-image-to-video-workflow-2026)
- Without a camera description, Seedance defaults to subtle motion that "can feel flat" — [Picsart](https://picsart.com/blog/seedance-2-0-prompts/) (search snippet)
- Fallback outside the model: build a depth map (estimated or hand-painted) and animate it as 2.5D parallax — [Upsampler parallax tool](https://upsampler.com/free-3d-parallax-generator-no-signup)

### Inferences (not directly sourced; flagged as reasoning)
- **Photoreal keyframe first:** convert the painting into a photoreal/3D-lit version of the same scene (image model), then animate that. The video model has stronger 3D priors for photographic inputs, and the painterly style can be reintroduced via @Image as a style reference or in post. This is consistent with Higgsfield's "sharp, well-lit reference" advice, but no source tests it on paintings.
- Phrase the scene as a physical space ("the painted room as a real interior; the camera physically travels between the table and the window") rather than "the painting".
- Fewer beats and a single move per clip reduce the model's tendency to fake movement with 2D scaling or morphing (see Q4).
- For a "camera enters the canvas" transition, use first/last frames: first = flat artwork on a wall, last = photoreal interior keyframe. Let Seedance interpolate.

### Gaps
- No official ByteDance or Higgsfield documentation on the "flat 2D zoom" failure or on painting-specific I2V was found.
- No camera-control parameter (numeric pan/tilt/dolly sliders) is documented for Seedance in fal's schema. Camera control is prompt- and reference-only there.

## 4. Max shots/beats per generation; do long, detailed prompts help or hurt?

### Takeaway
2.0: one camera move per shot, short prompts (≤100 words), and a few shots per 15 s clip. Packing in more locations or moves causes morphing and jitter. 2.5: beats of about 6–10 s (so roughly 3–5 beats per 30 s) using a structured format. Compound moves are acceptable inside a beat longer than about 4 s. Long prompts help only when they are structured and each line fixes a specific failure. Otherwise adherence drops.

### Cited Findings
- 2.0: "one camera move per clip". Stacking moves (e.g. fixed + orbit) causes jitter/drift. Use "cut to" markers for multi-shot. ≤15 s per shot, and a per-second timeline for anything over 8 s. Three locations in 5 s gives "smeared morphing". No hard max shot count — [heyuan110](https://www.heyuan110.com/posts/ai/2026-07-11-seedance-2-prompt-guide/)
- Higgsfield examples run up to "15s / 6 shots" in one 2.0 generation — [Higgsfield prompting guide](https://higgsfield.ai/blog/seedance-prompting-guide)
- Most curated prompts use one main movement to keep the shot clean — via search summary of [Morphed](https://morphed.app/blog/seedance-2-0-prompt-guide)
- Build compound moves in passes. "Change one variable per new take." If output drifts, remove extra camera directions and reduce competing action — [CapCut](https://www.capcut.com/create/seedance-2-0-mini-camera-control-tips)
- 2.5: a thin prompt drifts. One movement type per shot in 2.0, while in 2.5 the rule "doesn't hold as a hard rule" past about 4 s beats. Default beat 6–8 s — [Runway](https://runway.com/resources/seedance-2-5-prompt-guide)
- 2.5: beats of about 8–10 s minimum. Don't script every second (the model has to invent in-between motion). Start short — [Kapwing 2.5](https://www.kapwing.com/resources/how-to-prompt-seedance-2-5-a-guide-for-ai-video-creators/)

### Inferences
- For a continuous "inside the painting" move with fine detail, one shot per generation (no cuts) and one move, 5–10 s, is the safest. Chain clips via last-frame → first-frame rather than packing beats.
- Say "single continuous shot, no cuts" explicitly, because Seedance tends to cut by default (Higgsfield pro tip).

### Gaps
- No controlled study of prompt length vs. quality. The "60–100 words" figure is one expert's heuristic.

## 5. Macro / extreme close-up and material detail (fibres, hair, skin)

### Takeaway
Name the surface and its micro-structure explicitly ("knit weave and individual fibres", "sequins", "brushed metal"), pair macro framing with raking/side light and shallow depth of field, use a slow dolly-in or pull-back with start and end shot sizes, add lock constraints for detail that must not change, and render at 1080p/4K only after validating motion at 720p.

### Cited Findings
- Example: "Camera starts extreme close-up on fabric—weave, sequins, leather texture visible. Slowly pulls back to reveal model wearing the piece." — via search summary of fashion-lookbook skill [skills.sh](https://skills.sh/beshuaxian/higgsfield-seedance2-jineng/seedance-fashion-lookbook)
- "Slow dolly-in from medium shot to close-up, shallow depth of field, subject centered". Call out the surface that should read ("fabric weave, frost, brushed metal, or spray") so the 4K detail is in the prompt. 4K mode reportedly renders at full 3840x2160 from the start — via search summary of [Morphic Seedance 2.0 4K guide](https://morphic.com/resources/how-to/seedance-2-4k-guide)
- Kapwing template uses "Cut to a macro close-up" with constraints like "Do not redesign, distort, rotate, rewrite, or replace the label". Describe the light source, direction, quality and colour rather than stacking mood adjectives — [Kapwing 2.5](https://www.kapwing.com/resources/how-to-prompt-seedance-2-5-a-guide-for-ai-video-creators/)
- Higgsfield examples: "shallow depth of field", "anamorphic 35mm", "sharp but imperfect focus, noticeable focus breathing" — [Higgsfield prompting guide](https://higgsfield.ai/blog/seedance-prompting-guide)
- 4K output is available for 2.0 on fal. For 2.5, Runway lists 480p/720p/1080p, while other sites claim native 4K, so this conflicts and is platform-dependent — [fal](https://fal.ai/models/bytedance/seedance-2.0/reference-to-video/api); [Runway](https://runway.com/resources/seedance-2-5-prompt-guide); [Krea](https://www.krea.ai/blog/seedance-2-5-prompt-guide)

### Inferences
- For painting macro shots (brush strokes, canvas weave, impasto), use "raking light across impasto ridges, canvas weave visible" plus a slow push-in, and supply a high-res crop of the artwork as an additional @Image ("@Image2 defines the brushstroke texture only").

### Gaps
- No source tests hair/skin pore fidelity specifically, or compares 1080p vs 4K detail.

## 6. Differences between Seedance 2.0 and 2.5 relevant here

### Takeaway
2.5 (announced 23 Jun 2026, broadly available on platforms around late Jul–Sep 2026) extends duration to 30 s, refs to 50, adds Keyframe/Edit/Extend modes, prefers structured labeled prompts, and tolerates compound camera moves within long beats. 2.0 is cheaper, limited to 15 s and 12 refs, and works best with short flowing prose and one move.

### Cited Findings
- Comparison table: duration 5–15 s vs up to 30 s/Auto. Refs 9/3/3 vs 50 total. Prose vs structured labeled blocks. One move per shot vs compound past about 4 s. Six vs seven aspect presets. 2.5 adds timestamped editing and forward/backward extend, and costs more — [Runway, 25 Sep 2026](https://runway.com/resources/seedance-2-5-prompt-guide)
- 2.5 announced 23 Jun 2026 at Volcano Engine FORCE (30 s native, up to 50 refs, local editing). Initially enterprise test with public access expected early July — [DataLearner](https://www.datalearner.com/en/ai-models/pretrained-models/seedance-2-5). VidMuse reports a release on 31 Jul 2026 — [VidMuse](https://vidmuse.ai/blog/seedance-2-5-guide)
- 2.5 "expands on Seedance 2.0 with longer generations, more reference inputs, and stronger consistency between shots" — [Kapwing 2.5](https://www.kapwing.com/resources/how-to-prompt-seedance-2-5-a-guide-for-ai-video-creators/)
- 2.0 dialogue used a four-symbol markup, while 2.5 uses plain labeled lines — [Runway](https://runway.com/resources/seedance-2-5-prompt-guide)

### Inferences
- For short 5–10 s continuous painting moves, 2.0 is likely sufficient and cheaper. Use 2.5 when you need a 15–30 s unbroken journey, more than 3 motion reference clips, or Extend to continue a move seamlessly.

### Gaps
- Availability of 2.5 on Higgsfield, OpenRouter, and fal specifically was not confirmed. 2.5 resolution (1080p vs 4K) conflicts across sources. No source directly compares 3D-depth or parallax quality between 2.0 and 2.5.
