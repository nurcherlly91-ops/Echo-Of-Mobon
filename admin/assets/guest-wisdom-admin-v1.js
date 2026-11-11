(()=>{
'use strict';
if(typeof SB==='undefined'||typeof SUPABASE_URL==='undefined')return;
function init(){
 const app=document.getElementById('adminApp');
 if(!app||document.getElementById('eomWisdomAdminBtn'))return;
 const btn=document.createElement('button');
 btn.id='eomWisdomAdminBtn';btn.type='button';btn.className='btn ghost';
 btn.textContent='🖼️ Tinjau Kata Bijak Tamu';
 btn.style.cssText='margin:12px 0;min-height:44px;font-weight:800';
 const toolbar=app.querySelector('.admin-head');
 if(toolbar)toolbar.after(btn);else app.prepend(btn);
 const dialog=document.createElement('dialog');
 dialog.id='eomWisdomAdminDialog';
 dialog.style.cssText='width:min(780px,calc(100vw - 16px));max-height:92dvh;border:0;border-radius:20px;padding:0;background:#fffcf6;color:#213b41';
 const shell=document.createElement('section');
 shell.style.cssText='padding:18px;max-height:90dvh;overflow:auto';
 const head=document.createElement('div');
 head.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:9px';
 const title=document.createElement('h2');title.textContent='Kata Bijak Tamu · Persetujuan Admin';
 const close=document.createElement('button');close.type='button';close.textContent='×';close.className='btn ghost';
 close.onclick=()=>dialog.close();head.append(title,close);
 const guide=document.createElement('p');
 guide.textContent='Periksa kutipan dan foto sebelum dipublikasikan. Setelah disetujui, kutipan tampil tepat 7 hari dan otomatis hilang dari galeri.';
 const counter=document.createElement('p');
 counter.id='eomWisdomAdminStatus';counter.setAttribute('role','status');
 const list=document.createElement('div');list.id='eomWisdomAdminList';
 shell.append(head,guide,counter,list);dialog.appendChild(shell);document.body.appendChild(dialog);
 const endpoint=SUPABASE_URL+'/functions/v1/eom-exam-platform';
 async function call(action,payload={}){
  const session=await SB.session();
  if(!session?.access_token)throw Error('Sesi Admin berakhir. Silakan masuk kembali.');
  const response=await fetch(endpoint,{method:'POST',headers:{
   'Content-Type':'application/json',apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token
  },body:JSON.stringify({action,...payload})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Permintaan belum berhasil.');
  return data;
 }
 async function load(){
  counter.textContent='Memuat kata bijak yang menunggu persetujuan…';
  list.replaceChildren();
  try{
   const {rows=[]}=await call('admin-wisdom-list',{status:'pending'});
   counter.textContent=rows.length+' kiriman menunggu persetujuan.';
   if(!rows.length){const p=document.createElement('p');p.textContent='Belum ada kiriman yang menunggu.';list.appendChild(p);}
   for(const row of rows){
    const article=document.createElement('article');
    article.style.cssText='display:grid;grid-template-columns:105px minmax(0,1fr);gap:13px;padding:13px;margin:10px 0;border:1px solid #dcd7c9;border-radius:13px;background:#fff';
    const photo=document.createElement('img');
    photo.src=row.photo;photo.alt='Foto lampiran';photo.style.cssText='width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:9px';
    const content=document.createElement('div');content.style.cssText='min-width:0;overflow-wrap:anywhere';
    const h=document.createElement('strong');h.textContent=row.display_name;
    const text=document.createElement('p');text.textContent='“'+row.quote_text+'”';
    const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
    const accept=document.createElement('button');accept.type='button';accept.className='btn primary';accept.textContent='✓ Setujui 7 Hari';
    const reject=document.createElement('button');reject.type='button';reject.className='btn ghost';reject.textContent='Tolak';
    for(const [choice,button] of [['approved',accept],['rejected',reject]]){
     button.onclick=async()=>{
      accept.disabled=reject.disabled=true;
      counter.textContent='Menyimpan keputusan…';
      try{await call('admin-wisdom-moderate',{id:row.id,decision:choice});await load();}
      catch(e){counter.textContent='Gagal: '+e.message;accept.disabled=reject.disabled=false;}
     };
    }
    actions.append(accept,reject);content.append(h,text,actions);article.append(photo,content);list.appendChild(article);
   }
  }catch(e){counter.textContent='Tidak dapat memuat kata bijak: '+e.message;}
 }
 btn.onclick=()=>{if(!dialog.open)dialog.showModal();load();};
 window.EOMWisdomAdmin={open:()=>btn.click(),refresh:load};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
