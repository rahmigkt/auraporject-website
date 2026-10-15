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

`sohbet.html` provides a side-by-side chat and 3D concept workspace in eight UI languages, fourteen furniture families and eleven illustrated detail choices. Plain upholstery only. Full scope, local startup and production hosting boundaries are documented in `services/design/README.md` in the repository. No training, payment collection or designer project submission is implemented. Existing static FTP hosting does not run the model service. Live AI requires a separate deployed backend.

Local inference tests: Qwen3.5:9b on CPU exceeded the 85-second timeout. With a compact prompt, Qwen2.5:7b-instruct produced a French reply and tapered-leg patch in 36.5 seconds. Danish replies arrived in 23.6 and 37.0 seconds, but omitted the requested furniture family; after adding locale vocabulary a Danish request correctly produced console + tapered legs in 16.0 seconds. These are individual prototype tests, not a multilingual quality or load benchmark.


## Guided first-use configurator

`birlikte.html` is now the default non-AI guided configurator. It has adaptive, illustrated steps across 14 furniture families, eight selectable languages, live procedural geometry, plain fabric colour and three representative weave textures. Sofa choices include six arm shapes, fixed or loose seating, three back treatments, two/three seats and left/right chaise layouts. Storage, top shape, legs and dimensions adapt by family. Drawings are original concept geometry, not downloaded production CAD or a complete furniture component catalogue.

Final hand-off downloads include allowlisted JSON and a self-contained HTML sheet with front/side/top SVG drawings, perspective and material close-up, printable to PDF. Local save/restore and bounded import are supported. Designer payment and automatic submission remain unimplemented and are disclosed in the UI. No AI requests are made by this page. Rendering is per visitor; hosting concurrency has not been load-tested. The separate model service currently allows one generation at a time.

Validation: 451 guided option variants across all 14 flows, 336 studio combinations and 192 original planner boundary configurations pass. Browser QA completed a 12-stage sofa flow with rounded arms, fixed seat, channel back, left chaise, walnut and plain clay fabric; verified save/restore and drawing-sheet download. Mobile and all eight language screens have not yet been manually rechecked for this new flow.

References considered: IKEA EKTORP and SODERHAMN official product/buying-guide pages; O-LAP/home and torusservices/morti-app. No proprietary patterns were imported. KodyJKing/circlify is an image-to-circle JavaScript project; circle packing and Fourier contour animation do not replace measured component geometry. Its code is not included.


## Project submission draft (2026-10-15)

The guided final step now opens a contact dialog instead of customer-facing project downloads. Name, email, country and city are required; phone, full address, postcode and notes are optional. Contact details are never included in local design save/restore. Draft validation uses fictional input only and performs no submission. WhatsApp is not opened. The stock photograph area is explicitly pending verified stock/SKU matching; no stock data or real product images have been invented.

`proje-gizlilik.html` contains a clearly marked KVKK/GDPR draft with placeholders for controller identity, recipients, transfer safeguards and retention. TR/EN/FR/DA text is supplied; other language selections use English for the new form where untranslated. Acknowledgement is distinct from marketing consent; marketing is not collected.

`api/project.php` is disabled by default and returns draft/unavailable before reading any customer payload. Activation requires the verified controller/notice, actual recipient/sender, retention configuration, and a real hosting mail delivery test. In enabled mode it validates same-origin/session token, body and input sizes, allowlisted design state/geometry, honeypot, per-address rate limit; stores records outside the public document root and supplies reference receipts. Server email contains JSON and orthographic SVG attachments. PHP mail transport acceptance is not proof of inbox delivery. No actual email was sent in QA. Cleanup of private records runs on later submissions; before activation schedule retention cleanup and configure mailbox/log retention as well. Add operational notification failure monitoring before production use.

Geometry now includes continuous upholstered back support down to the frame, full loose-back support and an upholstered lower apron. Side/front views suppress the dimension that would collapse onto the screen; height labels sit outside the side silhouette. Non-sofa split-seat defaults normalize to a single seat.

QA: geometry suites pass; draft contact form completed with example.invalid data, acknowledgement and explicit no-send result; side silhouette checked on an armless loose-back armchair. Backend validator accepts a valid concept, rejects missing acknowledgement, bad email, family and geometry; draft gate remains disabled. Enabled mail transport and live PII submission have not been tested.


## Design-led homepage and WhatsApp PDF hand-off

W4 now opens around two primary entry points: guided choices and the design assistant. The homepage has a live colour/arm preview and furniture-family shortcuts, with no catalogue fetch required. The assistant is still explicitly a preview without a model backend. Both workspaces now use the same contact-to-PDF hand-off.

`project-pdf.js` creates an A4 PDF on the visitor's device, containing perspective, selections, three orthographic drawings, fabric close-up and optional contact/address notes. JPEG page images retain Unicode text appearance without external font dependencies; the PDF is a raster concept dossier, not editable CAD or tagged/selectable text. Contact overflow paginates. Privacy notice remains a draft pending actual company details.

No email/API request uploads contact data in this flow. The configured WhatsApp line is 905330339084. The prepared PDF can be sent via native Web Share on supported devices (visitor chooses WhatsApp/AURA), or saved and attached manually after opening the exact AURA chat. A wa.me URL cannot attach the file or guarantee its recipient in the native share picker. Sharing uses the visitor's WhatsApp account. The interface never claims delivery. Automatic server-to-business PDF delivery is not implemented and would require a WhatsApp Business API integration.

QA: homepage colour/arm interaction, direct armchair shortcut, desktop and 390px layout; complete contact-to-PDF browser path using fictional details; downloaded 340 KB PDF validated as three A4 pages by Poppler, all three page renders inspected. No test WhatsApp message was sent. Existing geometry suites remain passing.
