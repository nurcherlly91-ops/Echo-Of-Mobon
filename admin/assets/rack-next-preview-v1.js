(function(){
'use strict';
function init(){
 const rack=document.getElementById('bookRack'),add=document.getElementById('addBookBtn'),
       dialog=document.getElementById('bookDialog');
 if(!rack||!add||!dialog||!window.EOMRACK)return;
 const note=document.createElement('div');
 note.id='eomRackNextPreview';
 note.className='eom-rack-next-preview';
 note.setAttribute('role','status');
 note.setAttribute('aria-live','polite');
 rack.closest('label')?.after(note);
 let books=[],request=0,timer=null;
 function show(){
   const pos=EOMRACK.next(books,rack.value||1);
   const r=EOMRACK.shelf({rack_no:rack.value||1});
   if(!r){
     note.innerHTML='⚠️ Masukkan nomor rak yang benar (minimal 1).';
     return;
   }
   note.innerHTML='<strong>🔢 Nomor urut rak otomatis: '+EOMONLINE.esc(pos.code)+'</strong>'+
     '<small>Rak '+r+' · posisi berikutnya '+EOMONLINE.esc(String(pos.number).padStart(3,'0'))+
     ' dari '+(pos.number-1)+' judul yang aktif. Nomor akan menyesuaikan otomatis setelah buku ditambah, dipindah, atau diarsipkan.</small>'+
     '<small>Kode koleksi dan QR yang lama tetap dipertahankan sebagai identitas permanen.</small>';
 }
 async function refresh(){
   const id=++request;
   note.textContent='Memeriksa jumlah buku pada rak…';
   try{
     const session=await SB.session();
     if(!session?.access_token)throw new Error('Sesi Admin berakhir.');
     const d=await SB.rpc('admin_dashboard_data',{},session.access_token)||{};
     if(id!==request||!dialog.open)return;
     books=Array.isArray(d.books)?d.books:[];
     show();
   }catch(e){
     if(id!==request)return;
     note.textContent='Nomor posisi belum dapat dihitung: '+e.message;
   }
 }
 add.addEventListener('click',()=>{
   request++;books=[];setTimeout(refresh,0);
 });
 rack.addEventListener('input',()=>{
   if(!dialog.open)return;
   clearTimeout(timer);timer=setTimeout(show,120);
 });
 rack.addEventListener('change',()=>{
   if(dialog.open)show();
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();