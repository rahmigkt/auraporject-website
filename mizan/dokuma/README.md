# NAKIŞ — Textile exhibition study

Standalone, dependency-free web application for drawing a motif and developing it into a repeating textile. Turkish/English interface; 32-second deterministic formation sequence; full-screen loop; print/stitch visualization; SVG repeat tile, motif SVG, PNG and silent WebM/MP4 export.

## Geometry
- Carnation interpretation: scalloped polar semicircle, cubic Bézier leaves and stem.
- Tulip interpretation: four outer cubic Bézier segments, stem, leaves and interior details.
- Star: alternating radii 0.88 / 0.36 at 2k vertices, inner radial rosette.
- Straight lattice: W × H. Half-drop: alternating columns shifted H/2; rectangular repeat 2W × H. Mirrored: alternating columns reflected in x; repeat 2W × H.
- H = 1.25W. Motif scale = 0.42W × user scale.
- Canvas and exported SVG share the same sampled geometry. Parametric curves are sampled as polylines; exports are vector paths, not bitmap tracing. Displayed numerical formula coefficients are rounded to 2 decimals where applicable.
- Repeat tiles include background and clip boundary copies. Physical dimensions in mm; changing mm changes export scale, not screen density.

## Exhibition sequence
0–8 s line drawing and construction guides; 8–14 s filled motif; 14–24 s repeat formation; 24–32 s completed fabric and repeat equation. Recording renders this entire sequence on a fixed 1080×1350 canvas, including stage captions and equations. It contains no sound. Real-time browser capture requires the tab to remain active.

## Import
SVG ≤1 MB; 1–48 basic geometry elements. Imported geometry is sampled, centred and normalized. Colour/fill is adapted to the selected palette. Compound paths must be split. No active content, images, external sources, masks, gradients or text. This is a design import, not a faithful SVG document renderer.

## Limits and provenance
Original contemporary interpretations, not historical facsimiles or claims about historical makers using these formulas. Botanical textile context: Met object 451099; printing/repetition context: V&A Ink, Print, Repeat (links in About).

Stitch display is decorative and not machine embroidery data. Production requires material trials, colour management, bleed/registration where applicable, and separate stitch planning for embroidery. No claim of completed exhibition commissioning or museum endorsement.

Run geometry checks: `node --test tests/geometry.test.mjs`.
