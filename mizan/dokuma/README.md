# NAKIŞ — Textile exhibition study

Standalone, dependency-free web application for drawing a motif and developing it into a repeating textile. Turkish/English interface; 74-second deterministic formation sequence; full-screen loop; print/stitch visualization; SVG repeat tile, motif SVG, PNG and silent WebM/MP4 export.

## Geometry
- Carnation interpretation: scalloped polar semicircle, cubic Bézier leaves and stem.
- Tulip interpretation: four outer cubic Bézier segments, stem, leaves and interior details.
- Star: alternating radii 0.88 / 0.36 at 2k vertices, inner radial rosette.
- Straight lattice: W × H. Half-drop: alternating columns shifted H/2; rectangular repeat 2W × H. Mirrored: alternating columns reflected in x; repeat 2W × H.
- H = 1.25W. Motif scale = 0.42W × user scale.
- Canvas and exported SVG share the same sampled geometry. Parametric curves are sampled as polylines; exports are vector paths, not bitmap tracing. Displayed numerical formula coefficients are rounded to 2 decimals where applicable.
- Repeat tiles include background and clip boundary copies. Physical dimensions in mm; changing mm changes export scale, not screen density.

## Exhibition sequence
0–8 s line drawing and construction guides; 8–14 s filled motif; 14–24 s repeat formation; 24–74 s completed fabric and repeat equation. Recording renders this entire sequence on a fixed 1080×1350 canvas, including stage captions and equations. It contains no sound. Real-time browser capture requires the tab to remain active.

## Import
SVG ≤1 MB; 1–48 basic geometry elements. Imported geometry is sampled, centred and normalized. Colour/fill is adapted to the selected palette. Compound paths must be split. No active content, images, external sources, masks, gradients or text. This is a design import, not a faithful SVG document renderer.

## Limits and provenance
Original contemporary interpretations, not historical facsimiles or claims about historical makers using these formulas. Botanical textile context: Met object 451099; printing/repetition context: V&A Ink, Print, Repeat (links in About).

Stitch display is decorative and not machine embroidery data. Production requires material trials, colour management, bleed/registration where applicable, and separate stitch planning for embroidery. No claim of completed exhibition commissioning or museum endorsement.

Run geometry checks: `node --test tests/geometry.test.mjs`.


## Fourier formation
The 74-second sequence adds 1, 2, 3, 5, 10, 20, 50, 100, 255 rotating components to the largest closed contour (4 seconds each). Other paths are then drawn separately over 16 seconds, followed by a 4-second mechanism fade, 10-second repeat construction and 8-second final cloth.

Each path is arc-length sampled at 256 positions. Open paths are mirrored along their traversal to form a continuous periodic route; only the forward half is displayed. Complex DFT coefficients are sorted by magnitude, excluding the constant centre c0. Tiny circles below 0.15 screen pixels are omitted visually but remain in the numerical sum. RMS error is relative to centred sample energy (Parseval). It measures the sampled contour approximation, not fidelity to a historical object. Canvas final geometry and SVG use the same sampled 255-term reconstruction.

Run `node --test mizan/dokuma/tests/*.test.mjs` from the repository root.

## Exact 1–2–3 rotor study (current landing page)
The entry page is now a deliberately isolated geometry study. The previous textile/Fourier atelier remains at `atelier.html`. Rotors have radii [1, 1/2, 1/4], signed integer angular multipliers [1, -2, 3], and zero phases. All angles are absolute in a fixed mathematical coordinate system (y upward). Positions are calculated by cumulative vector addition. There is no Fourier fitting or textile-source claim in this study.
Each stage uses the same fixed display scale, vivid circles and arms, labelled centres, and an exact endpoint. Playback takes 20/40/60 seconds and stops at one complete period; stage advancement is manual. The previous stage's complete locus can be shown as a dashed comparison. The drawn trace is a 1440-segment approximation of the continuous analytic curve; its final vertex equals the live endpoint. Tests independently verify Cartesian equations, radius invariance, centre attachment, closure and partial trace endpoints.
