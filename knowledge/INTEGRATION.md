# User furniture knowledge package integration — 2026-10-16

The original `workspace.tar.gz` content is preserved in `furniture_design_engine/`.
Its provenance record includes a SHA-256 digest. No referenced model, third-party
dataset, prompt pipeline or ComfyUI workflow was downloaded or activated.

## Verified contents

Self-check: 44 passing checks, one warning, zero errors. The warning is substantive:
10 types have full part taxonomies; 16 enum-only types lack part trees. The README
also contains older counts (7/27), which should not be used as implementation facts.
There are five style profiles, 43 scoring features, 65 material records and 45
proposed manufacturing/design rules. Rules are knowledge descriptions, not a
fully implemented solver. Style target vectors are editorial and uncalibrated.

## Implemented runtime

- Reproducible `services/design/build-fde-runtime.py` (PyYAML) compiles the subset
  needed by the browser into `w4/assets/fde-knowledge-data.js`.
- `fde-engine.js` maps actual AURA part roles to exact taxonomy types. Unsupported
  furniture types and roles remain explicitly unmapped. It never uses fuzzy
  cross-category matching and never evaluates rule strings as executable code.
- The collapsed guide in the guided studio explains each actual component, shows
  source material suggestions and selected-profile directives.
- Five starting interpretations apply only supported parameters on eight
  families. Sectionals and other families are disabled. These are not complete
  reconstructions: no pointed arches, brass sabots, continuous Bauhaus tubing,
  concrete construction or new photorealistic meshes have been implemented.
- ERG-001/002/003 use actual seat geometry and the source type envelope; ERG-007
  uses table height. STR-003 uses visible wooden leg dimensions and a stated
  hardwood assumption, with conservative tapered/turned minimum-section factors.
  Not all five checks apply to every product. Every other rule is unevaluated.
- JSON brief exports component IDs, dimensions, quantities, explanations, style
  intent, observed checks and all unevaluated rule IDs. No production approval,
  originality score, structural rating or image analysis is invented.
- Whole source is versioned in the repository; FTP excludes `knowledge/` and
  `services/`. Only the generated browser subset and runtime modules are deployed.

## Limits that matter next

This package does not fix poor model topology or provide any 3D assets. High
visual quality still needs carefully modelled reference-based assets, seams,
cloth geometry, measured materials and render validation. VLM extraction, style
cosine scoring (including missing-feature confidence), load-path graphs, joint
design, tipping, material-specific structural tests and CAD machining remain
unimplemented. The source thresholds are preliminary knowledge, not verified
regulatory or engineering guidance. No model server or AI image service is live.

## Validation

`python knowledge/furniture_design_engine/tools/validate_engine.py`
(dependencies: PyYAML, jsonschema; Windows console may need PYTHONIOENCODING=utf-8)

`node services/design/fde-engine-check.mjs`

Existing category graph, choice flow and upholstery engine checks must also pass.
