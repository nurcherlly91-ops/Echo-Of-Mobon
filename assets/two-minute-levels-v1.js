(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const STATE_KEY='eom_literacy_v1';
const REWARD_KEY='eom_micro_rewards_v2';
const LEVEL_KEY='eom_two_minute_level_v1';
const levels={
  tk:{label:'TK',icon:'🧸',desc:'Huruf, angka, warna, bentuk, bunyi, dan kosakata sangat sederhana.'},
  sd:{label:'SD',icon:'📘',desc:'Berhitung, membaca, Bahasa Indonesia, Bahasa Inggris, IPA, dan IPS dasar.'},
  smp:{label:'SMP',icon:'🎒',desc:'Konsep dasar Matematika, IPA, IPS, Bahasa, dan logika.'},
  sma:{label:'SMA',icon:'🎓',desc:'Aljabar, sains, sosial, bahasa, dan penalaran tingkat menengah.'},
  mahasiswa:{label:'Mahasiswa',icon:'🏛️',desc:'Literasi akademik, statistik dasar, logika, riset, dan analisis.'},
  umum:{label:'Umum',icon:'🌍',desc:'Numerasi, literasi, pengetahuan sehari-hari, dan pemecahan masalah praktis.'}
};
const bank={
  tk:[
    {s:'Mengenal Huruf',q:'Huruf pertama dari kata “Buku” adalah ...',a:['B','K','U'],c:0,e:'Buku dimulai dengan huruf B.'},
    {s:'Berhitung',q:'Ada 2 apel, lalu ditambah 1 apel. Jadi ada ... apel.',a:['2','3','4'],c:1,e:'2 + 1 = 3.'},
    {s:'Warna',q:'Warna daun yang sehat biasanya ...',a:['Hijau','Hitam','Ungu'],c:0,e:'Daun sehat umumnya tampak hijau karena klorofil.'},
    {s:'Bentuk',q:'Bentuk roda adalah ...',a:['Lingkaran','Segitiga','Persegi'],c:0,e:'Roda berbentuk lingkaran.'},
    {s:'Mengeja',q:'Kata “Mata” dapat dibaca menjadi ...',a:['Ma-ta','Mat-a','M-at-a'],c:0,e:'Mata dapat dipecah menjadi suku kata ma-ta.'}
  ],
  sd:[
    {s:'Matematika',q:'24 + 18 = ...',a:['40','42','44'],c:1,e:'24 + 18 = 42.'},
    {s:'Bahasa Indonesia',q:'Lawan kata “tinggi” adalah ...',a:['Rendah','Jauh','Cepat'],c:0,e:'Antonim tinggi adalah rendah.'},
    {s:'Bahasa Inggris',q:'Arti “school” adalah ...',a:['Rumah','Sekolah','Buku'],c:1,e:'School berarti sekolah.'},
    {s:'IPA',q:'Tumbuhan membuat makanan melalui proses ...',a:['Fotosintesis','Erosi','Rotasi'],c:0,e:'Tumbuhan membuat makanan melalui fotosintesis.'},
    {s:'IPS',q:'Kegiatan membuat barang disebut ...',a:['Produksi','Distribusi','Konsumsi'],c:0,e:'Produksi adalah kegiatan menghasilkan barang atau jasa.'}
  ],
  smp:[
    {s:'Matematika',q:'Jika 3x = 21, nilai x adalah ...',a:['6','7','8'],c:1,e:'3x = 21, jadi x = 21 ÷ 3 = 7.'},
    {s:'IPA',q:'Perubahan wujud dari cair menjadi gas disebut ...',a:['Menguap','Membeku','Mengembun'],c:0,e:'Cair menjadi gas disebut menguap.'},
    {s:'IPS',q:'Interaksi antara penjual dan pembeli termasuk kegiatan ...',a:['Ekonomi','Fotosintesis','Geologi'],c:0,e:'Jual beli merupakan bagian dari kegiatan ekonomi.'},
    {s:'Bahasa Indonesia',q:'Kalimat utama biasanya berisi ...',a:['Gagasan pokok','Nama penulis saja','Tanda baca saja'],c:0,e:'Kalimat utama memuat gagasan pokok paragraf.'},
    {s:'Informatika',q:'Urutan langkah logis untuk menyelesaikan masalah disebut ...',a:['Algoritma','Monitor','Folder'],c:0,e:'Algoritma adalah urutan langkah untuk menyelesaikan masalah.'}
  ],
  sma:[
    {s:'Matematika',q:'Jika f(x)=2x+3, maka f(4)= ...',a:['8','11','14'],c:1,e:'f(4)=2(4)+3=11.'},
    {s:'Biologi',q:'Organel yang dikenal sebagai tempat utama respirasi sel adalah ...',a:['Mitokondria','Ribosom','Lisosom'],c:0,e:'Mitokondria menghasilkan sebagian besar ATP melalui respirasi sel.'},
    {s:'Ekonomi',q:'Kenaikan harga barang dan jasa secara umum dan terus-menerus disebut ...',a:['Inflasi','Distribusi','Subsidi'],c:0,e:'Inflasi adalah kenaikan tingkat harga secara umum dan berkelanjutan.'},
    {s:'Geografi',q:'Garis lintang 0° disebut ...',a:['Khatulistiwa','Meridian utama','Garis balik'],c:0,e:'Garis lintang 0° adalah Khatulistiwa.'},
    {s:'Bahasa Inggris',q:'Choose the correct form: “She ___ to school every day.”',a:['go','goes','going'],c:1,e:'Untuk subjek she dalam simple present, kata kerja menjadi goes.'}
  ],
  mahasiswa:[
    {s:'Statistik',q:'Ukuran pemusatan yang paling sensitif terhadap pencilan adalah ...',a:['Mean','Median','Modus'],c:0,e:'Mean menggunakan seluruh nilai sehingga paling terpengaruh oleh pencilan.'},
    {s:'Metodologi',q:'Variabel yang sengaja diubah peneliti dalam eksperimen disebut ...',a:['Variabel independen','Variabel dependen','Variabel kontrol'],c:0,e:'Variabel independen adalah variabel yang dimanipulasi atau menjadi prediktor utama.'},
    {s:'Literasi Akademik',q:'Parafrasa yang baik harus ...',a:['Mengubah kata tanpa memahami makna','Menjaga makna dengan susunan sendiri dan tetap mencantumkan sumber','Menyalin seluruh kalimat'],c:1,e:'Parafrasa mempertahankan makna dengan bahasa sendiri dan tetap memberi atribusi sumber.'},
    {s:'Logika',q:'Jika semua A adalah B dan semua B adalah C, maka ...',a:['Semua A adalah C','Semua C adalah A','Tidak ada hubungan'],c:0,e:'Secara transitif, jika A⊆B dan B⊆C, maka A⊆C.'},
    {s:'Ekonomi',q:'Biaya peluang adalah ...',a:['Nilai alternatif terbaik yang dikorbankan','Harga barang setelah diskon','Jumlah seluruh biaya tetap'],c:0,e:'Biaya peluang adalah nilai dari alternatif terbaik yang dilepas ketika memilih opsi lain.'}
  ],
  umum:[
    {s:'Numerasi',q:'Harga barang Rp80.000 mendapat diskon 25%. Harga setelah diskon adalah ...',a:['Rp60.000','Rp65.000','Rp70.000'],c:0,e:'25% dari Rp80.000 = Rp20.000, jadi harganya Rp60.000.'},
    {s:'Literasi Digital',q:'Tindakan paling aman saat menerima tautan mencurigakan adalah ...',a:['Langsung klik','Periksa sumber dan jangan masukkan data pribadi','Teruskan ke semua kontak'],c:1,e:'Periksa sumber terlebih dahulu dan jangan memberikan data pribadi pada tautan yang meragukan.'},
    {s:'Keseharian',q:'Jika ingin membandingkan dua harga dengan ukuran kemasan berbeda, yang paling adil adalah melihat ...',a:['Harga per satuan','Warna kemasan','Ukuran tulisan'],c:0,e:'Harga per satuan membantu membandingkan nilai secara adil.'},
    {s:'Bahasa',q:'Informasi yang dapat dipercaya sebaiknya ...',a:['Memiliki sumber yang dapat diperiksa','Selalu berasal dari pesan berantai','Tidak perlu tanggal'],c:0,e:'Sumber yang jelas dan dapat diperiksa membantu menilai keandalan informasi.'},
    {s:'Lingkungan',q:'Salah satu cara sederhana mengurangi sampah plastik adalah ...',a:['Membawa botol minum pakai ulang','Membakar semua plastik','Membuang ke sungai'],c:0,e:'Menggunakan kembali wadah dan botol membantu mengurangi sampah sekali pakai.'}
  ]
};
function dayId(){const d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);}
function award(n,token){let rewards={};try{rewards=JSON.parse(localStorage.getItem(REWARD_KEY)||'{}')}catch(e){}const k=String(dayId())+':'+token;if(rewards[k])return false;rewards[k]=true;try{localStorage.setItem(REWARD_KEY,JSON.stringify(rewards));const s=Object.assign({points:0,missions:{}},JSON.parse(localStorage.getItem(STATE_KEY)||'{}'));s.points=(Number(s.points)||0)+n;localStorage.setItem(STATE_KEY,JSON.stringify(s));const p=$('#eomPoints');if(p)p.textContent=String(s.points);}catch(e){}return true;}
function ensureStyle(){if($('#eomTwoMinuteStyle'))return;const st=document.createElement('style');st.id='eomTwoMinuteStyle';st.textContent=`
#eomTwoMinuteDialog{border:0;border-radius:24px;padding:0;width:min(680px,calc(100% - 24px));box-shadow:0 28px 80px rgba(0,0,0,.3)}#eomTwoMinuteDialog::backdrop{background:rgba(7,24,32,.72);backdrop-filter:blur(4px)}.eom2m{padding:22px;background:#fff;color:#243842;position:relative}.eom2m h2{font-family:Georgia,serif;color:#173f52;margin:4px 42px 6px 0}.eom2m p{color:#69777e;line-height:1.5}.eom2m-close{position:absolute;right:14px;top:14px;width:34px;height:34px;border:0;border-radius:50%;background:#edf2f3;font-size:1.15rem;cursor:pointer}.eom2m-levels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:16px 0}.eom2m-level{border:1px solid #dce4e4;background:#f9fbfb;border-radius:14px;padding:12px;text-align:left;cursor:pointer}.eom2m-level strong{display:block;color:#173f52;margin-bottom:3px}.eom2m-level small{display:block;color:#6d7a80;line-height:1.35}.eom2m-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.eom2m-timer{font-weight:800;color:#8a651e;background:#fff6df;border:1px solid #ead8a5;border-radius:999px;padding:7px 11px}.eom2m-progress{font-size:.8rem;color:#69777e}.eom2m-q{font-size:1.06rem;line-height:1.5;margin:10px 0 14px;color:#173f52}.eom2m-answers{display:grid;gap:9px}.eom2m-answers button{border:1px solid #dbe2e2;background:#f8fbfb;border-radius:12px;padding:11px 12px;text-align:left;font:inherit;cursor:pointer}.eom2m-answers button:hover{border-color:#b99548;background:#fffaf0}.eom2m-result{margin-top:13px;padding:12px;border-radius:12px;background:#f5f1e6;line-height:1.5}.eom2m-next{margin-top:10px;border:0;border-radius:11px;background:#174d68;color:white;padding:9px 13px;font-weight:800;cursor:pointer}.eom2m-score{font-size:2rem;font-weight:900;color:#174d68}.eom2m-again{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.eom2m-again button{border:0;border-radius:11px;padding:9px 12px;font:inherit;font-weight:800;cursor:pointer}.eom2m-primary{background:#174d68;color:#fff}.eom2m-alt{background:#f2ead6;color:#6f5321}@media(max-width:620px){.eom2m-levels{grid-template-columns:1fr 1fr}.eom2m{padding:18px}.eom2m-level small{font-size:.76rem}}
`;document.head.appendChild(st);}
function dialog(){let d=$('#eomTwoMinuteDialog');if(!d){d=document.createElement('dialog');d.id='eomTwoMinuteDialog';document.body.appendChild(d);}return d;}
function openLevelPicker(){ensureStyle();const d=dialog();d.innerHTML=`<div class="eom2m"><button class="eom2m-close" type="button" aria-label="Tutup">×</button><div style="font-size:.75rem;font-weight:800;letter-spacing:.08em;color:#9b7429">KEJUTAN HARI INI · LATIHAN 2 MENIT</div><h2>Pilih Jenjang Belajar</h2><p>Setiap jenjang memiliki soal berbeda. Setelah memilih, kamu punya <b>120 detik</b> untuk menyelesaikan 3 soal.</p><div class="eom2m-levels">${Object.entries(levels).map(([k,v])=>`<button class="eom2m-level" type="button" data-2m-level="${k}"><strong>${v.icon} ${v.label}</strong><small>${v.desc}</small></button>`).join('')}</div></div>`;$('.eom2m-close',d).onclick=()=>d.close();$$('[data-2m-level]',d).forEach(b=>b.onclick=()=>{localStorage.setItem(LEVEL_KEY,b.dataset['2mLevel']);startSession(b.dataset['2mLevel']);});if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}
function pickQuestions(level){const src=[...(bank[level]||bank.umum)];const seed=Date.now()+dayId();for(let i=src.length-1;i>0;i--){const j=(seed+i*17)% (i+1);[src[i],src[j]]=[src[j],src[i]];}return src.slice(0,3);}
function startSession(level){const d=dialog(),questions=pickQuestions(level);let i=0,score=0,remaining=120,locked=false,timer=null;function finish(timeout=false){clearInterval(timer);const won=award(score>=2?4:score,`two-minute-${level}`);d.innerHTML=`<div class="eom2m"><button class="eom2m-close" type="button">×</button><div style="font-size:.75rem;font-weight:800;letter-spacing:.08em;color:#9b7429">${levels[level].icon} ${levels[level].label}</div><h2>${timeout?'Waktu Selesai':'Latihan Selesai'}</h2><div class="eom2m-score">${score}/3</div><p>${score===3?'Luar biasa! Semua jawaban benar.':score===2?'Bagus! Pemahamanmu sudah kuat.':'Terus latihan. Membaca penjelasan setelah menjawab akan membantu.'}</p><div class="eom2m-result">${won?`🌟 Kamu mendapat +${score>=2?4:score} poin Jejak Mobon.`:'Latihan berpoin untuk jenjang ini sudah pernah kamu selesaikan hari ini, tetapi kamu tetap boleh berlatih lagi.'}</div><div class="eom2m-again"><button class="eom2m-primary" id="eom2mAgain" type="button">Ulangi jenjang ini</button><button class="eom2m-alt" id="eom2mLevels" type="button">Pilih jenjang lain</button></div></div>`;$('.eom2m-close',d).onclick=()=>d.close();$('#eom2mAgain',d).onclick=()=>startSession(level);$('#eom2mLevels',d).onclick=openLevelPicker;}
function draw(){if(i>=questions.length)return finish(false);const q=questions[i];locked=false;d.innerHTML=`<div class="eom2m"><button class="eom2m-close" type="button">×</button><div class="eom2m-top"><div><strong>${levels[level].icon} ${levels[level].label}</strong><div class="eom2m-progress">Soal ${i+1} dari 3 · ${q.s}</div></div><div class="eom2m-timer">⏱️ <span id="eom2mTimer">${remaining}</span> dtk</div></div><div class="eom2m-q"><b>${q.q}</b></div><div class="eom2m-answers">${q.a.map((x,n)=>`<button type="button" data-2m-a="${n}">${x}</button>`).join('')}</div><div id="eom2mResult"></div></div>`;$('.eom2m-close',d).onclick=()=>{clearInterval(timer);d.close();};$$('[data-2m-a]',d).forEach(b=>b.onclick=()=>{if(locked)return;locked=true;const ok=Number(b.dataset['2mA'])===q.c;if(ok)score++;$$('[data-2m-a]',d).forEach(x=>x.disabled=true);$('#eom2mResult',d).innerHTML=`<div class="eom2m-result"><b>${ok?'✓ Benar!':'Belum tepat.'}</b><br>${q.e}</div><button id="eom2mNext" class="eom2m-next" type="button">${i===questions.length-1?'Lihat hasil':'Soal berikutnya'} →</button>`;$('#eom2mNext',d).onclick=()=>{i++;draw();};});}
draw();timer=setInterval(()=>{remaining--;const el=$('#eom2mTimer',d);if(el)el.textContent=String(Math.max(0,remaining));if(remaining<=0)finish(true);},1000);}
function hook(){const btn=$('#eomMinuteBtn');if(!btn)return false;btn.textContent='⚡ Latihan 2 Menit';btn.title='Pilih jenjang TK, SD, SMP, SMA, Mahasiswa, atau Umum';btn.onclick=openLevelPicker;return true;}
function init(){ensureStyle();if(hook())return;let tries=0;const t=setInterval(()=>{tries++;if(hook()||tries>30)clearInterval(t);},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();