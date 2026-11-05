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
    photo.value='';gallery.value='';isbnInput.value='';
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
  function withDeadline(promise,ms,message){
    let timer;
    return Promise.race([
      promise,
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})
    ]).finally(()=>clearTimeout(timer));
  }
  function scriptForOCR(){
    if(window.Tesseract?.createWorker)return Promise.resolve(window.Tesseract);
    if(window.__eomTesseractLoading)return window.__eomTesseractLoading;
    const sources=[
      'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/6.0.1/tesseract.min.js'
    ];
    async function load(src){
      return withDeadline(new Promise((resolve,reject)=>{
        const script=document.createElement('script');
        script.src=src;script.async=true;script.crossOrigin='anonymous';
        script.onload=()=>window.Tesseract?.createWorker?resolve(window.Tesseract):reject(new Error('Mesin OCR tidak siap.'));
        script.onerror=()=>reject(new Error('Penyedia OCR tidak bisa diakses.'));
        document.head.appendChild(script);
      }),22000,'Unduhan mesin OCR melewati batas waktu.');
    }
    window.__eomTesseractLoading=(async()=>{
      for(const src of sources){
        try{return await load(src);}
        catch(e){console.warn('Echo of Mobon: beralih server OCR',e.message);}
      }
      throw new Error('Mesin pembaca foto tidak dapat dimuat. Periksa jaringan internet atau coba ISBN pada sampul belakang.');
    })().catch(e=>{window.__eomTesseractLoading=null;throw e;});
    return window.__eomTesseractLoading;
  }
  async function readText(file,id){
    setStatus('🔠 Memuat mesin pembaca tulisan. Pemindaian pertama bisa lebih lama karena perlu mengunduh data bahasa…',false);
    const t=await scriptForOCR();
    if(id!==requestId)return '';
    let worker;
    try{
      worker=await withDeadline(t.createWorker('eng',1,{
        logger:message=>{
          if(id!==requestId)return;
          if(message.status==='recognizing text'&&Number.isFinite(message.progress)){
            setStatus('🔠 Membaca tulisan di foto: '+Math.round(message.progress*100)+'%…',false);
          }else if(message.status==='loading language traineddata'){
            setStatus('🌐 Mengunduh data pembaca tulisan untuk pertama kali…',false);
          }
        }
      }),90000,'Pengunduhan OCR terlalu lama. Periksa jaringan internet.');
      if(id!==requestId)return '';
      const inputImage=await EOMONLINE.image(file,1800,.9);
      const recognized=await withDeadline(worker.recognize(inputImage||file),85000,'Foto sulit dibaca atau pemindaian terlalu lama. Silakan coba foto lain.');
      return String(recognized?.data?.text||'').trim();
    }finally{
      if(worker)await Promise.race([worker.terminate().catch(()=>{}),new Promise(r=>setTimeout(r,2500))]);
    }
  }
  function showRecognizedText(text,parsed,found){
    const current=esc(parsed.candidate||'Belum dikenali');
    result.classList.remove('hidden');
    result.innerHTML='<div style="width:100%"><b>📖 Hasil pembacaan foto</b>'+
      '<small>Judul: '+current+'</small>'+
      '<small>Penulis: '+esc(parsed.author||'Belum ditemukan')+
      ' · Penerbit: '+esc(parsed.publisher||'Belum ditemukan')+'</small>'+
      (found?'<small>ISBN: '+esc(found)+'</small>':'')+
      '<details class="smart-ocr-raw"><summary>Lihat teks yang terbaca (untuk koreksi)</summary><pre>'+
      esc(text.slice(0,1800))+'</pre></details></div>';
  }
  async function recognize(file,id){
    setStatus('🔎 Memeriksa barcode ISBN pada foto…',false);
    let barcode='';
    try{barcode=await withDeadline(EOMBOOKMETA.detectFile(file),12000,'Pemindaian barcode terlalu lama.');}
    catch(e){/* BarcodeDetector tidak tersedia di semua HP. Lanjut dengan OCR. */}
    if(id!==requestId)return;
    let isbnFromBarcode=EOMBOOKMETA.normalizeIsbn((barcode||'').replace(/^ISBN[:\s-]*/i,''));
    if(!/^(?:97[89]\d{10}|\d{9}[\dX])$/.test(isbnFromBarcode))isbnFromBarcode='';
    if(isbnFromBarcode){
      isbnInput.value=isbnFromBarcode;isbnField.value=isbnFromBarcode;
      setStatus('🔎 Barcode ISBN '+isbnFromBarcode+' ditemukan. Mengambil data buku…',false);
      try{
        const meta=await withDeadline(EOMBOOKMETA.lookupIsbn(isbnFromBarcode),16000,'Pencarian ISBN terlalu lama.');
        if(id!==requestId)return;
        if(meta?.title){applyMeta(meta);return;}
      }catch(error){console.warn('ISBN metadata belum ditemukan',error.message);}
    }
    let text='';
    if('TextDetector' in window){
      try{
        setStatus('🔠 Mencoba pembaca tulisan bawaan HP…',false);
        text=await withDeadline(EOMBOOKMETA.detectTextFile(file),12000,'Pemindaian lokal terlalu lama.');
      }catch(e){text='';}
    }
    if(!text||text.trim().length<8){
      try{text=await readText(file,id);}
      catch(error){
        if(id!==requestId)return;
        setStatus('⚠️ Mesin pembaca tulisan tidak berhasil: '+error.message+' Coba foto lebih dekat atau pindai barcode ISBN.',true);
        return;
      }
    }
    if(id!==requestId)return;
    if(!text){
      setStatus('⚠️ Teks sampul belum dapat dibaca. Pastikan foto terang, tidak miring, dan tulisan terlihat jelas. Coba foto ulang.',true);
      return;
    }
    const parsed=extractCoverText(text);
    const found=getIsbnFromText(text)||isbnFromBarcode;
    if(found){isbnInput.value=found;isbnField.value=found;}
    if(parsed.candidate){
      // Mengisi kolom SEKARANG, tidak menunggu jaringan metadata.
      title.value=parsed.candidate;
      if(parsed.author)author.value=parsed.author;
      if(parsed.publisher)publisher.value=parsed.publisher;
      if(parsed.publication_year)year.value=String(parsed.publication_year);
      guessCategory({title:parsed.candidate});
      showRecognizedText(text,parsed,found);
      setStatus('✅ Teks berhasil dibaca dan kolom terisi otomatis. Periksa hasilnya sebelum Simpan Buku.',false);
    }else{
      result.classList.remove('hidden');
      result.innerHTML='<details class="smart-ocr-raw" open><summary>Teks foto yang berhasil dibaca</summary><pre>'+esc(text.slice(0,1800))+'</pre></details>';
      setStatus('📝 Tulisan foto terbaca, tetapi judul belum jelas. Anda dapat menyalin dari hasil pembacaan di bawah.',true);
    }
    if(id!==requestId)return;
    if(found){
      setStatus('🔍 Mencocokkan ISBN dengan database buku…',false);
      try{
        const meta=await withDeadline(EOMBOOKMETA.lookupIsbn(found),16000,'Pencarian ISBN terlalu lama.');
        if(id===requestId&&meta?.title){applyMeta(meta);return;}
      }catch(error){console.warn('Pencarian ISBN',error.message);}
      if(id===requestId)setStatus('✅ Data yang terbaca dari foto sudah masuk kolom. ISBN belum ditemukan dalam katalog daring; periksa lalu Simpan Buku.',false);
      return;
    }
    if(parsed.candidate.length>=5&&parsed.candidate.split(' ').length>=2){
      setStatus('🔍 Mencocokkan judul dengan katalog, data foto sudah dapat diedit…',false);
      try{
        const meta=await withDeadline(EOMBOOKMETA.searchText(parsed.candidate),17000,'Pencarian judul terlalu lama.');
        if(id!==requestId)return;
        if(meta?.title&&similarity(parsed.candidate,meta.title)>=0.75){
          applyMeta({...meta,author:meta.author||parsed.author,publisher:meta.publisher||parsed.publisher});
          return;
        }
      }catch(error){console.warn('Pencarian judul',error.message);}
      if(id===requestId)setStatus('✅ Tulisan foto telah dibaca dan dimasukkan. Metadata tambahan tidak ditemukan. Mohon periksa kolom sebelum menyimpan.',false);
    }
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