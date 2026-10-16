# AURA Forma — parametric seating studio

Page: `w4/tasarla.html` · Tests: `node w4/tests/forma-check.mjs`

Forma replaces fixed menus of near-identical products with a parametric part grammar. A style is a
probability distribution over part types and proportions; proposals are sampled from it and picked to be
far apart, so twelve cards are twelve different pieces. Every part, dimension and material stays editable,
by click, by typed command or by voice, in eight languages. The same meshes drive the 3D view, the
technical drawings and the designer package.

## Modules (all pure ES modules; only `scene.js`, `studio.js`, `package.js` helpers need a browser)

| File | Role |
|---|---|
| `mesh.js` | Mesh builders in mm: crowned/tufted cushions, profile lofts (arms), lathes (legs), tubes, welt cords. |
| `profiles.js` | Arm cross-sections (track, square, slim, rolled, English scroll, flared, sloped, block) and leg turnings. |
| `sofa.js` | Seating grammar (sofa, loveseat, armchair): `RANGES`, `ENUMS`, `normalize`, `compile → parts`, `validate`, `fitSeatDepth`. Internal frame parts carry `internal: true`. |
| `styles.js` | 26 style distributions (ids match `style-directions.js`), part weights, ranges and material palettes. |
| `generate.js` | `sample`, `variants` (farthest-point diverse set), `similar`, `blend`, feature distance. |
| `catalog.js` | Fibres, weaves (NAKIŞ `weave.js`), patterns, 24 fabric colours, woods, finishes, metals (8 languages; colour names TR/EN). |
| `textile.js` | Woven fabric maps from the weave draft at true thread scale: albedo, normal, roughness; stripes, gingham, plaid, damask (NAKIŞ motif, figure woven in a contrasting structure); velvet, bouclé, leather. |
| `wood.js` | Procedural species maps (rings, rays, figure) and finish gloss. |
| `scene.js` | three.js r186 viewer: PBR, VSM soft shadows, GTAO, SMAA, contact shadow, orthographic views, structure mode, photo, GLB export, card thumbnails. |
| `drawing.js` | A3 sheet at a true scale: front, side, plan, section A–A (hatched cuts), dimension chains, spec table, title block; DXF in real mm. |
| `bom.js` | Grouped parts list with sizes, materials, suggested build (TR/EN), fabric area and metres, welt length, buttons. |
| `commands.js` | Deterministic command parser for TR, EN, DE, FR, NL, DA, ES, IT (dimensions with units, comparatives, part types, materials, styles, views, undo). |
| `ai.js` | Optional server AI: free-form edits and photo/sketch → parametric design; all output is validated against the vocabulary. |
| `package.js` | ZIP and PDF writers, SVG/canvas → JPEG. |
| `studio.js`, `i18n.js`, `studio.css` | Interface. |

## Server (PHP, works on the existing FTP hosting)

* `w4/api/forma-ai.php` + `forma-config.php`: proxy to the Anthropic Messages API. Off until
  `forma-secrets.php` (gitignored, uploaded by hand; see `forma-secrets.sample.php`) sets `ai_enabled` and a key.
* `w4/api/forma-submit.php`: stores the designer package outside the web root and mails it. Off until a
  recipient, sender and storage folder are configured and the privacy notice is final. While off, the
  studio downloads the package instead.

## Designer package (ZIP)

`project.json` (design, derived dimensions, checks, parts list) · `drawings.pdf` (render + A3 sheet) ·
`drawings.svg` · `drawings.dxf` (layers FRONT, SIDE, TOP, SECTION_A) · `parts.csv` · `model.glb` · `render.jpg`.

## Limits (stated honestly)

* Concept geometry. Frame and foam specs are suggestions for the designer, not structural approval.
* Fabric metres are an estimate from surface area with waste allowance.
* Colour hex values are representative, not measured.
* Image reading needs the server AI; without it the button explains that it is off.
