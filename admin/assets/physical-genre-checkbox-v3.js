(function(){
'use strict';
const FALLBACK=[
 'Anak-anak','Fiksi','Non Fiksi','Horor','Misteri & Thriller','Sci','Romantis','Fantasi',
 'Inspiratif','Fiksi Religi','Fiksi Sejarah','Fabel','Cerpen','Sejarah','Budaya','Agama',
 'Biografi','Puisi','Drama','Referensi','Umum','Bahasa Inggris','Bahasa Indonesia',
 'Bahasa Mandarin','Bahasa Rusia','Bahasa Korea','Bahasa Cina','Misteri','Thriller',
 'Petualangan','Kriminal','Komedi','Persahabatan','Keluarga','Psikologi','Sains Fiksi',
 'Nonfiksi','Motivasi','Teknologi','Lingkungan','Pengetahuan Umum','Cerita Rakyat',
 'Kesehatan','Kuliner','Kearifan Lokal','Edukasi','Sains','Pendidikan','Komik',
 'Religi Islami','Pertanian & Perkebunan','Ketrampilan & Kerajinan'
];
const norm=value=>String(value||'').trim().toLocaleLowerCase('id-ID');
const split=value=>String(value||'').split(/\s*,\s*/).map(x=>x.trim()).filter(Boolean).slice(0,5);
function init(){
 if(window.EOMPHYSICALGENRES)return;
 const form=document.getElementById('bookForm'),
       root=document.getElementById('eomPhysicalGenrePicker'),
       select=document.getElementById('bookGenre');
 if(!form||!root||!select)return;
 const list=root.querySelector('#eomPhysicalGenreList'),
       search=root.querySelector('#eomPhysicalGenreSearch'),
       count=root.querySelector('#eomPhysicalGenreCount'),
       status=root.querySelector('#eomPhysicalGenreStatus'),
       reset=root.querySelector('#eomPhysicalGenreAll'),
       summary=root.querySelector('#eomPhysicalGenreSummary');
 if(!list||!search||!count||!status||!reset||!summary)return;
 window.EOMPHYSICALGENRES={}; // Flag to disable the old physical picker.
 const legacyLabel=select.closest('label');
 if(legacyLabel){
   legacyLabel.classList.add('eom-mgenre-legacy');
   legacyLabel.setAttribute('aria-hidden','true');
 }
 const genres=new Map(),selected=new Map();
 let manual=false,syncing=false;
 const available=()=>{
   const current=window.EOMTaxonomy?.get?.().genres||[];
   const options=Array.from(select.options||[]).map(o=>o.value)
     .filter(x=>x&&!x.includes(',')&&!x.includes('Pilih genre'));
   return [...current,...options,...FALLBACK];
 };
 function updateCatalog(){
   for(const item of available()){
     const word=String(item||'').replace(/\s+/g,' ').trim();
     if(word&&!genres.has(norm(word)))genres.set(norm(word),word);
   }
 }
 function setStatus(msg,bad){
   status.textContent=msg;
   status.classList.toggle('error',!!bad);
 }
 function writeSelect(){
   const value=[...selected.values()].join(', ');
   syncing=true;
   try{
     select.querySelectorAll('option[data-eom-physical-value]').forEach(o=>o.remove());
     if(value){
       let option=Array.from(select.options).find(o=>o.value===value);
       if(!option){
         option=document.createElement('option');
         option.value=value;
         option.textContent=value;
         option.dataset.eomPhysicalValue='1';
         select.add(option);
       }
     }
     select.value=value;
     select.dataset.eomGenreValues=value;
     if(manual)select.dataset.eomManualOverride='true';
     else delete select.dataset.eomManualOverride;
     select.dispatchEvent(new Event('change',{bubbles:true}));
   }finally{syncing=false;}
 }
 function render(){
   updateCatalog();
   const q=search.value.trim().toLocaleLowerCase('id-ID');
   const items=[...genres.values()].sort((a,b)=>{
     const sa=selected.has(norm(a)),sb=selected.has(norm(b));
     const ma=q&&norm(a).includes(q),mb=q&&norm(b).includes(q);
     return Number(mb)-Number(ma)||Number(sb)-Number(sa)||a.localeCompare(b,'id');
   });
   list.replaceChildren();
   const fragment=document.createDocumentFragment();
   for(const genre of items){
     const label=document.createElement('label');
     label.className='eom-physical-genre-item';
     const input=document.createElement('input');
     input.type='checkbox';input.value=genre;
     input.checked=selected.has(norm(genre));
     input.setAttribute('aria-label','Centang genre '+genre);
     const text=document.createElement('span');text.textContent=genre;
     label.append(input,text);
     if(input.checked)label.classList.add('checked');
     if(q&&norm(genre).includes(q))label.classList.add('matching');
     fragment.appendChild(label);
   }
   list.appendChild(fragment);
   count.textContent=selected.size+'/5 terpilih';
   root.querySelector('#eomPhysicalGenreAvailable').textContent=items.length+' genre tersedia';
   summary.textContent=selected.size?'✓ '+[...selected.values()].join(' · '):
     'Belum ada genre dicentang. Centang 1–5 dari daftar di bawah.';
 }
 function changeSelection(values,asManual,announce=true){
   const next=new Map();
   updateCatalog();
   for(const candidate of values){
     const key=norm(candidate);
     const known=genres.get(key);
     if(known&&!next.has(key)&&next.size<5)next.set(key,known);
   }
   selected.clear();
   next.forEach((v,k)=>selected.set(k,v));
   if(asManual)manual=true;
   writeSelect();
   render();
   if(announce)setStatus('✅ '+selected.size+'/5 genre dipilih. Pilihan akan ikut disimpan bersama buku.',false);
 }
 list.addEventListener('change',event=>{
   const input=event.target;
   if(!(input instanceof HTMLInputElement)||input.type!=='checkbox')return;
   const key=norm(input.value);
   if(input.checked&&selected.size>=5&&!selected.has(key)){
     input.checked=false;
     setStatus('⚠️ Maksimal 5 genre. Hapus satu centang terlebih dahulu.',true);
     return;
   }
   const next=[...selected.values()];
   if(input.checked){if(!selected.has(key))next.push(input.value);}
   else{const i=next.findIndex(x=>norm(x)===key);if(i!==-1)next.splice(i,1);}
   changeSelection(next,true);
 });
 search.addEventListener('input',render);
 reset.addEventListener('click',()=>{
   search.value='';render();setStatus('Semua genre ditampilkan. Centang sesuai isi buku.',false);
 });
 select.addEventListener('change',()=>{
   if(syncing)return;
   // Manual checkboxes take priority over automatic classification/ISBN.
   if(manual){writeSelect();return;}
   const suggested=split(select.value);
   if(suggested.length)changeSelection(suggested,false,false);
 });
 document.addEventListener('eom:book-auto-classified',event=>{
   if(manual)return;
   const suggestions=event.detail?.genresSuggested||[];
   const fallback=event.detail?.genre||event.detail?.inputData?.genre;
   const values=Array.isArray(suggestions)&&suggestions.length?suggestions:(fallback?[fallback]:[]);
   if(values.length)changeSelection(values,false,false);
 });
 document.addEventListener('eom:book-taxonomy-ready',()=>{
   updateCatalog();render();
 });
 document.getElementById('addBookBtn')?.addEventListener('click',()=>{
   selected.clear();manual=false;search.value='';
   writeSelect();render();
   setStatus('Centang minimal 1 dan maksimal 5 genre sebelum Simpan Buku Fisik.',false);
 });
 form.addEventListener('submit',event=>{
   if(selected.size<1||selected.size>5){
     event.preventDefault();
     event.stopImmediatePropagation();
     setStatus('⚠️ Harap centang 1–5 genre sebelum buku disimpan.',true);
     root.scrollIntoView({behavior:'smooth',block:'center'});
     return;
   }
   writeSelect();
 },true);
 // Maintain full-book edit and any older integrations using this shape.
 const api={
   get values(){return [...selected.values()];},
   get options(){return [...genres.values()];},
   select:values=>changeSelection(values,true),
   refresh:render,
   get state(){return{chosen:[...selected.values()],manual};}
 };
 window.EOMPHYSICALGENRES=api;
 updateCatalog();render();
 // If a partially completed form already has an auto-suggested genre, retain it.
 if(select.value)changeSelection(split(select.value),false,false);
 setStatus('Centang 1–5 genre dari daftar. Judul dan penulis diisi manual.',false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();