document.addEventListener('DOMContentLoaded',async()=>{
  const loadCss=href=>{if(!document.querySelector(`link[href="${href}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}};
  const loadJs=src=>{if(!document.querySelector(`script[src="${src}"]`)){const s=document.createElement('script');s.src=src;document.body.appendChild(s)}};
  loadCss('assets/bookshelf-fresh.css?v=20261102-1');
  loadCss('assets/member-card-premium.css?v=20261102-1');
  loadJs('assets/member-card-premium.js?v=20261102-1');
  loadJs('assets/engagement-upgrade-v3.js?v=20261102-1');

  const getGuestIdentity=()=>{
    try{return JSON.parse(sessionStorage.getItem('eom_guest_online')||'null')}catch{return null}
  };
  const requireGuestBook=()=>{
    if(getGuestIdentity())return true;
    alert('Untuk meminjam buku, silakan isi Buku Tamu terlebih dahulu.');
    const guestBtn=document.getElementById('guestEntryBtn');
    if(guestBtn)guestBtn.click();
    return false;
  };

  const entryStrip=document.querySelector('.entry-strip');
  if(entryStrip&&!document.getElementById('borrowBooksEntryCard')){
    const card=document.createElement('button');
    card.className='entry-card';
    card.id='borrowBooksEntryCard';
    card.type='button';
    card.innerHTML='<span class="entry-icon">📖</span><strong>Pinjam Buku</strong><small>Isi Buku Tamu terlebih dahulu, lalu pilih buku yang ingin dipinjam.</small>';
    card.addEventListener('click',()=>{
      if(!requireGuestBook())return;
      const physical=document.getElementById('physical');
      if(physical)physical.scrollIntoView({behavior:'smooth',block:'start'});
    });
    entryStrip.appendChild(card);
  }

  document.addEventListener('click',event=>{
    const borrowButton=event.target.closest('[data-borrow]');
    if(!borrowButton)return;
    if(getGuestIdentity())return;
    event.preventDefault();
    event.stopImmediatePropagation();
    requireGuestBook();
  },true);

  try{
    const settings=await SB.rpc('public_library_settings',{});
    const categories=Array.isArray(settings?.book_categories)?settings.book_categories:[];
    const select=document.getElementById('guestCategory');
    if(select&&categories.length){const current=select.value;select.innerHTML='<option value="">Semua kategori</option>'+categories.map(c=>`<option value="${String(c).replace(/"/g,'&quot;')}">${String(c).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</option>`).join('');if(categories.includes(current))select.value=current;}
  }catch(e){console.warn('Sinkron kategori belum tersedia',e)}
});