# AURA homepage, style discovery and AI — 2026-10-16

## Product surfaces

- `w4/index.html`: text-led homepage, six simple categories, clear AI entry,
  process explanation and a separate link to the first product study.
- `w4/sohbet.html`: AI conversation plus an independently usable taste brief.
- `w4/tarzlar.html`: five detailed supplied profiles and 21 editorial
  continuations of the supplied planned-style registry. Drafts are marked.
- `w4/ritmo.html`: the existing modular product configurator. A confirmed
  storage taste brief is retained and attached to its project metadata.
- `w4/birlikte.html`: category entry, not the single-product editor.

No retired generic furniture drawings have been restored to the public UI.
Unsupported product categories collect a brief instead of substituting Ritmo.

## AI serving modes

1. Server: same-origin `/api/assistant/health` and `/api/assistant/chat`, provided
   by `services/design/server.mjs` and a loopback Ollama service. Qwen receives a
   bounded knowledge-grounded prompt and a JSON output schema. No arbitrary code,
   file/network tools, payments or outbound messages are exposed to the model.
   Chat requests are rate limited and concurrency bounded. This Node service is
   excluded from FTP and is not running on the current public hosting.
2. Device: explicit customer activation of WebLLM 0.2.85 in a Web Worker, using
   the official MLC Qwen2.5-1.5B-Instruct 4-bit model. A compatible WebGPU browser
   and roughly 2 GB GPU memory are required. About 1 GB is downloaded initially.
   Actual loading progress and cancellation are shown. Inference and messages
   stay in the browser in this mode. No model weights are bundled in Git.

The public server AI health URL returned 404 during inspection. The interface
therefore offers device activation and an honest offline brief mode, never
scripted chat replies disguised as model output. Device support is conditional;
a GPU-backed server remains preferable for consistent customer access without
an initial client download. No paid service or public model tunnel was created.

On the available Intel Iris Xe computer, the existing 7B/9B Ollama attempts did
not produce a validated answer within the test budget. They were stopped and
unloaded after the owned experiment. An installed-model health response is not
an inference-latency guarantee. The optional browser model was successfully
downloaded and initialized separately. Its free-prose trial hallucinated and
its first bounded extraction missed an explicit Turkish negation. Neither trial
was counted as a quality pass. The runtime now gives exact named-style evidence
priority over model hypotheses and never displays arbitrary model prose.
Qwen3.5:9b correctly extracted Art Deco as positive and Japandi as negative in
the bounded native test (53.055 seconds on CPU). This validates that one case,
not general furniture expertise. A GPU server is still needed for consistent
low-latency access across customer devices.

## Knowledge, decisions and safety boundaries

`assistant-contract.js` normalizes categories and known style IDs, retrieves
selected profile principles and relevant part vocabulary, and extracts intent, positive/negative style IDs and a next-question key.
Free model prose is not displayed. The renderer composes explanations and one
question from curated source material. Explicit dislikes stay
separate from positive preferences. Suggestions do not alter customer choices
until accepted. They never automatically execute geometry or send a project.
The current Ritmo geometry is not described as a universal style generator.

The homepage draft stays in session storage until the customer submits a
message. Confirmed taste briefs may be carried to the studio and exported.
No customer conversation is automatically logged or reused for model training.
The existing contact/PDF sharing consent flow remains a separate customer step.

## Training status

Knowledge grounding is implemented; fine-tuning is not. All 21 roadmap headings
now have original editorial starting notes, not full calibrated ontology models.
The 52 synthetic candidate examples in `style-training/` require explicit expert
review before export. No customer images or contact data enter that corpus.
Future work needs expert-labelled references, richer part-level style examples,
negative and mixed-preference cases, held-out evaluation and geometry builders
for each supported product family. Training alone cannot replace those assets.

## Verification

`node w4/tests/assistant-contract-check.mjs`

`node services/design/taste-agent-check.mjs` (mock upstream; protocol validation)

`node w4/tests/ritmo-check.mjs`

Browser checks cover homepage/category separation, style filtering, confirmed
brief handoff, offline behaviour, actual device-model loading and inference.

Primary runtime documentation:
https://webllm.mlc.ai/docs/user/get_started.html

Model catalogue:
https://github.com/mlc-ai/web-llm/blob/main/src/config.ts

## Final local browser QA

The actual Qwen2.5-1.5B model was downloaded (about 823 MB reported by the loader)
and initialized on the test browser. After adding the explicit-evidence guard,
the end-to-end app returned only Art Deco for the test preference and retained
Japandi as a rejected style. Accepting the suggestion selected Art Deco, left
Japandi unselected, and preserved the customer's exact message in the brief.
This is an application-level pass with deterministic guards, not a claim that
the small model's raw semantic extraction is reliable. The visible reply is
labelled “Tasarım rehberi · AI çözümlemesi”.

The serving contract is now bounded intent/style/question extraction. Questions
come from a reviewed bank and repeated questions are avoided. Descriptive text
comes from style profiles rather than generated prose. Exact named-style
preference/rejection evidence in TR/EN/FR/DA has regression fixtures. Ambiguous
style inference remains experimental and requires customer confirmation.

Browser QA also verified 26 style cards, the 21-draft filter, text search,
category-to-brief routing, storage handoff to Ritmo and no Ritmo substitution
for a bedroom brief. No WhatsApp/email message or paid service was sent/created during QA.

A second real Qwen3.5:9b test gave no style name: light wood, quiet neutrals,
slender legs and a warm but visually light sofa. It proposed
`scandinavian_modern` and `japandi` in 43.319 seconds on CPU, with no exact-name
evidence guard involved. This is one plausible generalization example, not a
calibrated accuracy result. Native serving defaults to this verified model;
client 1.5B mode is visibly labelled experimental.
