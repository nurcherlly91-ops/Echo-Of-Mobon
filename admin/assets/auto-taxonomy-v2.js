(function(){
'use strict';
function init(){
 if(window.__eomAutomaticTaxonomyV2)return;
 window.__eomAutomaticTaxonomyV2=true;
 const engine=window.EOMBOOKCLASSIFY;
 if(!engine)return;
 const physical=document.getElementById('bookForm'),digital=document.getElementById('digitalForm');
 if(!physical)return;
 const physicalTitle=document.getElementById('bookTitle');
 const bookCategory=document.getElementById('bookCategory');
 const bookGenre=document.getElementById('bookGenre');
 const desc=document.getElementById('bookDescription');
 let latest=null,timer=null,digitalTimer=null;
 function noteAfter(select,id){
   if(!select)return null;
   let note=document.getElementById(id);
   if(note)return note;
   note=document.createElement('div');
   note.id=id;note.className='eom-auto-taxonomy-note';
   note.setAttribute('role','status');
   note.setAttribute('aria-live','polite');
   select.closest('label')?.after(note);
   return note;
 }
 const physicalNote=noteAfter(bookGenre||bookCategory,'eomPhysicalTaxonomyNote');
 const digitalNote=noteAfter(document.getElementById('digitalGenre')||document.getElementById('digitalCategory'),'eomDigitalTaxonomyNote');
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function renderPhysical(result){
   if(!physicalNote)return;
   if(!physicalTitle?.value.trim()){
     physicalNote.innerHTML='🏷️ <b>Kategori & genre otomatis.</b> Foto sampul/ISBN atau isi judul. Keduanya akan muncul dan bisa dikoreksi.';
     physicalNote.classList.remove('eom-auto-warning');
     return;
   }
   const cat=bookCategory?.value||'—';
   const genre=bookGenre?.value||'—';
   const manual=bookCategory?.dataset.eomManualOverride||bookGenre?.dataset.eomManualOverride;
   const review=result?.needsReview||cat==='Umum / Belum Terklasifikasi';
   physicalNote.classList.toggle('eom-auto-warning',!!review);
   physicalNote.innerHTML='<b>🏷️ '+(manual?'Pilihan admin':review?'Prediksi otomatis · perlu diperiksa':'Terisi otomatis')+'</b>'+
     '<span>Kategori: <strong>'+escape(cat)+'</strong> · Genre: <strong>'+escape(genre)+'</strong></span>'+
     '<small>'+(review?'Belum cukup informasi untuk menentukan jenis buku dengan yakin.':'Berdasarkan judul, foto, atau metadata ISBN.')+' Bisa diubah sebelum menyimpan.</small>';
 }
 function classifyTypedPhysical(){
   if(!physicalTitle?.value.trim()){renderPhysical(null);return;}
   const metadata={title:physicalTitle.value.trim(),description:desc?.value||''};
   const result=engine.applyToForm(metadata);
   latest=result;
   renderPhysical(result);
 }
 window.document.addEventListener('eom:book-auto-classified',event=>{
   latest=event.detail;
   renderPhysical(latest);
 });
 physicalTitle?.addEventListener('input',()=>{
   clearTimeout(timer);
   timer=setTimeout(classifyTypedPhysical,500);
 });
 desc?.addEventListener('change',()=>{
   clearTimeout(timer);
   timer=setTimeout(classifyTypedPhysical,180);
 });
 [bookCategory,bookGenre].forEach(select=>select?.addEventListener('change',event=>{
   renderPhysical({...latest,needsReview:event.isTrusted?false:latest?.needsReview});
 }));
 physical.addEventListener('submit',()=>{
   if(physicalTitle?.value.trim()&&(!bookCategory?.value||!bookGenre?.value)){
     classifyTypedPhysical();
   }
 },true);
 document.getElementById('addBookBtn')?.addEventListener('click',()=>{
   clearTimeout(timer);latest=null;
   setTimeout(()=>renderPhysical(null),0);
 });
 // Kategori & genre juga disarankan pada buku digital berdasarkan judul.
 const digitalTitle=document.getElementById('digitalTitle');
 const digitalCategory=document.getElementById('digitalCategory');
 const digitalGenre=document.getElementById('digitalGenre');
 function renderDigital(result){
   if(!digitalNote)return;
   if(!digitalTitle?.value.trim()){
     digitalNote.innerHTML='🏷️ <b>Pengelompokan otomatis:</b> Ketik judul buku digital.';
     digitalNote.classList.remove('eom-auto-warning');
     return;
   }
   const category=digitalCategory?.value||'—',genre=digitalGenre?.value||'—';
   const review=result?.needsReview||category==='Umum / Belum Terklasifikasi';
   digitalNote.classList.toggle('eom-auto-warning',!!review);
   digitalNote.innerHTML='<b>🏷️ '+(review?'Prediksi · perlu diperiksa':'Saran otomatis')+'</b>'+
     '<span>Kategori: <strong>'+escape(category)+'</strong> · Genre: <strong>'+escape(genre)+'</strong></span>';
 }
 function classifyDigital(){
   const title=digitalTitle?.value.trim();
   if(!title){renderDigital(null);return;}
   const result=engine.recognize({title});
   if(result.category&&!digitalCategory?.dataset.eomManualOverride)engine.chooseOption(digitalCategory,result.category);
   if(result.genre&&!digitalGenre?.dataset.eomManualOverride)engine.chooseOption(digitalGenre,result.genre);
   renderDigital(result);
 }
 [digitalCategory,digitalGenre].forEach(select=>{
   select?.addEventListener('change',e=>{
     if(e.isTrusted)select.dataset.eomManualOverride='true';
     renderDigital(null);
   });
 });
 digitalTitle?.addEventListener('input',()=>{
   clearTimeout(digitalTimer);
   digitalTimer=setTimeout(classifyDigital,500);
 });
 digital?.addEventListener('submit',()=>{
   if(digitalTitle?.value.trim()&&(!digitalCategory?.value||!digitalGenre?.value))classifyDigital();
 },true);
 document.getElementById('addDigitalBtn')?.addEventListener('click',()=>{
   clearTimeout(digitalTimer);
   [digitalCategory,digitalGenre].forEach(x=>{if(x)delete x.dataset.eomManualOverride;});
   setTimeout(()=>renderDigital(null),0);
 });
 document.addEventListener('eom:book-taxonomy-ready',()=>{
   // Jika kategori di-refresh ketika OCR masih berjalan, kembalikan klasifikasi terakhir.
   if(physicalTitle?.value.trim()&&physical.closest('dialog')?.open){
     const current=latest;
     if(current?.category&&current?.genre){
       if(!bookCategory?.value&&!bookCategory?.dataset.eomManualOverride)engine.chooseOption(bookCategory,current.category);
       if(!bookGenre?.value&&!bookGenre?.dataset.eomManualOverride)engine.chooseOption(bookGenre,current.genre);
     }
     renderPhysical(latest);
   }
 });
 renderPhysical(null);
 renderDigital(null);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();