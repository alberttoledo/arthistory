The header and footer that frame every slide: series number and title, slide count, handle and progress dots.

## Use

- Every slide gets it. In the carousel kit `brand.js` adds it automatically from `<body data-no="03" data-title="The Night Watch">`; add `data-nochrome` to a slide to skip it (rare).
- The header sits 52px from the top, the footer 50px from the bottom, both inside `margin-outer`. Keep everything else inside `safe-top` and `safe-bottom`.
- The number uses `accent`; everything else uses `text`. The current dot is a 26px `gilt` pill.

## Don't

- Don't put headlines in the header zone.
- Don't change the handle per carousel.
