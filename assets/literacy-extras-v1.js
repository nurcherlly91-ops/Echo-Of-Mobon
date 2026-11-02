(function(){
'use strict';
const facts=[
  'Tahukah kamu? Membaca beberapa menit setiap hari membantu kita membangun kebiasaan belajar yang lebih konsisten.',
  'Tahukah kamu? Gurita memiliki tiga jantung dan darah berwarna kebiruan.',
  'Tahukah kamu? Cahaya Matahari memerlukan sekitar delapan menit untuk mencapai Bumi.',
  'Tahukah kamu? Hutan mangrove membantu melindungi pesisir dari gelombang sekaligus menjadi habitat berbagai makhluk hidup.',
  'Tahukah kamu? Peta menggunakan simbol agar banyak informasi dapat ditampilkan dalam ruang yang kecil.',
  'Tahukah kamu? Kata baru lebih mudah diingat ketika kita menggunakannya dalam kalimat buatan sendiri.',
  'Tahukah kamu? Membaca nyaring dapat membantu anak mengenali bunyi huruf, irama bahasa, dan kosakata.'
];
let factIndex=Math.floor(Date.now()/86400000)%facts.length;
function $(s,r=document){return r.querySelector(s)}
function showFact(){const e=$('#eomDidYouKnow');if(e)e.textContent=facts[factIndex%facts.length];}
function nextFact(){factIndex=(factIndex+1)%facts.length;showFact();}
function dialog(){let d=$('#eomVoiceDialog');if(d)return d;d=document.createElement('dialog');d.id='eomVoiceDialog';d.className='eom-mini-dialog';d.innerHTML='<div class="eom-mini-dialog-inner"><button class="eom-dialog-close" type="button" aria-label="Tutup">×</button><h2>Suara Oma & Opa</h2><p>Rekam cerita keluarga, dongeng, nasihat, atau ingatan tentang kampung. Rekaman ini hanya diproses di perangkat Anda dan tidak diunggah otomatis.</p><div class="eom-dialog-result" id="voiceStatus">Tekan “Mulai Rekam” saat siap.</div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"><button id="voiceStart" class="eom-mini-btn" type="button">🎙️ Mulai Rekam</button><button id="voiceStop" class="eom-mini-btn alt" type="button" disabled>■ Berhenti</button></div><audio id="voicePlayback" controls style="width:100%;margin-top:14px;display:none"></audio><p style="font-size:.8rem;color:#68757d;line-height:1.45">Untuk menjadi arsip publik Echo of Mobon, rekaman tetap perlu persetujuan dan moderasi pengelola.</p></div>';document.body.appendChild(d);$('.eom-dialog-close',d).onclick=()=>{if(d.open)d.close()};return d;}
let recorder=null,stream=null,chunks=[];
async function startRecording(){const d=dialog(),st=$('#voiceStatus',d),start=$('#voiceStart',d),stop=$('#voiceStop',d),audio=$('#voicePlayback',d);if(!navigator.mediaDevices||!window.MediaRecorder){st.textContent='Browser ini belum mendukung perekaman suara.';return;}try{stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});audio.src=URL.createObjectURL(blob);audio.style.display='block';st.textContent='Rekaman selesai. Silakan dengarkan kembali sebelum digunakan.';start.disabled=false;stop.disabled=true;stream&&stream.getTracks().forEach(t=>t.stop());stream=null};recorder.start();st.textContent='Sedang merekam… ceritakan perlahan dan jelas.';start.disabled=true;stop.disabled=false;}catch(e){st.textContent='Mikrofon belum diizinkan. Izinkan akses mikrofon pada browser lalu coba lagi.';}}
function openVoice(){const d=dialog();if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');$('#voiceStart',d).onclick=startRecording;$('#voiceStop',d).onclick=()=>{if(recorder&&recorder.state!=='inactive')recorder.stop()};}
function init(){showFact();document.querySelectorAll('[data-extra="fact"]').forEach(b=>b.onclick=nextFact);document.querySelectorAll('[data-extra="voices"]').forEach(b=>b.onclick=openVoice);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
