(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const endpoint='https://gubjvfdjgcwbwntyezgs.supabase.co/functions/v1/eom-exam-platform';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function request(action,data={},adminToken=''){
  const info=window.EOMGuestAccess?.current();
  const headers={'Content-Type':'application/json','apikey':SUPABASE_KEY};
  if(adminToken)headers.Authorization='Bearer '+adminToken;
  const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(Object.assign({action},data,info&&!adminToken?{guest_token:info.guest_token}:{}))});
  let result;try{result=await response.json();}catch{throw Error('Server latihan belum dapat dihubungi.');}
  if(!response.ok)throw Error(result.error||'Permintaan gagal.');
  return result;
}
window.EOMExamAPI={request:request};
function css(){
 if($('#eomExamOnlineStyles'))return;
 const s=document.createElement('style');s.id='eomExamOnlineStyles';
 s.textContent='#eomExamDialog .eom-online-progress{height:8px;background:#dedbd2;border-radius:99px;margin:14px 0;overflow:hidden}#eomExamDialog .eom-online-progress i{display:block;height:100%;background:linear-gradient(90deg,#145c72,#c09b4c)}#eomExamDialog .eom-online-answers{display:grid;gap:9px;margin:15px 0}#eomExamDialog .eom-online-answers button{min-height:46px;text-align:left;background:#fff;border:1px solid #ddd5c6;padding:12px;border-radius:12px;font:inherit;color:#263840;cursor:pointer}#eomExamDialog .eom-online-answers button.chosen{background:#def3ec;border-color:#14665e;box-shadow:inset 0 0 0 1px #14665e}#eomExamDialog .eom-online-answers button:focus-visible{outline:3px solid #bd9140}#eomExamDialog .eom-online-actions{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}#eomExamDialog .eom-online-plain{font-size:.88rem;color:#68716f}#eomExamDialog .eom-online-result{padding:17px;background:#eaf5f0;border-radius:14px}#eomRankingEntry{grid-column:span 2;display:flex;align-items:center;gap:16px;text-align:left;min-height:115px;background:linear-gradient(115deg,#f5faf4,#fff4dc)}#eomRankingEntry .entry-icon{margin:0}#eomRankingEntry strong{display:block}#eomRankingDialog{width:min(740px,calc(100% - 20px));max-height:90vh;border:0;border-radius:22px;padding:0;background:#fffcf5;color:#273b44}#eomRankingDialog::backdrop{background:rgba(4,27,36,.65)}.eom-rank-inner{padding:20px;max-height:90vh;overflow:auto}.eom-rank-row{display:grid;grid-template-columns:34px 48px 1fr auto;align-items:center;gap:12px;border-bottom:1px solid #e4e0d6;padding:11px 0}.eom-rank-avatar{width:46px;height:46px;object-fit:cover;border-radius:50%;background:#e6edea;display:grid;place-items:center;font-size:1.4rem}.eom-rank-row small{display:block;color:#68777b}.eom-rank-count{font-weight:850;color:#226b6d}.eom-rank-selects{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.eom-rank-selects select{min-height:43px}.eom-rank-close{float:right;border:0;background:#ede7dc;border-radius:50%;height:40px;width:40px;font-size:1.3rem;cursor:pointer}@media(max-width:500px){#eomRankingEntry{gap:10px;padding:14px}.eom-rank-row{grid-template-columns:26px 38px 1fr auto;gap:8px}.eom-rank-avatar{width:38px;height:38px}.eom-rank-inner{padding:14px}}';
 document.head.appendChild(s);
}
function shell(){
 const d=$('#eomExamDialog');if(!d)return null;
 d.innerHTML='<div class="eom-exam-shell"><div class="eom-exam-head"><div><div class="eom-exam-kicker">ECHO OF MOBON · LATIHAN 40 SOAL</div><h2>Latihan Ulangan &amp; Ujian Sekolah</h2><div class="eom-online-plain">Nilai dan peringkat dihitung otomatis setelah latihan selesai.</div></div><button id="eomExamOnlineClose" class="eom-exam-close" type="button" aria-label="Tutup">×</button></div><div id="eomExamOnlineBody"></div></div>';
 $('#eomExamOnlineClose',d).onclick=()=>d.close();
 if(!d.open){if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}
 return d;
}
const courses={SD:['Matematika','Bahasa Indonesia','IPAS','Pendidikan Pancasila','Bahasa Inggris'],SMP:['Matematika','Bahasa Indonesia','IPA','IPS','Bahasa Inggris','Informatika'],SMA:['Matematika','Bahasa Indonesia','Bahasa Inggris','Biologi','Fisika','Kimia','Ekonomi','Sejarah'],SMK:['Matematika','Bahasa Indonesia','Bahasa Inggris','Informatika','Dasar Kejuruan','Teknik Komputer dan Jaringan (TKJ)','Kewirausahaan','Akuntansi Dasar']};
function openExam(){
 if(!window.EOMGuestAccess?.require())return;
 css();const d=shell();if(!d)return;
 const box=$('#eomExamOnlineBody',d);
 let prefs={level:'SD',grade:1,subject:'Matematika',mode:'ulangan'};
 try{prefs=Object.assign(prefs,JSON.parse(sessionStorage.getItem('eom_exam_prefs_v2')||'{}'));}catch(e){}
 if(!courses[prefs.level])prefs.level='SD';
 box.innerHTML='<form id="eomExamOnlineForm" class="eom-exam-form"><label>Jenjang Sekolah<select id="eomOnlineLevel"></select></label><div class="eom-exam-grid"><label>Kelas<select id="eomOnlineGrade"></select></label><label>Mata Pelajaran<select id="eomOnlineSubject"></select></label></div><label>Jenis Latihan<select id="eomOnlineMode"><option value="ulangan">Latihan Ulangan · 40 Soal</option><option value="ujian">Simulasi Ujian Sekolah · 40 Soal</option></select></label><p class="eom-online-plain">40 soal berbeda untuk tiap paket. Riwayat nilai dan peringkat tersimpan di server berdasarkan identitas Buku Tamu. Jawaban benar dan pembahasan ditampilkan setelah selesai.</p><button class="eom-exam-btn" type="submit">Mulai 40 Soal</button><div id="eomOnlineMessage" role="status"></div></form>';
 const level=$('#eomOnlineLevel',box),grade=$('#eomOnlineGrade',box),subject=$('#eomOnlineSubject',box),mode=$('#eomOnlineMode',box);
 level.innerHTML=Object.keys(courses).map(x=>'<option>'+x+'</option>').join('');level.value=prefs.level;mode.value=prefs.mode==='ujian'?'ujian':'ulangan';
 function update(){
  const start=level.value==='SD'?1:level.value==='SMP'?7:10,end=level.value==='SD'?6:level.value==='SMP'?9:12;
  const prev=Number(grade.value)||Number(prefs.grade);
  grade.innerHTML=Array.from({length:end-start+1},(_,i)=>'<option value="'+(start+i)+'">Kelas '+(start+i)+'</option>').join('');
  grade.value=prev>=start&&prev<=end?String(prev):String(start);
  subject.innerHTML=courses[level.value].map(x=>'<option>'+esc(x)+'</option>').join('');
  if(courses[level.value].includes(prefs.subject))subject.value=prefs.subject;
 }
 level.onchange=()=>{prefs.grade=0;prefs.subject='';update();};update();
 $('#eomExamOnlineForm',box).onsubmit=async e=>{
  e.preventDefault();
  const config={level:level.value,grade:Number(grade.value),subject:subject.value,mode:mode.value};
  sessionStorage.setItem('eom_exam_prefs_v2',JSON.stringify(config));
  const submit=$('#eomExamOnlineForm button[type="submit"]',box),status=$('#eomOnlineMessage',box);submit.disabled=true;status.textContent='Menyiapkan soal berbeda untuk kunjungan ini...';
  try{const data=await request('start',config);sessionStorage.setItem('eom_exam_last_attempt',data.attempt_id);runExam(d,config,data);}catch(err){status.textContent='Gagal memulai: '+err.message;submit.disabled=false;}
 };
}
function runExam(d,config,data){
 const box=$('#eomExamOnlineBody',d),questions=data.questions||[],answers=Array(40).fill(-1);
 if(questions.length!==40){box.textContent='Paket soal belum lengkap. Silakan coba lagi.';return;}
 let n=0;
 function render(){
  const q=questions[n],selected=answers[n];
  box.innerHTML='<p class="eom-online-plain">'+esc(config.level)+' · Kelas '+config.grade+' · '+esc(config.subject)+' · '+(config.mode==='ujian'?'Ujian':'Ulangan')+'</p><div class="eom-online-progress"><i style="width:'+Math.round(n/40*100)+'%"></i></div><b>Soal '+(n+1)+' / 40</b><h3 style="line-height:1.45;margin:15px 0">'+esc(q.q)+'</h3><div class="eom-online-answers">'+q.a.map((a,i)=>'<button type="button" data-choice="'+i+'" class="'+(selected===i?'chosen':'')+'">'+String.fromCharCode(65+i)+'. '+esc(a)+'</button>').join('')+'</div><div class="eom-online-actions"><button id="eomOnlinePass" class="eom-exam-btn secondary" type="button">Pass / Tidak Tahu</button><button id="eomOnlineNext" class="eom-exam-btn" type="button">'+(n===39?'Selesaikan & Nilai':'Soal Selanjutnya →')+'</button></div><p class="eom-online-plain">Jawaban boleh diganti sebelum lanjut. Jika tidak tahu, pilih Pass.</p><p role="status" id="eomExamFeedback"></p>';
  $$('[data-choice]',box).forEach(btn=>btn.onclick=()=>{answers[n]=Number(btn.dataset.choice);$$('[data-choice]',box).forEach(x=>x.classList.toggle('chosen',x===btn));});
  $('#eomOnlinePass',box).onclick=()=>{answers[n]=-1;advance();};
  $('#eomOnlineNext',box).onclick=advance;
 }
 async function advance(){
  if(n<39){n++;render();return;}
  const b=$('#eomOnlineNext',box),p=$('#eomOnlinePass',box);b.disabled=true;p.disabled=true;$('#eomExamFeedback',box).textContent='Mengirim 40 jawaban dan menghitung nilai di server...';
  try{const result=await request('finish',{attempt_id:data.attempt_id,answers});display(result);}
  catch(err){b.disabled=false;p.disabled=false;$('#eomExamFeedback',box).textContent='Gagal menyimpan nilai: '+err.message;}
 }
 function display(result){
  const review=(result.review||[]).filter(x=>!x.correct);
  box.innerHTML='<div class="eom-online-result"><h3>🎓 Nilai Latihan: '+esc(result.score)+'/100</h3><p><b>Benar:</b> '+esc(result.correct)+' dari 40 soal.<br><b>Peringkat sementara jenjang '+esc(config.level)+':</b> #'+esc(result.rank||'-')+'</p><p class="eom-online-plain">Hasil telah disimpan di sistem Echo of Mobon. Admin dapat menyiapkan laporan PDF melalui dashboard.</p></div><details style="margin:16px 0"><summary>Lihat '+review.length+' pembahasan soal belum tepat</summary><ol>'+review.map(x=>'<li style="margin:13px 0"><b>'+esc(x.q)+'</b><br>Jawaban Anda: '+esc(x.selected)+'<br>Jawaban benar: '+esc(x.answer)+'<br><small>'+esc(x.explanation)+'</small></li>').join('')+'</ol></details><div class="eom-online-actions"><button id="eomOnlineAgain" class="eom-exam-btn" type="button">Coba Paket 40 Soal Baru</button><button id="eomOnlineChange" class="eom-exam-btn secondary" type="button">Ganti Pelajaran</button></div>';
  $('#eomOnlineAgain',box).onclick=async()=>{box.innerHTML='<p>Sedang menyusun paket baru...</p>';try{const newData=await request('start',config);runExam(d,config,newData);}catch(e){box.textContent='Gagal: '+e.message;}};
  $('#eomOnlineChange',box).onclick=openExam;
 }
 render();
}
function rankingDialog(){
 if(!window.EOMGuestAccess?.require())return;
 css();let d=$('#eomRankingDialog');
 if(!d){d=document.createElement('dialog');d.id='eomRankingDialog';document.body.appendChild(d);}
 d.innerHTML='<div class="eom-rank-inner"><button type="button" class="eom-rank-close" aria-label="Tutup">×</button><div class="eom-exam-kicker">TRIWULAN · TOP 20</div><h2>🏆 Peringkat Pelajar Echo of Mobon</h2><p class="eom-online-plain">Peringkat berdasarkan nilai terbaik peserta pada triwulan yang dipilih. Setiap jenjang dinilai terpisah. Nama dan foto hanya ditampilkan setelah izin publikasi disetujui.</p><div class="eom-rank-selects"><label>Jenjang<select id="eomRankLevel"><option>SD</option><option>SMP</option><option>SMA</option><option>SMK</option></select></label><label>Periode<select id="eomRankQuarter"></select></label></div><div id="eomRankBoard" aria-live="polite"></div></div>';
 $('.eom-rank-close',d).onclick=()=>d.close();if(!d.open)d.showModal();
 const now=new Date(Date.now()+8*3600000),currentYear=now.getUTCFullYear(),curQ=Math.floor(now.getUTCMonth()/3)+1,options=[];
 for(let i=0;i<5;i++){const idx=currentYear*4+(curQ-1)-i;const year=Math.floor(idx/4),q=idx%4+1;options.push('<option value="'+year+'-'+q+'">Triwulan '+q+' / '+year+(i===0?' (sementara)':'')+'</option>');}
 $('#eomRankQuarter',d).innerHTML=options.join('');
 let level='SD';try{level=JSON.parse(sessionStorage.getItem('eom_exam_prefs_v2')||'{}').level||'SD';}catch(e){}
 $('#eomRankLevel',d).value=level;
 async function render(){
  const view=$('#eomRankBoard',d),parts=$('#eomRankQuarter',d).value.split('-');view.textContent='Memuat 20 besar...';
  try{
   const data=await request('leaderboard',{level:$('#eomRankLevel',d).value,year:Number(parts[0]),quarter:Number(parts[1])});
   if(!data.rows.length){view.innerHTML='<p>Belum ada peserta yang menyelesaikan latihan pada periode ini.</p>';return;}
   view.innerHTML='<p class="eom-online-plain">'+(data.provisional?'⏳ Peringkat sementara—akan ditetapkan setelah triwulan berakhir.':'✅ Peringkat triwulan yang telah berakhir.')+'</p>'+data.rows.map(r=>'<article class="eom-rank-row"><b>'+r.rank+'</b>'+(r.photo?'<img class="eom-rank-avatar" src="'+esc(r.photo)+'" alt="Foto peserta" loading="lazy">':'<span class="eom-rank-avatar" aria-label="Belum ada foto">🎓</span>')+'<div><strong>'+esc(r.name)+'</strong><small>'+esc(r.subject)+' · 40 soal'+(r.anonymized?' · identitas privat':'')+'</small></div><span class="eom-rank-count">'+esc(r.score)+'</span></article>').join('');
  }catch(e){view.textContent='Tidak dapat memuat peringkat: '+e.message;}
 }
 $('#eomRankLevel',d).onchange=render;$('#eomRankQuarter',d).onchange=render;render();
}
function init(){
 css();const btn=$('#eomExamEntry');if(btn)btn.onclick=openExam;
 if(!$('#eomRankingEntry')&&document.querySelector('.entry-strip')){
  const b=document.createElement('button');b.id='eomRankingEntry';b.type='button';b.className='entry-card';b.innerHTML='<span class="entry-icon">🏆</span><span><strong>Top 20 Pelajar · Peringkat Triwulan</strong><small>Lihat nilai terbaik SD, SMP, SMA, dan SMK setiap tiga bulan. Nama dan foto memerlukan izin publikasi.</small></span>';b.onclick=rankingDialog;const card=$('#eomExamEntry');if(card)card.insertAdjacentElement('afterend',b);else $('.entry-strip').appendChild(b);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.EOMSchoolExamOnline={open:openExam,ranking:rankingDialog};
})();