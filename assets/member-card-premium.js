document.addEventListener('DOMContentLoaded',()=>{
  const content=document.getElementById('myCardContent');
  const printBtn=document.getElementById('printMyCardBtn');
  if(!content)return;

  function initials(name=''){return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'EM'}

  function enhanceCard(){
    const card=content.querySelector('.member-card');
    if(!card||card.dataset.premium==='1')return;
    const oldHead=card.querySelector('.member-card-head');
    const oldBody=card.querySelector('.member-card-body');
    if(!oldHead||!oldBody)return;
    const info=oldBody.querySelector('div:not(.member-card-head)');
    const name=info?.querySelector('h3')?.textContent?.trim()||'Anggota Echo of Mobon';
    const ps=info?[...info.querySelectorAll('p')]:[];
    const memberNo=ps[0]?.textContent?.trim()||'-';
    const role=ps[1]?.textContent?.trim()||'Anggota';
    const photo=oldBody.querySelector('.member-card-photo');
    const canvas=oldBody.querySelector('canvas');

    const head=document.createElement('div');head.className='member-card-head';
    const brand=document.createElement('div');brand.className='member-brand';
    brand.innerHTML='<img src="assets/echo-of-mobon-logo.jpg" alt="Logo Echo of Mobon"><div><b>ECHO OF MOBON</b><small>Literasi Suara Fayfiye</small></div>';
    const label=document.createElement('div');label.className='member-card-label';label.textContent='MEMBERSHIP CARD';
    head.append(brand,label);

    const body=document.createElement('div');body.className='member-card-body';
    if(photo){body.appendChild(photo)}else{const f=document.createElement('div');f.className='member-photo-fallback';f.textContent=initials(name);body.appendChild(f)}
    const detail=document.createElement('div');detail.className='member-card-info';
    const cap=document.createElement('div');cap.className='member-caption';cap.textContent='ANGGOTA RESMI';
    const h=document.createElement('h3');h.textContent=name;
    const num=document.createElement('p');num.className='member-number';num.textContent=memberNo;
    const r=document.createElement('p');r.textContent=role;
    const active=document.createElement('div');active.className='member-active';active.textContent='Keanggotaan Aktif';
    detail.append(cap,h,num,r,active);body.appendChild(detail);
    const q=document.createElement('div');q.className='member-qr-wrap';
    if(canvas)q.appendChild(canvas);
    const qs=document.createElement('span');qs.textContent='SCAN QR';q.appendChild(qs);body.appendChild(q);
    card.innerHTML='';card.append(head,body);card.dataset.premium='1';
    if(!content.querySelector('.member-card-note')){const note=document.createElement('p');note.className='member-card-note';note.textContent='Kartu ini digunakan untuk identifikasi anggota dan pemindaian QR pada layanan Echo of Mobon.';content.appendChild(note)}
  }

  const observer=new MutationObserver(()=>enhanceCard());observer.observe(content,{childList:true,subtree:true});enhanceCard();

  if(printBtn){
    printBtn.textContent='Cetak Membership Card';
    printBtn.onclick=()=>{
      enhanceCard();
      const card=content.querySelector('.member-card');if(!card)return;
      const clone=card.cloneNode(true),srcCanvas=card.querySelector('canvas'),dstCanvas=clone.querySelector('canvas');
      let qr='';try{qr=srcCanvas?.toDataURL('image/png')||''}catch{}
      if(dstCanvas&&qr){const img=document.createElement('img');img.src=qr;img.style.width='23mm';img.style.height='23mm';dstCanvas.replaceWith(img)}
      const w=window.open('','_blank','width=900,height=650');if(!w){alert('Izinkan popup browser untuk mencetak kartu.');return}
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Membership Card - Echo of Mobon</title><style>@page{size:85.6mm 54mm;margin:0}html,body{margin:0;padding:0;width:85.6mm;height:54mm}body{font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.member-card{width:85.6mm;height:54mm;box-sizing:border-box;border-radius:4mm;overflow:hidden;position:relative;background:radial-gradient(circle at 88% 12%,rgba(255,220,128,.24),transparent 28%),linear-gradient(135deg,#062b47 0%,#087f91 58%,#0ba6a3 100%);color:#fff;border:.35mm solid #d9ae52}.member-card:before{content:"";position:absolute;inset:2.3mm;border:.25mm solid rgba(255,219,125,.45);border-radius:3mm}.member-card:after{content:"ΜΟΒΟΝ • ECHO • LITERASI";position:absolute;right:4mm;bottom:2.2mm;font:700 5.5pt Georgia,serif;letter-spacing:.16em;color:rgba(255,241,195,.55)}.member-card-head{display:flex;justify-content:space-between;align-items:center;padding:4mm 5mm 2mm;position:relative;z-index:1}.member-brand{display:flex;align-items:center;gap:2.5mm}.member-brand img{width:11mm;height:11mm;object-fit:contain;background:white;border:.5mm solid #e8c367;border-radius:2.2mm;padding:.4mm}.member-brand b{display:block;font:700 11pt Georgia,serif;color:#fff}.member-brand small{display:block;font-size:5.5pt;margin-top:1mm;color:#dff6f5}.member-card-label{font-size:5.5pt;font-weight:800;letter-spacing:.12em;color:#ffe4a0;border:.25mm solid rgba(255,226,146,.55);padding:1.5mm 2mm;border-radius:5mm;background:rgba(1,32,52,.35)}.member-card-body{display:grid;grid-template-columns:17mm 1fr 22mm;gap:3mm;align-items:center;padding:1mm 5mm 5mm;position:relative;z-index:1}.member-card-photo,.member-photo-fallback{width:17mm;height:22mm;object-fit:cover;border-radius:2.5mm;border:.7mm solid #f2ca6a;background:#eef7f7}.member-photo-fallback{display:grid;place-items:center;color:#0a6174;font:800 18pt Georgia,serif}.member-caption{color:#f5d77c;font-size:5pt;font-weight:900;letter-spacing:.12em;margin-bottom:1mm}.member-card-info h3{margin:0 0 1.8mm;color:#fff;font:700 11pt/1.05 Georgia,serif}.member-card-info p{margin:.7mm 0;color:#e8f7f7;font-size:6pt}.member-number{display:inline-block!important;padding:1mm 1.5mm;border-radius:1.5mm;background:rgba(255,255,255,.12);border:.25mm solid rgba(255,255,255,.16);font-weight:800!important;color:#fff!important}.member-active{margin-top:1mm;color:#fff4ca;font-size:5.5pt;font-weight:800}.member-qr-wrap{display:grid;justify-items:center;gap:1mm;padding:1.2mm;border-radius:2.5mm;background:#fff;border:.5mm solid #e6bb55}.member-qr-wrap img{width:19mm!important;height:19mm!important}.member-qr-wrap span{color:#123547;font-size:4.5pt;font-weight:900;letter-spacing:.08em}</style></head><body>${clone.outerHTML}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),400)}<\/script></body></html>`);w.document.close();
    };
  }
});