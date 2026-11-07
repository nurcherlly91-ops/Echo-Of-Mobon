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
function applyToForm(data,opts={}){
 const guess=recognize(data);
 const cat=document.getElementById('bookCategory'),genre=document.getElementById('bookGenre');
 const canCategory=cat&&!cat.dataset.eomManualOverride;
 const canGenre=genre&&!genre.dataset.eomManualOverride;
 const categoryApplied=!!(canCategory&&guess.category&&chooseOption(cat,guess.category));
 const genreApplied=!!(canGenre&&guess.genre&&chooseOption(genre,guess.genre));
 document.dispatchEvent(new CustomEvent('eom:book-auto-classified',{detail:{
   ...guess,categoryApplied,genreApplied,categoryManual:!!cat?.dataset.eomManualOverride,
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
window.EOMBOOKCLASSIFY={recognize,applyToForm,chooseOption};
})();