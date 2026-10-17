// Styles shown in the studio: real, widely used styles with clear lines (no period "classic" styles — AURA does not
// make them), plus AURA, the house style. Other style data is kept only so older saved designs still open.
export const STYLE_IDS = ['aura', 'japandi', 'scandinavian_modern', 'mid_century_modern', 'minimalism', 'wabi_sabi', 'industrial', 'bauhaus', 'art_deco', 'brutalism'];
export const curate = all => STYLE_IDS.map(id => all.find(s => s.id === id)).filter(Boolean);
