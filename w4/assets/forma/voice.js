// Voice input: the browser's own speech service when it works, otherwise Whisper running locally in the page.
const WHISPER_LANG = {tr: 'turkish', en: 'english', de: 'german', fr: 'french', nl: 'dutch', da: 'danish', es: 'spanish', it: 'italian'};
const SPEECH_LANG = {tr: 'tr-TR', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', da: 'da-DK', es: 'es-ES', it: 'it-IT'};
let nativeBroken = false, worker = null, active = null;

/**
 * Start listening. onState(state, info): 'listening' | 'recording' | 'loading' (info: {loaded,total}) | 'working' | 'done' | 'error'.
 * onText(text, final). Returns a stop() function; calling start again while active stops it.
 */
export function startVoice({lang, onText, onState}) {
  if (active) { active.stop(); return () => {}; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR && !nativeBroken) return native(SR, lang, onText, onState);
  return whisper(lang, onText, onState);
}

function native(SR, lang, onText, onState) {
  const rec = new SR(); let gotResult = false;
  rec.lang = SPEECH_LANG[lang] || 'en-GB'; rec.interimResults = true; rec.maxAlternatives = 1;
  rec.onresult = e => { gotResult = true; const r = e.results[e.results.length - 1]; onText(r[0].transcript, r.isFinal); };
  rec.onerror = e => {
    // Embedded browsers and some vendors expose the API without a working service: switch to local Whisper.
    if (['network', 'service-not-allowed', 'not-allowed', 'audio-capture', 'language-not-supported'].includes(e.error) && !gotResult) {
      nativeBroken = e.error !== 'not-allowed'; active = null;
      if (nativeBroken) whisper(lang, onText, onState); else onState('error', {error: e.error});
    }
  };
  rec.onend = () => { if (active?.rec === rec) { active = null; onState('done'); } };
  active = {rec, stop: () => rec.stop()};
  onState('listening'); rec.start();
  return active.stop;
}

function whisper(lang, onText, onState) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { onState('error', {error: 'unsupported'}); return () => {}; }
  let stopped = false, recorder = null, stream = null, timer = 0;
  const stop = () => { if (stopped) return; stopped = true; clearTimeout(timer); recorder?.state === 'recording' && recorder.stop(); };
  active = {stop};
  worker ??= new Worker(new URL('./whisper-worker.js?v=20261016a', import.meta.url), {type: 'module'});
  worker.postMessage({type: 'warm'}); // start the one-time model download while the person speaks
  navigator.mediaDevices.getUserMedia({audio: {channelCount: 1, noiseSuppression: true, echoCancellation: true}}).then(s => {
    stream = s; const chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      onState('working');
      try {
        const buf = await new Blob(chunks).arrayBuffer(), ctx = new AudioContext({sampleRate: 16000});
        const audio = (await ctx.decodeAudioData(buf)).getChannelData(0); ctx.close();
        worker.onmessage = ({data}) => {
          if (data.type === 'progress') onState('loading', data);
          else if (data.type === 'result') { active = null; onText(data.text, true); onState('done'); }
          else if (data.type === 'error') { active = null; onState('error', data); }
        };
        worker.postMessage({type: 'run', audio, language: WHISPER_LANG[lang] || 'english'}, [audio.buffer]);
      } catch (e) { active = null; onState('error', {error: String(e.message || e)}); }
    };
    recorder.start(); onState('recording');
    timer = setTimeout(stop, 8000); // a command is short; the second click also stops
  }).catch(e => { active = null; onState('error', {error: String(e.message || e)}); });
  // While loading the model on the first run, report progress.
  worker.onmessage = ({data}) => { if (data.type === 'progress') onState('loading', data); };
  return stop;
}
