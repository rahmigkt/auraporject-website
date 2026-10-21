// Same-run reuse only: every distinct state/action byte sequence is replayed on
// the current engine. No saved approval or historical engine result is trusted.
export function motorDenetimi(uygula) {
  const results = new Map();
  const sayim = {kayit: 0, benzersiz: 0, tekrar: 0};
  return {
    sayim,
    kabul(durum, islemler) {
      const key = JSON.stringify([durum, islemler]);
      sayim.kayit++;
      if (results.has(key)) { sayim.tekrar++; return results.get(key); }
      const {rapor} = uygula(durum, islemler);
      const ok = rapor.red.length === 0; // Preserve the compiler's existing gate.
      results.set(key, ok);
      sayim.benzersiz++;
      return ok;
    }
  };
}
