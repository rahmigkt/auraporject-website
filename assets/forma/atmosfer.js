// Final frames only: imported on demand, never by the interactive studio.
import * as THREE from '../vendor/three.module.js?v=20261016b';
import {createRenderAsset} from './scene.js';
import {loadCatalogEnvironment} from './atmosfer-surfaces.js';
import {createAtmosphereStage} from './atmosfer-room.js';

const tick = () => new Promise(resolve => requestAnimationFrame(resolve));
const aborted = signal => { if (signal?.aborted) throw new DOMException('Render cancelled', 'AbortError'); };
function invalidPathFrame(message) { const error = new Error(message); error.code = 'INVALID_PATH_FRAME'; return error; }
function inspectFrame(renderer, width, height, mode, samples, tracer = null, linearOnly = false) {
  renderer.setRenderTarget(null);
  // Keep float framebuffer checks separate from the visible image check.
  // Use the browser's 2D copy for the canvas instead of raw default-FBO reads.
  if (tracer) for (const y of [0.25, 0.5, 0.75]) for (const x of [0.25, 0.5, 0.75]) {
    const linear = new Float32Array(4);
    renderer.readRenderTargetPixels(tracer.target, Math.floor(width * x), Math.floor(height * y), 1, 1, linear);
    if (Array.from(linear).some(v => !Number.isFinite(v)) || linear[3] < 0.9) throw invalidPathFrame(`Invalid path-traced pixel at ${x},${y}: ${Array.from(linear).join(',')}`);
  }
  if (linearOnly) return;
  const snapshot = document.createElement('canvas'); snapshot.width = snapshot.height = 64;
  const context = snapshot.getContext('2d', {willReadFrequently: true});
  if (!context) throw new Error('Frame verification canvas unavailable');
  context.drawImage(renderer.domElement, 0, 0, 64, 64);
  const pixels = context.getImageData(0, 0, 64, 64).data, values = [];
  for (const y of [0.25, 0.5, 0.75]) for (const x of [0.25, 0.5, 0.75]) {
    const offset = (Math.floor(y * 64) * 64 + Math.floor(x * 64)) * 4;
    values.push(pixels[offset] + pixels[offset + 1] + pixels[offset + 2]);
  }
  if (values.every(v => v < 6) || values.every(v => v === values[0])) {
    const targetPixel = new Float32Array(4);
    if (tracer) renderer.readRenderTargetPixels(tracer.target, Math.floor(width / 2), Math.floor(height / 2), 1, 1, targetPixel);
    throw (tracer ? invalidPathFrame : message => new Error(message))(`Final frame is empty or uniform (mode=${mode}, samples=${samples}, probes=${values.join(',')}, target=${Array.from(targetPixel).join(',')}, gl=${renderer.getContext().getError()})`);
  }
}
function cancellable(promise, signal) {
  if (!signal) return promise;
  aborted(signal);
  return new Promise((resolve, reject) => {
    const cancel = () => reject(new DOMException('Render cancelled', 'AbortError'));
    signal.addEventListener('abort', cancel, {once: true});
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', cancel));
  });
}

/** Render the actual compiled product in an architectural room.
 * onProgress receives {phase,progress,samples,targetSamples,mode}; cancellation
 * rejects with AbortError. Explicit mode=path never silently returns a raster.
 * Scene resources are released before returning; the caller owns the canvas. */
