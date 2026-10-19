// AURA account: email + password (Supabase Auth). A signed-in customer's studio work — the project, the design in
// progress for every family, per-kind memory, language — is stored in one row of `forma_workspaces`, readable and
// writable only by its owner (row-level security). Without an account the work stays in this browser only.
const SUPABASE_URL = 'https://xcsvobtewvjlnjeyqiux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yjwxxm5IaMkEi1TCugejzA__cqLpYnP';
const PREFIX = 'aura-forma-';
const LOCAL_ONLY = ['aura-forma-account-skip', 'aura-forma-synced-at', 'aura-forma-synced-user', 'aura-forma-local-at'];

let client = null, loading = null, user = null, timer = 0;
const listeners = new Set();

function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
async function sb() {
  if (client) return client;
  loading ??= (async () => {
    if (!window.supabase?.createClient) await loadScript(new URL('../vendor/supabase/supabase.js', import.meta.url).href);
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth: {persistSession: true, storageKey: 'aura-account-session', detectSessionInUrl: true}});
    client.auth.onAuthStateChange((_e, session) => { const was = user?.id; user = session?.user || null; if (was !== user?.id) for (const f of listeners) f(user); });
    const {data} = await client.auth.getSession(); user = data.session?.user || null;
    return client;
  })();
  return loading;
}

/** Everything the studio keeps in this browser (all aura-forma-* keys except local switches). */
function snapshot() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(PREFIX) && !LOCAL_ONLY.includes(k)) out[k] = localStorage.getItem(k); }
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
    out['aura-forma-project'] = JSON.stringify({...lp, ...rp, items});
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
    if (!user) return false;
    const c = await sb(), {data, error} = await c.from('forma_workspaces').select('data, updated_at').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    // First time this browser meets this account: unite the work. Afterwards the newer side wins as a whole.
    const local = snapshot(), remote = data?.data || {}, first = localStorage.getItem('aura-forma-synced-user') !== user.id;
    const localAt = localStorage.getItem('aura-forma-local-at') || '', remoteAt = data?.updated_at || '';
    const merged = first ? merge(remote, local, keyOf) : localAt > remoteAt ? local : remote;
    let changed = false;
    for (const [k, v] of Object.entries(merged)) if (typeof v === 'string' && localStorage.getItem(k) !== v) { localStorage.setItem(k, v); changed = true; }
    await this.push();
    return changed;
  },
  /** Save this browser's work to the account (debounced by schedule()). */
  async push() {
    if (!user) return;
    const c = await sb(), {error} = await c.from('forma_workspaces').upsert({user_id: user.id, data: snapshot(), updated_at: new Date().toISOString()});
    if (error) throw error;
    try { localStorage.setItem('aura-forma-synced-at', new Date().toISOString()); localStorage.setItem('aura-forma-synced-user', user.id); } catch {}
  },
  schedule() { try { localStorage.setItem('aura-forma-local-at', new Date().toISOString()); } catch {} if (!user) return; clearTimeout(timer); timer = setTimeout(() => this.push().catch(() => {}), 1200); },
  async flush() { if (timer) { clearTimeout(timer); timer = 0; await this.push().catch(() => {}); } }
};
