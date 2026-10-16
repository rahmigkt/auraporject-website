// Speech-to-text in the browser (no server, no cost): Whisper via transformers.js.
// The library loads from jsDelivr and the model from the Hugging Face hub once, then stays in the browser cache.
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js';
const MODEL = 'onnx-community/whisper-base';
let asr = null;
async function load() {
  if (asr) return asr;
  const {pipeline, env} = await import(LIB);
  env.allowLocalModels = false;
  const webgpu = !!self.navigator?.gpu && !!(await self.navigator.gpu.requestAdapter?.().catch(() => null));
  asr = await pipeline('automatic-speech-recognition', MODEL, {
    device: webgpu ? 'webgpu' : 'wasm',
    dtype: webgpu ? {encoder_model: 'fp32', decoder_model_merged: 'q4'} : 'q8',
    progress_callback: p => { if (p.status === 'progress' && p.total) self.postMessage({type: 'progress', loaded: p.loaded, total: p.total, file: p.file}); }
  });
  return asr;
}
self.onmessage = async ({data}) => {
  try {
    if (data.type === 'warm') { await load(); self.postMessage({type: 'ready'}); return; }
    const model = await load();
    const out = await model(data.audio, {language: data.language, task: 'transcribe', chunk_length_s: 30});
    self.postMessage({type: 'result', text: (out?.text || '').trim()});
  } catch (e) { self.postMessage({type: 'error', error: String(e?.message || e)}); }
};
