# AURA W4

W4 is an independent static edition at `/w4/`. Existing root, `/2/` and `/3/` editions are unchanged relative to the base branch.

## Surface atelier

`atolye.html` adapts motif geometry and weave shading from the owner's NAKIŞ Studio at https://aurichal.com.tr/nakis/studio.html.
Source: rahmigkt/aurichal-website, commit 3a4bccf35c541b3e3ac3ed3b8cbd6544ed36acb2, `nakis/{motifs,prim,weave,chladni-core}.js`. These four modules are retained under `assets/nakis/`. The original studio is linked for advanced composition and animation; it has not been modified.

The customer-facing atelier adds four curated colourways, a plain surface plus four motif families, seven weave appearances, grid/half-drop layouts, pixel scale, rotation, a conceptual cushion sketch, a short build animation, PNG/JSON export, validated JSON import, explicit browser save/restore, URL sharing and an enquiry brief. Links and exports preserve the selected settings. Language switching preserves the current study.

The W4 JSON schema is intentionally separate from NAKIŞ project JSON. It carries versioned, allowlisted settings, not full geometry or executable markup. Imported files are bounded to 10KB; ranges and identifiers are normalized. W4 uses separate enquiry and study storage keys.

These are digital studies. They do not represent available fabrics, actual AURA products, physical dimensions, loom instructions, dye recipes, price/stock, or verified colour matching. The cushion is an original schematic canvas drawing. Furni reference images remain labelled and credited. Belgium is described as in development.

Existing catalogue and enquiry service are reused. Their configuration is not changed. No new payment, upload backend, account or analytics service is added. No test enquiry was submitted to production.

## Validation

- JavaScript syntax and whitespace checks.
- All relative HTML assets and ES-module imports resolve.
- Share/export settings round trip; invalid versions/JSON, unrecognized identifiers and extreme ranges checked.
- Browser checks: motif/weave/colour selection, cushion view, explicit browser save/restore, project brief prefilling, language preservation, responsive menu and download output.
- PNG export inspected and verified as 1200 x 1410.

Deployment uses the repository's existing main-branch FTP workflow, authorized by the user for `/w4/`.


## Furniture planner

`tasarla.html` adds a three-step customer experience: piece, size and finish. Sideboard, bookcase and upholstered bench are generated as bounded concept geometry in metres. Overall dimensions are exposed in centimetres. Customers can select open/closed sideboard fronts, columns and rows, three wood appearances, and four plain upholstery colours with procedural weave texture. There is no structural certification, binding price, stock promise or production-ready cutlist.

The renderer uses the MIT-licensed Three.js already present in the repository, now copied with its license into W4 so this edition is self-contained. Manual orbit/keyboard rotation, front/side views, zoom and dimensional labels are supported. A front elevation fallback is available when WebGL creation fails; browser QA covered WebGL, not forced context failure.

Morti was inspected at `torusservices/morti-app`, commit `d12cb910339bd5d50e635882299ab6cfba70748d`. `morti-metrics.js` adapts its millimetre-snapping and module interior/front-clearance calculations from `shared/domain/defaults.ts` and `shared/domain/assembly.ts`. `vendor/MORTI-LICENSE.txt` preserves the MIT notice. The full Nuxt/Postgres/editor stack is not required or embedded. O-LAP and cabineteer were considered as reference approaches, not vendored.

Furniture designs use their own versioned, allowlisted state and storage key. Save/share, PNG export, bounded JSON download/import, language preservation and enquiry-prefill are provided. Existing NAKIŞ atelier studies can be passed into the bench design. Product-page and home links point to the planner.

Validation: 192 extreme parameter combinations were checked for positive finite parts and geometry inside the overall dimensions, as well as JSON/share round trips and invalid file rejection. Browser checks covered all three models, numeric resizing, open fronts, material/pattern selection, views, save, JSON download/reimport, PNG download, language preservation, NAKIŞ-to-bench hand-off, enquiry prefilling and 390px mobile overflow. A production enquiry/payment was not submitted.


## Conversational co-design

`birlikte.html` provides a side-by-side chat and 3D concept workspace in eight UI languages, fourteen furniture families and eleven illustrated detail choices. Plain upholstery only. Full scope, local startup and production hosting boundaries are documented in `services/design/README.md` in the repository. No training, payment collection or designer project submission is implemented. Existing static FTP hosting does not run the model service. Live AI requires a separate deployed backend.

Local inference tests: Qwen3.5:9b on CPU exceeded the 85-second timeout. With a compact prompt, Qwen2.5:7b-instruct produced a French reply and tapered-leg patch in 36.5 seconds. Danish replies arrived in 23.6 and 37.0 seconds, but omitted the requested furniture family; locale vocabulary was added for a follow-up check. These are individual prototype tests, not a multilingual quality or load benchmark.
