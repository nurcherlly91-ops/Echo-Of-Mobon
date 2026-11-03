document.addEventListener('DOMContentLoaded',async()=>{
  const loadCss=href=>{if(!document.querySelector(`link[href="${href}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}};
  const loadJs=src=>{if(!document.querySelector(`script[src="${src}"]`)){const s=document.createElement('script');s.src=src;document.body.appendChild(s)}};
  loadCss('assets/bookshelf-fresh.css?v=20261102-1');
  loadCss('assets/member-card-premium.css?v=20261102-1');
  loadJs('assets/member-card-premium.js?v=20261102-1');
  loadJs('assets/engagement-upgrade-v3.js?v=20261102-1');

  const brandSubtitle=document.querySelector('.topbar .brand small');
  if(brandSubtitle)brandSubtitle.textContent='Suara Fayfiye';

  const addWhatsAppButton=phone=>{
    if(!phone||document.getElementById('eomWhatsappAdmin'))return;
    let number=String(phone).replace(/[^0-9]/g,'');
    if(number.startsWith('0'))number='62'+number.slice(1);
    if(!number.startsWith('62'))number='62'+number;
    if(number.length<10)return;

    if(!document.getElementById('eomWhatsappStyle')){
      const style=document.createElement('style');
      style.id='eomWhatsappStyle';
      style.textContent=`
      #eomWhatsappAdmin{position:fixed;right:18px;bottom:22px;z-index:90;display:flex;align-items:center;gap:9px;padding:11px 15px 11px 11px;border-radius:999px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;text-decoration:none;font-weight:800;box-shadow:0 12px 32px rgba(18,140,126,.30);border:1px solid rgba(255,255,255,.34);transition:.2s ease;letter-spacing:.01em}
      #eomWhatsappAdmin:hover{transform:translateY(-2px);box-shadow:0 16px 38px rgba(18,140,126,.38)}
      #eomWhatsappAdmin .eom-wa-icon{display:grid;place-items:center;width:35px;height:35px;border-radius:50%;background:#fff;color:#128C7E;font-size:.76rem;font-weight:900;box-shadow:inset 0 0 0 1px rgba(18,140,126,.12)}
      #eomWhatsappAdmin .eom-wa-copy{display:flex;flex-direction:column;line-height:1.05}
      #eomWhatsappAdmin .eom-wa-copy strong{font-size:.88rem;color:#fff}
      #eomWhatsappAdmin .eom-wa-copy small{font-size:.65rem;color:rgba(255,255,255,.86);font-weight:600;margin-top:4px}
      @media(max-width:680px){#eomWhatsappAdmin{right:12px;bottom:18px;padding:9px 12px 9px 9px;gap:7px}#eomWhatsappAdmin .eom-wa-icon{width:32px;height:32px}#eomWhatsappAdmin .eom-wa-copy strong{font-size:.8rem}#eomWhatsappAdmin .eom-wa-copy small{font-size:.59rem}}
      @media(max-width:380px){#eomWhatsappAdmin .eom-wa-copy small{display:none}}
      `;
      document.head.appendChild(style);
    }

    const link=document.createElement('a');
    link.id='eomWhatsappAdmin';
    link.href=`https://wa.me/${number}?text=${encodeURIComponent('Halo Admin Echo of Mobon, saya ingin bertanya tentang layanan Echo of Mobon.')}`;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.setAttribute('aria-label','Chat WhatsApp Admin Echo of Mobon');
    link.innerHTML='<span class="eom-wa-icon">WA</span><span class="eom-wa-copy"><strong>Chat Admin</strong><small>WhatsApp Echo of Mobon</small></span>';
    document.body.appendChild(link);
  };

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
    addWhatsAppButton(settings?.admin_phone||'');
    const categories=Array.isArray(settings?.book_categories)?settings.book_categories:[];
    const select=document.getElementById('guestCategory');
    if(select&&categories.length){const current=select.value;select.innerHTML='<option value="">Semua kategori</option>'+categories.map(c=>`<option value="${String(c).replace(/"/g,'&quot;')}">${String(c).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</option>`).join('');if(categories.includes(current))select.value=current;}
  }catch(e){console.warn('Sinkron pengaturan publik belum tersedia',e)}
});