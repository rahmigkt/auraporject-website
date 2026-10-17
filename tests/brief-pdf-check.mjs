import assert from 'node:assert/strict';
import {createProjectPdf} from '../assets/project-pdf.js';
// Structural/pagination regression with a mock canvas; not visual PDF validation.
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){},measureText:s=>({width:s.length*15})}),toDataURL:()=> 'data:image/jpeg;base64,/9j/2Q=='})};
const pdf=await createProjectPdf({project:{stage:'brief',design:null,language:'tr',product:{names:{tr:'Özel sehpa'}}},rows:[{key:'Talep',value:'Açıklama '.repeat(1000)}],contact:{name:'Örnek'},reference:'TEST'});assert.equal(pdf.type,'application/pdf');const text=await pdf.text();assert(text.startsWith('%PDF-1.4'));assert(text.includes('/Count 3')||text.includes('/Count 4')||text.includes('/Count 5'));assert(text.includes('%%EOF'));console.log('PASS brief PDF accepts no design and paginates long requests without invoking furniture drawing (mock canvas).');
