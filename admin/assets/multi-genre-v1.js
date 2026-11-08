(function(){
'use strict';
function init(){
 if(window.__eomMultiGenreV1 || !window.EOMBOOKCLASSIFY || typeof SB==='undefined')return;
 const bookGenre=document.getElementById('bookGenre'),digitalGenre=document.getElementById('digitalGenre');
 if(!bookGenre||!digitalGenre)return;
 window.__eomMultiGenreV1=true;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const canonical=v=>String(v||'').trim().toLocaleLowerCase('id-ID');
 const split=v=>Array.from(new Set(String(v||'').split(/\s*,\s*/).map(x=>x.trim()).filter(Boolean))).slice(0,5);
 function optionsFrom(select){
   const found=[];
   for(const item of Array.from(select.options||[])){
     const v=String(item.value||'').trim();
     if(!v||v.includes(',')||item.dataset.eomMultiOption)return;
     if(!found.some(x=>canonical(x)===canonical(v)))found.push(v);
   }
   return found;
 }
 function view(){
  const section=document.createElement('section');
  section.className='eom-mgenre';
  section.innerHTML='<div class="eom-mgenre-heading"><strong>🏷️ Genre Buku · Pilih 1–5</strong><span class="eom-mgenre-count">0/5 terpilih</span></div>'+
   '<p class="eom-mgenre-instruction">Pilih beberapa genre sesuai isi dan sinopsis buku. Saran otomatis berasal dari judul, deskripsi, serta metadata ISBN—bukan pembacaan seluruh halaman.</p>'+
   '<div class="eom-mgenre-selected" aria-live="polite"><em>Belum ada genre dipilih.</em></div>'+
   '<label class="eom-mgenre-search-label">Cari genre (pisahkan dengan koma untuk beberapa pilihan)<input class="eom-mgenre-search" type="search" placeholder="Contoh: Religi Islami, Non Fiksi" autocomplete="off"></label>'+
   '<button class="eom-mgenre-apply-search btn ghost" type="button">✓ Pilih Genre dari Pencarian</button>'+ 
   '<div class="eom-mgenre-choices" role="group" aria-label="Pilih maksimal lima genre buku"></div>'+
   '<p class="eom-mgenre-status" role="status" aria-live="polite">Genre dapat dipilih lebih dari satu, maksimal lima.</p>';
  return section;
 }
 function attach(kind,legacy,formId,addId,titleId,descriptionId){
   const label=legacy.closest('label');
   if(!label)return null;
   label.classList.add('eom-mgenre-legacy');
   label.setAttribute('aria-hidden','true');
   const widget=view();
   label.after(widget);
   const selection=widget.querySelector('.eom-mgenre-selected');
   const count=widget.querySelector('.eom-mgenre-count');
   const choiceBox=widget.querySelector('.eom-mgenre-choices');
   const search=widget.querySelector('.eom-mgenre-search');
   const addSearch=widget.querySelector('.eom-mgenre-apply-search');
   const status=widget.querySelector('.eom-mgenre-status');
   const form=document.getElementById(formId);
   const title=document.getElementById(titleId);
   const description=document.getElementById(descriptionId);
   const state={kind,legacy,widget,options:optionsFrom(legacy).concat((window.EOMTaxonomy?.get?.().genres||[]).filter(v=>!optionsFrom(legacy).some(x=>canonical(x)===canonical(v)))),chosen:split(legacy.value),manual:false,auto:[],wasReady:false};
   const choicesFromCatalog=()=>{
     const live=optionsFrom(legacy);
     const known=window.EOMTaxonomy?.get?.().genres||[];
     const combined=live.concat(known);
     const unique=[];
     for(const item of combined){
       if(!unique.some(v=>canonical(v)===canonical(item)))unique.push(item);
     }
     return unique;
   };
   function message(s,bad=false){
     status.textContent=s;
     status.classList.toggle('eom-mgenre-error',bad);
   }
   function writeLegacy(){
     legacy.querySelectorAll('option[data-eom-multi-option]').forEach(opt=>opt.remove());
     const value=state.chosen.join(', ');
     if(value){
       let opt=Array.from(legacy.options).find(x=>x.value===value);
       if(!opt){
         opt=document.createElement('option');
         opt.value=value;
         opt.textContent=value;
         opt.dataset.eomMultiOption='1';
         legacy.add(opt);
       }
     }
     legacy.value=value;
     legacy.dataset.eomGenreValues=value;
     legacy.dispatchEvent(new Event('change',{bubbles:true}));
   }
   function render(){
     count.textContent=state.chosen.length+'/5 terpilih';
     selection.innerHTML=state.chosen.length
       ?state.chosen.map(x=>'<span class="eom-mgenre-tag">'+esc(x)+'</span>').join('')
       :'<em>Belum ada genre dipilih.</em>';
     const queries=search.value.split(',').map(canonical).filter(Boolean);
     const visible=state.options.filter(x=>!queries.length||queries.some(q=>canonical(x).includes(q)));
     choiceBox.replaceChildren();
     for(const v of visible){
       const row=document.createElement('label');
       row.className='eom-mgenre-item';
       const checkbox=document.createElement('input');
       checkbox.type='checkbox';
       checkbox.value=v;
       checkbox.checked=state.chosen.some(x=>canonical(x)===canonical(v));
       const text=document.createElement('span');
       text.textContent=v;
       row.append(checkbox,text);
       if(checkbox.checked)row.classList.add('selected');
       choiceBox.appendChild(row);
     }
     if(!visible.length){
       const empty=document.createElement('p');
       empty.className='eom-mgenre-empty';
       empty.textContent=state.options.length?'Genre tidak ditemukan. Coba kata lain.':'Daftar genre belum tersedia. Tekan “Muat Ulang Daftar Genre” atau periksa Pengaturan.';
       choiceBox.appendChild(empty);
     }
   }
   function setSelection(values,{manual=false,announce=true}={}){
     const next=[];
     for(const raw of values){
       const match=state.options.find(x=>canonical(x)===canonical(raw));
       if(match&&!next.some(x=>canonical(x)===canonical(match))&&next.length<5)next.push(match);
     }
     state.chosen=next;
     if(manual){
       state.manual=true;
       legacy.dataset.eomManualOverride='true';
     }
     writeLegacy();
     render();
     if(announce)message(manual?'✅ Pilihan genre disimpan. '+next.length+' dari maksimal 5 genre.':
       (next.length?'✨ Saran otomatis: '+next.join(', ')+'. Periksa kecocokan dengan isi buku.':
       'Belum cukup informasi untuk mengusulkan genre. Silakan pilih 1–5 genre.'),false);
   }
   function autoSuggest(data,fromEngine=[]){
     if(state.manual)return;
     const engine=window.EOMBOOKCLASSIFY;
     const derived=(typeof engine.suggestGenres==='function')?engine.suggestGenres(data):[];
     const suggested=[...new Set([...derived,...(Array.isArray(fromEngine)?fromEngine:[])])];
     if(!suggested.length && data?.genre)suggested.push(data.genre);
     state.auto=suggested;
     setSelection(suggested,{announce:true});
   }
   function refresh(){
     const candidates=choicesFromCatalog();
     if(candidates.length)state.options=candidates;
     // Pilihan manual dipertahankan ketika daftar genre diperbarui.
     if(state.manual){state.chosen=state.chosen.filter(x=>state.options.some(v=>canonical(v)===canonical(x)));writeLegacy();render();return;}
     if(state.auto.length){setSelection(state.auto,{announce:false});return;}
     if(!state.wasReady&&legacy.value&&state.options.length){
       state.wasReady=true;setSelection(split(legacy.value),{announce:false});return;
     }
     state.wasReady=true;writeLegacy();render();
   }
   choiceBox.addEventListener('change',e=>{
     const check=e.target;
     if(!(check instanceof HTMLInputElement)||check.type!=='checkbox')return;
     const item=check.value;
     const has=state.chosen.some(x=>canonical(x)===canonical(item));
     if(check.checked&&!has&&state.chosen.length>=5){
       check.checked=false;
       message('⚠️ Maksimal lima genre. Hapus satu pilihan dahulu sebelum memilih genre lain.',true);
       return;
     }
     const next=check.checked?[...state.chosen,item]:state.chosen.filter(x=>canonical(x)!==canonical(item));
     setSelection(next,{manual:true});
   });
   search.addEventListener('input',render);
   function selectFromSearch(){
     const queries=search.value.split(',').map(canonical).filter(Boolean);
     if(!queries.length){message('Ketik nama genre terlebih dahulu.',true);return;}
     const choices=choicesFromCatalog();
     if(choices.length)state.options=choices;
     const selected=state.chosen.slice(),missing=[];
     for(const query of queries){
       const found=state.options.find(x=>canonical(x)===query)||
         (state.options.filter(x=>canonical(x).includes(query)).length===1
           ?state.options.find(x=>canonical(x).includes(query)):null);
       if(!found){missing.push(query);continue;}
       if(!selected.some(v=>canonical(v)===canonical(found))&&selected.length<5)selected.push(found);
     }
     if(selected.length===state.chosen.length){
       message('Tidak ada genre baru yang cocok. Cek penulisan atau coba kata lain.',true);render();return;
     }
     setSelection(selected,{manual:true});
     search.value='';
     render();
     if(missing.length)message('✅ Genre yang cocok terpilih. Tidak ditemukan: '+missing.join(', '),true);
   }
   addSearch?.addEventListener('click',selectFromSearch);
   search.addEventListener('keydown',e=>{
     if(e.key==='Enter'){e.preventDefault();selectFromSearch();}
   });
   document.getElementById(addId)?.addEventListener('click',()=>{
     state.manual=false;state.auto=[];state.chosen=[];
     delete legacy.dataset.eomManualOverride;
     search.value='';
     setSelection([],{announce:false});
     message('Pilih satu sampai lima genre. Saran otomatis akan muncul setelah judul atau foto dikenali.');
   });
   document.addEventListener('eom:book-taxonomy-ready',refresh);
   if(kind==='physical'){
     document.addEventListener('eom:book-auto-classified',e=>{
       if(!title?.value.trim())return;
       autoSuggest({...((e.detail?.inputData)||{title:title.value,description:description?.value||''}),category:e.detail?.inputData?.category||e.detail?.category||''},e.detail?.genresSuggested);
     });
     document.getElementById('bookCategory')?.addEventListener('change',e=>{
       if(e.isTrusted&&!state.manual&&title?.value.trim()){
         autoSuggest({title:title.value,category:e.target.value,description:description?.value||''});
       }
     });
   }else{
     let timer=null;
     function typed(){
       if(state.manual)return;
       autoSuggest({title:title?.value||'',category:document.getElementById('digitalCategory')?.value||'',description:document.getElementById('digitalSummary')?.value||''});
     }
     title?.addEventListener('input',()=>{
       clearTimeout(timer);timer=setTimeout(typed,540);
     });
     document.getElementById('digitalSummary')?.addEventListener('input',()=>{
       clearTimeout(timer);timer=setTimeout(typed,540);
     });
     document.getElementById('digitalCategory')?.addEventListener('change',e=>{
       if(e.isTrusted)typed();
     });
   }
   form?.addEventListener('submit',e=>{
     // If admin typed "Religi Islami, Non Fiksi" directly, resolve matches
     // before the required-genre validation, rather than blocking the save.
     if(!state.chosen.length&&search.value.trim())selectFromSearch();
     if(!state.chosen.length){
       e.preventDefault();e.stopImmediatePropagation();
       message('⚠️ Pilih minimal satu genre sebelum menyimpan buku.',true);
       widget.scrollIntoView({behavior:'smooth',block:'center'});
       return;
     }
     if(state.chosen.length>5){
       e.preventDefault();e.stopImmediatePropagation();
       message('⚠️ Genre maksimal lima.',true);
       return;
     }
     writeLegacy();
   },true);
   render();
   return {
     get values(){return state.chosen.slice();},
     get options(){return state.options.slice();},
     refresh,
     select:items=>setSelection(items,{manual:true}),
     state
   };
 }
 const physical=attach('physical',bookGenre,'bookForm','addBookBtn','bookTitle','bookDescription');
 const digital=attach('digital',digitalGenre,'digitalForm','addDigitalBtn','digitalTitle');
 const editDialog=document.createElement('dialog');
 editDialog.id='eomGenreEditDialog';
 editDialog.className='eom-genre-edit-dialog';
 editDialog.innerHTML='<form class="modal" id="eomEditGenreForm">'+
  '<button class="close" type="button" id="eomEditGenreClose" aria-label="Tutup">×</button>'+
  '<h2>Ubah Genre Buku Fisik</h2><p id="eomEditGenreTitle" class="muted"></p>'+
  '<div class="eom-mgenre-edit-options"></div>'+
  '<p id="eomEditGenreStatus" role="status" aria-live="polite"></p>'+
  '<button type="submit" class="btn primary">Simpan 1–5 Genre</button>'+
  '</form>';
 document.body.appendChild(editDialog);
 document.getElementById('eomEditGenreClose').addEventListener('click',()=>editDialog.close());
 const editZone=editDialog.querySelector('.eom-mgenre-edit-options');
 const editTitle=document.getElementById('eomEditGenreTitle');
 const editStatus=document.getElementById('eomEditGenreStatus');
 let currentEdit=null,editSelected=[];
 function showEditOptions(){
   const available=physical?.options||[];
   editZone.replaceChildren();
   const chip=document.createElement('div');
   chip.className='eom-mgenre-edit-selected';
   chip.textContent=editSelected.length+'/5 dipilih: '+(editSelected.join(', ')||'Belum dipilih');
   editZone.appendChild(chip);
   const list=document.createElement('div');
   list.className='eom-mgenre-choices';
   for(const v of Array.from(new Set([...available,...editSelected]))){
     const row=document.createElement('label');
     row.className='eom-mgenre-item';
     const input=document.createElement('input');
     input.type='checkbox';input.value=v;
     input.checked=editSelected.some(x=>canonical(x)===canonical(v));
     const span=document.createElement('span');span.textContent=v;
     row.append(input,span);
     list.appendChild(row);
   }
   editZone.appendChild(list);
 }
 editZone.addEventListener('change',e=>{
   const input=e.target;
   if(!(input instanceof HTMLInputElement)||input.type!=='checkbox')return;
   const val=input.value;
   if(input.checked&&editSelected.length>=5){
     input.checked=false;editStatus.textContent='⚠️ Maksimal lima genre.';return;
   }
   editSelected=input.checked?[...editSelected,val]:editSelected.filter(x=>canonical(x)!==canonical(val));
   editStatus.textContent='';
   showEditOptions();
 });
 async function editExisting(id){
   try{
     const s=await SB.session();
     if(!s?.access_token)throw new Error('Sesi Admin sudah berakhir.');
     const rows=await SB.select('books','select=id,title,genre&id=eq.'+encodeURIComponent(id)+'&limit=1',s.access_token);
     const book=rows?.[0];
     if(!book)throw new Error('Buku tidak ditemukan.');
     currentEdit=book;
     editSelected=split(book.genre);
     editTitle.textContent=book.title;
     editStatus.textContent='';
     showEditOptions();
     editDialog.showModal();
   }catch(e){alert('Gagal membuka genre: '+e.message);}
 }
 editDialog.querySelector('form')?.addEventListener('submit',async e=>{
   e.preventDefault();
   if(!currentEdit||editSelected.length<1||editSelected.length>5){editStatus.textContent='Pilih 1–5 genre.';return;}
   const submit=e.currentTarget.querySelector('button[type=submit]');
   if(submit)submit.disabled=true;
   try{
     const session=await SB.session();if(!session?.access_token)throw new Error('Sesi berakhir.');
     await SB.rpc('admin_update_book',{p_id:currentEdit.id,p_data:{genre:editSelected.join(', ')}},session.access_token);
     editDialog.close();document.getElementById('refreshBtn')?.click();
   }catch(err){editStatus.textContent='Gagal menyimpan genre: '+err.message;}
   finally{if(submit)submit.disabled=false;}
 });
 window.EOMMULTIGENRE={physical,digital,editExisting,split};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();