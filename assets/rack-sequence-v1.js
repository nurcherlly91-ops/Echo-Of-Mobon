/* Echo of Mobon — nomor posisi rak dinamis.
   collection_code dan qr_code adalah identitas permanen; jangan diubah ketika
   buku diarsipkan/dihapus agar riwayat dan stiker QR tetap benar. */
(()=>{
 'use strict';
 const posInt=value=>{
   const n=Number(value);
   return Number.isSafeInteger(n)&&n>0?n:null;
 };
 const shelf=b=>posInt(b?.rack_no);
 const permanentOrder=b=>{
   const r=shelf(b);
   const m=r&&String(b?.collection_code||'').match(new RegExp('^'+r+'-([0-9]+)$'));
   return m?Number(m[1]):Number.POSITIVE_INFINITY;
 };
 const compare=(a,b)=>{
   const ar=shelf(a),br=shelf(b);
   if(ar!==br)return ar===null?1:br===null?-1:ar-br;
   const ao=permanentOrder(a),bo=permanentOrder(b);
   if(ao!==bo)return ao-bo;
   const ac=String(a.created_at||''),bc=String(b.created_at||'');
   if(ac!==bc)return ac.localeCompare(bc);
   const t=String(a.title||'').localeCompare(String(b.title||''),'id');
   return t||String(a.id||'').localeCompare(String(b.id||''));
 };
 const pad=n=>String(n).padStart(3,'0');
 function enumerate(rows){
   const ordered=(Array.isArray(rows)?rows:[]).filter(x=>x&&x.active!==false).slice().sort(compare);
   const positions=new Map(),counts=new Map();
   for(const book of ordered){
     const rack=shelf(book);
     if(rack===null){
       positions.set(String(book.id),{rack:null,number:null,code:'Rak belum diatur',label:'Rak belum diatur'});
       continue;
     }
     const number=(counts.get(rack)||0)+1;
     counts.set(rack,number);
     positions.set(String(book.id),{rack,number,code:'R'+String(rack).padStart(2,'0')+'-'+pad(number),
       label:'Rak '+rack+' • No. '+pad(number)});
   }
   return {ordered,positions,counts};
 }
 function next(rows,rack){
   const r=posInt(rack);
   if(r===null)return null;
   const number=(enumerate(rows).counts.get(r)||0)+1;
   return {rack:r,number,code:'R'+String(r).padStart(2,'0')+'-'+pad(number),
     label:'Rak '+r+' • No. '+pad(number)};
 }
 window.EOMRACK={enumerate,next,shelf,compare,pad};
})();