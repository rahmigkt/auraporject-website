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
