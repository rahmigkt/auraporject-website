// Public application identity only. No service-role, SMTP or OAuth secret belongs in a browser.
export const AUTH_URL='https://xcsvobtewvjlnjeyqiux.supabase.co';
export const AUTH_KEY='sb_publishable_yjwxxm5IaMkEi1TCugejzA__cqLpYnP';
export const SESSION_KEY='aura-account-session';
export function safeNext(value){return ['tasarla.html','tasarimci.html','sosyal-editor.php'].includes(value)?value:'tasarla.html';}
export function callbackUrl(origin,next){const u=new URL('hesap.html',origin+'/');u.searchParams.set('next',safeNext(next));return u.href;}
export function profile({name,market,locale}){name=String(name||'').trim();if(name.length<2||name.length>80)throw Error('Adınızı 2–80 karakter olarak girin.');const choices={TR:'tr-TR',DE:'de-DE',SA:'ar-SA',AE:'ar-AE'};if(choices[market]!==locale)throw Error('Ülke ve dil seçimini kontrol edin.');return {name,market,locale};}
export function emailAddress(v){v=String(v||'').trim().toLowerCase();if(v.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(v))throw Error('Geçerli e-posta adresi girin.');return v;}
export function newPassword(a,b){if(typeof a!=='string'||a.length<12||a.length>128)throw Error('Parola 12–128 karakter olmalı.');if(a!==b)throw Error('Parolalar eşleşmiyor.');return a;}
