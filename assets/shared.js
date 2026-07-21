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
  if (path.startsWith("http") || path.startsWith("data:")) return path;
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

// ================= WHATSAPP =================
const WHATSAPP_NUMBER = "905330339084";
const WHATSAPP_WELCOME = "Merhaba AURA PROJECT 👋\nBir proje hakkında bilgi almak istiyorum.\n\nProjenizin tasarım ve çizim sürecinde Merve Hanım ile görüşeceksiniz.";
function waLink(message){
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message || WHATSAPP_WELCOME);
}
function waProductMessage(title, url){
  return "Merhaba AURA PROJECT 👋\n\n\"" + title + "\" hakkında teklif almak istiyorum.\n🔗 " + url +
    "\n\nProjenizin tasarım ve çizim sürecinde Merve Hanım ile görüşeceksiniz.";
}
function waCartMessage(items){
  const lines = items.map((it,i) => (i+1) + ". " + it.title + " (adet: " + it.qty + ")\n🔗 " + it.url).join("\n\n");
  return "Merhaba AURA PROJECT 👋\n\nAşağıdaki ürünler için teklif almak istiyorum:\n\n" + lines +
    "\n\nProjenizin tasarım ve çizim sürecinde Merve Hanım ile görüşeceksiniz.";
}

// ================= SEPET (localStorage) =================
const CART_KEY = "aura_cart";
function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch(e){ return []; }
}
function saveCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); updateCartBadge(); }
function addToCart(product, qty){
  const items = getCart();
  const url = window.location.origin + '/urun.html?slug=' + encodeURIComponent(product.slug);
  const existing = items.find(it => it.slug === product.slug);
  if (existing) existing.qty += qty;
  else items.push({ slug: product.slug, title: product.title, image: product.image_url, qty: qty, url: url });
  saveCart(items);
}
function removeFromCart(slug){
  saveCart(getCart().filter(it => it.slug !== slug));
}
function updateCartQty(slug, qty){
  const items = getCart();
  const it = items.find(i => i.slug === slug);
  if (it) it.qty = Math.max(1, qty);
  saveCart(items);
}
function cartCount(){
  return getCart().reduce((sum,it) => sum + it.qty, 0);
}
function updateCartBadge(){
  document.querySelectorAll('.cart-badge').forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? 'inline-flex' : 'none';
  });
}

// ================= FLOATING WHATSAPP BUTTON (tüm sayfalarda otomatik) =================
function injectWhatsAppFloat(){
  if (document.getElementById('waFloat')) return;
  const a = document.createElement('a');
  a.id = 'waFloat';
  a.href = waLink();
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'WhatsApp ile iletişime geç');
  a.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:60;width:56px;height:56px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.25);text-decoration:none;';
  a.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.004 2C6.477 2 2 6.477 2 12c0 1.856.505 3.658 1.463 5.235L2 22l4.887-1.436A9.953 9.953 0 0012.004 22C17.53 22 22 17.523 22 12S17.53 2 12.004 2zm0 18.2c-1.66 0-3.29-.446-4.71-1.29l-.338-.2-2.898.852.87-2.83-.22-.35A8.196 8.196 0 013.8 12c0-4.529 3.674-8.2 8.204-8.2 4.529 0 8.2 3.671 8.2 8.2 0 4.53-3.671 8.2-8.2 8.2z"/></svg>';
  document.body.appendChild(a);
}
document.addEventListener('DOMContentLoaded', () => {
  injectWhatsAppFloat();
  updateCartBadge();
  document.querySelectorAll('.cta-whatsapp').forEach(el => {
    el.href = waLink();
    el.target = '_blank';
    el.rel = 'noopener';
  });
});

