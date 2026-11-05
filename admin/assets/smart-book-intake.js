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
  const box=byId('smartBookFormPanel');
  if(!box)return;
  const photo=byId('smartBookPhoto'),gallery=byId('smartBookGallery'),isbnInput=byId('smartBookIsbn'),lookup=byId('smartBookLookup'),status=byId('smartBookStatus'),result=byId('smartBookResult');
  const publisher=byId('bookPublisher'),year=byId('bookYear'),isbnField=byId('bookIsbn'),coverUrl=byId('bookCoverUrl'),coverPreview=byId('bookCoverPreview');
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
    photo.disabled=scanning;
    gallery.disabled=scanning;
    lookup.disabled=scanning;
    box.classList.toggle('smart-photo-loading',scanning);
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
    const text=String(raw||'');
    const lines=text.split(/\r?\n/).map(x=>x.replace(/[^\p{L}\p{N}\s:.,&'()\-]/gu,' ').replace(/\s+/g,' ').trim()).filter(Boolean);
    function labeled(prefix){
      const pattern=new RegExp('(?:^|\\n)\\s*(?:'+prefix+')\\s*[:\\-]?\\s*([^\\r\\n]{3,85})','im');
      const match=text.match(pattern);
      return match?match[1].replace(/^[\s:.\-]+|[\s:.\-]+$/g,'').trim():'';
    }
    const writer=labeled('penulis|pengarang|oleh|author|written\\s+by');
    const publish=labeled('penerbit|publisher|published\\s+by');
    const yearMatch=text.match(/\b(?:19[5-9]\d|20[0-3]\d)\b/);
    const clean=lines.filter(x=>x.length>=5&&x.length<=95&&!/^(ISBN|PENULIS|PENGARANG|OLEH|AUTHOR|PENERBIT|PUBLISHER|PUBLISHED|EDISI|EDITION|CETAKAN|COPYRIGHT|WWW\.|HTTP)/i.test(x)&&!/^[-\d\s.,]+$/.test(x));
    const possible=clean.find(x=>x.split(' ').length>=2)||clean[0]||'';
    return {lines:clean,candidate:possible,author:writer,publisher:publish,publication_year:yearMatch?Number(yearMatch[0]):null};
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
      const result=await worker.recognize(coverUrl.value||file);
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
      if(parsed.author&&!author.value)author.value=parsed.author;
      if(parsed.publisher&&!publisher.value)publisher.value=parsed.publisher;
      if(parsed.publication_year&&!year.value)year.value=String(parsed.publication_year);
      guessCategory({title:title.value});
      result.classList.remove('hidden');
      result.innerHTML='<div><b>📝 Data terbaca dari foto</b><small>Judul: '+esc(parsed.candidate)+
        '</small><small>Penulis: '+esc(parsed.author||'belum terbaca')+
        ' · Penerbit: '+esc(parsed.publisher||'belum terbaca')+'</small></div>';
      setStatus('✅ Kolom hasil baca foto sudah terisi sejauh terbaca. Periksa data buku, lalu tekan Simpan Buku.',false);
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
  photo.addEventListener('change',e=>handlePhoto(e.target.files?.[0]));
  gallery.addEventListener('change',e=>handlePhoto(e.target.files?.[0]));
  isbnInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findIsbn();}});
  lookup.addEventListener('click',findIsbn);
  addBook?.addEventListener('click',()=>{reset();});
  form.onsubmit=async e=>{
    e.preventDefault();
    if(scanning){alert('Pembacaan foto masih berjalan. Silakan periksa hasilnya sebelum menyimpan.');return;}
    const bookTitle=title.value.trim();
    if(!bookTitle){alert('Judul buku wajib diisi.');title.focus();return;}
    const nQty=Math.max(1,Math.floor(Number(qty.value)||1));
    const nRack=Math.max(1,Math.floor(Number(rack.value)||1));
    const pubYear=year.value?Number(year.value):null;
    const submit=form.querySelector('button[type="submit"]')||form.querySelector('.form > button.btn.primary');
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