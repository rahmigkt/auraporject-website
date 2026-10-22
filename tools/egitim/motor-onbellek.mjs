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
      // EGITIM-PLANI-STUDYO: a positive target with an engine warning is not
      // verified. In particular no-fit/unmet constraints must not become success.
      const ok = rapor?.gecti === true && Array.isArray(rapor.red) && rapor.red.length === 0 && Array.isArray(rapor.uyari) && rapor.uyari.length === 0;
      results.set(key, ok);
      sayim.benzersiz++;
      return ok;
    }
  };
}
