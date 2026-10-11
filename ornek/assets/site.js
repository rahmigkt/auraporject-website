(() => {
  const toggle = document.querySelector('.menu-toggle');
  const drawer = document.getElementById('mobile-menu');
  if (!toggle || !drawer) return;
  const close = () => {
    drawer.hidden = true;
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Menu' : 'Menü');
  };
  toggle.addEventListener('click', () => {
    drawer.hidden = !drawer.hidden;
    toggle.setAttribute('aria-expanded', String(!drawer.hidden));
    toggle.setAttribute('aria-label', !drawer.hidden ? (document.documentElement.lang === 'en' ? 'Close' : 'Kapat') : (document.documentElement.lang === 'en' ? 'Menu' : 'Menü'));
  });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if(window.innerWidth > 1050) close(); });
})();
