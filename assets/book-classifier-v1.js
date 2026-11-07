(()=>{
'use strict';
/* Klasifikasi katalog otomatis menggunakan judul, OCR dan metadata ISBN.
   Berjalan lokal di browser, tanpa mengirim foto ke layanan AI lain.
   Semua prediksi dapat diperiksa dan dikoreksi admin. */
const RULES=[
 {category:'Komik & Novel Grafis',genre:'Komik',pattern:/\b(komik|comic|manga|manhwa|graphic novel|ilustrasi komik)\b/i},
 {category:'Fabel & Dongeng',genre:'Fabel',pattern:/\b(fabel|fable|kisah binatang|hewan (yang )?berbicara)\b/i},
 {category:'Fabel & Dongeng',genre:'Dongeng',pattern:/\b(dongeng|fairy tale|cerita rakyat|legenda|hikayat|mitos rakyat|folklore)\b/i},
 {category:'Puisi & Drama',genre:'Puisi',pattern:/\b(puisi|poetry|sajak|pantun|syair|soneta)\b/i},
 {category:'Puisi & Drama',genre:'Drama',pattern:/\b(drama|teater|naskah lakon|sandiwara)\b/i},
 {category:'Biografi & Autobiografi',genre:'Biografi',pattern:/\b(biografi|biography|autobiografi|autobiography|riwayat hidup|kisah hidup tokoh)\b/i},
 {category:'Buku Anak-anak',genre:'Anak-anak',pattern:/\b(buku anak|anak-anak|cerita anak|dongeng anak|buku cerita anak|picture book|children's book|juvenile|balita|paud|usia dini|buku bergambar|dony)\b/i},
 {category:'Referensi & Ensiklopedia',genre:'Referensi',pattern:/\b(ensiklopedia|encyclopedia|kamus|dictionary|atlas|tesaurus|glosarium|referensi|almanak)\b/i},
 {category:'Buku Ajar & Akademik',genre:'Bahasa Inggris',pattern:/\b(bahasa inggris|belajar english|english (?:grammar|language|learning|for|vocabulary|conversation|lesson|book)|vocabulary|grammar|speaking english|english speaking|english course)\b/i},
 {category:'Buku Ajar & Akademik',genre:'Pendidikan',pattern:/\b(buku pelajaran|buku siswa|buku guru|buku teks|textbook|kurikulum|lembar kerja|lks|latihan soal|ujian sekolah|modul ajar|bahan ajar|matematika (sd|smp|sma|kelas)|kelas (1[0-2]|[1-9])|sekolah dasar|bahasa indonesia (sd|smp|sma))\b/i},
 {category:'Sejarah & Budaya',genre:'Sejarah',pattern:/\b(sejarah|history|historis|kerajaan|perjuangan kemerdekaan|perang dunia|peninggalan sejarah)\b/i},
 {category:'Sejarah & Budaya',genre:'Budaya',pattern:/\b(budaya|cultural|culture|adat istiadat|tradisi|tarian tradisional|warisan budaya|kearifan lokal|halmahera|maba|lalayon|nusantara)\b/i},
 {category:'Sains & Teknologi',genre:'Sains',pattern:/\b(sains|science|ilmiah|pengetahuan alam|biologi|biology|fisika|physics|kimia|chemistry|astronomi|astronomy|planet|tata surya|ekosistem|hewan laut|marine life|ocean science|flora|fauna|zoologi|botani|geologi)\b/i},
 {category:'Sains & Teknologi',genre:'Sains',pattern:/\b(teknologi|technology|komputer|computer|programming|pemrograman|coding|internet|robotik|elektronika|artificial intelligence|kecerdasan buatan|informatika)\b/i},
 {category:'Filsafat & Agama',genre:'Agama',pattern:/\b(agama|islam|quran|alquran|al-qur'an|hadis|hadits|doa|shalat|salat|fikih|fiqih|gereja|alkitab|bible|religion|spiritualitas)\b/i},
 {category:'Filsafat & Agama',genre:'Umum',pattern:/\b(filsafat|philosophy|filosofi|logika filsafat|etika filsafat)\b/i},
 {category:'Sosial & Politik',genre:'Umum',pattern:/\b(sosiologi|sociology|politik|politics|demokrasi|democracy|pemerintahan|government|kebijakan publik|masyarakat sosial|hukum tata negara)\b/i},
 {category:'Pengembangan Diri (Self-Improvement)',genre:'Umum',pattern:/\b(motivasi|motivational|self.help|self-improvement|pengembangan diri|membangun kebiasaan|produktivitas|percaya diri|manajemen waktu|mindset|personal growth)\b/i},
 {category:'Panduan Praktis (How-To)',genre:'Pendidikan',pattern:/\b(panduan|tutorial|manual|langkah-langkah|cara membuat|cara belajar|how to|petunjuk praktis|do it yourself|resep masakan|keterampilan dasar)\b/i},
 {category:'Memoar & Catatan Perjalanan (Travelogue)',genre:'Umum',pattern:/\b(memoar|memoir|catatan perjalanan|travelogue|travel diary|kisah perjalanan|keliling dunia)\b/i},
 {category:'Novel & Cerpen',genre:'Cerpen',pattern:/\b(cerpen|cerita pendek|short stories|short story)\b/i},
 {category:'Novel & Cerpen',genre:'Novel',pattern:/\b(novel|fiction|fiksi|roman|romance|thriller|fantasy|fantasi|misteri|petualangan novel)\b/i}
];
/* Aliases kategori metadata Google Books/Open Library dan jenis bacaan yang umum. */
const METADATA_RULES=[
 {category:'Buku Anak-anak',genre:'Anak-anak',pattern:/\b(juvenile|children|kids|early readers|picture books?|young readers|reading age|buku anak)\b/i},
 {category:'Buku Ajar & Akademik',genre:'Bahasa Inggris',pattern:/\b(english language|learn english|english grammar|bahasa inggris|vocabulary|pronunciation|kosakata inggris)\b/i},
 {category:'Buku Ajar & Akademik',genre:'Pendidikan',pattern:/\b(education|school|teaching|pedagog|study guides|curriculum|teaching methods|textbooks?|pendidikan|pembelajaran)\b/i},
 {category:'Sains & Teknologi',genre:'Sains',pattern:/\b(computers?|technology|science|nature|ecology|engineering|medicine|mathematics|environment|informatika|kesehatan)\b/i},
 {category:'Sejarah & Budaya',genre:'Budaya',pattern:/\b(anthropology|folklore|cultural studies|customs|adat|warisan budaya|tradisi)\b/i},
 {category:'Sejarah & Budaya',genre:'Sejarah',pattern:/\b(history|historical|sejarah)\b/i},
 {category:'Filsafat & Agama',genre:'Agama',pattern:/\b(religion|religious|islamic|christianity|theology|spiritual|keagamaan)\b/i},
 {category:'Novel & Cerpen',genre:'Novel',pattern:/\b(juvenile fiction|fiction|fantasy|romance|literary fiction|novels?|fiksi)\b/i},
 {category:'Biografi & Autobiografi',genre:'Biografi',pattern:/\b(biography|autobiography|memoir|life stories)\b/i},
 {category:'Sosial & Politik',genre:'Umum',pattern:/\b(political|social science|public policy|sociology|politics|hukum|law)\b/i},
 {category:'Panduan Praktis (How-To)',genre:'Pendidikan',pattern:/\b(cooking|crafts|hobbies|handbooks?|guides|how to)\b/i}
];
const UNCLASSIFIED='Umum / Belum Terklasifikasi';
const norm=x=>String(x||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[&.,():/\\\-]+/g,' ').replace(/\s+/g,' ').trim();

function chooseOption(select,wanted){
 if(!select||!wanted)return false;
 const options=Array.from(select.options||[]).filter(x=>x.value);
 let match=options.find(x=>norm(x.value)===norm(wanted))||
   options.find(x=>norm(x.textContent)===norm(wanted));
 if(!match){
   match=document.createElement('option');
   match.value=wanted;
   match.textContent=wanted;
   match.dataset.eomAutoOption='true';
   select.add(match);
 }
 select.value=match.value;
 select.dataset.eomAutoValue=match.value;
 select.dispatchEvent(new Event('change',{bubbles:true}));
 return true;
}
function recognize(input){
 const data=typeof input==='string'?{title:input}:input||{};
 const title=String(data.title||'').slice(0,230).trim();
 if(!title)return {category:'',genre:'',confidence:'rendah',score:0,source:'',needsReview:true};
 const metadata=[data.category,data.genre,Array.isArray(data.subjects)?data.subjects.join(' '):data.subjects].filter(Boolean).join(' ').slice(0,650);
 const description=String(data.description||'').slice(0,800);
 const ocr=String(data.detected_text||data.ocr_text||'').slice(0,800);
 const scores=new Map();
 function add(category,genre,weight,source){
   const key=category+'|'+genre;
   const prior=scores.get(key)||{category,genre,score:0,reasons:[],titleMatch:false};
   prior.score+=weight;
   prior.reasons.push(source);
   if(source==='judul')prior.titleMatch=true;
   scores.set(key,prior);
 }
 // Metadata kategori yang sudah dalam taksonomi Echo of Mobon paling dipercaya.
 const canonical=RULES.filter((rule,i,arr)=>arr.findIndex(x=>x.category===rule.category&&x.genre===rule.genre)===i);
 const explicitCategory=norm(data.category),explicitGenre=norm(data.genre);
 if(explicitCategory){
   const matches=canonical.filter(x=>norm(x.category)===explicitCategory);
   if(matches.length){
     const exact=matches.find(x=>norm(x.genre)===explicitGenre);
     const choice=exact||matches.find(x=>x.genre!=='Umum')||matches[0];
     add(choice.category,choice.genre,12,'kategori katalog');
   }
 }
 if(explicitGenre&&!explicitCategory){
   const match=canonical.find(x=>norm(x.genre)===explicitGenre);
   if(match)add(match.category,match.genre,8,'genre katalog');
 }
 // 'Juvenile Fiction' berarti buku anak, bukan novel dewasa.
 if(/\b(juvenile|children|kids|young readers|picture books?)\b/i.test(metadata)){
   add('Buku Anak-anak','Anak-anak',12,'metadata usia pembaca');
 }
 // Judul lebih penting daripada tulisan kecil di halaman/cover.
 for(const [source,weight,label] of [[title,9,'judul'],[metadata,7,'metadata'],[description,3,'deskripsi'],[ocr,2,'foto']]){
   if(!source)continue;
   const rules=label==='metadata'?[...RULES,...METADATA_RULES]:RULES;
   for(const rule of rules){
     if(rule.pattern.test(source))add(rule.category,rule.genre,weight,label);
   }
 }
 if(!scores.size)return {category:UNCLASSIFIED,genre:'Umum',confidence:'rendah',score:0,source:'judul belum teridentifikasi',needsReview:true,fallback:true};
 const sorted=[...scores.values()].sort((a,b)=>b.score-a.score||(b.titleMatch?1:0)-(a.titleMatch?1:0));
 const best=sorted[0],runner=sorted[1],gap=best.score-(runner?.score||0);
 const confidence=best.score>=9&&gap>=2?'tinggi':best.score>=5?'sedang':'rendah';
 return {category:best.category,genre:best.genre,score:best.score,source:best.reasons.join(', '),
   confidence,needsReview:confidence==='rendah',candidates:sorted.slice(0,3)};
}
/* Saran beberapa genre (maksimal 5) berdasarkan metadata, judul, sinopsis, dan teks cover.
   Foto cover tidak dianggap sebagai pembacaan isi lengkap buku. */
const GENRE_RULES=[
 {name:'Fiksi',pattern:/\b(fiction|fiksi|cerita rekaan|novel|cerpen|roman)\b/i},
 {name:'Horor',pattern:/\b(horor|horror|seram|menyeramkan|mencekam|teror|terror|hantu|arwah|angker|rumah berhantu|haunted|ghost|supernatural)\b/i},
 {name:'Misteri',pattern:/\b(misteri|mystery|mysterious|teka teki|teka-teki|rahasia|penyelidikan|detektif|detective|whodunit)\b/i},
 {name:'Thriller',pattern:/\b(thriller|suspense|menegangkan|ketegangan|konspirasi|pembunuh berantai|serial killer)\b/i},
 {name:'Fantasi',pattern:/\b(fantasi|fantasy|sihir|magic|magical|naga|dragon|peri|fairy world|dunia ajaib)\b/i},
 {name:'Sains Fiksi',pattern:/\b(sci[\s-]?fi|science fiction|fiksi ilmiah|antariksa futuristik|alien|dunia masa depan)\b/i},
 {name:'Romantis',pattern:/\b(romantis|romance|romantic|percintaan|kisah cinta|cinta sejati|asmara|love story)\b/i},
 {name:'Petualangan',pattern:/\b(petualangan|adventure|adventures|menjelajah|penjelajahan|ekspedisi|exploration)\b/i},
 {name:'Kriminal',pattern:/\b(kriminal|crime|criminal|pembunuhan|pencurian|kasus pidana|kejahatan)\b/i},
 {name:'Komedi',pattern:/\b(komedi|comedy|lucu|humor|jenaka|kocak)\b/i},
 {name:'Persahabatan',pattern:/\b(persahabatan|sahabat|friendship|best friend)\b/i},
 {name:'Keluarga',pattern:/\b(keluarga|family|parenting|orang tua dan anak)\b/i},
 {name:'Psikologi',pattern:/\b(psikologi|psychology|kejiwaan|mental health)\b/i},
 {name:'Motivasi',pattern:/\b(motivasi|motivation|inspirasi|inspirational|pengembangan diri|self help|self-help)\b/i},
 {name:'Fiksi Sejarah',pattern:/\b(fiksi sejarah|historical fiction|historical novel|novel sejarah)\b/i},
 {name:'Nonfiksi',pattern:/\b(nonfiksi|nonfiction|non-fiction|kisah nyata|fakta ilmiah|berdasarkan fakta)\b/i},
 {name:'Sejarah',pattern:/\b(sejarah|history|historis|kemerdekaan|kerajaan|masa kolonial)\b/i},
 {name:'Budaya',pattern:/\b(budaya|culture|cultural|adat|tradisi|ritual|tarian|lalayon|kearifan lokal)\b/i},
 {name:'Kearifan Lokal',pattern:/\b(kearifan lokal|local wisdom|cerita daerah|budaya lokal|halmahera|maba|mobon)\b/i},
 {name:'Cerita Rakyat',pattern:/\b(cerita rakyat|folktale|folklore|legenda|legend|mitologi)\b/i},
 {name:'Dongeng',pattern:/\b(dongeng|fairy tale|cerita pengantar tidur|kisah ajaib)\b/i},
 {name:'Fabel',pattern:/\b(fabel|fable|hewan berbicara|binatang berbicara)\b/i},
 {name:'Anak-anak',pattern:/\b(buku anak|anak-anak|cerita anak|picture book|juvenile|children|balita|paud|usia dini|dony)\b/i},
 {name:'Edukasi',pattern:/\b(edukasi|belajar|pelajaran|pembelajaran|pengetahuan|pendidikan|textbook|buku siswa)\b/i},
 {name:'Pendidikan',pattern:/\b(pendidikan|education|textbook|kurikulum|buku ajar|modul ajar)\b/i},
 {name:'Sains',pattern:/\b(sains|science|fisika|kimia|biologi|astronomi|hewan laut|marine biology|dinosaurus|planet)\b/i},
 {name:'Teknologi',pattern:/\b(teknologi|technology|coding|pemrograman|komputer|informatika|robotik|artificial intelligence)\b/i},
 {name:'Lingkungan',pattern:/\b(lingkungan|environment|ekologi|ecosystem|ekosistem|pencemaran|konservasi)\b/i},
 {name:'Agama',pattern:/\b(agama|religion|religious|islam|quran|alkitab|hadis|hadits|shalat)\b/i},
 {name:'Biografi',pattern:/\b(biografi|biography|autobiografi|autobiography|riwayat hidup)\b/i},
 {name:'Komik',pattern:/\b(komik|comic|manga|manhwa|novel grafis)\b/i},
 {name:'Puisi',pattern:/\b(puisi|poetry|sajak|pantun|syair)\b/i},
 {name:'Drama',pattern:/\b(drama|theatre|teater|naskah drama)\b/i},
 {name:'Cerpen',pattern:/\b(cerpen|short stories|short story|cerita pendek)\b/i},
 {name:'Novel',pattern:/\b(novel|roman|novels)\b/i},
 {name:'Referensi',pattern:/\b(ensiklopedia|kamus|dictionary|atlas|referensi)\b/i},
 {name:'Bahasa Inggris',pattern:/\b(bahasa inggris|english language|learn english|english grammar|english conversation)\b/i},
 {name:'Bahasa Indonesia',pattern:/\b(bahasa indonesia|indonesian language)\b/i}
];
function suggestGenres(input){
 const data=typeof input==='string'?{title:input}:input||{};
 const title=String(data.title||'').slice(0,250);
 const rawCategory=String(data.category||'');
 const isKnownCategory=['Novel & Cerpen','Komik & Novel Grafis','Buku Anak-anak','Sains & Teknologi',
  'Sejarah & Budaya','Buku Ajar & Akademik','Filsafat & Agama','Puisi & Drama',
  'Fabel & Dongeng','Biografi & Autobiografi','Referensi & Ensiklopedia']
  .some(x=>norm(x)===norm(rawCategory));
 const subjects=[data.genre,isKnownCategory?'':rawCategory,Array.isArray(data.subjects)?data.subjects.join(' '):data.subjects].filter(Boolean).join(' ').slice(0,1200);
 const description=String(data.description||data.summary||'').slice(0,3500);
 const ocr=String(data.detected_text||data.ocr_text||'').slice(0,1000);
 if(!title&&!subjects&&!description&&!ocr)return [];
 const scores=new Map(),ranks=new Map(GENRE_RULES.map((x,i)=>[x.name,i]));
 function add(name,weight,reason){
  const old=scores.get(name)||{name,score:0,reasons:[]};
  old.score+=weight;
  old.reasons.push(reason);
  scores.set(name,old);
 }
 for(const [source,weight,reason] of [[title,9,'judul'],[subjects,8,'metadata'],[description,5,'sinopsis'],[ocr,1,'foto']]){
  if(!source)continue;
  for(const rule of GENRE_RULES){
   if(rule.pattern.test(source))add(rule.name,weight,reason);
  }
 }
 const category=norm(data.category);
 const generic=norm(data.genre);
 if(category==='novel cerpen' || category==='komik novel grafis'){
   add('Fiksi',5,'kategori');
 }
 if(category==='buku anak anak')add('Anak-anak',7,'kategori');
 if(category==='sains teknologi')add('Sains',5,'kategori');
 if(category==='sejarah budaya')add('Budaya',4,'kategori');
 if(generic==='umum'&&scores.size===0)add('Umum',3,'genre umum');
 // Saran selalu dibatasi lima. Hasil dengan bukti lebih kuat diutamakan.
 const sorted=[...scores.values()].sort((a,b)=>b.score-a.score||(ranks.get(a.name)||0)-(ranks.get(b.name)||0));
 return sorted.filter(x=>x.score>=3).slice(0,5).map(x=>x.name);
}
function applyToForm(data,opts={}){
 const guess=recognize(data);
 const cat=document.getElementById('bookCategory'),genre=document.getElementById('bookGenre');
 const canCategory=cat&&!cat.dataset.eomManualOverride;
 const canGenre=genre&&!genre.dataset.eomManualOverride;
 const categoryApplied=!!(canCategory&&guess.category&&chooseOption(cat,guess.category));
 const genreApplied=!!(canGenre&&guess.genre&&chooseOption(genre,guess.genre));
 document.dispatchEvent(new CustomEvent('eom:book-auto-classified',{detail:{
   ...guess,genresSuggested:suggestGenres(data),inputData:data,categoryApplied,genreApplied,categoryManual:!!cat?.dataset.eomManualOverride,
   genreManual:!!genre?.dataset.eomManualOverride
 }}));
 return {...guess,categoryApplied,genreApplied};
}
function enableManualOverrideTracking(){
 for(const id of ['bookCategory','bookGenre']){
   const select=document.getElementById(id);
   if(!select||select.dataset.eomTracking)return;
   select.dataset.eomTracking='true';
   select.addEventListener('change',event=>{
     if(event.isTrusted)select.dataset.eomManualOverride='true';
   });
 }
 document.getElementById('addBookBtn')?.addEventListener('click',()=>{
   for(const id of ['bookCategory','bookGenre']){
     const select=document.getElementById(id);
     if(select){delete select.dataset.eomManualOverride;delete select.dataset.eomAutoValue;}
   }
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enableManualOverrideTracking);
else enableManualOverrideTracking();
window.EOMBOOKCLASSIFY={recognize,suggestGenres,applyToForm,chooseOption};
})();