# AURA AI service and retained studio experiment

Current public surfaces: `w4/index.html` is the homepage, `w4/sohbet.html` is the
style assistant, and `w4/ritmo.html` is the separate first product studio.

New endpoints: `/api/assistant/health` and `/api/assistant/chat`. The model is a
preference extractor with a strict schema. `assistant-classifier.js` and
`preference-evidence.js` validate the result and render curated guide text;
raw generated prose is never presented as advice. Explicit dislikes override
inferred styles, and the customer must accept suggestions before preference
handoff. Model weights have not been trained or fine-tuned by this application.

The public FTP hosting does not execute this Node service. A same-origin reverse
proxy and a suitable serving machine are required for server AI. Never expose
Ollama directly. The browser alternatively offers explicit opt-in WebLLM/Qwen
inference on compatible WebGPU devices, with an initial model download.

Start locally with the existing model installation:

```powershell
$env:AURA_MODEL='qwen3.5:9b'
$env:PORT='8770'
node services/design/server.mjs
```

The server binds to loopback; no model is downloaded by this command. A health
check verifies installed-model availability, not inference speed. Requests are
bounded and rate limited. No messages are logged or reused for training.

Checks:

```powershell
node services/design/taste-agent-check.mjs
node w4/tests/assistant-contract-check.mjs
node w4/tests/preference-evidence-check.mjs
```

The first check uses a mock upstream and does not prove model quality. A real
Qwen3.5:9b bounded extraction correctly distinguished one Art Deco preference
from a Japandi rejection in 53.055 seconds on CPU. General quality and latency
need broader tests. The small browser model's raw negation failure is documented
in `knowledge/AURA-AI-ARCHITECTURE.md`; deterministic evidence guards are required.

The older `/api/design/*` tool experiment remains source-only. Its generic
geometry is not reintroduced into the active public studio.


2026-10-21 compatibility repair: retained modules now import repository-root assets instead of the removed w4 checkout. Root regression tests import these in-repository historical modules; model calls are mocked. The historical server remains archived and is not deployed or started by imports. This repair does not activate any AI service.
