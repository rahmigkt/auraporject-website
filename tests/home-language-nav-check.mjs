import assert from 'node:assert/strict';
globalThis.document={body:{dataset:{}}};
const {siteHeader}=await import('../assets/aura-home.js');
for(const lang of ['tr','en','de','fr','nl','da','es','it','ar']){
 const html=siteHeader(lang,{switcher:true});
 assert.ok(html.includes(`class="a-brand" href="index.html?lang=${lang}"`));
 assert.ok(html.includes(`href="tasarla.html?lang=${lang}"`));
 assert.ok(html.includes(`value="${lang}" selected`));
}
assert.ok(siteHeader().includes('index.html?lang=tr'));
console.log('PASS9supportedlanguages/default:brandanddesignURLretainlanguage;switcherselectionpreserved.');
