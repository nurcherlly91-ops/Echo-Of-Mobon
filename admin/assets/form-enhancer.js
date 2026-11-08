(()=>{
'use strict';
const FALLBACK_GENRES=[
 'Anak-anak','Fiksi','Non Fiksi','Horor','Misteri & Thriller','Petualangan','Romantis',
 'Fantasi','Inspiratif','Fabel','Dongeng','Novel','Cerpen','Sejarah','Budaya','Agama',
 'Biografi','Puisi','Drama','Referensi','Umum','Sains','Pendidikan','Religi Islami',
 'Komik','Edukasi','Persahabatan','Keluarga','Teknologi'
];
const CACHE='eom_taxonomy_last_valid_v3';
const unique=value=>{
 if(!Array.isArray(value))return [];
 const out=[],known=new Set();
 for(const item of value){
  const genre=String(item||'').replace(/\s+/g,' ').trim().slice(0,100);
  const k=genre.toLocaleLowerCase('id-ID');
  if(!genre||known.has(k))continue;
  known.add(k);out.push(genre);
 }
 return out;
};
function remembered(){
 try{
  const parsed=JSON.parse(localStorage.getItem(CACHE)||'null');
  if(parsed&&Array.isArray(parsed.genres)&&parsed.genres.length)return {
   categories:unique(parsed.categories),genres:unique(parsed.genres)
  };
 }catch(e){}
 return null;
}
const fallback={
 categories:unique(typeof EOMONLINE!=='undefined'?EOMONLINE.categories:[]),
 genres:FALLBACK_GENRES
};
let latest=remembered()||fallback, inflight=null;
window.EOMTaxonomy={
 get:()=>({categories:latest.categories.slice(),genres:latest.genres.slice()}),
 fallbackGenres:FALLBACK_GENRES.slice(),
 refresh:()=>inflight
};
function init(){
 if(window.__eomFormEnhancerLoaded)return;
 const bookForm=document.getElementById('bookForm'),digitalForm=document.getElementById('digitalForm');
 if(!bookForm||!digitalForm||typeof SB==='undefined')return;
 window.__eomFormEnhancerLoaded=true;
 const byId=id=>document.getElementById(id);
 function ensureSelect(id,label){
  let sel=byId(id);
  if(sel)return sel;
  const wrap=document.createElement('label');
  wrap.textContent=label;
  sel=document.createElement('select');
  sel.id=id;
  wrap.appendChild(sel);
  const base=byId(id==='bookGenre'?'bookCategory':'digitalCategory');
  base?.closest('label')?.after(wrap);
  return sel;
 }
 const bookGenre=ensureSelect('bookGenre','Genre Buku');
 const digitalGenre=ensureSelect('digitalGenre','Genre Buku');
 const bookCategory=byId('bookCategory'),digitalCategory=byId('digitalCategory');
 const notification=document.createElement('p');
 notification.id='eomGenreSyncStatus';
 notification.setAttribute('role','status');
 notification.setAttribute('aria-live','polite');
 notification.style.cssText='font-size:.78rem;line-height:1.4;color:#436259;margin:5px 0 10px';
 const refreshButton=document.createElement('button');
 refreshButton.id='eomReloadBookGenres';
 refreshButton.type='button';
 refreshButton.className='btn ghost';
 refreshButton.textContent='🔄 Muat Ulang Daftar Genre';
 refreshButton.style.cssText='font-size:.76rem;padding:7px 12px;margin-bottom:8px';
 const label=bookGenre.closest('label');
 if(label){label.after(notification);notification.after(refreshButton);}
 function fill(select,values,placeholder){
  if(!select)return;
  const current=select.value;
  const genres=unique(values);
  select.replaceChildren();
  const def=document.createElement('option');def.value='';def.textContent=placeholder;
  select.add(def);
  for(const name of genres){
   const opt=document.createElement('option');
   opt.value=name;opt.textContent=name;
   select.add(opt);
  }
  if(current){
   // Multi-genre selection is represented as a virtual option in the legacy select.
   if(!Array.from(select.options).some(x=>x.value===current)){
    const virtual=document.createElement('option');
    virtual.value=current;virtual.textContent=current;
    virtual.dataset.eomMultiOption='1';
    select.add(virtual);
   }
   select.value=current;
  }
 }
 function publish(data,source){
  const categories=unique(data.categories),genres=unique(data.genres);
  if(!genres.length)return false;
  latest={
   categories:categories.length?categories:latest.categories.slice(),
   genres
  };
  fill(bookCategory,latest.categories,'Pilih kategori');
  fill(digitalCategory,latest.categories,'Pilih kategori');
  fill(bookGenre,latest.genres,'Pilih genre');
  fill(digitalGenre,latest.genres,'Pilih genre');
  notification.textContent=source==='server'
    ?'✅ '+latest.genres.length+' genre dari Pengaturan tersedia.'
    :source==='cache'?'📚 '+latest.genres.length+' pilihan genre tersimpan tersedia; sambungan sedang diperiksa.'
    :'📚 '+latest.genres.length+' pilihan genre cadangan tersedia, sambungan Pengaturan belum terhubung.';
  document.dispatchEvent(new CustomEvent('eom:book-taxonomy-ready',{
   detail:{categories:latest.categories.slice(),genres:latest.genres.slice(),source}
  }));
  return true;
 }
 async function fetchRemote(force=false){
  if(inflight)return inflight;
  inflight=(async()=>{
   notification.textContent='🔄 Menyinkronkan daftar genre dari Pengaturan…';
   let settings=null;
   try{
    // Small public read-only RPC avoids downloading the entire dashboard and
    // avoids depending on an expired admin access token.
    const r=await SB.rpc('public_library_settings',{});
    if(Array.isArray(r?.book_genres)&&r.book_genres.length){
     settings={categories:r.book_categories,genres:r.book_genres};
    }
   }catch(e){console.warn('EOM: RPC pengaturan publik sementara gagal:',e.message);}
   if(!settings){
    try{
     const session=await SB.session();
     if(session?.access_token){
      const data=await SB.rpc('admin_dashboard_data',{},session.access_token)||{};
      const records=Array.isArray(data.settings)?data.settings:[];
      const read=key=>records.find(item=>item.key===key)?.value;
      if(Array.isArray(read('book_genres'))&&read('book_genres').length){
       settings={categories:read('book_categories'),genres:read('book_genres')};
      }
     }
    }catch(e){console.warn('EOM: RPC pengaturan admin sementara gagal:',e.message);}
   }
   if(settings&&publish(settings,'server')){
    try{localStorage.setItem(CACHE,JSON.stringify(latest));}catch(e){}
    return latest;
   }
   publish(remembered()||fallback,remembered()?'cache':'fallback');
   notification.textContent+=' Tekan “Muat Ulang Daftar Genre” setelah jaringan stabil.';
   return latest;
  })();
  window.EOMTaxonomy.refresh=()=>inflight||fetchRemote();
  try{return await inflight;}
  finally{inflight=null;window.EOMTaxonomy.refresh=()=>fetchRemote();}
 }
 // Fill the genre widget immediately, even before the remote request completes.
 publish(remembered()||fallback,remembered()?'cache':'fallback');
 refreshButton.addEventListener('click',()=>fetchRemote(true));
 byId('addBookBtn')?.addEventListener('click',()=>fetchRemote());
 byId('addDigitalBtn')?.addEventListener('click',()=>fetchRemote());
 document.addEventListener('eom:setting-saved',()=>fetchRemote(true));
 window.addEventListener('online',()=>fetchRemote());
 fetchRemote();
 const originalInsert=SB.insert.bind(SB);
 SB.insert=async function(table,payload,token){
  if(table==='books')payload={...payload,genre:bookGenre.value||null};
  if(table==='digital_books')payload={...payload,genre:digitalGenre.value||null};
  return originalInsert(table,payload,token);
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();