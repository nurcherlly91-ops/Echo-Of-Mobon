(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const endpoint='https://gubjvfdjgcwbwntyezgs.supabase.co/functions/v1/eom-exam-platform';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function mobile(phone){let p=String(phone||'').replace(/\D/g,'');if(p.startsWith('0'))p='62'+p.slice(1);if(p.startsWith('8'))p='62'+p;return /^62\d{8,13}$/.test(p)?p:'';}
async function api(action,params={}){
 const s=await SB.session();if(!s?.access_token)throw Error('Sesi admin berakhir. Silakan masuk kembali.');
 const status=await SB.rpc('admin_session_info',{},s.access_token);
 const info=Array.isArray(status)?status[0]:status;
 if(!info?.allowed)throw Error('Akses khusus admin atau petugas berwenang.');
 const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+s.access_token},body:JSON.stringify(Object.assign({action},params))});
 let out;try{out=await res.json();}catch{throw Error('Server nilai belum merespons.');}
 if(!res.ok)throw Error(out.error||'Permintaan gagal.');return out;
}
function pdfSafe(s){return String(s==null?'':s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[\u2013\u2014]/g,'-').replace(/[\u00D7]/g,'x').replace(/[^\x20-\x7E]/g,' ');}
function wrap(line,max=94){
 const t=pdfSafe(line).trim();if(!t)return[''];let w=t.split(/\s+/),out=[],curr='';
 w.forEach(word=>{if((curr+' '+word).trim().length>max&&curr){out.push(curr);curr=word;}else curr=(curr?curr+' ':'')+word;});if(curr)out.push(curr);return out;
}
function createPDF(doc){
 const attempt=doc.attempt;let lines=[];
 lines.push('ECHO OF MOBON  |  SUARA FAYFIYE');
 lines.push('LAPORAN HASIL LATIHAN ULANGAN / UJIAN SEKOLAH');
 lines.push('--------------------------------------------------------------');
 lines.push('Nama Peserta : '+doc.name);
 lines.push('Jenjang/Kelas: '+attempt.level+' / '+attempt.grade);
 lines.push('Mata Pelajaran: '+attempt.subject);
 lines.push('Jenis Latihan: '+(attempt.mode==='ujian'?'Simulasi Ujian Sekolah':'Latihan Ulangan'));
 lines.push('Tanggal Selesai: '+new Date(attempt.completed_at).toLocaleString('id-ID',{timeZone:'Asia/Makassar'}));
 lines.push('Nilai Akhir: '+attempt.score+' / 100 | Jawaban Benar: '+attempt.correct+' / 40');
 lines.push(' ');
 lines.push('Catatan: Paket latihan mandiri, bukan ujian resmi sekolah.');
 lines.push('RINCIAN JAWABAN:');
 (doc.review||[]).forEach(r=>{lines.push(' ');lines.push(r.n+'. '+r.q);lines.push('Jawaban peserta: '+r.selected);lines.push('Kunci jawaban: '+r.correct);if(r.explanation)lines.push('Pembahasan: '+r.explanation);});
 lines.push(' ');lines.push('Diterbitkan dari dashboard Echo of Mobon - hasil nilai tersimpan di server.');
 const expanded=lines.flatMap(l=>wrap(l,90)),pages=[];for(let i=0;i<expanded.length;i+=51)pages.push(expanded.slice(i,i+51));
 const objects=[];
 objects.push('<< /Type /Catalog /Pages 2 0 R >>');
 objects.push('<< /Type /Pages /Kids ['+pages.map((_,i)=>(5+2*i)+' 0 R').join(' ')+'] /Count '+pages.length+' >>');
 objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 pages.forEach((page,i)=>{
  const content=['BT','/F1 9 Tf','14 TL','42 798 Td'].concat(page.map(l=>'('+l.replace(/[()\\]/g,'\\$&')+') Tj\nT*')).concat(['ET']).join('\n');
  objects.push('<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents '+(4+i*2)+' 0 R >>');
 });
 let output='%PDF-1.4\n',offsets=[0];
 objects.forEach((obj,i)=>{offsets.push(output.length);output+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';});
 const start=output.length;output+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
 for(let i=1;i<offsets.length;i++)output+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 output+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';
 return new Blob([output],{type:'application/pdf'});
}
function downloadPdf(blob,name){
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function styles(){
 if($('#eomAdminExamStyle'))return;const st=document.createElement('style');st.id='eomAdminExamStyle';
 st.textContent='#tab-exam-results h2{margin:0 0 7px}#tab-exam-results .eom-admin-note{padding:12px;background:#eff6f2;border-radius:12px;margin-bottom:14px;font-size:.88rem}#tab-exam-results table{border-collapse:collapse;width:100%;min-width:950px}#tab-exam-results th,#tab-exam-results td{padding:10px;text-align:left;border-bottom:1px solid #e4e6df;vertical-align:middle}#tab-exam-results th{background:#f4f1e9}#tab-exam-results .act{display:flex;gap:5px;flex-wrap:wrap}#tab-exam-results .act button{border:0;background:#195871;color:#fff;border-radius:8px;padding:8px 11px;cursor:pointer;font:inherit;font-size:.78rem}#tab-exam-results .act button.alt{background:#d0a050;color:#2b291e}#tab-exam-results .act button.green{background:#178a5f}#tab-exam-results input[type=file]{max-width:160px}#eomExamAdminStatus{padding:10px;min-height:25px}#tab-exam-results .tag{background:#e9f1ea;border-radius:9px;padding:5px 7px;font-size:.74rem}';
 document.head.appendChild(st);
}
function init(){
 const app=$('#adminApp'),tabs=$('.admin-tabs');if(!app||!tabs||$('#tab-exam-results'))return;
 styles();
 const tab=document.createElement('button');tab.className='tab';tab.type='button';tab.textContent='🎓 Nilai & Top 20';tab.dataset.tab='exam-results';tabs.appendChild(tab);
 const panel=document.createElement('section');panel.className='tab-panel hidden';panel.id='tab-exam-results';
 panel.innerHTML='<div class="panel-head"><div><h2>🎓 Nilai Latihan & Peringkat Triwulan</h2><p class="muted">Data diambil dari penilaian server dan Buku Tamu terverifikasi.</p></div><button id="eomAdminExamRefresh" type="button" class="btn primary">Perbarui Nilai</button></div><div class="eom-admin-note">📄 <b>PDF + WhatsApp</b> mengunduh laporan PDF dan membuka chat peserta melalui satu klik. <b>Admin tetap perlu melampirkan PDF dan menekan Kirim di WhatsApp.</b> 📷 Permintaan foto juga membuka chat yang harus dikirim oleh admin. Publikasi nama/foto pelajar di bawah 18 tahun hanya setelah izin orang tua/wali disimpan.</div><div id="eomExamAdminStatus" role="status"></div><div id="eomExamAdminList" class="table-wrap"></div>';
 app.appendChild(panel);
 tab.addEventListener('click',()=>{$$('.admin-tabs .tab').forEach(x=>x.classList.remove('active'));$$('.tab-panel').forEach(x=>x.classList.add('hidden'));tab.classList.add('active');panel.classList.remove('hidden');refresh();});
 $('#eomAdminExamRefresh',panel).onclick=refresh;
}
async function refresh(){
 const status=$('#eomExamAdminStatus'),body=$('#eomExamAdminList');if(!body)return;
 status.textContent='Memuat laporan peserta...';
 try{
  const result=await api('admin-results'),rows=result.rows||[];
  if(!rows.length){body.innerHTML='<p>Belum ada peserta yang menyelesaikan paket 40 soal.</p>';status.textContent='Belum ada hasil latihan.';return;}
  status.textContent='Menampilkan '+rows.length+' hasil terakhir. Nomor WhatsApp hanya tersedia di dashboard admin.';
  body.innerHTML='<table><thead><tr><th>Nama / Kontak</th><th>Kelas & Mata Pelajaran</th><th>Nilai</th><th>Tanggal</th><th>Laporan / WhatsApp</th><th>Izin & Foto Top 20</th></tr></thead><tbody>'+rows.map(row=>{
   const p=row.participant||{},phone=mobile(p.phone),consent=!!p.guardian_consent&&!!p.public_name_approved;
   return '<tr><td><b>'+esc(p.full_name||'Peserta')+'</b><br><small>'+esc(p.phone||'-')+'</small></td><td>'+esc(row.level)+' Kelas '+esc(row.grade)+'<br>'+esc(row.subject)+'</td><td><b>'+esc(row.score)+'/100</b><br><small>'+esc(row.correct_count)+'/40 benar</small></td><td>'+esc(new Date(row.completed_at).toLocaleDateString('id-ID',{timeZone:'Asia/Makassar'}))+'</td><td><div class="act"><button data-report="'+esc(row.id)+'" type="button" '+(!phone?'disabled':'')+'>📄 PDF + WA</button></div></td><td><div class="act"><button class="alt" data-consent="'+esc(row.participant_id)+'" type="button">'+(consent?'✓ Izin Tercatat':'Catat Izin')+'</button><button class="green" data-photo="'+esc(row.participant_id)+'" type="button" '+(!phone?'disabled':'')+'>📲 Minta Foto WA</button></div><label style="font-size:.72rem">Unggah foto setelah izin:<br><input type="file" data-upload="'+esc(row.participant_id)+'" accept="image/jpeg,image/png,image/webp" '+(!consent?'disabled':'')+'></label>'+(p.public_photo_approved?'<span class="tag">Foto disetujui</span>':'')+'</td></tr>';
  }).join('')+'</tbody></table>';
  $$('[data-report]',body).forEach(el=>el.onclick=()=>sendReport(el.dataset.report));
  $$('[data-photo]',body).forEach(el=>el.onclick=()=>requestPhoto(el.dataset.photo));
  $$('[data-consent]',body).forEach(el=>el.onclick=()=>recordConsent(el.dataset.consent));
  $$('[data-upload]',body).forEach(el=>el.onchange=()=>uploadPhoto(el.dataset.upload,el.files[0]));
 }catch(err){body.textContent='Gagal memuat: '+err.message;status.textContent='Periksa koneksi admin.';}
}
async function sendReport(id){
 const status=$('#eomExamAdminStatus');status.textContent='Menyiapkan PDF hasil latihan ...';
 const newTab=window.open('about:blank','_blank');
 try{
  const result=await api('admin-report',{attempt_id:id}),phone=mobile(result.phone);
  const safeName=String(result.name||'Peserta').replace(/[^\w\d-]+/g,'_').slice(0,40);
  downloadPdf(createPDF(result),'EchoOfMobon_Nilai_'+safeName+'_'+result.attempt.id.slice(0,8)+'.pdf');
  if(phone){
   const msg='Halo, '+result.name+'. Salam dari Admin Echo of Mobon. Hasil latihan '+result.attempt.subject+' kelas '+result.attempt.grade+' telah tersedia. Nilai: '+result.attempt.score+'/100 ('+result.attempt.correct+'/40 benar). Admin akan melampirkan PDF rincian latihan pada chat ini. Terima kasih.';
   const url='https://wa.me/'+phone+'?text='+encodeURIComponent(msg);
   if(newTab)newTab.location.href=url;
   else{status.innerHTML='PDF sudah disiapkan. <a target="_blank" rel="noopener" href="'+esc(url)+'">Buka WhatsApp</a> untuk melampirkan PDF.';return;}
  }else if(newTab)newTab.close();
  status.textContent='PDF diunduh. Chat WhatsApp terbuka. Lampirkan PDF tadi lalu kirim secara manual.';
 }catch(err){newTab?.close();status.textContent='Gagal membuat laporan: '+err.message;}
}
async function requestPhoto(id){
 const status=$('#eomExamAdminStatus');const newTab=window.open('about:blank','_blank');
 try{
  const r=await api('admin-request-photo',{participant_id:id}),phone=mobile(r.phone);
  if(!phone){newTab?.close();throw Error('Nomor WhatsApp peserta tidak valid.');}
  const url='https://wa.me/'+phone+'?text='+encodeURIComponent(r.message);
  if(newTab)newTab.location.href=url;else status.innerHTML='Pesan foto disiapkan. <a target="_blank" rel="noopener" href="'+esc(url)+'">Buka WhatsApp</a>.';
  status.textContent='Pesan permintaan foto dibuka. Admin perlu menekan Kirim di WhatsApp, lalu memastikan izin tertulis peserta/wali.';
 }catch(err){newTab?.close();status.textContent='Gagal menyiapkan permintaan foto: '+err.message;}
}
async function recordConsent(id){
 const status=$('#eomExamAdminStatus');
 const approved=window.confirm('Apakah Anda SUDAH menerima dan menyimpan persetujuan eksplisit dari peserta dewasa atau orang tua/wali untuk menampilkan nama dan foto di peringkat publik? Tekan OK hanya jika bukti izin telah diterima.');
 if(!approved)return;
 try{await api('admin-consent',{participant_id:id,guardian_consent:true,public_name_approved:true,public_photo_approved:false});status.textContent='Izin publikasi dicatat. Silakan unggah foto yang sudah dikirim peserta/wali.';refresh();}
 catch(err){status.textContent='Gagal mencatat persetujuan: '+err.message;}
}
async function uploadPhoto(id,file){
 const status=$('#eomExamAdminStatus');if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1048576){status.textContent='Gunakan foto JPG/PNG/WebP di bawah 1 MB.';return;}
 const reader=new FileReader();reader.onload=async()=>{
  const data=String(reader.result||'').split(',')[1];
  try{status.textContent='Mengunggah foto dengan izin publikasi...';await api('admin-photo-upload',{participant_id:id,mime:file.type,data});status.textContent='Foto sudah tersedia untuk peringkat Top 20 setelah masuk posisi terbaik.';refresh();}
  catch(err){status.textContent='Gagal mengunggah foto: '+err.message;}
 };reader.readAsDataURL(file);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();