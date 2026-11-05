(function(){
'use strict';
function init(){
  if(window.__eomSmartBookIntakeV2)return;
  const form=document.getElementById('bookForm'),dialog=document.getElementById('bookDialog');
  if(!form||!dialog||typeof SB==='undefined'||!window.EOMBOOKMETA||typeof EOMONLINE==='undefined')return;
  window.__eomSmartBookIntakeV2=true;
  const byId=id=>document.getElementById(id);
  const title=byId('bookTitle'),author=byId('bookAuthor'),category=byId('bookCategory'),level=byId('bookLevel'),qty=byId('bookQty'),rack=byId('bookRack'),description=byId('bookDescription');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const box=byId('smartBookFormPanel');
  if(!box)return;
  const photo=byId('smartBookPhoto'),gallery=byId('smartBookGallery'),isbnInput=byId('smartBookIsbn'),lookup=byId('smartBookLookup'),status=byId('smartBookStatus'),result=byId('smartBookResult');
  const publisher=byId('bookPublisher'),year=byId('bookYear'),isbnField=byId('bookIsbn'),coverUrl=byId('bookCoverUrl'),coverPreview=byId('bookCoverPreview'),retry=byId('smartBookRetry');
  const addBook=byId('addBookBtn');
  let capturedCover=false,scanning=false,requestId=0,lastMetadata=null,autoIsbnTimer=null,autoIsbnSequence=0,lastPhotoFile=null,provisionalCoverUrl='';
  function setStatus(message,bad){
    status.textContent=message||'';
    status.classList.toggle('smart-photo-error',!!bad);
  }
  function clearTemporaryPreview(){
    if(provisionalCoverUrl&&window.URL?.revokeObjectURL){
      window.URL.revokeObjectURL(provisionalCoverUrl);
    }
    provisionalCoverUrl='';
  }
  function showImmediatePreview(file){
    clearTemporaryPreview();
    if(!file||!window.URL?.createObjectURL)return;
    provisionalCoverUrl=window.URL.createObjectURL(file);
    coverPreview.src=provisionalCoverUrl;
    coverPreview.classList.remove('hidden');
  }
  function setCover(url){
    coverUrl.value=url||'';
    if(url){
      coverPreview.src=url;
      coverPreview.classList.remove('hidden');
    }else{
      coverPreview.removeAttribute('src');
      coverPreview.classList.add('hidden');
    }
    clearTemporaryPreview();
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
  function classifyBook(input){
    lastMetadata=input;
    const engine=window.EOMBOOKCLASSIFY;
    if(!engine?.applyToForm)return null;
    const result=engine.applyToForm(input);
    if(result.categoryApplied||result.genreApplied){
      const label=[result.categoryApplied?'Kategori: '+result.category:'',result.genreApplied?'Genre: '+result.genre:''].filter(Boolean).join(' · ');
      box.dataset.autoClassification=label;
    }else{
      box.dataset.autoClassification='';
    }
    return result;
  }
  function classificationLabel(value){
    if(!value||!(value.categoryApplied||value.genreApplied))return '';
    const labels=[
      value.categoryApplied?'Kategori: '+value.category:'',
      value.genreApplied?'Genre: '+value.genre:''
    ].filter(Boolean);
    return '<small class="smart-auto-label">🏷️ Saran otomatis ('+
      esc(value.confidence==='tinggi'?'lebih kuat':'perlu diperiksa')+
      '): '+esc(labels.join(' · '))+'</small>';
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
    const suggestion=classifyBook(m);
    if(!suggestion?.categoryApplied)guessCategory(m);
    guessLevel(m);
    result.classList.remove('hidden');
    const img=coverUrl.value?'<img src="'+esc(coverUrl.value)+'" alt="Sampul buku">':'';
    result.innerHTML=img+'<div><b>'+esc(m.title||title.value||'Data buku')+'</b><small>'+
      esc(m.author||'Penulis belum dikenali')+' · '+esc(m.publisher||'Penerbit belum dikenali')+
      '</small><small>ISBN: '+esc(m.isbn||'-')+' · Sumber: '+esc(m.source||'foto buku')+'</small>'+classificationLabel(suggestion)+'</div>';
    setStatus(m.local
      ?'⚠️ ISBN ini sudah tercatat di katalog. Jika hanya menambah eksemplar, sebaiknya ubah stok buku yang sudah ada.'
      :'✅ Data buku ditemukan dan kolom telah terisi otomatis. Periksa judul, kategori, genre dan jumlah sebelum Simpan Buku.',false);
    return true;
  }
  function reset(){
    requestId++;
    clearTimeout(autoIsbnTimer);autoIsbnSequence++;
    capturedCover=false;scanning=false;lastMetadata=null;lastPhotoFile=null;
    photo.value='';gallery.value='';isbnInput.value='';
    if(retry){retry.disabled=true;retry.classList.add('hidden');}
    publisher.value='';year.value='';isbnField.value='';
    setCover('');
    result.innerHTML='';result.classList.add('hidden');
    box.dataset.autoClassification='';
    setStatus('✅ Pembaca buku siap. Ambil foto atau ketik ISBN 10/13 digit; sistem akan mencari data secara otomatis.',false);
    updateControls();
  }
  function updateControls(){
    photo.disabled=scanning;
    gallery.disabled=scanning;
    lookup.disabled=scanning;
    if(retry)retry.disabled=scanning||!lastPhotoFile;
    box.classList.toggle('smart-photo-loading',scanning);
  }
  async function findIsbn(){
    clearTimeout(autoIsbnTimer);
    const value=EOMBOOKMETA.normalizeIsbn(isbnInput.value.trim()||isbnField.value.trim());
    if(!value){setStatus('Masukkan ISBN buku lebih dahulu.',true);return;}
    if(!/^(?:\d{10}|\d{13}|\d{9}X)$/.test(value)){
      setStatus('ISBN harus memiliki 10 atau 13 karakter. Periksa angka terakhir.',true);
      return;
    }
    isbnField.value=value;
    isbnInput.value=value;
    const serial=++autoIsbnSequence;
    setStatus('🔎 Membaca ISBN '+value+' dan mencari judul, penulis, kategori, serta genre buku…',false);
    try{
      const m=await EOMBOOKMETA.lookupIsbn(value);
      if(serial!==autoIsbnSequence)return;
      if(!m?.title){
        result.classList.remove('hidden');
        result.innerHTML='<div><b>ISBN '+esc(value)+' belum ada di katalog daring.</b><small>Foto sampul depan untuk mengenali judul dari tulisan, lalu periksa kategorinya.</small></div>';
        setStatus('⚠️ ISBN '+value+' valid secara format, tetapi data buku tidak ditemukan. Coba Foto Buku untuk membaca sampul.',true);
        return;
      }
      applyMeta(m);
    }catch(e){
      if(serial!==autoIsbnSequence)return;
      setStatus('⚠️ Pencarian ISBN terkendala: '+e.message+'. Gunakan foto sampul untuk membaca judul.',true);
    }
  }
  function watchIsbn(e){
    const source=e.target,value=EOMBOOKMETA.normalizeIsbn(source.value);
    if(source===isbnInput)isbnField.value=value;
    if(source===isbnField)isbnInput.value=value;
    clearTimeout(autoIsbnTimer);
    autoIsbnSequence++;
    if(!value){setStatus('📸 Pilih foto atau isi ISBN untuk mengisi data otomatis.',false);return;}
    if(!/^(?:\d{10}|\d{13}|\d{9}X)$/.test(value)){
      setStatus('✍️ ISBN sedang diketik ('+value.length+' karakter). Pencarian otomatis berjalan setelah 10 atau 13 karakter.',false);
      return;
    }
    setStatus('🔎 ISBN lengkap. Menyiapkan pencarian otomatis tanpa perlu klik tombol…',false);
    autoIsbnTimer=setTimeout(()=>{findIsbn();},550);
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
    let possible=clean.find(x=>x.split(' ').length>=2)||clean[0]||'';
    const index=clean.indexOf(possible);
    if(index>=0&&index+1<clean.length&&/\b(dan|yang|di|ke|untuk|the|of|and)\s*$/i.test(possible))possible=(possible+' '+clean[index+1]).slice(0,95);
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
  async function strongerTextImage(file){
    if(typeof createImageBitmap!=='function')return null;
    const bitmap=await createImageBitmap(file);
    try{
      const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));
      canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const context=canvas.getContext('2d',{willReadFrequently:false});
      if(!context)return null;
      context.filter='grayscale(1) contrast(1.65) brightness(1.06)';
      context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      return canvas.toDataURL('image/png');
    }finally{bitmap.close?.();}
  }
  function parsedScore(read){
    const p=window.EOMCOVERREADER?.parse?.(read);
    if(!p)return String(read?.text||'').trim().length;
    return p.quality+(p.title?.split(/\s+/).length>=2?7:0)+(p.author?8:0);
  }
  async function readText(file,id,enhancedFirst=false){
    setStatus('🔠 Membaca sampul dalam bahasa Indonesia dan Inggris…',false);
    const engine=await scriptForOCR();
    if(id!==requestId)return {text:'',blocks:[]};
    let worker;
    const logger=message=>{
      if(id!==requestId)return;
      if(message.status==='recognizing text'&&Number.isFinite(message.progress)){
        setStatus('🔠 Memeriksa judul dan penulis: '+Math.round(message.progress*100)+'%…',false);
      }else if(message.status==='loading language traineddata'){
        setStatus('🌐 Mengunduh data bahasa OCR sekali saja. Selanjutnya dapat digunakan kembali…',false);
      }
    };
    try{
      try{
        worker=await withDeadline(engine.createWorker(['ind','eng'],1,{logger}),90000,'Data bahasa OCR tidak selesai diunduh.');
      }catch(error){
        setStatus('🔠 Memakai pembaca teks cadangan…',false);
        worker=await withDeadline(engine.createWorker('eng',1,{logger}),90000,'Mesin pembaca teks tidak dapat dimuat.');
      }
      if(id!==requestId)return {text:'',blocks:[]};
      async function run(image){
        const output=await withDeadline(worker.recognize(image,{}, {blocks:true}),85000,'Pembacaan sampul terlalu lama.');
        return {text:String(output?.data?.text||'').trim(),blocks:Array.isArray(output?.data?.blocks)?output.data.blocks:[]};
      }
      let image=file;
      try{
        image=enhancedFirst
          ?await strongerTextImage(file)||file
          :await EOMONLINE.image(file,1850,.92)||file;
      }catch(e){image=file;}
      let best=await run(image);
      let score=parsedScore(best);
      if(score<55||(window.EOMCOVERREADER?.parse(best)?.author||'')===''){
        setStatus('🔎 Memeriksa hasil judul/penulis dengan memperjelas foto yang sama…',false);
        try{
          const other=enhancedFirst
            ?await EOMONLINE.image(file,1850,.92)
            :await strongerTextImage(file);
          if(other&&other!==image){
            const next=await run(other);
            if(parsedScore(next)>score+2){
              best=next;score=parsedScore(next);
            }
          }
        }catch(e){console.warn('Pengecekan OCR alternatif tidak berhasil',e.message);}
      }
      return best;
    }finally{
      if(worker){
        await Promise.race([
          worker.terminate().catch(()=>{}),
          new Promise(resolve=>setTimeout(resolve,2500))
        ]);
      }
    }
  }
  function showRecognizedText(text,parsed,found,suggestion){
    const candidate=parsed.title||parsed.candidate||'';
    const titleOptions=Array.isArray(parsed.titleCandidates)?parsed.titleCandidates:[];
    const authorOptions=Array.isArray(parsed.authorCandidates)?parsed.authorCandidates:[];
    const titleAlternatives=titleOptions.filter(v=>v.text&&v.text!==candidate).slice(0,3);
    result.classList.remove('hidden');
    result.innerHTML='<div class="smart-ocr-choice-panel">'+
      '<b>📖 Hasil pembacaan dari satu foto</b>'+
      '<small>Judul terdeteksi: '+esc(candidate||'belum yakin')+
      ' · Penulis: '+esc(parsed.author||'belum cukup pasti')+'</small>'+
      (found?'<small>ISBN: '+esc(found)+'</small>':'')+
      classificationLabel(suggestion)+
      (titleAlternatives.length?'<div class="smart-ocr-options"><strong>Judul kurang tepat? Pilih hasil lain:</strong>'+
        titleAlternatives.map(x=>'<button type="button" data-cover-title="'+esc(x.text)+'">'+esc(x.text)+'</button>').join('')+'</div>':'')+
      (authorOptions.length?'<div class="smart-ocr-options"><strong>Klik nama penulis jika sesuai dengan sampul:</strong>'+
        authorOptions.slice(0,4).map(x=>'<button type="button" data-cover-author="'+esc(x.text)+'">'+
          esc(x.text)+(x.requiresConfirmation?' · perlu dicek':'')+'</button>').join('')+'</div>':'')+
      '<details class="smart-ocr-raw"><summary>Lihat semua tulisan yang terbaca</summary><pre>'+
      esc(String(text||'').slice(0,1900))+'</pre></details></div>';
  }
  async function recognize(file,id,enhancedFirst=false){
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
    let nativeText='',ocrResult=null,text='';
    if('TextDetector' in window){
      try{
        nativeText=await withDeadline(EOMBOOKMETA.detectTextFile(file),9000,'Pembaca teks bawaan terlalu lama.');
      }catch(e){nativeText='';}
    }
    try{
      ocrResult=await readText(file,id,enhancedFirst);
      text=String(ocrResult?.text||'').trim();
    }catch(error){
      if(id!==requestId)return;
      if(!nativeText){
        setStatus('⚠️ Pembacaan foto gagal: '+error.message+'. Gunakan Baca Ulang Foto Ini tanpa membuka kamera.',true);
        return;
      }
      text=nativeText;
    }
    if(id!==requestId)return;
    if(nativeText&&window.EOMCOVERREADER){
      const nativeScore=window.EOMCOVERREADER.parse(nativeText).quality;
      const ocrScore=window.EOMCOVERREADER.parse(ocrResult||text).quality;
      if(nativeScore>ocrScore+8){text=nativeText;ocrResult=null;}
    }
    if(!text){
      setStatus('⚠️ Tulisan belum terbaca. Coba Baca Ulang Foto Ini tanpa memotret kembali.',true);
      return;
    }
    const parser=window.EOMCOVERREADER;
    const parsed=parser?.parse(ocrResult||{text})||extractCoverText(text);
    const detectedTitle=parsed.title||parsed.candidate||'';
    const found=getIsbnFromText(text)||isbnFromBarcode;
    if(found){isbnInput.value=found;isbnField.value=found;}
    if(detectedTitle){
      title.value=detectedTitle;
      if(parsed.author)author.value=parsed.author;
      if(parsed.publisher)publisher.value=parsed.publisher;
      if(parsed.publication_year)year.value=String(parsed.publication_year);
      const suggestion=classifyBook({title:detectedTitle,author:parsed.author,detected_text:text});
      if(!suggestion?.categoryApplied)guessCategory({title:detectedTitle});
      showRecognizedText(text,parsed,found,suggestion);
      if(parsed.confidence==='rendah'){
        setStatus('📝 Judul masih belum pasti. Pilih saran yang paling sesuai dari teks foto atau koreksi kolom Judul.',true);
      }else if(!parsed.author){
        setStatus('✅ Judul ditemukan. Nama penulis belum pasti; pilih dari saran penulis jika benar atau isi manual.',false);
      }else{
        setStatus('✅ Judul dan penulis berhasil dibaca dari foto. Periksa kesesuaiannya sebelum Simpan Buku.',false);
      }
    }else{
      result.classList.remove('hidden');
      result.innerHTML='<details class="smart-ocr-raw" open><summary>📝 Teks yang terbaca</summary><pre>'+esc(text.slice(0,1800))+'</pre></details>';
      setStatus('⚠️ Foto terbaca, tetapi judul belum cukup jelas. Gunakan Baca Ulang Foto Ini atau pilih teks sebagai panduan.',true);
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
    if(detectedTitle.length>=5&&detectedTitle.split(' ').length>=2){
      setStatus('🔍 Mencocokkan judul dengan katalog, data foto sudah dapat diedit…',false);
      try{
        const meta=await withDeadline(EOMBOOKMETA.searchText(detectedTitle),17000,'Pencarian judul terlalu lama.');
        if(id!==requestId)return;
        if(meta?.title&&similarity(detectedTitle,meta.title)>=0.88){
          applyMeta({...meta,author:meta.author||parsed.author,publisher:meta.publisher||parsed.publisher});
          return;
        }
      }catch(error){console.warn('Pencarian judul',error.message);}
      if(id===requestId)setStatus('✅ Tulisan foto telah dibaca dan dimasukkan. Metadata tambahan tidak ditemukan. Mohon periksa kolom sebelum menyimpan.',false);
    }
  }
  async function handlePhoto(file,fromSavedPhoto=false){
    if(!file)return;
    if(!String(file.type||'').startsWith('image/')){
      setStatus('Pilih foto buku berformat gambar JPG, PNG, atau WebP.',true);return;
    }
    if(file.size>15000000){
      setStatus('Foto terlalu besar. Pilih foto di bawah 15 MB.',true);return;
    }
    const newCapture=!fromSavedPhoto||lastPhotoFile!==file;
    const id=++requestId;
    clearTimeout(autoIsbnTimer);autoIsbnSequence++;
    if(newCapture){
      lastPhotoFile=file;
      capturedCover=false;
      coverUrl.value='';
      showImmediatePreview(file); // Foto langsung tampil tanpa menunggu OCR/katalog.
      result.innerHTML='';
      result.classList.add('hidden');
    }
    if(retry){retry.classList.remove('hidden');retry.disabled=true;}
    scanning=true;updateControls();
    try{
      if(newCapture||!coverUrl.value){
        setStatus('📸 Satu foto diterima dan cover ditampilkan. Menyiapkan cover untuk katalog…',false);
        try{
          const small=await EOMONLINE.image(file,1100,.80);
          if(id!==requestId)return;
          if(small&&/^data:image\//.test(small)){
            setCover(small);
            capturedCover=true;
          }
        }catch(err){
          // Gagal mengecilkan foto bukan alasan menghentikan pembacaan.
          if(id!==requestId)return;
          if(file.size<450000){
            try{
              const url=await new Promise((resolve,reject)=>{
                const reader=new FileReader();
                reader.onload=()=>resolve(reader.result);
                reader.onerror=()=>reject(reader.error);
                reader.readAsDataURL(file);
              });
              if(id!==requestId)return;
              if(typeof url==='string'&&url.startsWith('data:image/')){
                setCover(url);capturedCover=true;
              }
            }catch(e){}
          }
        }
      }
      if(id!==requestId)return;
      setStatus(capturedCover
        ?'✅ Cover sudah tersimpan dari foto yang sama. Sedang membaca judul, ISBN, kategori dan genre…'
        :'📸 Foto tetap tersedia. Sedang membaca judul dan data buku…',false);
      await recognize(file,id,fromSavedPhoto);
    }catch(e){
      if(id===requestId)setStatus('⚠️ Foto tetap tersedia; pembacaan belum berhasil: '+e.message+'. Tekan “Baca Ulang Foto Ini” tanpa memotret lagi.',true);
    }finally{
      if(id===requestId){scanning=false;updateControls();}
    }
  }
  result.addEventListener('click',event=>{
    const button=event.target?.closest?.('button[data-cover-title],button[data-cover-author]');
    if(!button)return;
    event.preventDefault();
    if(button.hasAttribute('data-cover-title')){
      const chosen=button.getAttribute('data-cover-title')||'';
      if(chosen){title.value=chosen;classifyBook({title:chosen});setStatus('✅ Judul diperbaiki dari pilihan foto. Periksa penulis dan data lainnya.',false);}
    }
    if(button.hasAttribute('data-cover-author')){
      const chosen=button.getAttribute('data-cover-author')||'';
      if(chosen){author.value=chosen;setStatus('✅ Nama penulis dipilih dari hasil foto. Pastikan sesuai sampul sebelum disimpan.',false);}
    }
  });
  photo.addEventListener('change',e=>handlePhoto(e.target.files?.[0]));
  gallery.addEventListener('change',e=>handlePhoto(e.target.files?.[0]));
  retry?.addEventListener('click',()=>{if(!scanning&&lastPhotoFile)handlePhoto(lastPhotoFile,true);});
  isbnInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findIsbn();}});
  isbnInput.addEventListener('input',watchIsbn);
  isbnField.addEventListener('input',watchIsbn);
  lookup.addEventListener('click',findIsbn);
  setStatus('✅ Pembaca buku aktif. Foto sampul atau ketik ISBN lengkap untuk pengisian otomatis.',false);
  addBook?.addEventListener('click',()=>{reset();});
  document.addEventListener('eom:book-taxonomy-ready',()=>{if(lastMetadata)classifyBook(lastMetadata);});
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