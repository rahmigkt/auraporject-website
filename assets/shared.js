const SUPABASE_URL = "https://xcsvobtewvjlnjeyqiux.supabase.co";
const SUPABASE_KEY = "sb_publishable_yjwxxm5IaMkEi1TCugejzA__cqLpYnP";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const CATALOG_BUCKET = "aura-catalog-images";
const PROJECT_BUCKET = "aura-project-images"; // felsefe bölümleri / kurucu fotoğrafı için

function escapeHtml(str){
  if (str == null) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function nl2p(str){
  if (!str) return "";
  return str.split(/\n\s*\n/).map(p => '<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>').join('');
}
function publicImageUrl(path, bucket){
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = sb.storage.from(bucket || CATALOG_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
function formatPrice(price, currency){
  if (price == null) return null;
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
  return symbol + Number(price).toLocaleString('tr-TR');
}
function qs(name){
  return new URLSearchParams(window.location.search).get(name);
}
