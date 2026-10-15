# AURA local furniture tool experiment

The local assistant route is `/w4/sohbet.html?lang=tr`. Live W4 has not been changed by this experiment. Home and room planning remain out of scope.

## Run locally

Requires the existing Ollama installation and Node 22+; no model is downloaded automatically.

```powershell
$env:AURA_MODEL='qwen3.5:9b'
$env:PORT='8770'
node services/design/server.mjs
```

Open `http://127.0.0.1:8770/w4/sohbet.html?lang=tr`. The service binds to 127.0.0.1 by default. Ollama stays on loopback. `AURA_MODEL` can select another installed tool-capable model; the compatibility default remains qwen2.5:7b-instruct.

## Tool contract

Six allowlisted native Ollama tools are exposed: update_design, set_view, zoom_view, save_draft, restore_draft and prepare_project. Furniture updates cover 14 families and 20 fields: family, width, height, depth, legs, arms, cushions, back, configuration, seats, top, front, columns, rows, wood, fabric, weave, returnSeats, service and pillows. Every proposed update is normalised and compiled with the existing geometry engine. Adjustments are reported; unknown commands and invalid arguments are rejected. No shell, URL fetch, external file or messaging tool is exposed to the model.

`studio-agent.mjs` feeds validated tool results back to the model, with a maximum of three inference rounds and twelve tool calls. CPU evaluation has a generous eight-minute total planning deadline. The client applies validated operations in order, so saving after a modification captures the updated design. Camera and zoom operate on the actual scene. Browser save/restore remain browser-local. Project preparation opens the existing contact/PDF form; it never sends a message, charges money, reserves stock or bypasses the form.

Server-side tool results explicitly mark browser-only operations as queued. A model reply alone does not prove browser storage or delivery succeeded. Restore followed by relative edits requires knowing the restored browser state; this prototype has not established that general workflow. User edits made while inference runs invalidate the returned drawing/actions.

## Local evaluation

Set `AURA_LOCAL_EVAL=1` and open `?lang=tr&eval=1` to show model operations and per-round timings in the local-only diagnostic details. The flag logs tool names/timings in the local terminal; it is off by default. Normal application code does not persist chat transcripts on the server. Evaluation scripts outside the service save synthetic test requests/results for inspection.

Readiness at `/api/design/health` only verifies that a model is installed; it does not guarantee inference latency. Only one chat request is admitted concurrently; additional requests receive 429. Native commands are not production-qualified by these limited tests. Unsupported geometry must remain an unresolved designer requirement. Fabrics are plain and representative; drawings are concepts, not production CAD or stock photographs.

## Deployment

The FTP workflow excludes `services/`; it cannot start Node or Ollama. This local experiment does not connect the public site to AI. A future deployment needs its own model server and same-origin HTTPS proxy, per-language and latency evaluation, execution acknowledgements, queueing and production error handling. Do not expose Ollama or this workstation with a public tunnel as a workaround.

References: https://docs.ollama.com/capabilities/tool-calling and https://docs.ollama.com/capabilities/structured-outputs

## Observed local results (16 October 2026)

CPU-only Qwen3.5:9b produced the requested complex sofa update with side view and zoom in 177.352 s. Qwen2.5:7b-instruct took 114.982 s but interpreted rounded arms as no arms. An eight-scenario first-response suite passed five checks; failures were wrong chaise cushion type, missing later camera/save operations and unnecessary clarification instead of drawing in Danish. These are limited synthetic checks, not a production success rate.

The real browser agent trial completed in 213.077 s over two inference rounds (133.334 + 79.738 s). It selected all six tool types in order, created a 160 cm walnut console, selected front view and opened the project form. Save/restore was independently verified by switching to an armchair and restoring the console. The zoom command was dispatched; numerical camera displacement was not independently measured. No contact data, external message or payment was submitted. GPU latency and concurrency remain unmeasured.

## Sectional drawing tools

Real cornerLeft/cornerRight layouts now generate backed return seating rather than a chaise. Sectional controls include 1–3 return seats, optional wood/cupholder service module, padded wood-tray arms, cylindrical legs and throw pillows. Taupe and sage plain fabrics are available. These are procedural concept parts, not engineering specifications for cupholder cutouts or manufacturing hardware. Generic freeform curves and photo reconstruction are still unsupported. The same normalized fields are available to native Qwen tool calls, guided choices and manual studio controls. `sectional-check.mjs` verifies 216 size/layout/material combinations, mirror symmetry, bounds, support parts and the model tool contract.

A real Qwen3.5:9b request for all new sectional features timed out at 240.043 s on the local CPU. This does not demonstrate model mastery of the new options. Manual UI drawing and tool-schema validation passed; model latency and new-feature selection require further evaluation on serving hardware.
