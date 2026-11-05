(function(){
'use strict';
function init(){
  if(window.__eomSmartBookIntakeV2)return;
  const form=document.getElementById('bookForm'),dialog=document.getElementById('bookDialog');
  if(!form||!dialog||!window.SB||!window.EOMBOOKMETA||!window.EOMONLINE)return;
  window.__eomSmartBookIntakeV2=true;
  const byId=id=>document.getElementById(id);
  const title=byId('bookTitle'),author=byId('bookAuthor'),category=byId('bookCategory'),level=byId('bookLevel'),qty=byId('bookQty'),rack=byId('bookRack'),description=byId('bookDescription');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const box=document.createElement('section');
  box.className='smart-intake-card';
  box.innerHTML=[
    '<div class="smart-intake-head"><div><b>📸 Foto Buku → Data Otomatis</b>',
    '<small>Foto sampul depan atau barcode ISBN. Judul, penulis, penerbit, tahun, ISBN, dan sampul diisi otomatis bila dapat dikenali.</small></div></div>',
    '<div class="smart-photo-actions">',
    '<button id="smartBookCameraBtn" type="button" class="btn primary">📸 Ambil Foto Buku</button>',
    '<button id="smartBookGalleryBtn" type="button" class="btn ghost">🖼️ Pilih dari Galeri</button></div>',
    '<input id="smartBookPhoto" class="smart-file-input" type="file" accept="image/*" capture="environment" aria-label="Foto buku menggunakan kamera">',
    '<input id="smartBookGallery" class="smart-file-input" type="file" accept="image/*" aria-label="Pilih foto buku dari galeri">',
    '<div class="smart-intake-grid"><label>Atau ketik ISBN (jika ada)',
    '<input id="smartBookIsbn" type="text" inputmode="numeric" placeholder="Contoh: 978602..." autocomplete="off"></label>',
    '<div class="smart-intake-lookup"><button id="smartBookLookup" type="button" class="btn ghost">🔍 Cari Data ISBN</button></div></div>',
    '<div id="smartBookStatus" class="smart-photo-status" role="status" aria-live="polite">📖 Foto buku akan dibaca di HP; data tetap bisa diperiksa dan diperbaiki.</div>',
    '<div id="smartBookResult" class="smart-book-result hidden"></div>'
  ].join('');
  form.querySelector('h2')?.after(box);
  const desc=description?.closest('label'),extra=document.createElement('div');
  extra.className='smart-extra-fields';
  extra.innerHTML=[
    '<div class="grid2"><label>Penerbit<input id="bookPublisher" autocomplete="off"></label>',
    '<label>Tahun Terbit<input id="bookYear" type="number" min="1000" max="2100"></label></div>',
    '<div class="grid2"><label>ISBN<input id="bookIsbn" autocomplete="off"></label>',
    '<label>Foto Sampul Buku (opsional)<input id="bookCoverPhoto" type="file" accept="image/*" capture="environment"></label></div>',
    '<input id="bookCoverUrl" type="hidden"><img id="bookCoverPreview" class="smart-cover-preview hidden" alt="Pratinjau sampul buku">'
  ].join('');
  desc?.before(extra);
  const photo=byId('smartBookPhoto'),gallery=byId('smartBookGallery'),isbnInput=byId('smartBookIsbn'),lookup=byId('smartBookLookup'),status=byId('smartBookStatus'),result=byId('smartBookResult');
  const publisher=byId('bookPublisher'),year=byId('bookYear'),isbnField=byId('bookIsbn'),coverPhoto=byId('bookCoverPhoto'),coverUrl=byId('bookCoverUrl'),coverPreview=byId('bookCoverPreview');
  const addBook=byId('addBookBtn');
  let capturedCover=false,scanning=false,requestId=0;
  function setStatus(message,bad){
    status.textContent=message||'';
    status.classList.toggle('smart-photo-error',!!bad);
  }
  function setCover(url){
    coverUrl.value=url||'';
    if(url){coverPreview.src=url;coverPreview.classList.remove('hidden');}
    else {coverPreview.removeAttribute('src');coverPreview.classList.add('hidden');}
  }
  function guessCategory(m){
    if(!category||category.value)return;
    const txt=(String(m.title||'')+' '+String(m.category||'')+' '+String(m.description||'')).toLowerCase();
    const possible=[
      [/novel|cerpen|fiksi|fiction|cerita pendek/i,'Novel & Cerpen'],
      [/komik|comic|manga/i,'Komik & Novel Grafis'],
      [/dongeng|fabel|fairy|folktale/i,'Fabel & Dongeng'],
      [/sejarah|history|budaya|tradisi/i,'Sejarah & Budaya'],
      [/sains|ilmu pengetahuan|biology|fisika|kimia|science|teknologi/i,'Sains & Teknologi'],
      [/biografi|biography|autobiography/i,'Biografi & Autobiografi'],
      [/pelajaran|sekolah|matematika|kurikulum|buku siswa|buku guru|textbook/i,'Buku Ajar & Akademik']
    ];
    for(const pair of possible){
      if(!pair[0].test(txt))continue;
      const opt=Array.from(category.options).find(o=>o.value.toLowerCase()===pair[1].toLowerCase());
      if(opt){category.value=opt.value;break;}
    }
  }
  function guessLevel(m){
    if(!level||level.value)return;
    const text=(m.title||'')+' '+(m.reader_level||'');
    const patterns=[[/\b(?:tk|paud)\b/i,'TK / PAUD'],[/\b(?:sd|mi)\b/i,'SD / MI'],[/\b(?:smp|mts)\b/i,'SMP / MTs'],[/\b(?:sma|smk|ma)\b/i,'SMA / MA / SMK']];
    for(const pair of patterns){if(pair[0].test(text)){const match=Array.from(level.options).find(o=>o.value===pair[1]);if(match){level.value=match.value;break;}}}
  }
  function applyMeta(m){
    if(!m)return false;
    if(m.title)title.value=String(m.title).trim();
    if(m.author)author.value=String(m.author).trim();
    if(m.publisher)publisher.value=String(m.publisher).trim();
    if(m.publication_year)year.value=String(m.publication_year);
    if(m.isbn){isbnField.value=String(m.isbn);isbnInput.value=String(m.isbn);}
    if(m.description)description.value=String(m.description).trim();
    if(m.cover_url&&!capturedCover)setCover(m.cover_url);
    if(m.category&&category){
      const option=Array.from(category.options).find(o=>o.value.toLowerCase()===String(m.category).toLowerCase());
      if(option)category.value=option.value;
    }
    guessCategory(m);guessLevel(m);
    result.classList.remove('hidden');
    const img=coverUrl.value?'<img src="'+esc(coverUrl.value)+'" alt="Sampul buku">':'';
    result.innerHTML=img+'<div><b>'+esc(m.title||title.value||'Data buku')+'</b><small>'+
      esc(m.author||'Penulis belum dikenali')+' · '+esc(m.publisher||'Penerbit belum dikenali')+
      '</small><small>ISBN: '+esc(m.isbn||'-')+' · Sumber: '+esc(m.source||'foto buku')+'</small></div>';
    setStatus(m.local
      ?'⚠️ ISBN ini sudah tercatat di katalog. Jika hanya menambah eksemplar, sebaiknya ubah stok buku yang sudah ada.'
      :'✅ Data foto berhasil diisikan. Periksa judul, penulis, kategori dan jumlah buku, lalu tekan Simpan Buku.',false);
    return true;
  }
  function reset(){
    requestId++;
    capturedCover=false;scanning=false;
    photo.value='';gallery.value='';coverPhoto.value='';isbnInput.value='';
    publisher.value='';year.value='';isbnField.value='';
    setCover('');
    result.innerHTML='';result.classList.add('hidden');
    setStatus('📖 Ambil foto sampul atau barcode untuk mengisi data otomatis.',false);
    updateControls();
  }
  function updateControls(){
    for(const el of [byId('smartBookCameraBtn'),byId('smartBookGalleryBtn'),lookup]){
      if(el)el.disabled=scanning;
    }
  }
  async function findIsbn(){
    const value=isbnInput.value.trim()||isbnField.value.trim();
    if(!value){setStatus('Masukkan ISBN buku lebih dahulu.',true);return;}
    setStatus('🔎 Sedang mencari judul dan penulis berdasarkan ISBN…',false);
    try{
      const m=await EOMBOOKMETA.lookupIsbn(value);
      if(!m){setStatus('ISBN belum ditemukan di katalog buku daring. Judul dan penulis bisa diisi manual.',true);return;}
      applyMeta(m);
    }catch(e){setStatus('Pencarian ISBN gagal: '+e.message,true);}
  }
  function getIsbnFromText(text){
    const candidate=String(text||'').match(/(?:ISBN(?:-1[03])?\s*:?\s*)?(?:97[89][0-9\s-]{10,17}|\b[0-9]{9}[0-9Xx]\b)/gi)||[];
    for(const c of candidate){
      const n=EOMBOOKMETA.normalizeIsbn(c.replace(/^ISBN(?:-1[03])?\s*:?\s*/i,''));
      if(/^(?:97[89]\d{10}|\d{9}[\dX])$/.test(n))return n;
    }
    return '';
  }
  function extractCoverText(raw){
    const lines=String(raw||'').split(/\r?\n/).map(s=>s.replace(/[^\p{L}\p{N}\s:.,&'()\-]/gu,' ').replace(/\s+/g,' ').trim()).filter(Boolean);
    const clean=lines.filter(s=>s.length>=5&&s.length<=95&&!/^(ISBN|PENERBIT|PUBLISHED|EDISI|EDITION|CETAKAN|COPYRIGHT|WWW\.|HTTP)/i.test(s)&&!/^[-\d\s.,]+$/.test(s));
    const possible=clean.find(s=>s.split(' ').length>=2)||clean[0]||'';
    return {lines:clean,candidate:possible};
  }
  function similarity(a,b){
    const tokens=s=>new Set(String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').split(' ').filter(x=>x.length>=3));
    const aa=tokens(a),bb=tokens(b);if(!aa.size||!bb.size)return 0;
    let overlap=0;aa.forEach(t=>{if(bb.has(t))overlap++;});
    return overlap/Math.max(1,Math.min(aa.size,bb.size));
  }
  function scriptForOCR(){
    if(window.Tesseract?.createWorker)return Promise.resolve(window.Tesseract);
    if(window.__eomTesseractLoading)return window.__eomTesseractLoading;
    window.__eomTesseractLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
      script.crossOrigin='anonymous';
      script.onload=()=>window.Tesseract?.createWorker?resolve(window.Tesseract):reject(new Error('Modul pembaca foto belum siap.'));
      script.onerror=()=>reject(new Error('Modul OCR tidak dapat diunduh. Periksa internet atau gunakan ISBN manual.'));
      document.head.appendChild(script);
    }).catch(err=>{window.__eomTesseractLoading=null;throw err;});
    return window.__eomTesseractLoading;
  }
  async function readText(file,id){
    setStatus('🔠 Membaca tulisan di sampul menggunakan OCR pada perangkat…',false);
    const t=await scriptForOCR();
    let worker;
    try{
      worker=await t.createWorker(['ind','eng'],1,{
        logger:msg=>{
          if(id!==requestId)return;
          if(msg.status==='recognizing text'&&Number.isFinite(msg.progress)){
            setStatus('🔠 Membaca teks sampul: '+Math.round(msg.progress*100)+'%…',false);
          }
        }
      });
    }catch(error){
      worker=await t.createWorker('eng');
    }
    try{
      const result=await worker.recognize(file);
      return String(result?.data?.text||'').trim();
    }finally{await worker.terminate().catch(()=>{});}
  }
  async function recognize(file,id){
    setStatus('🔎 Memindai barcode atau teks sampul…',false);
    try{
      const meta=await EOMBOOKMETA.smartFromPhoto(file);
      if(id!==requestId)return;
      if(meta?.title){applyMeta(meta);return;}
    }catch(e){/* Lanjut OCR jika browser tidak mendukung pemindaian bawaan. */}
    let text='';
    try{text=await readText(file,id);}
    catch(error){if(id===requestId)setStatus('📸 Sampul tersimpan. Pembacaan teks otomatis belum tersedia: '+error.message+' Anda masih dapat mengisi data manual.',true);return;}
    if(id!==requestId)return;
    const found=getIsbnFromText(text);
    if(found){
      isbnInput.value=found;isbnField.value=found;
      setStatus('🔎 ISBN '+found+' ditemukan. Mencari metadata…',false);
      try{const meta=await EOMBOOKMETA.lookupIsbn(found);if(meta){applyMeta(meta);return;}}catch(e){}
    }
    const parsed=extractCoverText(text);
    if(parsed.candidate){
      setStatus('🔎 Teks sampul dikenali. Memeriksa kecocokan judul…',false);
      try{
        const meta=await EOMBOOKMETA.searchText(parsed.candidate);
        if(id!==requestId)return;
        if(meta?.title&&similarity(parsed.candidate,meta.title)>=0.6){applyMeta(meta);return;}
      }catch(e){}
      if(id!==requestId)return;
      if(!title.value)title.value=parsed.candidate;
      result.classList.remove('hidden');
      result.innerHTML='<div><b>📝 Perkiraan judul dari foto</b><small>'+esc(parsed.candidate)+
        '</small><small>Hasil OCR perlu diperiksa; penulis/penerbit mungkin belum terdeteksi.</small></div>';
      setStatus('✅ Foto sampul tersimpan, perkiraan judul terisi. Koreksi jika perlu, lalu lengkapi penulis dan simpan.',false);
      return;
    }
    setStatus('📸 Foto sampul telah disiapkan. Teks belum terbaca jelas. Silakan foto ulang lebih dekat atau isi ISBN manual.',true);
  }
  async function handlePhoto(file){
    if(!file)return;
    if(!String(file.type||'').startsWith('image/')){setStatus('Pilih file gambar JPG, PNG atau WebP.',true);return;}
    if(file.size>15000000){setStatus('Foto terlalu besar. Gunakan gambar di bawah 15 MB.',true);return;}
    const id=++requestId;
    scanning=true;updateControls();
    try{
      setStatus('📷 Menyiapkan foto sampul untuk disimpan…',false);
      const small=await EOMONLINE.image(file,950,.76);
      if(id!==requestId)return;
      if(small){setCover(small);capturedCover=true;}
      await recognize(file,id);
    }catch(e){
      if(id===requestId)setStatus('Foto sudah dipilih, tetapi pembacaan gagal: '+e.message+'. Anda dapat mengisi data manual.',true);
    }finally{
      if(id===requestId){scanning=false;updateControls();}
    }
  }
  byId('smartBookCameraBtn').addEventListener('click',()=>photo.click());
  byId('smartBookGalleryBtn').addEventListener('click',()=>gallery.click());
  photo.addEventListener('change',e=>handlePhoto(e.target.files?.[0]));
  gallery.addEventListener('change',e=>handlePhoto(e.target.files?.[0]));
  isbnInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findIsbn();}});
  lookup.addEventListener('click',findIsbn);
  coverPhoto.addEventListener('change',async e=>{
    const f=e.target.files?.[0];if(!f)return;
    try{setCover(await EOMONLINE.image(f,950,.76));capturedCover=true;setStatus('📷 Sampul pilihan Anda siap disimpan bersama data buku.',false);}
    catch(err){setStatus('Foto sampul gagal diproses: '+err.message,true);}
  });
  addBook?.addEventListener('click',()=>{reset();});
  const panel=document.querySelector('#tab-books .panel-head');
  if(panel&&!byId('autoBookPhotoBtn')){
    const quick=document.createElement('button');
    quick.id='autoBookPhotoBtn';quick.type='button';quick.className='btn primary';
    quick.textContent='📸 Foto Buku → Isi Otomatis';
    quick.addEventListener('click',()=>{addBook?.click();photo.click();});
    panel.appendChild(quick);
  }
  form.onsubmit=async e=>{
    e.preventDefault();
    if(scanning){alert('Pembacaan foto masih berjalan. Silakan periksa hasilnya sebelum menyimpan.');return;}
    const bookTitle=title.value.trim();
    if(!bookTitle){alert('Judul buku wajib diisi.');title.focus();return;}
    const nQty=Math.max(1,Math.floor(Number(qty.value)||1));
    const nRack=Math.max(1,Math.floor(Number(rack.value)||1));
    const pubYear=year.value?Number(year.value):null;
    const submit=form.querySelector('button[type="submit"]')||form.querySelector('.btn.primary');
    if(submit)submit.disabled=true;
    try{
      const session=await SB.session();
      if(!session?.access_token)throw new Error('Sesi Admin berakhir. Masuk kembali.');
      await SB.insert('books',{
        title:bookTitle,author:author.value.trim()||null,category:category.value||null,
        reader_level:level.value||null,publisher:publisher.value.trim()||null,
        publication_year:pubYear,isbn:EOMBOOKMETA.normalizeIsbn(isbnField.value)||null,
        qty_total:nQty,qty_available:nQty,book_status:'Tersedia',
        cover_url:coverUrl.value||null,description:description.value.trim()||null,
        rack_no:nRack,active:true
      },session.access_token);
      dialog.close();
      byId('refreshBtn')?.click();
      alert('Buku fisik berhasil ditambahkan ke katalog Echo of Mobon. Foto sampul dan data yang sudah diperiksa ikut tersimpan.');
    }catch(err){alert('Gagal menyimpan buku fisik: '+err.message);}
    finally{if(submit)submit.disabled=false;}
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();