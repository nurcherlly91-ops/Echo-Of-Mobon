document.addEventListener('DOMContentLoaded',async()=>{
  try{
    const settings=await SB.rpc('public_library_settings',{});
    const categories=Array.isArray(settings?.book_categories)?settings.book_categories:[];
    const select=document.getElementById('guestCategory');
    if(select&&categories.length){const current=select.value;select.innerHTML='<option value="">Semua kategori</option>'+categories.map(c=>`<option value="${String(c).replace(/"/g,'&quot;')}">${String(c).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</option>`).join('');if(categories.includes(current))select.value=current;}
  }catch(e){console.warn('Sinkron kategori belum tersedia',e)}
});