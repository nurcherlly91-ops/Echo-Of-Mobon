(()=>{
'use strict';
const by=id=>document.getElementById(id);
const quoteList=by('eomWisdomGallery'),form=by('eomWisdomForm');
if(!quoteList||!form)return;
const status=by('eomWisdomStatus'),message=by('eomWisdomMessage');
const endpoint=SUPABASE_URL+'/functions/v1/eom-exam-platform';
async function call(action,payload={}){
 const token=window.EOMGuestAccess?.current()?.guest_token||'';
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY},
  body:JSON.stringify({action,...payload,guest_token:token})});
 let data={};
 try{data=await response.json();}catch(_){}
 if(!response.ok)throw Error(data.error||'Layanan kata bijak sedang bermasalah.');
 return data;
}
function card(row){
 const article=document.createElement('article');article.className='eom-wisdom-card';
 const figure=document.createElement('figure'),photo=document.createElement('img');
 photo.src=row.photo;photo.alt='Foto lampiran kata bijak dari '+row.name;photo.loading='lazy';photo.decoding='async';
 figure.appendChild(photo);article.appendChild(figure);
 const body=document.createElement('div');
 const text=document.createElement('blockquote');text.textContent='“'+row.quote+'”';
 const byline=document.createElement('strong');byline.textContent='— '+row.name;
 const detail=document.createElement('small');
 const date=new Date(row.expires_at);
 detail.textContent='Dipajang hingga '+date.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
 body.append(text,byline,detail);article.appendChild(body);
 return article;
}
async function refresh(){
 if(!quoteList.isConnected)return;
 try{
  const {rows=[]}=await call('wisdom-list');
  quoteList.replaceChildren();
  if(!rows.length){
   const empty=document.createElement('p');empty.className='eom-wisdom-empty';
   empty.textContent='Belum ada kata bijak terpilih minggu ini. Bagikan pesan positif Anda!';
   quoteList.appendChild(empty);
  }else for(const row of rows)quoteList.appendChild(card(row));
  status.textContent=rows.length+' kata bijak ditampilkan selama 7 hari setelah disetujui Admin.';
 }catch(e){status.textContent='Kata bijak belum dapat dimuat: '+e.message;}
}
async function encodePhoto(file){
 if(!file)throw Error('Lampirkan satu foto yang sesuai dengan kata bijak.');
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Foto harus JPG, PNG atau WebP.');
 if(file.size>8*1024*1024)throw Error('Foto terlalu besar, pilih gambar di bawah 8 MB.');
 if(typeof EOMONLINE==='undefined'||typeof EOMONLINE.image!=='function')throw Error('Pengolah foto belum siap. Muat ulang halaman.');
 const encoded=await EOMONLINE.image(file,850,.7);
 const match=String(encoded||'').match(/^data:image\/(jpeg|png|webp);base64,(.+)$/i);
 if(!match)throw Error('Foto gagal diproses, coba gambar lain.');
 if(match[2].length>950000)throw Error('Foto hasil kompresi masih terlalu besar. Pilih foto lain.');
 return {mime:'image/'+match[1].toLowerCase(),image_base64:match[2]};
}
form.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!window.EOMGuestAccess?.require())return;
 const btn=by('eomWisdomSubmit');btn.disabled=true;
 message.textContent='Mengirim pesan dan foto untuk diperiksa Admin…';
 try{
  const image=await encodePhoto(by('eomWisdomPhoto').files?.[0]);
  const r=await call('wisdom-submit',{
   display_name:by('eomWisdomName').value.trim(),
   quote:by('eomWisdomQuote').value.trim(),
   consent_publish:by('eomWisdomConsent').checked,
   ...image
  });
  message.textContent=r.message||'Berhasil dikirim untuk persetujuan Admin.';
  form.reset();
 }catch(err){message.textContent='Belum berhasil: '+(err.message||err);}
 finally{btn.disabled=false;}
});
document.addEventListener('eom:guest-verified',()=>{
 const data=(()=>{try{return JSON.parse(sessionStorage.getItem('eom_guest_online')||'{}')}catch{return{}}})();
 if(data.name&&!by('eomWisdomName').value)by('eomWisdomName').value=data.name;
});
by('eomWisdomRefresh')?.addEventListener('click',refresh);
refresh();
window.addEventListener('focus',()=>{if(!document.hidden)refresh();});
setInterval(()=>{if(!document.hidden)refresh();},5*60*1000);
})();
