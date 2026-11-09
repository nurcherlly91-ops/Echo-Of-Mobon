(function(){
'use strict';
const FALLBACK=['Anak-anak','Fiksi','Non Fiksi','Horor','Misteri & Thriller','Petualangan','Romantis','Fantasi','Inspiratif','Fabel','Dongeng','Novel','Cerpen','Sejarah','Budaya','Agama','Biografi','Puisi','Drama','Referensi','Umum','Sains','Pendidikan','Religi Islami','Komik','Edukasi','Persahabatan','Keluarga','Teknologi'];
const norm=s=>String(s||'').trim().toLocaleLowerCase('id-ID');
const split=s=>String(s||'').split(/\s*,\s*/).map(x=>x.trim()).filter(Boolean).slice(0,5);
const byId=id=>document.getElementById(id);
const unique=items=>{
 const data=new Map();
 for(const item of items||[]){
  const val=String(item||'').replace(/\s+/g,' ').trim();
  if(val&&!data.has(norm(val)))data.set(norm(val),val);
 }
 return [...data.values()];
};
function init(){
 if(window.EOMDIGITALGENRES)return;
 const form=byId('digitalForm'),root=byId('eomDigitalGenrePicker'),legacy=byId('digitalGenre');
 if(!form||!root||!legacy)return;
 const list=byId('eomDigitalGenreList'),search=byId('eomDigitalGenreSearch'),
  count=byId('eomDigitalGenreCount'),summary=byId('eomDigitalGenreSummary'),
  status=byId('eomDigitalGenreStatus'),available=byId('eomDigitalGenreAvailable'),
  all=byId('eomDigitalGenreAll');
 if(!list||!search||!count||!summary||!status||!available||!all)return;
 legacy.closest('label')?.classList.add('eom-mgenre-legacy');
 const chosen=new Map(),catalog=new Map();
 let manual=false,changing=false;
 function syncCatalog(){
  const fromSettings=window.EOMTaxonomy?.get?.().genres||[];
  const fromSelect=Array.from(legacy.options||[]).map(x=>x.value).filter(x=>x&&!x.includes(','));
  for(const genre of unique([...fromSettings,...fromSelect,...FALLBACK])){
   if(!catalog.has(norm(genre)))catalog.set(norm(genre),genre);
  }
 }
 function inform(msg,isError=false){
  status.textContent=msg;status.classList.toggle('error',!!isError);
 }
 function syncLegacy(){
  const value=[...chosen.values()].join(', ');
  changing=true;
  try{
   legacy.querySelectorAll('option[data-eom-digital-value]').forEach(x=>x.remove());
   if(value&&!Array.from(legacy.options).some(x=>x.value===value)){
    const opt=document.createElement('option');
    opt.value=value;opt.textContent=value;
    opt.dataset.eomDigitalValue='1';legacy.add(opt);
   }
   legacy.value=value;
   legacy.dataset.eomGenreValues=value;
   if(manual)legacy.dataset.eomManualOverride='true';
   else delete legacy.dataset.eomManualOverride;
   legacy.dispatchEvent(new Event('change',{bubbles:true}));
  }finally{changing=false;}
 }
 function makeCheckbox(label,checked,group){
  const row=document.createElement('label');row.className='eom-digital-genre-item';
  const input=document.createElement('input');input.type='checkbox';input.value=label;input.checked=checked;
  input.setAttribute('aria-label','Centang genre '+label);
  const name=document.createElement('span');name.textContent=label;
  row.append(input,name);
  if(checked)row.classList.add('checked');
  if(group)row.classList.add('matched');
  return row;
 }
 function render(){
  syncCatalog();
  const query=norm(search.value);
  const options=[...catalog.values()].sort((a,b)=>{
   const matchedA=!!query&&norm(a).includes(query),matchedB=!!query&&norm(b).includes(query);
   const selectedA=chosen.has(norm(a)),selectedB=chosen.has(norm(b));
   return Number(matchedB)-Number(matchedA)||
     Number(selectedB)-Number(selectedA)||a.localeCompare(b,'id');
  });
  const fragment=document.createDocumentFragment();
  for(const item of options)fragment.appendChild(makeCheckbox(item,chosen.has(norm(item)),!!query&&norm(item).includes(query)));
  list.replaceChildren(fragment);
  count.textContent=chosen.size+'/5 terpilih';
  available.textContent=options.length+' genre tersedia';
  summary.textContent=chosen.size?'✓ '+[...chosen.values()].join(' · '):
   'Belum ada genre dipilih. Centang minimal 1 dan maksimal 5.';
 }
 function setChosen(items,asManual=false){
  syncCatalog();
  const next=new Map();
  for(const item of items||[]){
   const k=norm(item),word=catalog.get(k);
   if(word&&!next.has(k)&&next.size<5)next.set(k,word);
  }
  chosen.clear();next.forEach((v,k)=>chosen.set(k,v));
  if(asManual)manual=true;
  syncLegacy();render();
 }
 list.addEventListener('change',event=>{
  const box=event.target;
  if(!(box instanceof HTMLInputElement)||box.type!=='checkbox')return;
  const key=norm(box.value);
  if(box.checked&&!chosen.has(key)&&chosen.size>=5){
   box.checked=false;
   inform('⚠️ Maksimal 5 genre. Hilangkan satu centang sebelum memilih lagi.',true);
   return;
  }
  const next=[...chosen.values()];
  if(box.checked){if(!chosen.has(key))next.push(box.value);}
  else{const pos=next.findIndex(x=>norm(x)===key);if(pos>=0)next.splice(pos,1);}
  setChosen(next,true);
  inform('✅ '+chosen.size+'/5 genre dipilih dan akan ikut disimpan bersama buku digital.');
 });
 search.addEventListener('input',render);
 all.addEventListener('click',()=>{search.value='';render();inform('Semua genre tampil. Centang yang sesuai dengan isi buku.');});
 legacy.addEventListener('change',()=>{
  if(changing)return;
  if(manual){syncLegacy();return;}
  const vals=split(legacy.value);
  if(vals.length)setChosen(vals,false);
 });
 document.addEventListener('eom:book-taxonomy-ready',()=>{syncCatalog();render();});
 byId('addDigitalBtn')?.addEventListener('click',()=>{
  chosen.clear();manual=false;search.value='';
  syncLegacy();render();
  inform('Centang 1–5 genre sebelum menyimpan Buku Digital.');
 });
 form.addEventListener('submit',event=>{
  if(chosen.size<1||chosen.size>5){
   event.preventDefault();
   event.stopImmediatePropagation();
   inform('⚠️ Centang minimal satu genre, maksimal lima, sebelum publikasi.',true);
   root.scrollIntoView({behavior:'smooth',block:'center'});
   return;
  }
  syncLegacy();
 },true);
 function editor(){
  let dialog=byId('eomDigitalGenreEditDialog');
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.id='eomDigitalGenreEditDialog';dialog.className='eom-digital-genre-editor';
  dialog.innerHTML='<form class="eom-digital-genre-edit-form">'+
   '<div class="eom-digital-genre-edit-head"><h2>☑ Ubah Genre Buku Digital</h2>'+
   '<button type="button" class="eom-digital-genre-edit-close" aria-label="Tutup">×</button></div>'+
   '<p id="eomDigitalGenreEditBookTitle"></p>'+
   '<div class="eom-digital-genre-edit-count" id="eomDigitalGenreEditCount">0/5 terpilih</div>'+
   '<input type="search" id="eomDigitalGenreEditSearch" placeholder="Cari genre…" aria-label="Cari genre" autocomplete="off">'+
   '<div id="eomDigitalGenreEditList" class="eom-digital-genre-list" role="group" aria-label="Genre buku digital yang dapat diubah"></div>'+
   '<p id="eomDigitalGenreEditStatus" role="status" aria-live="polite"></p>'+
   '<button type="submit" class="btn primary eom-digital-genre-edit-save">Simpan Perubahan Genre</button>'+
   '</form>';
  document.body.appendChild(dialog);
  dialog.querySelector('.eom-digital-genre-edit-close')?.addEventListener('click',()=>dialog.close());
  return dialog;
 }
 let editBook=null,editChosen=new Map();
 function renderEditor(){
  const holder=byId('eomDigitalGenreEditList'),query=norm(byId('eomDigitalGenreEditSearch')?.value);
  syncCatalog();
  const options=[...catalog.values()].sort((a,b)=>{
   const ma=query&&norm(a).includes(query),mb=query&&norm(b).includes(query);
   return Number(mb)-Number(ma)||Number(editChosen.has(norm(b)))-Number(editChosen.has(norm(a)))||a.localeCompare(b,'id');
  });
  const frag=document.createDocumentFragment();
  for(const genre of options)frag.appendChild(makeCheckbox(genre,editChosen.has(norm(genre)),!!query&&norm(genre).includes(query)));
  holder.replaceChildren(frag);
  byId('eomDigitalGenreEditCount').textContent=editChosen.size+'/5 terpilih';
 }
 function editExisting(book){
  if(!book?.id)return;
  const dialog=editor();
  editBook=book;editChosen=new Map();
  syncCatalog();
  split(book.genre).forEach(value=>{
   const name=catalog.get(norm(value))||value;
   if(!editChosen.has(norm(name)))editChosen.set(norm(name),name);
  });
  byId('eomDigitalGenreEditBookTitle').textContent=book.title||'Buku Digital';
  byId('eomDigitalGenreEditSearch').value='';
  byId('eomDigitalGenreEditStatus').textContent='Centang 1–5 genre kemudian simpan.';
  renderEditor();
  if(!dialog.open)dialog.showModal();
 }
 document.addEventListener('change',event=>{
  const el=event.target;
  if(!el?.closest?.('#eomDigitalGenreEditList')||el.type!=='checkbox')return;
  const key=norm(el.value);
  if(el.checked&&editChosen.size>=5&&!editChosen.has(key)){
   el.checked=false;
   byId('eomDigitalGenreEditStatus').textContent='⚠️ Maksimal 5 genre.';
   return;
  }
  if(el.checked)editChosen.set(key,el.value);
  else editChosen.delete(key);
  renderEditor();
 });
 document.addEventListener('input',event=>{
  if(event.target?.id==='eomDigitalGenreEditSearch')renderEditor();
 });
 document.addEventListener('submit',async event=>{
  if(event.target?.closest?.('#eomDigitalGenreEditDialog')==null)return;
  event.preventDefault();
  if(!editBook)return;
  if(editChosen.size<1||editChosen.size>5){
   byId('eomDigitalGenreEditStatus').textContent='⚠️ Centang 1 sampai 5 genre terlebih dahulu.';return;
  }
  const submit=event.target.querySelector('button[type="submit"]');
  if(submit)submit.disabled=true;
  try{
   const session=await SB.session();
   if(!session?.access_token)throw new Error('Sesi Admin berakhir. Silakan masuk kembali.');
   const value=[...editChosen.values()].join(', ');
   await SB.rpc('admin_update_digital_book',{p_id:editBook.id,p_data:{genre:value}},session.access_token);
   byId('eomDigitalGenreEditDialog').close();
   byId('refreshBtn')?.click();
  }catch(e){byId('eomDigitalGenreEditStatus').textContent='Gagal menyimpan genre: '+(e.message||e);}
  finally{if(submit)submit.disabled=false;}
 });
 const api={
  get values(){return [...chosen.values()];},
  get options(){return [...catalog.values()];},
  get state(){return{chosen:[...chosen.values()],manual};},
  select:items=>setChosen(items,true),
  refresh:render,
  editExisting
 };
 window.EOMDIGITALGENRES=api;
 syncCatalog();render();
 if(legacy.value)setChosen(split(legacy.value));
 inform('Pilih genre dengan mencentang 1–5 pilihan sebelum Simpan Buku Digital.');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();