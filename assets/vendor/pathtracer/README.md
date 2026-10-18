# Final-render path tracer (local, optional)

Only `assets/forma/atmosfer.js` dynamically imports `index.js`. The interactive
studio and thumbnails do not import this bundle. No runtime CDN, remote asset,
API, WASM download or model service is used.

Pinned npm sources (MIT; full licenses alongside the bundle):

- `three-gpu-pathtracer@0.0.23`: https://github.com/gkjohnson/three-gpu-pathtracer/tree/v0.0.23
- `three-mesh-bvh@0.9.5`: https://github.com/gkjohnson/three-mesh-bvh/tree/v0.9.5
- `three@0.181.1`: https://github.com/mrdoob/three.js/tree/r181
  (only its small FullScreenQuad/Pass helper is bundled; all core Three imports
  use the existing Three 186 `../three.module.js?v=20261016b` instance).

The preceding 0.0.24 tracer was rejected after a real local Chrome/Intel Iris Xe
D3D11 test: even an isolated sphere produced transparent zero pixels at its
surface. Three 181 isolation and BVH 0.9.5 did not repair that version. The same
scene on 0.0.23 with the existing Three 186 produced finite colored pixels and
alpha 1. This pin also avoids the upstream-reported 0.0.24 black-model regression:
https://github.com/gkjohnson/three-gpu-pathtracer/issues/785 .

Built with `esbuild@0.25.12`, browser ESM, ES2022, minified, legal comments retained.
`xatlas-web` is an npm peer but is **not included or used**; no UV atlas generation
is needed for the actual product's existing geometry. Mesh BVH runs in the bundled
module worker `bvh-worker.js`; only the worker URL in the upstream wrapper is
rewritten to point at that local filename. No renderer/shader source is modified.
The wrapper releases the actual `_quad` and path targets directly: 0.0.23's public
`dispose()` incorrectly references `_renderQuad`. This local ownership cleanup
also releases the upstream low-resolution targets and uniform textures.

SHA-256:

- `index.js`: `8a09b91a78d61a28fbabd73aa3bcae1aeedc99eadced271ae4444414639845f7`
- `bvh-worker.js`: `db7dc77559f916dbf8c6098d44abd331dbcb24e541db6d9971dff10d74080af9`

To rebuild, install the exact npm versions above plus esbuild into a temporary
folder outside the repository. Bundle an entry that exports `WebGLPathTracer`
from `three-gpu-pathtracer` and `GenerateMeshBVHWorker` from `three-mesh-bvh/worker`.
Also bundle `three-mesh-bvh/src/workers/generateMeshBVH.worker.js` as
`bvh-worker.js`. Resolve every bare `three` import externally to
`../three.module.js?v=20261016b`. Rewrite the upstream
`GenerateMeshBVHWorker.js` URL from `./generateMeshBVH.worker.js` to
`./bvh-worker.js`. Copy the three licenses and update hashes when rebuilding.

The experimental path mode traces six bounces and uses the actual procedural
albedo, normal and roughness maps. The validated default is raster with GTAO and SMAA;
its result is labeled `mode: raster`, with `fallbackReason` if auto-selected.
There is no denoiser in this first stage: sample count and noise remain visible
for review, rather than claiming an unimplemented denoising stage.


