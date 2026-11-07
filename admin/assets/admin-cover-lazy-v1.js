(()=>{
'use strict';
function init(){
 if(window.__eomAdminLazyBookCovers)return;
 const root=document.getElementById('booksTable');
 if(!root||typeof SB==='undefined')return;
 window.__eomAdminLazyBookCovers=true;
 const cache=new Map(),queued=new Set(),queue=[];
 let active=0,activeScan=false;
 const limit=3;
 function rowInfo(row){
   const btn=row?.querySelector?.('[data-edit-book]');
   if(!btn||!row.cells||row.cells.length<3)return null;
   // operations-v2 inserts the cover immediately after the first column.
   const table=row.closest('table');
   if(table?.dataset.v2!=='1')return null;
   return {id:btn.dataset.editBook,cell:row.cells[1]};
 }
 function render(row,url){
   const info=rowInfo(row);
   if(!info||!row.isConnected)return;
   const cell=info.cell;
   if(!url){cell.innerHTML='<span class="member-table-photo placeholder-photo" title="Foto belum tersedia">📖</span>';return;}
   const img=document.createElement('img');
   img.className='member-table-photo';
   img.alt='Sampul buku fisik';
   img.loading='lazy';
   img.decoding='async';
   img.src=url;
   cell.replaceChildren(img);
 }
 async function work(){
   while(active<limit&&queue.length){
     const item=queue.shift();
     const id=item.id;
     queued.delete(id);active++;
     try{
       if(!cache.has(id)){
         const session=await SB.session();
         if(!session?.access_token)throw new Error('Sesi admin sudah berakhir');
         const rows=await SB.select('books','select=cover_url&id=eq.'+encodeURIComponent(id)+'&limit=1',session.access_token);
         cache.set(id,rows?.[0]?.cover_url||'');
       }
       // Find current row if table got rebuilt during the request.
       root.querySelectorAll('[data-edit-book]').forEach(btn=>{
         if(btn.dataset.editBook===id)render(btn.closest('tr'),cache.get(id));
       });
     }catch(e){
       console.warn('Sampul buku belum dapat dimuat:',e.message);
     }finally{active--;work();}
   }
 }
 function enqueue(row){
   const info=rowInfo(row);
   if(!info)return;
   const id=info.id;
   if(cache.has(id)){render(row,cache.get(id));return;}
   if(queued.has(id))return;
   queued.add(id);queue.push({id});work();
 }
 const observer=('IntersectionObserver' in window)
   ?new IntersectionObserver(entries=>{
     entries.forEach(entry=>{if(entry.isIntersecting){enqueue(entry.target);observer.unobserve(entry.target);}});
    },{rootMargin:'200px 0px'})
   :null;
 function scan(){
   if(activeScan)return;
   activeScan=true;
   try{
     const table=root.querySelector('table');
     if(!table||table.dataset.v2!=='1')return;
     const rows=[...table.querySelectorAll('tr')].filter(row=>rowInfo(row));
     for(const row of rows){
       if(row.dataset.eomCoverObserved==='true')continue;
       row.dataset.eomCoverObserved='true';
       if(observer)observer.observe(row);
       else if(rows.indexOf(row)<12)enqueue(row);
     }
   }finally{activeScan=false;}
 }
 const mutations=new MutationObserver(()=>{clearTimeout(window.__eomLazyCoverTimer);window.__eomLazyCoverTimer=setTimeout(scan,250);});
 mutations.observe(root,{childList:true,subtree:true});
 document.addEventListener('eom:book-full-edit-saved',e=>{
   const id=String(e.detail?.id||'');
   if(id)cache.delete(id);
   setTimeout(scan,600);
 });
 document.getElementById('refreshBtn')?.addEventListener('click',()=>setTimeout(scan,500));
 setTimeout(scan,550);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();