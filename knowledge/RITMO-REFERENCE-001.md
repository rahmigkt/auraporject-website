# AURA Ritmo 01 — reference-led modular storage

## Classification and scope

Contemporary modular bookcase and storage wall: open shelving, timber carcass,
paired coloured doors, two drawers, small horizontal satin-metal handles.
This is a new procedural construction interpreted from the user-supplied image,
not a recovered supplier model or an exact measured reproduction. The source
photograph and third-party configurator code have not been republished.

Source page inspected 2026-10-16:
https://www.mobilesumisura.it/librerie-allestimento-completo
It describes custom widths for individual bays, shelves, doors and drawers,
colours, and depth constraints. AURA implements its own bounded version of
these operations, without copying that site's code or assets.

## Model and reversibility

Initial dimensions are assumptions: 2400 mm wide, 2300 mm high, 380 mm carcass
depth, 22 mm panels. Nominal carcass depth excludes handle projection; the
technical overall depth includes handles. All dimensions require verification.

`ritmo-model.js` contains only this product family. A stable ID identifies every
bay, opening and component. 2–5 bays and 2–7 openings per bay can be assembled.
Changing an opening creates actual door or drawer-box geometry. No unrelated
furniture family is substituted. Clear minimum dimensions are retained;
dimensions may increase to accommodate selected bay/opening counts.

The model includes carcass sides/top/bottom, continuous dividers, shelves,
6 mm backs, recessed plinth rails, inset fronts, handles, schematic hinge bodies
and independent drawer-box sides/ends/bottoms. Hinge geometry is illustrative;
there are no verified drilling patterns, selected hardware SKUs or load tests.
Drawer clearance uses the existing example side-runner adapter.

The editor offers per-opening finish, bay/opening proportions, undo/redo and
validated JSON save/restore. The cell map is keyboard accessible. 3D picking
selects fronts/shelves; open compartments can always be selected on the map.
Opening fronts is a geometric inspection mode, not a collision/motion solver.

`ritmo-scene.js` adds small extruded bevels rather than broad interpolated box
rounding, physically scaled grain UVs, matte lacquer, brighter satin hardware,
selectable parts and a closer camera fit on an infinite shadow-receiving floor.
No claim of photographic realism or automatic photo reconstruction is made.

## Technical outputs

The closed configuration is the single source for dimensioned front/side/top
views, individual component views, grouped quantities and dimensions, CSV,
envelope DXF, SVG and the existing contact/PDF/WhatsApp workflow. Preview-open
geometry never changes the dimensions or BOM in these files. Contact information
stays local until the user chooses sharing; no test message is sent.

The PDF generator has an explicit engine discriminator. It calls `compileRitmo`
for this model, so it cannot silently export the retired generic shelf template.

## Retirement of previous visuals

The old W4 HTML entry points and relevant entry scripts were snapshotted under
`archive/studio-legacy-20261016/`, with a route manifest. This archive is excluded
from FTP deployment. Index and guided-picker entry points now load only Ritmo;
other old visual routes redirect there. Privacy draft pages are retained.
Historical geometry code remains versioned but is not offered in the new UI.

## Verification

`node w4/tests/ritmo-check.mjs` checks 324 assemblies, positive dimensions,
closed part bounds, unique persistent IDs, BOM quantities, independent opening
changes, safe normalization and save/restore round trips. Browser verification
also covers editing, undo, opening fronts and PDF generation. Production
readiness still requires joints, anchoring, shelf deflection, real hardware
tolerances and physical validation.
