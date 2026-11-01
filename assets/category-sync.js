document.addEventListener('DOMContentLoaded',async()=>{
  const loadCss=href=>{if(!document.querySelector(`link[href="${href}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}};
  const loadJs=src=>{if(!document.querySelector(`script[src="${src}"]`)){const s=document.createElement('script');s.src=src;document.body.appendChild(s)}};
  loadCss('assets/bookshelf-fresh.css?v=20261102-1');
  loadCss('assets/member-card-premium.css?v=20261102-1');
  loadJs('assets/member-card-premium.js?v=20261102-1');
  try{
    const settings=await SB.rpc('public_library_settings',{});
    const categories=Array.isArray(settings?.book_categories)?settings.book_categories:[];
    const select=document.getElementById('guestCategory');
    if(select&&categories.length){const current=select.value;select.innerHTML='<option value="">Semua kategori</option>'+categories.map(c=>`<option value="${String(c).replace(/"/g,'&quot;')}">${String(c).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</option>`).join('');if(categories.includes(current))select.value=current;}
  }catch(e){console.warn('Sinkron kategori belum tersedia',e)}
});