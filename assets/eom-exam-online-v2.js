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
s.textContent+='\n#eomExamDialog .eom-exam-countdown{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:9px 0;font-size:1rem}#eomExamDialog .eom-exam-clock{background:#fff0d6;border:1px solid #e6c28b;border-radius:12px;padding:7px 10px;color:#8f5219}#eomExamDialog .eom-online-time-track{height:8px;border-radius:20px;background:#eee2ca;overflow:hidden;margin-bottom:12px}#eomExamDialog .eom-online-time-track i{display:block;height:100%;background:#168774;transition:width .2s linear}#eomExamDialog .eom-online-subject{font-size:.9rem;background:#e7f4ed;border-radius:10px;color:#2c6557;padding:9px 11px;font-weight:800}#eomExamDialog .eom-online-question{line-height:1.45;margin:15px 0}#eomExamDialog .eom-online-mixed-banner{border-radius:12px;background:#e8f6ed;padding:11px 12px;color:#276252;font-weight:700}';
 document.head.appendChild(s);
}
function shell(){
 let d=$('#eomExamDialog');
 if(!d){d=document.createElement('dialog');d.id='eomExamDialog';document.body.appendChild(d);}
 d.innerHTML='<div class="eom-exam-shell"><div class="eom-exam-head"><div><div class="eom-exam-kicker">ECHO OF MOBON · LATIHAN 60 SOAL</div><h2>Latihan Ulangan &amp; Ujian Sekolah</h2><div class="eom-online-plain">Nilai dan peringkat dihitung otomatis setelah latihan selesai.</div></div><button id="eomExamOnlineClose" class="eom-exam-close" type="button" aria-label="Tutup">×</button></div><div id="eomExamOnlineBody"></div></div>';
 $('#eomExamOnlineClose',d).onclick=()=>d.close();
 if(!d.open){if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}
 return d;
}
const courses={SD:['Matematika','Bahasa Indonesia','IPAS','Pendidikan Pancasila','Bahasa Inggris'],SMP:['Matematika','Bahasa Indonesia','IPA','IPS','Bahasa Inggris','Informatika'],SMA:['Matematika','Bahasa Indonesia','Bahasa Inggris','Biologi','Fisika','Kimia','Ekonomi','Sejarah'],SMK:['Matematika','Bahasa Indonesia','Bahasa Inggris','Informatika','Dasar Kejuruan','Teknik Komputer dan Jaringan (TKJ)','Kewirausahaan','Akuntansi Dasar']};
function openExam(){
 if(!window.EOMGuestAccess?.require())return;
 css();const d=shell();if(!d)return;
 const box=$('#eomExamOnlineBody',d);
 let prefs={level:'SD',grade:1,subject:'Semua Mata Pelajaran',mode:'ulangan'};
 try{prefs=Object.assign(prefs,JSON.parse(sessionStorage.getItem('eom_exam_prefs_v2')||'{}'));}catch(e){}
 if(!courses[prefs.level])prefs.level='SD';
 box.innerHTML='<form id="eomExamOnlineForm" class="eom-exam-form"><label>Jenjang Sekolah<select id="eomOnlineLevel"></select></label><div class="eom-exam-grid"><label>Kelas<select id="eomOnlineGrade"></select></label><div class="eom-online-mixed-banner">📘 Semua mata pelajaran sesuai kelas otomatis digabung dalam satu paket.</div></div><label>Jenis Latihan<select id="eomOnlineMode"><option value="ulangan">Latihan Ulangan · 60 Soal</option><option value="ujian">Simulasi Ujian Sekolah · 60 Soal</option></select></label><p class="eom-online-plain">60 soal campuran seluruh pelajaran kelas terpilih · waktu 20 detik per soal (20 menit jika semua waktu dipakai). Nilai, riwayat dan Top 20 triwulan tetap dihitung di server berdasarkan identitas Buku Tamu.</p><button class="eom-exam-btn" type="submit">Mulai 60 Soal</button><div id="eomOnlineMessage" role="status"></div></form>';
 const level=$('#eomOnlineLevel',box),grade=$('#eomOnlineGrade',box),mode=$('#eomOnlineMode',box);
 level.innerHTML=Object.keys(courses).map(x=>'<option>'+x+'</option>').join('');level.value=prefs.level;mode.value=prefs.mode==='ujian'?'ujian':'ulangan';
 function update(){
  const start=level.value==='SD'?1:level.value==='SMP'?7:10,end=level.value==='SD'?6:level.value==='SMP'?9:12;
  const prev=Number(grade.value)||Number(prefs.grade);
  grade.innerHTML=Array.from({length:end-start+1},(_,i)=>'<option value="'+(start+i)+'">Kelas '+(start+i)+'</option>').join('');
  grade.value=prev>=start&&prev<=end?String(prev):String(start);
 }
 level.onchange=()=>{prefs.grade=0;update();};update();
 $('#eomExamOnlineForm',box).onsubmit=async e=>{
  e.preventDefault();
  const config={level:level.value,grade:Number(grade.value),subject:'Semua Mata Pelajaran',mode:mode.value};
  try{sessionStorage.setItem('eom_exam_prefs_v2',JSON.stringify(config));}catch(_){}
  const submit=$('#eomExamOnlineForm button[type="submit"]',box),status=$('#eomOnlineMessage',box);submit.disabled=true;status.textContent='Menyiapkan soal berbeda untuk kunjungan ini...';
  try{const data=await request('start',config);try{sessionStorage.setItem('eom_exam_last_attempt',data.attempt_id);}catch(_){}runExam(d,config,data);}catch(err){status.textContent='Gagal memulai: '+err.message;submit.disabled=false;}
 };
}
function runExam(d,config,data){
 const box=$('#eomExamOnlineBody',d),questions=data.questions||[],total=60,seconds=20;
 const answers=Array(total).fill(-1);
 if(questions.length!==total){
  box.textContent='Paket 60 soal campuran belum lengkap. Silakan coba kembali.';return;
 }
 let n=0,timer=null,deadline=0,submitting=false;
 const clearTimer=()=>{if(timer){clearInterval(timer);timer=null;}};
 d.addEventListener('close',clearTimer,{once:true});
 function progress(){
  const secondsLeft=Math.max(0,Math.ceil((deadline-Date.now())/1000));
  const display=$('#eomOnlineSeconds',box),bar=$('#eomOnlineTimeBar',box);
  if(display)display.textContent=secondsLeft+' detik';
  if(bar)bar.style.width=String(secondsLeft/seconds*100)+'%';
  if(!secondsLeft&&!submitting&&timer){clearTimer();answers[n]=-1;advance(true);}
 }
 function render(){
  clearTimer();
  if(!d.open)return;
  const q=questions[n],selected=answers[n];
  const header='<p class="eom-online-plain">'+esc(config.level)+' · Kelas '+config.grade+
   ' · Semua Mata Pelajaran · '+(config.mode==='ujian'?'Ujian Sekolah':'Ulangan')+'</p>';
  box.innerHTML=header+
   '<div class="eom-online-progress"><i style="width:'+Math.round(n/total*100)+'%"></i></div>'+
   '<div class="eom-exam-countdown"><b>Soal '+(n+1)+' / '+total+'</b>'+
   '<span class="eom-exam-clock">⏱️ <strong id="eomOnlineSeconds">'+seconds+' detik</strong></span></div>'+
   '<div class="eom-online-time-track"><i id="eomOnlineTimeBar" style="width:100%"></i></div>'+
   '<div class="eom-online-subject">📗 '+esc(q.subject||'Pelajaran kelas '+config.grade)+'</div>'+
   '<h3 class="eom-online-question">'+esc(q.q)+'</h3>'+
   '<div class="eom-online-answers">'+q.a.map((a,i)=>
     '<button type="button" data-choice="'+i+'" class="'+(selected===i?'chosen':'')+'">'+
     String.fromCharCode(65+i)+'. '+esc(a)+'</button>').join('')+'</div>'+
   '<div class="eom-online-actions"><button id="eomOnlinePass" class="eom-exam-btn secondary" type="button">Lewati</button>'+
   '<button id="eomOnlineNext" class="eom-exam-btn" type="button">'+
   (n===total-1?'Selesaikan & Nilai':'Soal Berikutnya →')+'</button></div>'+
   '<p class="eom-online-plain">Pilih jawaban sebelum 20 detik habis. Jika waktu habis, soal otomatis dilewati.</p>'+
   '<p role="status" id="eomExamFeedback"></p>';
  $$('[data-choice]',box).forEach(btn=>btn.onclick=()=>{
   answers[n]=Number(btn.dataset.choice);
   $$('[data-choice]',box).forEach(x=>x.classList.toggle('chosen',x===btn));
  });
  $('#eomOnlinePass',box).onclick=()=>{answers[n]=-1;advance(false);};
  $('#eomOnlineNext',box).onclick=()=>advance(false);
  deadline=Date.now()+seconds*1000;
  timer=setInterval(progress,250);
 }
 async function advance(expired=false){
  clearTimer();
  if(submitting)return;
  if(n<total-1){
   n++;
   render();
   return;
  }
  submitting=true;
  const b=$('#eomOnlineNext',box),p=$('#eomOnlinePass',box);
  if(b)b.disabled=true;if(p)p.disabled=true;
  const info=$('#eomExamFeedback',box);
  if(info)info.textContent='Mengirim 60 jawaban dan menghitung nilai di server…';
  try{
   const result=await request('finish',{attempt_id:data.attempt_id,answers});
   display(result);
  }catch(err){
   submitting=false;
   if(b)b.disabled=false;if(p)p.disabled=false;
   if(info)info.textContent='Gagal menyimpan nilai: '+err.message+
    '. Periksa koneksi lalu tekan Selesaikan & Nilai kembali.';
  }
 }
 function display(result){
  clearTimer();
  const review=(result.review||[]).filter(x=>!x.correct);
  box.innerHTML='<div class="eom-online-result"><h3>🎓 Nilai Latihan: '+esc(result.score)+'/100</h3>'+
   '<p><b>Benar:</b> '+esc(result.correct)+' dari '+total+' soal.<br>'+
   '<b>Peringkat sementara jenjang '+esc(config.level)+':</b> #'+esc(result.rank||'-')+'</p>'+
   '<p class="eom-online-plain">Hasil tersimpan pada Echo of Mobon. Top 20 triwulan tetap dihitung otomatis.</p></div>'+
   '<details style="margin:16px 0"><summary>Lihat '+review.length+' pembahasan soal belum tepat</summary><ol>'+
   review.map(x=>'<li style="margin:13px 0"><b>'+esc(x.q)+'</b><br>Jawaban Anda: '+
     esc(x.selected)+'<br>Jawaban benar: '+esc(x.answer)+'<br><small>'+esc(x.explanation)+'</small></li>').join('')+
   '</ol></details><div class="eom-online-actions">'+
   '<button id="eomOnlineAgain" class="eom-exam-btn" type="button">Coba Paket 60 Soal Baru</button>'+
   '<button id="eomOnlineChange" class="eom-exam-btn secondary" type="button">Ganti Kelas</button></div>';
  $('#eomOnlineAgain',box).onclick=async()=>{
   box.innerHTML='<p>Sedang menyusun 60 soal campuran baru...</p>';
   try{const newData=await request('start',config);runExam(d,config,newData);}
   catch(e){box.textContent='Gagal: '+e.message;}
  };
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
   view.innerHTML='<p class="eom-online-plain">'+(data.provisional?'⏳ Peringkat sementara—akan ditetapkan setelah triwulan berakhir.':'✅ Peringkat triwulan yang telah berakhir.')+'</p>'+data.rows.map(r=>'<article class="eom-rank-row"><b>'+r.rank+'</b>'+(r.photo?'<img class="eom-rank-avatar" src="'+esc(r.photo)+'" alt="Foto peserta" loading="lazy">':'<span class="eom-rank-avatar" aria-label="Belum ada foto">🎓</span>')+'<div><strong>'+esc(r.name)+'</strong><small>'+esc(r.subject)+' · 60 soal'+(r.anonymized?' · identitas privat':'')+'</small></div><span class="eom-rank-count">'+esc(r.score)+'</span></article>').join('');
  }catch(e){view.textContent='Tidak dapat memuat peringkat: '+e.message;}
 }
 $('#eomRankLevel',d).onchange=render;$('#eomRankQuarter',d).onchange=render;render();
}
function init(){
 css();let btn=$('#eomExamEntry');
 if(!btn){const strip=$('.entry-strip');if(strip){btn=document.createElement('button');btn.id='eomExamEntry';btn.type='button';btn.className='entry-card';btn.innerHTML='<span class="entry-icon">📝</span><span><strong>Latihan Ulangan &amp; Ujian Sekolah</strong><small>60 soal campuran setiap paket untuk SD, SMP, SMA, dan SMK. Nilai dan peringkat otomatis.</small></span>';const game=$('#eomGameEntry',strip);if(game)game.insertAdjacentElement('afterend',btn);else strip.appendChild(btn);}}
 if(btn){btn.onclick=openExam;const sub=btn.querySelector('small');if(sub)sub.textContent='60 soal campuran per paket · SD, SMP, SMA, SMK · nilai otomatis.';}
 if(!$('#eomRankingEntry')&&document.querySelector('.entry-strip')){
  const b=document.createElement('button');b.id='eomRankingEntry';b.type='button';b.className='entry-card';b.innerHTML='<span class="entry-icon">🏆</span><span><strong>Top 20 Pelajar · Peringkat Triwulan</strong><small>Lihat nilai terbaik SD, SMP, SMA, dan SMK setiap tiga bulan. Nama dan foto memerlukan izin publikasi.</small></span>';b.onclick=rankingDialog;const card=$('#eomExamEntry');if(card)card.insertAdjacentElement('afterend',b);else $('.entry-strip').appendChild(b);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.EOMSchoolExamOnline={open:openExam,ranking:rankingDialog};
})();