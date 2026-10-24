# Manufacturer CAD candidate trial

This is a local diagnostic, not a production or motion approval. It retains the original wardrobe, machining and project storage. No manufacturer CAD or tessellated geometry is committed or served by the live website.

Run from the main workspace with its existing isolated environment:

    work/cad-fcl-env/Scripts/python.exe work/site-hardware-cad-assembly/tools/cad-fcl/wardrobe-hardware-pilot.py .
    work/cad-fcl-env/Scripts/python.exe work/site-hardware-cad-assembly/tools/cad-fcl/hardware-native-intersections.py .

Inputs are the existing frozen pilot input/40-stock STEP and mesh ZIP, and local Hettich STEP files. The first script writes the source-hashed scalar report and local mesh preview under outputs/hardware-cad-assembly. The second independently intersects six selected pairs using native BRep solids. To publish scalar findings in the viewer, append native-intersections.json as native_nominal_intersections in report.json and copy that report to assets/forma/production/hardware-assembly-trial-report.json. Keep input SHA and all approval fields unchanged. A local preview server may expose only the exact hardware-trial-preview.local.json route. This route is ignored by Git and unavailable on live hosting.

The 9221544 candidate is not automatically equivalent to selected 9221528. Source hole axes map to 37,165,261,325,483.3 mm; the original last pilot is496.3. Nominal alternative Sensys9071205 + plate9071575 requires52mm cup fixing, C4.5/D0 for17mm overlay and different plate screw machining. The original Blum machining is not rewritten. Candidate9071223 CAD has52mm centers despite the TB45 description and is rejected as a45mm drilling authority.

Seven sampled linear poses use assumed travel0..500mm and half-speed carrier motion. No sourced stops, member travel law, articulated hinge trajectory or continuous hardware collision test is available. The hinge remains static. FCL mesh surface contact is not native penetration volume. Native selected-pair intersections show zero volume for three runner/stock pairs after replacing the rounded display proxy with the actual receiving face. Two hinge/stock pairs intersect in an unqualified nominal pose; this rejects this placement, not the manufacturer's mechanism. No load, torque, wall anchorage or physical prototype approval follows.

The initial0.05mm proxy datum error and failed general-transform attempt are retained in the audit. Do not relax geometry thresholds or rerun all392 native cuts/445 models to reproduce this targeted trial.

Primary sources:
- https://shop.hettich.com/gb_EN/p/9071205
- https://shop.hettich.com/gb_EN/p/9071575
- https://shop.hettich.com/sg_EN/p/9221544
- https://web2.hettich.com/hbh/addon/montage/300201_Distanz_B12_5_DE.pdf
- https://www.hettich.com/en-de/services/downloads