export async function renderAtmosphere({compiled, materials, family, canvas = document.createElement('canvas'),
  width = 2400, height = 1600, preset = 'north', samples = 64, mode = 'raster', signal, onProgress} = {}) {
  if (!compiled?.parts?.length || !materials) throw new TypeError('A compiled design and materials are required');
  if (!['auto', 'path', 'raster'].includes(mode)) throw new TypeError('Unknown atmosphere render mode');
  if (![width, height].every(v => Number.isInteger(v) && v >= 64 && v <= 4096)) throw new RangeError('Frame dimensions must be 64–4096 pixels');
  if (!Number.isInteger(samples) || samples < 1 || samples > 4096) throw new RangeError('Samples must be 1–4096');
  aborted(signal);
  const started = performance.now();
  let renderer, asset, stage, tracer, worker, composer, resources = [], fallbackReason = null, actualMode = mode, completed = 0;
  let contextLost = false;
  const lost = event => { event.preventDefault(); contextLost = true; };
  canvas.addEventListener('webglcontextlost', lost);
  const progress = (phase, amount) => {
    aborted(signal);
    if (contextLost) throw new Error('Graphics context lost during final rendering');
    onProgress?.({phase, progress: amount, samples: completed, targetSamples: actualMode === 'raster' ? 1 : samples, mode: actualMode});
  };
  const releaseTracer = () => {
    worker?.dispose(); worker = null;
    if (tracer) {
      // The pinned upstream version omits its low-resolution target and generated
      // environment texture from dispose(); release those too (no studio state).
      const shaders = new Set([tracer._pathTracer?.material, tracer._lowResPathTracer?.material]);
      for (const shader of shaders) {
        for (const {value} of Object.values(shader?.uniforms || {})) {
          value?.renderTarget?.dispose();
          value?.dispose?.();
          value?.tex?.dispose?.();
        }
        shader?.dispose();
      }
      tracer._pathTracer?._blendQuad?.material?.dispose();
      tracer._lowResPathTracer?._blendQuad?.material?.dispose();
      tracer._lowResPathTracer?.dispose();
      tracer._colorBackground?.dispose();
      tracer._internalBackground?.dispose();
      tracer._generator?.geometry?.dispose();
      // 0.0.23's public dispose() references _renderQuad, but its constructor
      // creates _quad. Release the actual owned objects directly so cleanup
      // cannot replace a valid render result (or hide its original failure).
      tracer._quad?.material?.dispose();
      tracer._quad?.dispose();
      tracer._pathTracer?.dispose();
      tracer = null;
    }
  };
  try {
    progress('materials', 0);
    const loading = createRenderAsset(compiled, materials);
    // A cancelled material build still owns textures once its promises settle.
    loading.then(value => { if (signal?.aborted) value.dispose(); }, () => {});
    asset = await cancellable(loading, signal);
    progress('room', 0.05);
    stage = createAtmosphereStage(THREE, asset.group, {family, preset, aspect: width / height});
    await loadCatalogEnvironment(THREE, stage);
    renderer = new THREE.WebGLRenderer({canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
    renderer.setPixelRatio(1); renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.debug.onShaderError = (_gl, _program, _vertex, _fragment) => { throw new Error('Final render shader compilation failed'); };
    const supported = renderer.capabilities.isWebGL2 && renderer.extensions.has('EXT_color_buffer_float') && renderer.extensions.has('OES_texture_float_linear');
    if (mode === 'path' && !supported) throw new Error('This graphics device does not support floating-point WebGL2 path tracing');
    actualMode = mode === 'raster' || !supported ? 'raster' : 'path';
    if (mode === 'auto' && !supported) fallbackReason = 'Floating-point WebGL2 path tracing is unavailable';
    if (actualMode === 'path') {
      stage.scene.getObjectByName('window-shadow-proxy').visible=false;
      try {
        progress('acceleration', 0.08); await tick();
        const {WebGLPathTracer, GenerateMeshBVHWorker} = await import('../vendor/pathtracer/index.js');
        aborted(signal);
        tracer = new WebGLPathTracer(renderer);
        const pathRenderer = tracer._pathTracer, pathMaterial = pathRenderer.material;
        // The legacy upstream listener compiles after each individual define
        // change. Batch the initial scene defines into one final shader variant.
        pathMaterial.removeEventListener('recompilation', pathRenderer._compileFunction);
        tracer.bounces = 6; tracer.transmissiveBounces = 4;
        tracer.filterGlossyFactor = 0.4;
        tracer.tiles.set(1, 1);
        tracer.renderDelay = 0; tracer.fadeDuration = 0; tracer.minSamples = 1;
        tracer.dynamicLowRes = false; tracer.rasterizeScene = false;
        tracer.textureSize.set(1024, 1024);
        worker = new GenerateMeshBVHWorker(); tracer.setBVHWorker(worker);
        await cancellable(tracer.setSceneAsync(stage.scene, stage.camera, {onProgress: p => {
          if (!signal?.aborted) onProgress?.({phase: 'acceleration', progress: 0.08 + Math.min(1, p) * 0.12, samples: 0, targetSamples: samples, mode: 'path'});
        }}), signal);
        pathMaterial.onBeforeRender();
        pathMaterial.addEventListener('recompilation', pathRenderer._compileFunction);
        const compile = pathRenderer.compileMaterial();
        pathRenderer._compilePromise = compile;
        compile.then(() => { if (pathRenderer._compilePromise === compile) pathRenderer._compilePromise = null; }, () => {});
        progress('sampling', 0.2);
        let stalledSince = performance.now(), lastSample = -1, compileFailure = null, firstSampleChecked = false;
        const observedCompiles = new Set();
        while (tracer.samples < samples) {
          aborted(signal);
          for (const pending of [tracer._compilePromise, tracer._pathTracer?._compilePromise]) {
            if (pending && !observedCompiles.has(pending)) {
              observedCompiles.add(pending);
              pending.catch(error => { compileFailure = error; });
            }
          }
          if (compileFailure) throw new Error('Final render shader compilation failed', {cause: compileFailure});
          if (tracer.samples !== lastSample) { lastSample = tracer.samples; stalledSince = performance.now(); }
          if (performance.now() - stalledSince > 180000) throw new Error(`Final renderer stalled for 180 seconds (${tracer.isCompiling ? 'shader compilation' : 'sampling'}, samples=${tracer.samples})`);
          tracer.renderSample(); completed = Math.floor(tracer.samples);
          if (completed >= 2 && !firstSampleChecked) {
            inspectFrame(renderer, width, height, actualMode, completed, tracer, true);
            firstSampleChecked = true;
          }
          progress(tracer.isCompiling ? 'compiling' : 'sampling', 0.2 + Math.min(1, tracer.samples / samples) * 0.79);
          await tick();
        }
        // Present the converged target explicitly after the final tiled update.
        // This pass copies the result only; it must not begin another sample.
        tracer.pausePathTracing = true;
        renderer.setRenderTarget(null);
        tracer.renderSample();
        await tick();
        // Failed/blank path output follows the same explicit fallback contract
        // as unsupported shaders; it must never escape as a successful frame.
        inspectFrame(renderer, width, height, actualMode, completed, tracer);
      } catch (error) {
        if (error.name === 'AbortError' || signal?.aborted || mode === 'path' || contextLost) throw error;
        fallbackReason = error.message;
        releaseTracer(); actualMode = 'raster'; completed = 0;
      }
    }
    if (actualMode === 'raster') {
      stage.scene.getObjectByName('window-shadow-proxy').visible=true;
      progress('raster', 0.25); await tick();
      const {RectAreaLightUniformsLib} = await import('../vendor/addons/lights/RectAreaLightUniformsLib.js');
      RectAreaLightUniformsLib.init();
      const [{EffectComposer}, {RenderPass}, {GTAOPass}, {SMAAPass}, {OutputPass}] = await Promise.all([
        import('../vendor/addons/postprocessing/EffectComposer.js'), import('../vendor/addons/postprocessing/RenderPass.js'),
        import('../vendor/addons/postprocessing/GTAOPass.js'), import('../vendor/addons/postprocessing/SMAAPass.js'), import('../vendor/addons/postprocessing/OutputPass.js')]);
      aborted(signal);
      composer = new EffectComposer(renderer);
      const render = new RenderPass(stage.scene, stage.camera), ao = new GTAOPass(stage.scene, stage.camera, width, height), aa = new SMAAPass(), output = new OutputPass();
      ao.blendIntensity = 0.8;
      ao.updateGtaoMaterial({radius: 0.18, distanceExponent: 1.3, thickness: 0.8, scale: 1, samples: 32});
      resources.push(ao, aa, output);
      for (const pass of [render, ao, aa, output]) composer.addPass(pass);
      composer.setSize(width, height);
      composer.render(); await tick(); completed = 1;
      progress('raster', 0.99);
    }
    // Inspect the rendered pixels rather than reporting a black/empty frame as success.
    inspectFrame(renderer, width, height, actualMode, completed, tracer);
    progress('complete', 1);
    return {canvas, mode: actualMode, samples: completed, width, height, preset, fallbackReason,
      elapsedMs: Math.round(performance.now() - started), jpeg: (quality = 0.94) => canvas.toDataURL('image/jpeg', quality)};
  } finally {
    canvas.removeEventListener('webglcontextlost', lost);
    releaseTracer();
    for (const resource of resources) resource.dispose?.();
    composer?.dispose(); stage?.dispose(); asset?.dispose(); renderer?.dispose();
  }
}
