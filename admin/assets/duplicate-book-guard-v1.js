(function(){
'use strict';
function init(){
  if(window.__eomDuplicateBookGuard)return;
  const form=document.getElementById('bookForm'),dialog=document.getElementById('bookDialog'),
        add=document.getElementById('addBookBtn'),smart=document.getElementById('smartBookFormPanel');
  if(!form||!dialog||!smart||typeof SB==='undefined')return;
  window.__eomDuplicateBookGuard=true;
  const field=id=>document.getElementById(id);
  const title=field('bookTitle'),author=field('bookAuthor'),isbn=field('bookIsbn');
  const front=field('smartBookPhoto'),gallery=field('smartBookGallery');
  const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('id-ID').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
  const cleanISBN=s=>String(s||'').replace(/[^0-9Xx]/g,'').toUpperCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const panel=document.createElement('section');
  panel.id='eomDuplicatePanel';
  panel.className='eom-duplicate-panel hidden';
  panel.setAttribute('aria-live','polite');
  panel.setAttribute('aria-label','Peringatan duplikat koleksi buku fisik');
  smart.after(panel);
  let catalog=[],metadataLoadedAt=0,metadataLoading=null;
  let coverRows=null,coverLoading=null,coverFingerprints=null,coverFingerprintsLoading=null,limitedCovers=false;
  let currentPhoto=null,currentPhotoHash=null,imageMatch=null,photoSequence=0,checkSequence=0,lastKey='',checkTimer=null;
  let bypassNext=false,override=false,lastDuplicate=null,checkingSubmit=false,detectError='';
  const CACHE_MS=60000;
  function imageFrom(source){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      if(/^https?:/i.test(source))image.crossOrigin='anonymous';
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error('Foto tidak bisa dibuka.'));
      image.src=source;
    });
  }
  async function fingerprint(source){
    let image,src;
    if(source instanceof Blob){
      src=URL.createObjectURL(source);
      try{image=await imageFrom(src);}finally{URL.revokeObjectURL(src);}
    }else image=await imageFrom(source);
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx||!image.naturalWidth||!image.naturalHeight)throw new Error('Gambar tidak dapat dibaca.');
    function pixels(w,h){
      canvas.width=w;canvas.height=h;
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(image,0,0,w,h);
      return ctx.getImageData(0,0,w,h).data;
    }
    const toGray=(d,p)=>.299*d[p]+.587*d[p+1]+.114*d[p+2];
    let dHash='',aHash='';
    let data=pixels(9,8);
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){
      const p=(y*9+x)*4;
      dHash+=toGray(data,p)>toGray(data,p+4)?'1':'0';
    }
    data=pixels(8,8);
    const luminance=[];
    for(let p=0;p<data.length;p+=4)luminance.push(toGray(data,p));
    const avg=luminance.reduce((a,b)=>a+b,0)/64;
    aHash=luminance.map(x=>x>avg?'1':'0').join('');
    data=pixels(4,4);
    const rgb=[];
    for(let p=0;p<data.length;p+=4)rgb.push(data[p],data[p+1],data[p+2]);
    return {dHash,aHash,rgb};
  }
  function bits(a,b){
    if(!a||!b||a.length!==b.length)return 64;
    let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;
    return n;
  }
  function colorDifference(a,b){
    if(!a||!b||a.length!==b.length)return 255;
    let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);
    return sum/a.length;
  }
  function coverSimilarity(a,b){
    const d=bits(a.dHash,b.dHash),h=bits(a.aHash,b.aHash),c=colorDifference(a.rgb,b.rgb);
    // Dua hash bentuk dan posisi warna harus sama-sama mendekati.
    const similar=(d<=6&&h<=9&&c<=38)||(d<=3&&h<=7&&c<=50);
    return similar?{distance:d+h+c/10,d,h,c}:null;
  }
  async function allRows(withCovers,force=false){
    const chosen=withCovers?'id,cover_url':'id,title,author,isbn,collection_code,rack_no,qty_total,qty_available,book_status,publisher,publication_year';
    const rows=[];
    const pageSize=withCovers?65:500;
    const limit=withCovers?500:20000;
    let complete=true;
    const session=await SB.session();
    if(!session?.access_token)throw new Error('Sesi admin berakhir. Silakan masuk kembali.');
    for(let offset=0;offset<limit;offset+=pageSize){
      const q='select='+chosen+'&order=created_at.desc&limit='+pageSize+'&offset='+offset;
      const part=await SB.select('books',q,session.access_token);
      if(!Array.isArray(part))throw new Error('Katalog buku belum dapat dibaca.');
      rows.push(...part);
      if(part.length<pageSize)break;
      if(offset+pageSize>=limit)complete=false;
    }
    if(withCovers)limitedCovers=!complete;
    return rows;
  }
  async function loadMetadata(force=false){
    if(!force&&catalog.length&&Date.now()-metadataLoadedAt<CACHE_MS)return catalog;
    if(metadataLoading)return metadataLoading;
    metadataLoading=(async()=>{
      const rows=await allRows(false,force);
      catalog=rows;metadataLoadedAt=Date.now();detectError='';
      return rows;
    })();
    try{return await metadataLoading;}finally{metadataLoading=null;}
  }
  async function loadFingerprints(){
    if(coverFingerprints)return coverFingerprints;
    if(coverFingerprintsLoading)return coverFingerprintsLoading;
    coverFingerprintsLoading=(async()=>{
      if(!coverRows){
        coverLoading=coverLoading||allRows(true);
        try{coverRows=await coverLoading;}finally{coverLoading=null;}
      }
      const items=[];
      for(let i=0;i<coverRows.length;i++){
        const item=coverRows[i];
        if(!item.cover_url)continue;
        try{
          const hash=await fingerprint(item.cover_url);
          items.push({id:item.id,hash});
        }catch(e){ /* gambar lama tidak dapat dibaca / akses CORS dibatasi */ }
        if(i%8===0)await new Promise(resolve=>setTimeout(resolve,0));
      }
      // Simpan fingerprint saja, lepaskan gambar besar dari memori.
      coverRows=null;
      coverFingerprints=items;
      return items;
    })();
    try{return await coverFingerprintsLoading;}finally{coverFingerprintsLoading=null;}
  }
  function similarity(a,b){
    const x=norm(a),y=norm(b);
    if(!x||!y)return 0;
    if(x===y)return 1;
    const s=new Set(),t=new Set();
    for(let i=0;i<x.length-2;i++)s.add(x.slice(i,i+3));
    for(let i=0;i<y.length-2;i++)t.add(y.slice(i,i+3));
    if(!s.size||!t.size)return 0;
    let common=0;for(const trigram of s)if(t.has(trigram))common++;
    return 2*common/(s.size+t.size);
  }
  function duplicateByData(){
    const newTitle=norm(title?.value),newAuthor=norm(author?.value);
    const newISBN=cleanISBN(isbn?.value||field('smartBookIsbn')?.value);
    if(!newTitle&&!newISBN)return null;
    let best=null;
    for(const book of catalog){
      const oldTitle=norm(book.title),oldAuthor=norm(book.author);
      const oldISBN=cleanISBN(book.isbn);
      let candidate=null;
      if(newISBN&&oldISBN&&newISBN===oldISBN&&newISBN.length>=10){
        candidate={book,score:120,level:'pasti',reason:'Nomor ISBN sama dengan buku yang sudah tersimpan.'};
      }else if(newTitle&&oldTitle&&newTitle===oldTitle){
        const authorsMatch=newAuthor&&oldAuthor&&similarity(newAuthor,oldAuthor)>=.9;
        candidate={book,score:authorsMatch?110:100,level:authorsMatch?'pasti':'kemungkinan',
          reason:authorsMatch?'Judul dan penulis sama dengan buku yang sudah tersimpan.':'Judul sama dengan buku yang sudah tersimpan. Periksa penulis dan edisinya.'};
      }else if(newTitle.length>=10&&oldTitle.length>=10&&similarity(newTitle,oldTitle)>=.94){
        const sameWriter=newAuthor&&oldAuthor&&similarity(newAuthor,oldAuthor)>=.87;
        candidate={book,score:sameWriter?95:80,level:'kemungkinan',
          reason:'Judul sangat mirip'+(sameWriter?' dan penulis cocok.':'.')};
      }
      if(candidate&&(!best||candidate.score>best.score))best=candidate;
    }
    return best;
  }
  function duplicateByCover(){
    if(!imageMatch)return null;
    const book=catalog.find(x=>String(x.id)===String(imageMatch.id));
    if(!book)return null;
    return {book,score:108,level:'kemungkinan',
      reason:'Foto sampul sangat mirip dengan foto buku yang sudah tersimpan (pengenalan gambar).'};
  }
  function getDuplicate(){
    const data=duplicateByData(),photo=duplicateByCover();
    if(!data)return photo;
    if(!photo)return data;
    if(data.book.id===photo.book.id)return {...data,level:data.level==='pasti'?'pasti':'kemungkinan',
      reason:data.reason+' Foto sampul juga cocok.',score:data.score+15};
    return data.score>=photo.score?data:photo;
  }
  function showProgress(){
    panel.classList.remove('hidden','is-duplicate','is-possible','is-clear','is-error');
    panel.classList.add('is-checking');
    panel.innerHTML='<b>🔎 Memeriksa duplikat buku fisik…</b><p>Sistem sedang membandingkan dengan koleksi yang sudah tersimpan.</p>';
  }
  function render(){
    const match=getDuplicate();
    lastDuplicate=match;
    panel.classList.remove('hidden','is-checking','is-duplicate','is-possible','is-clear','is-error');
    if(match){
      panel.classList.add(match.level==='pasti'?'is-duplicate':'is-possible');
      const b=match.book;
      panel.innerHTML='<div class="eom-duplicate-icon" aria-hidden="true">⚠️</div>'+
        '<div class="eom-duplicate-content"><strong>'+(match.level==='pasti'?'BUKU FISIK SUDAH TERSIMPAN!':'KEMUNGKINAN BUKU SUDAH TERSIMPAN!')+'</strong>'+
        '<p>'+esc(match.reason)+'</p>'+
        '<div class="eom-existing-book">'+
        '<b>📚 '+esc(b.title||'Tanpa judul')+'</b>'+
        '<small>Penulis: '+esc(b.author||'Belum tercatat')+'</small>'+
        '<small>Kode koleksi: '+esc(b.collection_code||'—')+' · Rak: '+esc(b.rack_no??'—')+'</small>'+
        '<small>Stok tersedia: '+esc(b.qty_available??0)+' dari '+esc(b.qty_total??0)+' buku</small></div>'+
        '<div class="eom-duplicate-actions"><button type="button" id="eomShowExistingBook" class="btn primary">📚 Lihat Buku Tersimpan</button>'+
        '<button type="button" id="eomCancelDuplicate" class="btn ghost">Batal Tambah Buku</button></div>'+
        '<label class="eom-duplicate-confirm"><input id="eomDuplicateOverride" type="checkbox" '+(override?'checked':'')+'>'+
        '<span>Ini buku/edisi berbeda. Saya sudah memeriksa dan tetap ingin menambah sebagai koleksi baru.</span></label>'+
        '<small>Jika hanya menambah jumlah eksemplar, gunakan tombol <b>Ubah</b> pada buku yang sudah ada, bukan Tambah Buku.</small></div>';
      panel.querySelector('#eomDuplicateOverride')?.addEventListener('change',e=>{override=e.target.checked;});
      panel.querySelector('#eomCancelDuplicate')?.addEventListener('click',()=>dialog.close());
      panel.querySelector('#eomShowExistingBook')?.addEventListener('click',()=>{
        dialog.close();
        document.querySelector('.admin-tabs .tab[data-tab="books"]')?.click();
        const action=Array.from(document.querySelectorAll('#booksTable [data-edit-book]')).find(x=>x.dataset.editBook===String(b.id));
        const row=action?.closest('tr');
        if(row){row.scrollIntoView({behavior:'smooth',block:'center'});row.classList.add('eom-duplicate-highlight');setTimeout(()=>row.classList.remove('eom-duplicate-highlight'),6000);}
        else document.getElementById('refreshBtn')?.click();
      });
    }else if(detectError){
      panel.classList.add('is-error');
      panel.innerHTML='<b>⚠️ Pemeriksaan duplikat belum berhasil.</b>'+
        '<p>'+esc(detectError)+' Periksa buku di daftar koleksi terlebih dahulu.</p>'+
        '<label class="eom-duplicate-confirm"><input type="checkbox" id="eomDuplicateOverride" '+(override?'checked':'')+'>'+
        '<span>Saya sudah memeriksa koleksi secara manual dan tetap ingin menyimpan.</span></label>';
      panel.querySelector('#eomDuplicateOverride')?.addEventListener('change',e=>{override=e.target.checked;});
    }else if(title?.value.trim()||isbn?.value.trim()||currentPhoto){
      panel.classList.add('is-clear');
      panel.innerHTML='<b>✅ Belum ditemukan kecocokan duplikat.</b>'+
        '<p>Pemeriksaan berdasarkan '+(currentPhoto?'foto sampul, judul, dan ISBN yang terbaca.':'judul dan ISBN yang tersedia.')+
        (limitedCovers?' Perbandingan foto dilakukan pada sebagian koleksi terbaru.':'')+
        ' Tetap periksa data sebelum menyimpan.</p>';
    }else{
      panel.classList.add('hidden');
    }
  }
  async function runCheck({force=false,image=false}={}){
    const seq=++checkSequence;
    if(!catalog.length||force)showProgress();
    try{
      await loadMetadata(force);
      if(seq!==checkSequence)return null;
      if(image&&currentPhoto){
        await compareCurrentPhoto(currentPhoto,photoSequence);
        if(seq!==checkSequence)return null;
      }
      detectError='';
      render();
      return lastDuplicate;
    }catch(error){
      if(seq!==checkSequence)return null;
      detectError=error.message||'Tidak dapat terhubung ke katalog.';
      render();
      return null;
    }
  }
  async function compareCurrentPhoto(file,seq){
    try{
      if(!currentPhotoHash)currentPhotoHash=await fingerprint(file);
      if(seq!==photoSequence)return;
      const saved=await loadFingerprints();
      if(seq!==photoSequence)return;
      let best=null;
      for(const item of saved){
        const match=coverSimilarity(currentPhotoHash,item.hash);
        if(match&&(!best||match.distance<best.distance))best={...match,id:item.id};
      }
      imageMatch=best;
    }catch(error){
      // ISBN / judul tetap dicek meskipun pemindaian gambar tidak tersedia.
      console.warn('Echo of Mobon: pembanding foto belum tersedia:',error.message);
      imageMatch=null;
    }
  }
  function queueCheck(){
    clearTimeout(checkTimer);
    checkTimer=setTimeout(()=>runCheck().catch(console.warn),350);
  }
  for(const id of ['bookTitle','bookAuthor','bookIsbn','smartBookIsbn']){
    field(id)?.addEventListener('input',queueCheck);
    field(id)?.addEventListener('change',queueCheck);
  }
  // OCR dan pencarian ISBN mengisi .value tanpa memicu input; pantau status/hasilnya.
  const monitor=new MutationObserver(()=>queueCheck());
  for(const id of ['smartBookStatus','smartBookResult']){
    const el=field(id);
    if(el)monitor.observe(el,{childList:true,characterData:true,subtree:true});
  }
  async function handleCover(event){
    const file=event.target?.files?.[0];if(!file)return;
    const seq=++photoSequence;currentPhoto=file;currentPhotoHash=null;imageMatch=null;
    override=false;
    showProgress();
    try{
      await loadMetadata();
      await compareCurrentPhoto(file,seq);
      if(seq!==photoSequence)return;
      render();
    }catch(err){
      if(seq!==photoSequence)return;
      detectError=err.message;render();
    }
  }
  front?.addEventListener('change',handleCover);
  gallery?.addEventListener('change',handleCover);
  add?.addEventListener('click',()=>{
    photoSequence++;checkSequence++;clearTimeout(checkTimer);
    currentPhoto=null;currentPhotoHash=null;imageMatch=null;detectError='';override=false;lastDuplicate=null;
    catalog=[];metadataLoadedAt=0;coverFingerprints=null;coverRows=null;limitedCovers=false;
    panel.className='eom-duplicate-panel hidden';panel.innerHTML='';
    // Menyiapkan metadata ketika formulir dibuka.
    loadMetadata().then(()=>{if(dialog.open)render();}).catch(err=>{if(dialog.open){detectError=err.message;render();}});
  });
  // Blokir submit sampai pemeriksaan terbaru selesai. Submit asli tetap ditangani smart-book-intake.
  form.addEventListener('submit',async e=>{
    if(bypassNext){bypassNext=false;return;}
    e.preventDefault();e.stopImmediatePropagation();
    if(checkingSubmit)return;
    if(smart.classList.contains('smart-photo-loading')){
      alert('Foto masih dibaca. Periksa hasil foto dan duplikat sebelum menyimpan.');
      return;
    }
    checkingSubmit=true;
    const submit=e.submitter||form.querySelector('button[type="submit"]');
    if(submit)submit.disabled=true;
    try{
      await runCheck({force:true,image:!!currentPhoto});
      if(!dialog.open)return;
      if((lastDuplicate||detectError)&&!override){
        panel.scrollIntoView({behavior:'smooth',block:'center'});
        panel.classList.add('eom-duplicate-attention');
        setTimeout(()=>panel.classList.remove('eom-duplicate-attention'),1600);
        alert(lastDuplicate?'Buku mungkin sudah tercatat. Buka data buku yang tersimpan, atau centang konfirmasi jika benar-benar edisi berbeda.':
          'Pemeriksaan duplikat tidak tersedia. Periksa katalog secara manual lalu beri konfirmasi.');
        return;
      }
      bypassNext=true;
      try{form.requestSubmit(submit);}
      finally{bypassNext=false;}
    }catch(error){
      detectError=error.message;render();
      alert('Gagal memeriksa duplikat: '+error.message);
    }finally{checkingSubmit=false;if(submit)submit.disabled=false;}
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();