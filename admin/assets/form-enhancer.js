(()=>{
function init(){
  if(window.__eomFormEnhancerLoaded)return;window.__eomFormEnhancerLoaded=true;
  const bookForm=document.getElementById('bookForm'),digitalForm=document.getElementById('digitalForm');
  if(!bookForm||!digitalForm||!window.SB)return;

  function makeGenreField(id,label='Genre Buku'){
    const wrap=document.createElement('label');wrap.textContent=label;
    const sel=document.createElement('select');sel.id=id;wrap.appendChild(sel);return {wrap,sel};
  }
  const bookGenre=makeGenreField('bookGenre');
  const digitalGenre=makeGenreField('digitalGenre');
  const bookCategory=document.getElementById('bookCategory');
  const digitalCategory=document.getElementById('digitalCategory');
  bookCategory?.closest('label')?.after(bookGenre.wrap);
  digitalCategory?.closest('label')?.after(digitalGenre.wrap);

  async function refreshTaxonomy(){
    try{
      const s=await SB.session();if(!s?.access_token)return;
      const d=await SB.rpc('admin_dashboard_data',{},s.access_token)||{};
      const settings=Array.isArray(d.settings)?d.settings:[];
      const get=(key,def=[])=>settings.find(x=>x.key===key)?.value??def;
      const cats=get('book_categories',[]),genres=get('book_genres',[]);
      const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
      const fill=(el,arr,placeholder)=>{if(!el)return;const current=el.value;el.innerHTML=`<option value="">${placeholder}</option>`+(Array.isArray(arr)?arr:[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');if([...el.options].some(o=>o.value===current))el.value=current};
      fill(bookCategory,cats,'Pilih kategori');fill(digitalCategory,cats,'Pilih kategori');fill(bookGenre.sel,genres,'Pilih genre');fill(digitalGenre.sel,genres,'Pilih genre');
    }catch(e){console.warn('Gagal memuat kategori/genre terbaru',e)}
  }
  document.getElementById('addBookBtn')?.addEventListener('click',()=>setTimeout(refreshTaxonomy,0));
  document.getElementById('addDigitalBtn')?.addEventListener('click',()=>setTimeout(refreshTaxonomy,0));
  refreshTaxonomy();

  const originalInsert=SB.insert.bind(SB);
  SB.insert=async function(table,payload,token){
    if(table==='books')payload={...payload,genre:bookGenre.sel.value||null};
    if(table==='digital_books')payload={...payload,genre:digitalGenre.sel.value||null};
    return originalInsert(table,payload,token);
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();