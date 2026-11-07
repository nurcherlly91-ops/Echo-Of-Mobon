(function(){
'use strict';
function init(){
  const input=document.getElementById('smartBookBarcodePhoto');
  const status=document.getElementById('smartBarcodeStatus');
  if(!input||!status||!window.EOMBOOKMETA)return;
  let active=0;
  const setStatus=(message,error)=>{status.textContent=message;status.classList.toggle('error',!!error);};
  const normalize=v=>EOMBOOKMETA.normalizeIsbn(String(v||'').replace(/^ISBN(?:-1[03])?[\s:-]*/i,''));
  function validISBN(value){
    const s=normalize(value);
    if(/^97[89]\d{10}$/.test(s)){
      let sum=0;for(let i=0;i<13;i++)sum+=Number(s[i])*(i%2?3:1);
      return sum%10===0;
    }
    if(/^\d{9}[\dX]$/.test(s)){
      let sum=0;for(let i=0;i<10;i++)sum+=(10-i)*(s[i]==='X'?10:Number(s[i]));
      return sum%11===0;
    }
    return false;
  }
  function fromText(text){
    const lines=String(text||'').split(/[\n\r]+/);
    const candidates=[];
    for(const line of lines){
      const marked=line.match(/ISBN(?:-1[03])?[\s:=-]*([0-9Xx -]{10,25})/gi)||[];
      marked.forEach(x=>candidates.push(x.replace(/^ISBN(?:-1[03])?[\s:=-]*/i,'')));
      // ISBN-13 biasanya terpisah dalam kelompok angka di dekat barcode.
      (line.match(/97[89](?:[\s-]?[0-9]){10}/g)||[]).forEach(x=>candidates.push(x));
      (line.match(/\b\d{9}[\dXx]\b/g)||[]).forEach(x=>candidates.push(x));
    }
    return candidates.map(normalize).find(validISBN)||'';
  }
  const timeout=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Pembacaan melewati batas waktu.')),ms))]);
  async function ocrEngine(){
    if(window.Tesseract?.createWorker)return window.Tesseract;
    if(window.__eomTesseractLoading)return timeout(window.__eomTesseractLoading,30000);
    window.__eomTesseractLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
      script.async=true;
      script.onload=()=>window.Tesseract?.createWorker?resolve(window.Tesseract):reject(new Error('OCR tidak tersedia'));
      script.onerror=()=>reject(new Error('OCR belum bisa diunduh'));
      document.head.appendChild(script);
    }).catch(e=>{window.__eomTesseractLoading=null;throw e;});
    return timeout(window.__eomTesseractLoading,30000);
  }
  async function getPhotoText(file){
    try{
      const native=await timeout(EOMBOOKMETA.detectTextFile(file),8000);
      if(native&&fromText(native))return native;
    }catch(e){}
    const engine=await ocrEngine();
    let worker;
    try{
      worker=await timeout(engine.createWorker('eng'),90000);
      const image=await EOMONLINE.image(file,1900,.93).catch(()=>null);
      const res=await timeout(worker.recognize(image||file),90000);
      return res?.data?.text||'';
    }finally{if(worker)await worker.terminate().catch(()=>{});}
  }
  input.addEventListener('change',async()=>{
    const file=input.files?.[0];if(!file)return;
    const serial=++active;
    if(!String(file.type||'').startsWith('image/')){setStatus('Pilih gambar JPG/PNG/WebP.',true);return;}
    if(file.size>15*1024*1024){setStatus('Maksimal foto 15 MB.',true);return;}
    input.disabled=true;
    setStatus('🔎 Membaca ISBN pada foto belakang…',false);
    try{
      let isbn='';
      try{isbn=normalize(await timeout(EOMBOOKMETA.detectFile(file),14000));}
      catch(e){}
      if(!validISBN(isbn)){
        setStatus('🔠 Barcode belum terbaca. Memeriksa angka ISBN pada foto…',false);
        const text=await getPhotoText(file);
        isbn=fromText(text);
      }
      if(serial!==active)return;
      if(!validISBN(isbn)){
        setStatus('ISBN belum terbaca jelas. Coba foto ulang barcode dalam cahaya terang atau ketik ISBN.',true);
        return;
      }
      const isbnInput=document.getElementById('smartBookIsbn');
      const isbnField=document.getElementById('bookIsbn');
      if(isbnInput)isbnInput.value=isbn;
      if(isbnField)isbnField.value=isbn;
      setStatus('✅ ISBN '+isbn+' dikenali. Mengisi data buku otomatis dari katalog…',false);
      document.getElementById('smartBookLookup')?.click();
    }catch(error){
      if(serial===active)setStatus('Foto belum terbaca: '+error.message+'. ISBN tetap dapat diketik manual.',true);
    }finally{if(serial===active)input.disabled=false;}
  });
  document.getElementById('addBookBtn')?.addEventListener('click',()=>{
    active++;input.value='';input.disabled=false;setStatus('Opsional: foto barcode belakang bila informasi sampul belum lengkap.',false);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();