Art History is an Instagram channel about the hidden details and human stories inside famous paintings. Every painting we make a film for also gets a 10-slide story carousel. This brand book is the rulebook for those carousels, and for anything else that should look like it comes from the same museum.

The look in one line: **a museum after hours.** Gallery-black walls, cream wall-label type, gilt frames, and a docent leaning in to tell you a secret.

## Voice

- Write like a warm, conspiratorial docent whispering a secret. Short sentences. No lecture, no jargon.
- Hooks make people curious; they never summarise. "Its famous name is a mistake." beats "The history of The Night Watch."
- Headlines are 9 words or fewer. Body copy is 45 words or fewer per slide. One idea per slide.
- Put exactly one key word of a headline in `<em>`: it renders italic in `accent`.
- Show the evidence, then say what it means.
- Facts must be true. Hedge contested claims ("historians think…", "likely"). **Never invent a quote**; if a famous line can't be sourced, use a fact slide instead.
- Use "we" for the channel and "you" for the reader. No emoji on slides.

Real hooks from the series:

| No. | Painting | Hook |
| --- | --- | --- |
| 01 | La Grande Jatte | Everyone in this park is *hiding* something. |
| 02 | Nighthawks | The painter is in here. *Twice.* |
| 03 | The Night Watch | Its famous name is a *mistake*. |
| 04 | The Arnolfini Portrait | Someone else is in this *room*. |
| 05 | The Calling of St Matthew | Who's he *pointing* at? |
| 06 | The School of Athens | Ancient Athens. *Famous* faces. |
| 07 | The Rehearsal | He *erased* part of this room. |
| 08 | The Last Supper | There's a *nail hole* in his head. |

## Colour

- Default every slide to the **gallery** theme: `ground` with `text`. Use the **paper** theme (`data-theme="paper"`) for one or two slides per carousel, usually the quote, the timeline or the "look again" beat.
- `accent` is the only emphasis colour for words: gold on gallery, oxblood on paper. Kickers, the `<em>` word, bold words and timeline dates all use it.
- `gilt` is for lines and shapes, never for text on paper: frames, marker rings, loupe borders, leader lines, the active progress dot and filled buttons (with `on-gilt` text).
- `oxblood` is rare: the twist or a warning, at most once per gallery slide.
- Captions and metadata use `text-muted`.
- No gradients except the black shades that keep text readable over a photo (top 260px, bottom 640px).

## Typography

- Three families, all Google Fonts: **Cormorant Garamond** for display, **Newsreader** for body, **IBM Plex Mono** for labels.
- Sizes are canvas pixels on the 1080 × 1350 slide. Use the type styles exactly: `hero` for the cover hook, `headline-m` for story slides, `headline-s` on dense slides, `quote` for pull quotes, `numeral` for the single giant number.
- Every headline gets a `kicker` above it: uppercase mono in `accent`, 2–4 words ("THE GLOWING GIRL", "LOOK AGAIN").
- Story copy is `copy`; the cover line is `lede`; image captions are `caption` in `text-muted`.

## Layout

- Canvas: `canvas-width` × `canvas-height` (1080 × 1350, Instagram 4:5).
- Safe zones: text stays inside `margin-outer` (84px) on both sides, below `safe-top` (120px) and above `safe-bottom` (110px). Only the chrome lives in the top and bottom zones.
- **Chrome on every slide:** top-left "NO. 0X — TITLE" (number in `accent`), top-right "03 / 10"; bottom-left "@ART.ALIVE.STUDIO", bottom-right progress dots with the current one as a gilt pill. `brand.js` adds it automatically.
- Text blocks sit at the bottom of a slide over a dark shade, or at the top on paper slides. Never centre body copy.
- Film grain (`grain-opacity`) and a vignette sit over every slide.
- Square corners everywhere (`radius-none`). Circles are only for markers, loupes and badges (`radius-disc`); the CTA phone uses `radius-phone`.

## Profile picture

Files: `profile/` (`profile.json` lists the rotation, first = the one up now).

- **Always the same frame:** `profile/frame.png` (1254 × 1254, transparent centre), a round gilt frame with a twisted rope moulding and four acanthus ornaments at 12, 3, 6 and 9 o'clock, on gallery black. Never redraw or swap it.
- **The painter inside rotates.** It's a photoreal, oil-painted bust of the painter, lit like the old masters, leaning out of the frame towards the viewer. Part of them breaks over the frame: van Eyck's turban, Caravaggio's hand and brush.
- **The face goes in the centre** with a clear expression (a wink, a stare), so it still reads at Instagram's 110 px circle.
- **Making a new one:** give the image model `frame.png` plus the painter's own portrait as references. Prompt: "Keep this exact gold frame unchanged, centred on a dark background. Inside it, [painter] as in [their portrait], photoreal oil-painting skin and fabric, leaning out of the frame towards the viewer, [one gesture or expression], with [one prop or garment] breaking over the frame edge. Square, 1:1." Then lay it over `frame.png` and check that the moulding and ornaments match.
- **Instagram crops it to a circle,** and the side ornaments sit close to that edge. Check the crop before uploading.

## The 10-slide story

1. **Cover**: a dramatic full-bleed detail crop, hook in `hero`, lede, short gilt rule, "SWIPE".
2. **Plate**: the whole painting in the gilt frame with a museum label (title, artist, date, medium, size, collection).
3–8. **Story**: one idea per slide. Every carousel uses at least one **Loupe**, one **Strip** or cut-up collage, and one quote, fact or **Timeline**.
9. **Look again**: the twist or payoff.
10. **Watch the film**: our video's first frame in a phone frame, "Now step inside", Save / Share.

Vary the layouts: don't repeat a slide type back to back, and mix one or two paper slides into the dark run.

## Imagery

- Use the painting itself, cropped hard. Covers are tight details (a face, a hand, a mirror), never the whole painting.
- Crops never cut through eyes. Keep faces whole or crop decisively.
- Supporting images come only from public-domain or CC sources (Wikimedia Commons, museum open access such as the Rijksmuseum, Met, NGA or Art Institute of Chicago, and the Library of Congress). Log every image's URL and licence in the carousel's `sources.md`.
- No AI-generated images on carousels. The only exception is the CTA phone, which shows our own film's first frame.
- 20th-century paintings (Hopper) may still be under copyright. Use only our existing scan and flag it.

## Iconography

There are no icons. The graphic vocabulary is: numbered gilt discs (`on-gilt` numerals), thin gilt rings over details, leader lines with dots on both ends, the gilt frame outline, and the timeline spine in `gilt-dim`. Arrows are a gilt line after "SWIPE".

## Making a carousel

The kit lives in the Content Factory repo at `channels/art-history/carousels/`:

- `_brand/brand.css` and `_brand/brand.js` are the slide components and the automatic chrome.
- `BRIEF.md` is the full brief an agent follows for a new painting.
- Render with `node channels/art-history/carousels/_brand/render.mjs <slug>`, then rebuild the explorer with `node channels/art-history/carousels/_brand/build-index.mjs`.
