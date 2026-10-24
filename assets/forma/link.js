// A link that opens a design (or a whole project) again in the studio. The design travels in the URL fragment
// (#d=… or #p=…), deflated and base64url-encoded, so nothing is stored on a server and the link keeps working
// from the PDF, the README or the files the designer receives.
const b64u = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = text => { const s = atob(text.replace(/-/g, '+').replace(/_/g, '/')); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; };
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

/** Only what is needed to rebuild a design. */
const slim = d => ({...(d.productId?{i:d.productId}:{}),f: d.family, k: d.kind, s: d.style, n: d.seed, p: d.params, m: d.materials, ...(d.overrides?.length ? {o: d.overrides} : {})});
const full = x => ({...(x.i?{productId:x.i}:{}),family: x.f, kind: x.k, style: x.s, seed: x.n, params: x.p, materials: x.m, ...(x.o ? {overrides: x.o} : {})});

export async function encode(obj) {
  const json = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'function') { try { return 'z' + b64u(await pipe(json, new CompressionStream('deflate-raw'))); } catch {} }
  return 'j' + b64u(json);
}
export async function decode(text) {
  if(typeof text!=='string'||text.length>262144||!/^([zj])[A-Za-z0-9_-]+$/.test(text))throw Error('Geçersiz veya çok uzun tasarım bağlantısı.');
  const kind=text[0],bytes=unb64u(text.slice(1));let json=bytes;
  if(kind==='z'){
    const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),chunks=[];let size=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2097152)throw Error('Tasarım bağlantısı veri sınırını aşıyor.');chunks.push(value);}}catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
    json=new Uint8Array(size);let offset=0;for(const c of chunks){json.set(c,offset);offset+=c.length;}
  }
  const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(json));
  const inspect=(v,depth=0)=>{if(depth>32)throw Error('Tasarım verisi çok derin.');if(v&&typeof v==='object')for(const [key,item]of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(key))throw Error('Geçersiz tasarım anahtarı.');inspect(item,depth+1);}else if(typeof v==='number'&&!Number.isFinite(v))throw Error('Geçersiz sayı.');};inspect(value);return value;
}

/** Studio address the links point to (the deployed studio page, whatever page made the link). */
export const studioUrl = (lang = 'tr') => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}tasarla.html?lang=${lang}`;
export async function designLink(design, lang) { return `${studioUrl(lang)}#d=${await encode({v: 1, d: slim(design)})}`; }
export async function projectLink(items, room, lang) { return `${studioUrl(lang)}#p=${await encode({v: 1, items: items.map(i => ({id: i.id, q: i.qty || 1, d: slim(i.design)})), room: room || null})}`; }

/** Read #d= / #p= from the current address. Returns {design} or {items, room} or null. */
export async function readLink(hash = location.hash) {
  const m = hash.match(/[#&]([dp])=([A-Za-z0-9_-]+)/); if (!m) return null;
  try {
    const x = await decode(m[2]);
    if(x?.v!==1)return null;
    if (m[1] === 'd' && x?.d) return {design: full(x.d)};
    if (m[1] === 'p' && Array.isArray(x?.items)&&x.items.length>0&&x.items.length<=40) return {items: x.items.map(i => ({id: i.id, qty: i.q || 1, design: full(i.d)})), room: x.room || null};
  } catch {}
  return null;
}

/** A small page that forwards to the link (works by double-click on any computer). */
export const linkPage = (url, title) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><meta http-equiv="refresh" content="0;url=${url.replace(/"/g, '&quot;')}"></head><body style="font-family:sans-serif;padding:40px"><p><a href="${url.replace(/"/g, '&quot;')}">${title}</a></p></body></html>`;
export const urlShortcut = url => `[InternetShortcut]\r\nURL=${url}\r\n`;
