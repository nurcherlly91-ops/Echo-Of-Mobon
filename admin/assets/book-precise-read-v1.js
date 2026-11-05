(function(){
'use strict';
const $=s=>document.querySelector(s);
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let file=null,objectURL='',worker=null,mode='title',busy=false,drag=null,selected=null;
function getFile(){
 return file||$('#smartBookPhoto')?.files?.[0]||$('#smartBookGallery')?.files?.[0]||null;
}
function message(msg,isError=false){
 const text=$('#eomCropStatus');if(text){text.textContent=msg;text.classList.toggle('is-error',isError);}
}
function setMode(value){
 mode=value==='author'?'author':'title';
 const t=$('#eomCropModeTitle'),a=$('#eomCropModeAuthor');
 t?.classList.toggle('is-active',mode==='title');
 a?.classList.toggle('is-active',mode==='author');
 t?.setAttribute('aria-pressed',String(mode==='title'));
 a?.setAttribute('aria-pressed',String(mode==='author'));
 message(mode==='title'?'Geser jari untuk membingkai tulisan JUDUL pada sampul.':'Geser jari untuk membingkai NAMA PENULIS pada sampul.');
 selected=null;const outline=$('#eomCropSelection');if(outline)outline.hidden=true;
}
function ensureDialog(){
 let dialog=$('#eomCropDialog');if(dialog)return dialog;
 dialog=document.createElement('dialog');
 dialog.id='eomCropDialog';dialog.className='eom-crop-dialog';
 dialog.innerHTML='<div class="eom-crop-shell">'+
 '<header class="eom-crop-head"><div><small>PEMBACA FOTO PRESISI</small><h2>🎯 Pilih Tulisan pada Cover</h2></div><button type="button" id="eomCropClose" aria-label="Tutup">×</button></header>'+
 '<p class="eom-crop-help">Gunakan <b>foto yang sama</b>. Pilih Judul atau Penulis, kemudian <b>geser jari membentuk kotak</b> tepat di atas tulisan. Sistem akan membacanya otomatis.</p>'+
 '<div class="eom-crop-modes"><button type="button" id="eomCropModeTitle">📖 Pilih Judul</button><button type="button" id="eomCropModeAuthor">✍️ Pilih Penulis</button></div>'+
 '<div class="eom-crop-photo-wrap"><div class="eom-crop-photo-stage" id="eomCropStage">'+
 '<img id="eomCropImage" alt="Foto sampul buku yang sama untuk dipilih bagian judul atau penulis" draggable="false">'+
 '<div id="eomCropSelection" hidden></div></div></div>'+
 '<p class="eom-crop-status" id="eomCropStatus" role="status">Geser jari pada bagian tulisan yang ingin dibaca.</p>'+
 '<div class="eom-crop-result" id="eomCropResult" hidden></div>'+
 '<footer class="eom-crop-footer"><button type="button" id="eomCropAgain">🔄 Gunakan area yang sama</button><button type="button" id="eomCropDone">Selesai</button></footer>'+
 '</div>';
 document.body.appendChild(dialog);
 $('#eomCropClose').onclick=()=>dialog.close();
 $('#eomCropDone').onclick=()=>dialog.close();
 $('#eomCropModeTitle').onclick=()=>setMode('title');
 $('#eomCropModeAuthor').onclick=()=>setMode('author');
 $('#eomCropAgain').onclick=()=>{if(!busy&&selected)readSelection();else message('Blok tulisan pada foto dengan menggeser jari dahulu.');};
 dialog.addEventListener('close',()=>{
  cleanupURL(); if(worker){const old=worker;worker=null;old.terminate?.().catch(()=>{});}
 });
 const stage=$('#eomCropStage'),box=$('#eomCropSelection');
 function render(){
  if(!drag)return;
  const stageRect=stage.getBoundingClientRect();
  const x=Math.min(drag.x,drag.cx),y=Math.min(drag.y,drag.cy);
  const width=Math.abs(drag.cx-drag.x),height=Math.abs(drag.cy-drag.y);
  box.hidden=false;
  box.style.left=x+'px';box.style.top=y+'px';box.style.width=width+'px';box.style.height=height+'px';
 }
 function point(e){
  const rect=stage.getBoundingClientRect();
  return {x:Math.max(0,Math.min(rect.width,e.clientX-rect.left)),y:Math.max(0,Math.min(rect.height,e.clientY-rect.top))};
 }
 stage.addEventListener('pointerdown',e=>{
  if(busy||!getFile())return;
  if(e.button!==0&&e.pointerType!=='touch')return;
  e.preventDefault();
  const p=point(e);
  drag={x:p.x,y:p.y,cx:p.x,cy:p.y};
  try{stage.setPointerCapture(e.pointerId);}catch(_){}
  render();
 });
 stage.addEventListener('pointermove',e=>{
  if(!drag||busy)return;
  const p=point(e);drag.cx=p.x;drag.cy=p.y;render();
 });
 stage.addEventListener('pointerup',e=>{
  if(!drag||busy)return;
  const p=point(e);drag.cx=p.x;drag.cy=p.y;render();
  const sx=Math.min(drag.x,drag.cx),sy=Math.min(drag.y,drag.cy);
  const w=Math.abs(drag.cx-drag.x),h=Math.abs(drag.cy-drag.y);
  drag=null;
  if(w<18||h<12){box.hidden=true;message('Buat kotak yang lebih besar tepat mengelilingi tulisan.',true);return;}
  const rect=stage.getBoundingClientRect();
  selected={x:sx/rect.width,y:sy/rect.height,w:w/rect.width,h:h/rect.height};
  readSelection();
 });
 stage.addEventListener('pointercancel',()=>{drag=null;box.hidden=true;});
 return dialog;
}
function cleanupURL(){
 if(objectURL){URL.revokeObjectURL(objectURL);objectURL='';}
}
function open(){
 file=$('#smartBookPhoto')?.files?.[0]||$('#smartBookGallery')?.files?.[0]||file;
 if(!file){const status=$('#smartBookStatus');if(status)status.textContent='Ambil atau pilih satu foto sampul dahulu.';return;}
 const dialog=ensureDialog();cleanupURL();
 objectURL=URL.createObjectURL(file);
 const img=$('#eomCropImage');img.src=objectURL;
 const result=$('#eomCropResult');result.innerHTML='';result.hidden=true;
 if(!dialog.open){try{dialog.showModal();}catch(_){dialog.setAttribute('open','');}}
 setMode('title');
}
function loadOCR(){
 if(window.Tesseract?.createWorker)return Promise.resolve(window.Tesseract);
 if(window.__eomTesseractLoading)return window.__eomTesseractLoading;
 return Promise.reject(Error('Mesin OCR belum dimuat. Buka kembali Tambah Buku dan tunggu pembacaan pertama selesai.'));
}
async function makeWorker(){
 if(worker)return worker;
 const engine=await loadOCR();
 try{worker=await engine.createWorker(['ind','eng']);}
 catch(e){worker=await engine.createWorker('eng');}
 try{await worker.setParameters?.({tessedit_pageseg_mode:6,preserve_interword_spaces:'1'});}catch(_){}
 return worker;
}
async function croppedData(){
 const current=getFile(),img=$('#eomCropImage');
 if(!current||!selected||!img?.naturalWidth)throw Error('Foto atau kotak pilihan belum tersedia.');
 let bitmap=null;
 try{bitmap=await createImageBitmap(current);}
 catch(e){
  // Canvas can also use the already-loaded original image.
  bitmap=img;
 }
 const naturalW=bitmap.width||bitmap.naturalWidth,naturalH=bitmap.height||bitmap.naturalHeight;
 const sx=Math.max(0,Math.floor(selected.x*naturalW)),
       sy=Math.max(0,Math.floor(selected.y*naturalH)),
       sw=Math.max(1,Math.min(naturalW-sx,Math.ceil(selected.w*naturalW))),
       sh=Math.max(1,Math.min(naturalH-sy,Math.ceil(selected.h*naturalH)));
 if(sw<8||sh<6)throw Error('Area terlalu kecil untuk dibaca.');
 const canvas=document.createElement('canvas');
 const scale=Math.max(1,Math.min(3,1700/sw));
 canvas.width=Math.max(1,Math.round(sw*scale));
 canvas.height=Math.max(1,Math.round(sh*scale));
 const context=canvas.getContext('2d');
 if(!context)throw Error('HP tidak mendukung pemrosesan gambar.');
 context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
 context.filter='grayscale(1) contrast(1.3)';
 context.drawImage(bitmap,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
 if(bitmap!==img&&bitmap.close)bitmap.close();
 return canvas.toDataURL('image/png');
}
function cleanLines(text){
 return String(text||'').split(/\r?\n/).map(v=>v.replace(/^\s*(?:judul|title|penulis|pengarang|oleh|author|written by)\s*[:：-]?\s*/i,'').replace(/\s+/g,' ').trim())
 .filter(x=>x&&x.length<100&&!/^(?:isbn|penerbit|publisher|diterbitkan|copyright|badan pengembangan|kementerian|www\.|http|tahun terbit)\b/i.test(x));
}
function valueFromOCR(text){
 const lines=cleanLines(text);
 if(!lines.length)return'';
 if(mode==='title'){
  const parsed=window.EOMCOVERREADER?.parse?.(lines.join('\n'));
  return String(parsed?.title||lines.slice(0,3).join(' ')).slice(0,150).trim();
 }
 const candidates=lines.filter(v=>!/^(?:penulis|teks|gambar|ilustrasi|penerbit)\b/i.test(v));
 return candidates.slice(0,2).join(' ').slice(0,105).trim();
}
async function readSelection(){
 if(busy)return;
 busy=true;$('#eomCropModeTitle').disabled=true;$('#eomCropModeAuthor').disabled=true;
 try{
  message('🔎 Sedang membaca bagian '+(mode==='author'?'penulis':'judul')+' dari foto yang sama…');
  const image=await croppedData(),ocr=await makeWorker();
  const response=await Promise.race([
   ocr.recognize(image),
   new Promise((_,reject)=>setTimeout(()=>reject(Error('Proses OCR terlalu lama. Coba area lebih kecil.')),65000))
  ]);
  const text=String(response?.data?.text||'').trim();
  const proposed=valueFromOCR(text);
  const target=mode==='author'?$('#bookAuthor'):$('#bookTitle');
  const result=$('#eomCropResult');
  result.hidden=false;
  result.innerHTML='<b>Hasil pembacaan '+(mode==='author'?'penulis':'judul')+':</b>'+
   '<p>'+escape(proposed||'(belum terbaca)')+'</p>'+
   '<small>Periksa isi kolom. Jika belum tepat, buat kotak lebih rapat pada bagian tulisannya.</small>';
  if(!proposed||!target)throw Error('Teks belum cukup terbaca. Coba pilih kotak lebih dekat.');
  target.value=proposed;
  target.dispatchEvent(new Event('input',{bubbles:true}));
  if(mode==='title')window.EOMBOOKCLASSIFY?.applyToForm?.({title:proposed});
  message('✅ '+(mode==='author'?'Penulis':'Judul')+' diperbarui dari area foto yang dipilih. Tidak perlu foto ulang.');
  const status=$('#smartBookStatus');
  if(status)status.textContent='✅ '+(mode==='author'?'Penulis':'Judul')+' telah diperbaiki melalui pemilihan area pada foto yang sama.';
 }catch(e){
  message('⚠️ '+String(e.message||e)+' Foto tetap tersimpan, silakan atur ulang area tulisan.',true);
 }finally{
  busy=false;$('#eomCropModeTitle').disabled=false;$('#eomCropModeAuthor').disabled=false;
 }
}
function init(){
 const form=$('#bookForm'),panel=$('#smartBookFormPanel');
 if(!form||!panel||$('#eomPreciseReadButton'))return;
 const preview=$('.smart-photo-preview-row>div');
 if(!preview)return;
 const button=document.createElement('button');
 button.type='button';button.id='eomPreciseReadButton';button.className='btn ghost eom-precise-button';
 button.textContent='🎯 Perbaiki Judul / Penulis dari Foto Ini';
 button.hidden=true;
 button.onclick=open;
 preview.appendChild(button);
 const update=()=>{
  const chosen=$('#smartBookPhoto')?.files?.[0]||$('#smartBookGallery')?.files?.[0];
  if(chosen){file=chosen;button.hidden=false;}
 };
 $('#smartBookPhoto')?.addEventListener('change',update);
 $('#smartBookGallery')?.addEventListener('change',update);
 $('#addBookBtn')?.addEventListener('click',()=>{file=null;button.hidden=true;});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();