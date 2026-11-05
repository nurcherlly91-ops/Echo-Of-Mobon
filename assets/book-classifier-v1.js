(()=>{
'use strict';
/* Saran taksonomi lokal; tidak mengirim foto peserta atau sampul ke layanan AI.
   Kategori/genre selalu dipilih dari opsi yang sudah tersedia di dashboard. */
const RULES=[
 {category:'Komik & Novel Grafis',genre:'Komik',pattern:/\b(komik|comic|manga|manhwa|graphic novel|ilustrasi komik)\b/i},
 {category:'Fabel & Dongeng',genre:'Fabel',pattern:/\b(fabel|fable|kisah binatang|hewan (yang )?berbicara)\b/i},
 {category:'Fabel & Dongeng',genre:'Dongeng',pattern:/\b(dongeng|fairy tale|cerita rakyat|legenda|hikayat|mitos rakyat|folklore)\b/i},
 {category:'Puisi & Drama',genre:'Puisi',pattern:/\b(puisi|poetry|sajak|pantun|syair|soneta)\b/i},
 {category:'Puisi & Drama',genre:'Drama',pattern:/\b(drama|teater|naskah lakon|sandiwara)\b/i},
 {category:'Biografi & Autobiografi',genre:'Biografi',pattern:/\b(biografi|biography|autobiografi|autobiography|riwayat hidup|kisah hidup tokoh)\b/i},
 {category:'Buku Anak-anak',genre:'Anak-anak',pattern:/\b(buku anak|anak-anak|cerita anak|dongeng anak|buku cerita anak|picture book|children's book|juvenile|balita|paud|usia dini|buku bergambar)\b/i},
 {category:'Referensi & Ensiklopedia',genre:'Referensi',pattern:/\b(ensiklopedia|encyclopedia|kamus|dictionary|atlas|tesaurus|glosarium|referensi|almanak)\b/i},
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
const norm=x=>String(x||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[&.,():/\\\-]+/g,' ').replace(/\s+/g,' ').trim();
function chooseOption(select,wanted){
 if(!select||!wanted)return false;
 const options=Array.from(select.options||[]).filter(x=>x.value);
 if(!options.length)return false;
 const match=options.find(x=>norm(x.value)===norm(wanted))||
   options.find(x=>norm(x.textContent)===norm(wanted));
 if(!match)return false;
 select.value=match.value;
 select.dispatchEvent(new Event('change',{bubbles:true}));
 return true;
}
function recognize(input){
 const data=typeof input==='string'?{title:input}:input||{};
 const title=String(data.title||'').slice(0,230);
 const external=String(data.category||data.genre||'')+' '+(Array.isArray(data.subjects)?data.subjects.join(' '):String(data.subjects||''));
 const detail=String(data.description||'').slice(0,650);
 const seen=String(data.detected_text||data.ocr_text||'').slice(0,700);
 const scores=new Map();
 for(const [source,weight] of [[title,7],[external,5],[detail,2],[seen,1]]){
   for(const rule of RULES){
     if(!rule.pattern.test(source))continue;
     const key=rule.category+'|'+rule.genre,prior=scores.get(key)||{score:0,category:rule.category,genre:rule.genre,reasons:[]};
     prior.score+=weight;prior.reasons.push(weight>=5?'judul/metadata':'teks pendukung');scores.set(key,prior);
   }
 }
 if(!scores.size)return{category:'',genre:'',confidence:'rendah',source:'',score:0};
 const ordered=[...scores.values()].sort((a,b)=>b.score-a.score);
 const best=ordered[0],runner=ordered[1];
 const gap=best.score-(runner?.score||0);
 return {category:best.category,genre:best.genre,score:best.score,source:best.reasons[0]||'',
   confidence:best.score>=7&&gap>=2?'tinggi':best.score>=5?'sedang':'rendah',candidates:ordered.slice(0,3)};
}
function applyToForm(data,opts={}){
 const candidate=recognize(data);
 const cat=document.getElementById('bookCategory');
 const genre=document.getElementById('bookGenre');
 let categoryApplied=false,genreApplied=false;
 if(candidate.score>=5){
   categoryApplied=chooseOption(cat,candidate.category);
   genreApplied=chooseOption(genre,candidate.genre);
 }
 return {...candidate,categoryApplied,genreApplied};
}
window.EOMBOOKCLASSIFY={recognize,applyToForm,chooseOption};
})();