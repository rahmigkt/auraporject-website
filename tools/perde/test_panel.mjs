// Acceptance (Codex TEKSTIL-02): folded arc length equals the flat panel within 2 % for every heading, width and open state.
// Run: node tools/perde/test_panel.mjs
globalThis.document = {createElement: () => ({getContext: () => new Proxy({}, {get: () => () => ({addColorStop(){}})}), width: 0, height: 0})};
const P = await import(new URL('../../assets/ev/perde.js', import.meta.url));
const {HEADINGS} = await import(new URL('../../assets/ev/tekstil.js', import.meta.url));
let worst = 0;
for (const hd of Object.keys(HEADINGS)) for (const ow of [1200, 1800, 3000]) for (const op of [0, 0.5, 1]) {
  const railW = ow + 300, half = railW / 2, stack = Math.max(110, 180 * railW / 1000 / 2), flat = half * HEADINGS[hd].full, disp = half - (half - stack) * op;
  const m = P.curtainPanel(disp / 1000, flat / 1000, 2.4, hd, {opacity: 1}); const e = Math.abs(m.userData.arc - flat / 1000) / (flat / 1000) * 100; worst = Math.max(worst, e);
  if (ow === 1800) console.log(hd, 'açıklık', op, 'görünen', Math.round(disp), 'düz', Math.round(flat), 'yay', Math.round(m.userData.arc * 1000), 'kıvrım', m.userData.folds, 'genlik', Math.round(m.userData.amp * 1000), 'hata%', e.toFixed(2));
}
console.log('en kötü hata %', worst.toFixed(2));
if (worst > 2) { console.error('KUMAŞ BOYU KORUNMUYOR'); process.exit(1); }
