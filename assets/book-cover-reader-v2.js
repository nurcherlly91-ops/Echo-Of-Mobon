(function(){
'use strict';
const stop=/^(?:isbn|issn|editor|edisi|edition|cetakan|copyright|©|www\.|https?:|penerbit|publisher|diterbitkan|penulis|pengarang|written by|oleh|author|ditulis|ilustrasi|ilustrator|gambar oleh|digambar|sampul|kata pengantar|daftar isi|kementerian|kemendik|badan pengembangan|pusat pembinaan|balai bahasa|perpustakaan nasional|direktorat|dinas pendidikan|seri buku cerita|buku pengayaan|untuk pembaca|tahun terbit|terbitan|buku ini|dilarang|all rights reserved|teks dan ilustrasi|komite|disusun oleh)\b/i;
const reject=/\b(?:badan pengembangan dan pembinaan bahasa|kementerian pendidikan|hak cipta|copyright|universitas|penerbitan nasional|katalog dalam terbitan|diterbitkan oleh|printed in|dicetak oleh|isbn|www\.|https?:|e-mail|\.com|\.or\.id|\.go\.id|anggota ikapi|tim penulis|hak penerbit)\b/i;
const lead=/^\s*(?:judul|title|book title)\s*[:：-]\s*(.+)$/i;
const aut=/^\s*(?:penulis(?:an)?|pengarang|author|written\s+by|ditulis\s+oleh|disusun\s+oleh|oleh|cerita\s+oleh|story\s+by|teks\s+oleh)\s*[:：-]?\s*(.*)$/i;
const pub=/^\s*(?:penerbit|publisher|diterbitkan\s+oleh|published\s+by)\s*[:：-]?\s*(.*)$/i;
const year=/\b(?:19[5-9]\d|20[0-3]\d)\b/;
const clean=s=>String(s||'').replace(/[\u200b-\u200f\ufeff]/g,'').replace(/[\u201c\u201d]/g,'"').replace(/[ \t]+/g,' ').replace(/^[\s|_~•·—:.,]+|[\s|_~•·—:.,]+$/g,'').trim();
const norm=s=>clean(s).toLocaleLowerCase('id-ID').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function valid(s){
 const line=clean(s);
 return line.length>=3&&line.length<=100&&/[\p{L}]{2,}/u.test(line)&&!/^([A-Za-z])\1{3,}$/i.test(line)&&!/^\d[\d\W]+$/.test(line);
}
function extractLines(result){
 let lines=[],blocks=result?.blocks;
 if(Array.isArray(blocks)){
  for(const block of blocks){
   for(const paragraph of block?.paragraphs||[]){
    for(const line of paragraph?.lines||[]){
     const text=clean(line.text|| (line.words||[]).map(x=>x.text).join(' '));
     if(!valid(text))continue;
     const bb=line.bbox||{},height=Math.max(0,(bb.y1||0)-(bb.y0||0));
     lines.push({text,confidence:Number(line.confidence)||Number(paragraph.confidence)||0,
       y:Number(bb.y0)||null,x:Number(bb.x0)||null,height,source:'layout'});
    }
   }
  }
 }
 const original=String(result?.text||'').split(/\r?\n/).map(clean).filter(valid);
 if(!lines.length||lines.length<Math.max(2,Math.floor(original.length*.48))){
  lines=original.map((text,i)=>({text,y:null,x:null,height:0,confidence:0,source:'text',originalIndex:i}));
 }else{
  // The bounding boxes allow top-down reading order even on angled covers.
  lines.sort((a,b)=>(a.y??0)-(b.y??0)||(a.x??0)-(b.x??0));
  for(const text of original){
   if(lines.some(x=>norm(x.text)===norm(text)))continue;
   if(text.length>=6&&!lines.some(x=>norm(x.text).includes(norm(text)))){
     lines.push({text,y:null,x:null,height:0,confidence:0,source:'text',originalIndex:lines.length});
   }
  }
 }
 return lines.slice(0,55);
}
function parse(result){
 if(typeof result==='string')result={text:result};
 const lines=extractLines(result),used=new Set();
 const text=lines.map(x=>x.text).join('\n');
 const annotated={};
 function labelValue(pattern){
  for(let i=0;i<lines.length;i++){
   const m=lines[i].text.match(pattern);
   if(!m)continue;
   used.add(i);
   const immediate=clean(m[1]||'');
   if(immediate&&valid(immediate)&&!reject.test(immediate))return {text:immediate,index:i,explicit:true};
   const following=lines[i+1]?.text;
   if(following&&valid(following)&&!reject.test(following)&&!stop.test(following)){
     used.add(i+1);return{text:clean(following),index:i+1,explicit:true};
   }
  }
  return null;
 }
 annotated.title=labelValue(lead);
 annotated.author=labelValue(aut);
 annotated.publisher=labelValue(pub);
 const sizes=lines.map(x=>x.height).filter(h=>h>0).sort((a,b)=>a-b);
 const medium=sizes[Math.floor(sizes.length/2)]||0;
 const maxY=Math.max(1,...lines.map(x=>x.y||0));
 const candidates=[];
 function scoreTitleParts(parts,start){
  const candidate=clean(parts.join(' '));
  if(candidate.length<4||candidate.length>125)return null;
  const tokens=candidate.split(/\s+/);
  if(tokens.length>17)return null;
  let score=18;
  const noStop=parts.every(p=>!stop.test(p)&&!reject.test(p));
  if(!noStop)return null;
  const first=lines[start];
  if(first.y!==null&&first.y!==undefined){
   const fraction=first.y/maxY;
   if(fraction<.12)score-=7;
   else if(fraction<=.72)score+=7;
   else score-=7;
  }else if(start>0&&start<=Math.max(2,Math.floor(lines.length*.6)))score+=4;
  if(medium&&first.height>medium*1.3)score+=8;
  if(medium&&first.height<medium*.72)score-=5;
  if(tokens.length>=2&&tokens.length<=11)score+=5;
  if(parts.length===2)score+=2;
  if(parts.length===2&&parts[0].split(/\s+/).length===1&&/^[A-ZÀ-Ý\s]+$/.test(parts.join(' '))&&parts[1].length>=7)score+=10;
  if(/^buku cerita anak$/i.test(candidate))score-=25;
  if(parts.length>1&&/^buku cerita anak$/i.test(parts[0]))score-=18;
  if(parts.length===3)score-=2;
  if(/\b(dan|yang|di|ke|untuk|the|of|and|dari|serta)\s*$/i.test(candidate))score-=12;
  if(/\b(dan|yang|di|ke|untuk|the|of|and|dari|serta)\s*$/i.test(parts[0])&&parts.length>1)score+=9;
  if(/\b(buku cerita|novel|dongeng|petualangan|hewan laut|cerita anak|ensiklopedia|belajar|matematika|bermain|kisah|sejarah)\b/i.test(candidate))score+=5;
  if(/^[a-z\s]{4,}$/.test(candidate))score-=3;
  if(start>Math.max(5,Math.floor(lines.length*.72)))score-=10;
  if(/\b(volume|jilid|kelas|ser i|book)\s*\d+\s*$/i.test(candidate))score+=2;
  if(year.test(candidate)||/\b(?:bab|chapter|edisi|terbit|tahun)\b/i.test(candidate))score-=10;
  const shortWords=parts.filter(p=>p.length<=3).length;
  if(shortWords)score-=shortWords*4;
  return {text:candidate,score:Math.max(0,score),index:start,parts:parts.slice(),type:'title'};
 }
 for(let i=0;i<lines.length;i++){
  const line=lines[i].text;
  if(used.has(i)||stop.test(line)||reject.test(line)||/^(?:isbn[-\s]?\d|\b\d{10,13}\b)/i.test(line))continue;
  for(let length=1;length<=3&&i+length<=lines.length;length++){
   let parts=[],blocked=false;
   for(let j=i;j<i+length;j++){
    const next=lines[j];
    if(used.has(j)||!next||stop.test(next.text)||reject.test(next.text)){blocked=true;break;}
    const a=lines[i],b=next;
    if(j>i&&a.y!==null&&b.y!==null&&a.height&&Math.abs((b.y||0)-(lines[j-1]?.y||0))>a.height*4.5){blocked=true;break;}
    if(j>i&&/^[A-ZÀ-Ý\d\s]+$/.test(parts.join(' '))&&/^(?:[A-ZÀ-ÖØ-Þ][\p{L}'’.-]+\s+){1,3}[A-ZÀ-ÖØ-Þ][\p{L}'’.-]+$/u.test(next.text)){blocked=true;break;}
    parts.push(next.text);
   }
   if(blocked)break;
   const score=scoreTitleParts(parts,i);
   if(score)candidates.push(score);
  }
 }
 if(annotated.title)candidates.push({text:annotated.title.text,score:99,type:'title',index:annotated.title.index});
 const top=candidates.sort((a,b)=>b.score-a.score||a.index-b.index).filter((x,i,a)=>a.findIndex(y=>norm(y.text)===norm(x.text))===i);
 // Prefer a same-area longer title only if its score is comparable.
 let title=top[0]?.text||'';
 const best=top[0];
 if(best){
  const longer=top.filter(x=>x.index===best.index&&x.text.startsWith(best.text+' ')&&x.score>=best.score-4).sort((a,b)=>b.text.length-a.text.length)[0];
  if(longer)title=longer.text;
 }
 const authorOptions=[];
 function candidateAuthor(t,i,reason,score){
  let text=clean(t).replace(/^(?:oleh|by|penulis|author|ditulis oleh)\s*[:：-]?\s*/i,'');
  if(!valid(text)||reject.test(text)||stop.test(text)||/\b(?:buku|tamu|cerita|hewan|laut|anak|seri|kelas|jilid|volume|sains|sejarah|belajar|penerbit)\b/i.test(text))return;
  if(text.split(/\s+/).length>7||text.split(/\s+/).length<(score>=75?1:2))return;
  if(title&&norm(text)===norm(title))return;
  authorOptions.push({text,score,reason,index:i,type:'author'});
 }
 if(annotated.author)candidateAuthor(annotated.author.text,annotated.author.index,'label',95);
 for(let i=0;i<lines.length;i++){
  if(used.has(i)||!valid(lines[i].text)||stop.test(lines[i].text)||reject.test(lines[i].text))continue;
  const v=lines[i].text;
  const isPerson=/^(?:[A-ZÀ-ÖØ-Þ][\p{L}'’.-]+\.?\s+){1,5}[A-ZÀ-ÖØ-Þ][\p{L}'’.-]+\.?$/u.test(v);
  const nearTitle=best&&i>=best.index&&i<=best.index+5;
  if(isPerson)candidateAuthor(v,i,'dugaan nama orang',nearTitle?42:28);
 }
 const authors=authorOptions.sort((a,b)=>b.score-a.score).filter((x,i,a)=>a.findIndex(y=>norm(x.text)===norm(y.text))===i).slice(0,4);
 const strongAuthor=authors.find(x=>x.score>=75)?.text||'';
 const yr=text.match(year);
 const quality=Math.round((best?.score||0)*.67 + (strongAuthor?20:0) + (lines.length>=2?5:0));
 return{
  title,author:strongAuthor,publisher:annotated.publisher?.text||'',publication_year:yr?Number(yr[0]):null,
  titleCandidates:top.slice(0,5).map(x=>({text:x.text,score:x.score})),
  authorCandidates:authors.map(x=>({text:x.text,score:x.score,requiresConfirmation:x.score<75})),
  confidence:best?.score>=42?'tinggi':best?.score>=25?'sedang':'rendah',
  quality,lines:lines.map(x=>x.text),rawText:result?.text||text
 };
}
window.EOMCOVERREADER={parse};
})();