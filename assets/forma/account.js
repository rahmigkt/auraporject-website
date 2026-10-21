// AURA account: email + password (Supabase Auth). A signed-in customer's studio work — the project, the design in
// progress for every family, per-kind memory, language — is stored in one row of `forma_workspaces`, readable and
// writable only by its owner (row-level security). Without an account the work stays in this browser only.
const SUPABASE_URL = 'https://xcsvobtewvjlnjeyqiux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yjwxxm5IaMkEi1TCugejzA__cqLpYnP';
const PREFIX = 'aura-forma-';
const LOCAL_ONLY = ['aura-forma-account-skip', 'aura-forma-synced-at', 'aura-forma-synced-user', 'aura-forma-local-at'];

let client = null, loading = null, user = null, timer = 0;
const listeners = new Set();
const pushes = new Map();

function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
async function sb() {
  if (client) return client;
  loading ??= (async () => {
    if (!window.supabase?.createClient) await loadScript(new URL('../vendor/supabase/supabase.js', import.meta.url).href);
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth: {persistSession: true, storageKey: 'aura-account-session', detectSessionInUrl: true}});
    client.auth.onAuthStateChange((_e, session) => { const was = user?.id; user = session?.user || null; if (was !== user?.id) { clearTimeout(timer); timer = 0; for (const f of listeners) f(user); } });
    const {data} = await client.auth.getSession(); user = data.session?.user || null;
    return client;
  })();
  return loading;
}

/** Everything the studio keeps in this browser (all aura-forma-* keys except local switches). */
const isWorkspaceKey = k => k?.startsWith(PREFIX) && !LOCAL_ONLY.includes(k);
function snapshot() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (isWorkspaceKey(k)) out[k] = localStorage.getItem(k); }
  return out;
}
function remoteSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid workspace snapshot');
  const out = {};
  for (const [k, v] of Object.entries(value)) if (isWorkspaceKey(k)) {
    if (typeof v !== 'string') throw new Error('Invalid workspace value');
    out[k] = v;
  }
  return out;
}
const parse = v => { try { return JSON.parse(v); } catch { return null; } };
/** Merge the account's saved work with this browser's: account wins per key, projects are united (no duplicates). */
function merge(remote, local, keyOf) {
  const out = {...local, ...remote};
  const rp = parse(remote['aura-forma-project']), lp = parse(local['aura-forma-project']);
  if (rp?.items || lp?.items) {
    const items = [...(rp?.items || [])], seen = new Set(items.map(i => keyOf(i.design)));
    let n = Math.max(0, ...items.map(i => +String(i.id).slice(1) || 0));
    for (const it of lp?.items || []) if (!seen.has(keyOf(it.design))) { items.push({...it, id: 'U' + (++n)}); seen.add(keyOf(it.design)); }
    out['aura-forma-project'] = JSON.stringify({items});
  }
  return out;
}

export const account = {
  get user() { return user; },
  onChange(f) { listeners.add(f); return () => listeners.delete(f); },
  async init() { try { await sb(); } catch { return null; } return user; },
  async signUp(email, password, name) {
    const c = await sb();
    const {data, error} = await c.auth.signUp({email, password, options: {data: {name}, emailRedirectTo: location.href.split('#')[0]}});
    if (error) throw error;
    return {confirm: !data.session};
  },
  async signIn(email, password) { const c = await sb(); const {error} = await c.auth.signInWithPassword({email, password}); if (error) throw error; return user; },
  async reset(email) { const c = await sb(); const {error} = await c.auth.resetPasswordForEmail(email, {redirectTo: location.href.split('#')[0]}); if (error) throw error; },
  async signOut() { const c = await sb(); await this.flush(); await c.auth.signOut(); },
  /** Pull the account's work into this browser (merged). Returns true when local data changed. */
  async pull(keyOf) {
    const id = user?.id;
    if (!id) return false;
    const c = await sb();
    if (user?.id !== id) return false;
    const {data, error} = await c.from('forma_workspaces').select('data, updated_at').eq('user_id', id).maybeSingle();
    if (user?.id !== id) return false;
    if (error) throw error;
    // First time this browser meets this account: unite the work. Afterwards the newer side wins as a whole.
    const local = snapshot(), remote = data ? remoteSnapshot(data.data) : {}, first = localStorage.getItem('aura-forma-synced-user') !== id;
    const localAt = localStorage.getItem('aura-forma-local-at') || '', remoteAt = data?.updated_at || '';
    const merged = first ? merge(remote, local, keyOf) : localAt > remoteAt ? local : remote;
    let changed = false;
    for (const k of Object.keys(local)) if (!Object.hasOwn(merged, k)) { localStorage.removeItem(k); changed = true; }
    for (const [k, v] of Object.entries(merged)) if (typeof v === 'string' && localStorage.getItem(k) !== v) { localStorage.setItem(k, v); changed = true; }
    await this.push(id);
    return changed;
  },
  /** Save this browser's work to the account (debounced by schedule()). */
  async push(id = user?.id) {
    if (!id || user?.id !== id) return;
    const data = snapshot(), updatedAt = new Date().toISOString();
    // Keep one account's snapshots in capture order, even when network responses are slow.
    const pending = (pushes.get(id) || Promise.resolve()).catch(() => {}).then(async () => {
      if (user?.id !== id) return;
      const c = await sb();
      if (user?.id !== id) return;
      const {error} = await c.from('forma_workspaces').upsert({user_id: id, data, updated_at: updatedAt});
      if (user?.id !== id) return;
      if (error) throw error;
      try { localStorage.setItem('aura-forma-synced-at', new Date().toISOString()); localStorage.setItem('aura-forma-synced-user', id); } catch {}
    });
    pushes.set(id, pending);
    try { await pending; } finally { if (pushes.get(id) === pending) pushes.delete(id); }
  },
  schedule() { try { localStorage.setItem('aura-forma-local-at', new Date().toISOString()); } catch {} const id = user?.id; if (!id) return; clearTimeout(timer); timer = setTimeout(() => { timer = 0; this.push(id).catch(() => {}); }, 1200); },
  async flush() { if (timer) { clearTimeout(timer); timer = 0; await this.push().catch(() => {}); } }
};
