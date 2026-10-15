# AURA co-design service

## What is implemented

`/w4/birlikte.html` is a visual furniture concept workspace with eight UI languages. A local Ollama model interprets the customer's language, asks one discovery question at a time, and returns a constrained JSON patch. The browser renders validated procedural geometry. This is inference with catalogue context, **not a fine-tuned furniture model**.

Fourteen supported families: sofa, armchair, chair, bench, sideboard, dining table, coffee table, desk, bookcase, wardrobe, dresser, nightstand, TV unit and bed. Eleven illustrated details cover legs, arms, cushions and fronts. This is a bounded starter library; it does not contain every domestic furniture part. Unsupported custom features must be discussed as unresolved requirements rather than fabricated.

Fabric is always plain. Four procedural fabric appearances and three wood appearances are representative, not verified supplier products or colour matches. No customer references/images are uploaded, analysed or retained by this version.

Explicit save/restore uses browser storage. JSON project export includes geometry, materials, conversation, proposed dimensions and review/payment status. Print sheets include front, side, top, perspective and fabric close-up; use browser Save as PDF. Export is a concept brief, not a production CAD file. No payment, designer queue, project transmission or automatic price is implemented. No data is submitted to production enquiry/payment services during tests.

## Local start

Requires Node 22+ and an already running Ollama. No npm packages required.

```powershell
$env:AURA_MODEL='qwen2.5:7b-instruct'
node services/design/server.mjs
```

Visit `http://127.0.0.1:8770/w4/birlikte.html?lang=tr`.
The model is configurable using `AURA_MODEL`; there is no runtime model download or training. `AURA_OLLAMA_URL` defaults to `http://127.0.0.1:11434` and must remain loopback. Do not expose port 11434 to the internet. UI languages: tr, en, fr, da, de, nl, es, it. Model language proficiency needs evaluation per target market.

API:
- GET `/api/design/health`: reports whether the configured model exists; not a latency or generation guarantee.
- POST `/api/design/chat`: same-origin JSON `{language,messages,design}`, last 16 turns, response `{reply,patch}`. No credentials/URL/model/tool code supplied by customer requests is executed.

## Production deployment boundary

The existing Natro workflow uploads static W4 files over FTP. It cannot start Node/Ollama, install a model, provision GPU capacity, set DNS or install an HTTPS reverse proxy. The service is explicitly excluded from FTP publication. A successful FTP deployment alone **does not make live AI available**.

A server able to run the selected model must be provisioned separately, or existing accessible server credentials/configuration supplied. Deploy Node as a supervised service and Ollama on that server. Keep both on loopback behind HTTPS. Route `/api/design/` on the AURA website to the Node service over a private connection. The client deliberately uses same-origin API paths; it never calls the visitor's localhost.

Example application environment (server administrator configures it, never browser code):

```text
AURA_BIND=127.0.0.1
PORT=8770
AURA_MODEL=qwen2.5:7b-instruct
AURA_ALLOWED_ORIGINS=https://auraproject.com.tr,https://www.auraproject.com.tr
AURA_OLLAMA_URL=http://127.0.0.1:11434
```

Example nginx locations on a server that already serves the AURA domain, with its existing HTTPS configuration:

```nginx
location /api/design/ {
    proxy_pass http://127.0.0.1:8770;
    proxy_set_header Host $host;
    proxy_set_header Origin $http_origin;
    proxy_read_timeout 95s;
    client_max_body_size 50k;
}
```

This is an example configuration, not an installed configuration. For shared hosting without reverse-proxy control, the hosting administrator must provide equivalent routing or hosting must change. Do not publish a temporary tunnel to this workstation as a production service.

The application limits generation to one concurrent request and 12 requests per socket IP/minute; behind a reverse proxy this is a shared conservative limit. Scale with authenticated sessions, proxy rate limiting and a bounded job queue before wider promotion. Conversational data exists in request memory and the user's explicit browser save/export; application code does not write server chat logs. Configure external proxy/provider retention separately. No payment provider or amount has been selected.
