document.addEventListener('DOMContentLoaded',()=>{
  const adminApp=document.getElementById('adminApp');
  const settingsPanel=document.getElementById('tab-settings');
  const settingsForm=document.getElementById('settingsForm');
  const settingsTab=document.querySelector('.admin-tabs .tab[data-tab="settings"]');
  if(!adminApp||!settingsPanel||!settingsForm||!settingsTab)return;

  // Kategori adalah bagian dari Pengaturan, bukan menu utama terpisah.
  const subnav=document.createElement('nav');
  subnav.className='settings-subnav';
  subnav.setAttribute('aria-label','Kategori pengaturan Echo of Mobon');
  subnav.innerHTML='<button type="button" id="settingsGeneralTab" class="settings-subtab active">⚙️ Pengaturan Umum</button>'+
    '<button type="button" id="settingsTaxonomyTab" class="settings-subtab">📚 Kategori & Genre Buku</button>';
  settingsPanel.querySelector('.panel-head')?.after(subnav);
  const generalTab=subnav.querySelector('#settingsGeneralTab');
  const categoryTab=subnav.querySelector('#settingsTaxonomyTab');

  const panel=document.createElement('section');
  panel.id='settingsTaxonomy';
  panel.className='taxonomy-panel hidden';
  panel.innerHTML=`
    <div class="panel-head taxonomy-heading">
      <div>
        <div class="kicker gold">MANAJEMEN KOLEKSI</div>
        <h2>Kategori & Genre Buku</h2>
        <p class="muted">Tambahkan kategori dan genre baru. Perubahan disimpan langsung ke database Echo of Mobon.</p>
      </div>
      <button id="taxonomyReload" class="btn ghost" type="button">Muat Ulang</button>
    </div>
    <div class="taxonomy-grid">
      <article class="taxonomy-card">
        <div class="taxonomy-icon">Κ</div>
        <div class="taxonomy-card-head"><div><span class="eyebrow">KATEGORI</span><h3>Kategori Buku</h3></div><b id="categoryCount">0</b></div>
        <form id="categoryAddForm" class="taxonomy-add"><input id="categoryNew" placeholder="Contoh: Sastra Daerah" autocomplete="off" required><button class="btn primary" type="submit">+ Tambahkan Kategori</button></form>
        <p class="taxonomy-note">Kategori dipakai untuk mengelompokkan koleksi fisik dan digital.</p>
        <div id="categoryList" class="taxonomy-list"></div>
      </article>
      <article class="taxonomy-card">
        <div class="taxonomy-icon egypt">𓂀</div>
        <div class="taxonomy-card-head"><div><span class="eyebrow">GENRE</span><h3>Genre Buku</h3></div><b id="genreCount">0</b></div>
        <form id="genreAddForm" class="taxonomy-add"><input id="genreNew" placeholder="Contoh: Misteri" autocomplete="off" required><button class="btn primary" type="submit">+ Tambahkan Genre</button></form>
        <p class="taxonomy-note">Genre membantu memperjelas jenis bacaan tanpa mengubah kategori utamanya.</p>
        <div id="genreList" class="taxonomy-list"></div>
      </article>
    </div>
    <div id="taxonomyStatus" class="taxonomy-status"></div>`;
  settingsForm.after(panel);
  // Edit massal tetap tersedia sebagai pengaturan lanjutan.
  const bulk=document.getElementById('setCategories')?.closest('.grid2');
  if(bulk){
    const details=document.createElement('details');
    details.className='settings-bulk-edit';
    details.innerHTML='<summary>Pengaturan lanjutan · Edit daftar kategori/genre sekaligus</summary>';
    bulk.before(details);
    details.appendChild(bulk);
  }

  let categories=[],genres=[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uniq=list=>[...new Map(list.map(x=>[String(x).trim().toLocaleLowerCase('id'),String(x).trim()])).values()].filter(Boolean);

  function showPanel(){
    settingsForm.classList.add('hidden');
    panel.classList.remove('hidden');
    generalTab.classList.remove('active');
    categoryTab.classList.add('active');
    load();
  }
  function showGeneral(){
    settingsForm.classList.remove('hidden');
    panel.classList.add('hidden');
    generalTab.classList.add('active');
    categoryTab.classList.remove('active');
  }
  categoryTab.addEventListener('click',showPanel);
  generalTab.addEventListener('click',showGeneral);
  settingsTab.addEventListener('click',showGeneral);
  const booksHead=document.querySelector('#tab-books .panel-head');
  if(booksHead){
    const manage=document.createElement('button');
    manage.type='button';manage.className='btn ghost';manage.textContent='⚙️ Atur Kategori Buku';
    manage.addEventListener('click',()=>{settingsTab.click();showPanel();});
    booksHead.appendChild(manage);
  }

  async function token(){const s=await SB.session();if(!s?.access_token)throw new Error('Sesi Admin berakhir. Silakan login kembali.');return s.access_token}
  function setting(rows,key,def=[]){const x=(rows||[]).find(r=>r.key===key);return x?x.value:def}

  function syncSelect(id,list){
    const el=document.getElementById(id);if(!el)return;
    const current=el.value;
    const first=el.options[0]?.textContent||'Pilih';
    el.innerHTML=`<option value="">${esc(first)}</option>`+list.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if(list.includes(current))el.value=current;
  }

  function render(){
    document.getElementById('categoryCount').textContent=categories.length;
    document.getElementById('genreCount').textContent=genres.length;
    document.getElementById('categoryList').innerHTML=categories.map((v,i)=>`<div class="taxonomy-item"><span><i>${String(i+1).padStart(2,'0')}</i>${esc(v)}</span><button type="button" class="taxonomy-edit" data-rename-category="${esc(v)}" title="Ubah nama kategori">Ubah</button><button type="button" class="taxonomy-remove" data-remove-category="${esc(v)}" title="Hapus dari daftar">×</button></div>`).join('')||'<div class="taxonomy-empty">Belum ada kategori.</div>';
    document.getElementById('genreList').innerHTML=genres.map((v,i)=>`<div class="taxonomy-item"><span><i>${String(i+1).padStart(2,'0')}</i>${esc(v)}</span><button type="button" class="taxonomy-edit" data-rename-genre="${esc(v)}" title="Ubah nama genre">Ubah</button><button type="button" class="taxonomy-remove" data-remove-genre="${esc(v)}" title="Hapus dari daftar">×</button></div>`).join('')||'<div class="taxonomy-empty">Belum ada genre.</div>';
    syncSelect('bookCategory',categories);syncSelect('digitalCategory',categories);
    syncSelect('bookGenre',genres);syncSelect('digitalGenre',genres);
    document.dispatchEvent(new CustomEvent('eom:book-taxonomy-ready'));
    const sc=document.getElementById('setCategories'),sg=document.getElementById('setGenres');
    if(sc)sc.value=categories.join('\n');if(sg)sg.value=genres.join('\n');
  }

  async function load(){
    const status=document.getElementById('taxonomyStatus');status.textContent='Memuat daftar...';
    try{const t=await token(),d=await SB.rpc('admin_dashboard_data',{},t)||{};categories=uniq(setting(d.settings,'book_categories',[]));genres=uniq(setting(d.settings,'book_genres',[]));render();status.textContent='Daftar kategori dan genre tersinkron.'}
    catch(e){status.textContent='Gagal memuat: '+e.message}
  }

  async function save(key,list,description){
    const t=await token();
    await SB.rpc('admin_save_setting',{p_key:key,p_value:list,p_description:description},t);
  }

  document.getElementById('categoryAddForm').addEventListener('submit',async e=>{
    e.preventDefault();const input=document.getElementById('categoryNew'),v=input.value.trim();if(!v)return;
    if(categories.some(x=>x.toLocaleLowerCase('id')===v.toLocaleLowerCase('id'))){document.getElementById('taxonomyStatus').textContent='Kategori tersebut sudah ada.';return}
    const updated=uniq([...categories,v]);
    try{await save('book_categories',updated,'Daftar kategori buku yang dapat dikelola Admin');categories=updated;input.value='';render();document.getElementById('taxonomyStatus').textContent='Kategori baru berhasil ditambahkan.'}catch(err){document.getElementById('taxonomyStatus').textContent='Gagal menambah kategori: '+err.message}
  });

  document.getElementById('genreAddForm').addEventListener('submit',async e=>{
    e.preventDefault();const input=document.getElementById('genreNew'),v=input.value.trim();if(!v)return;
    if(genres.some(x=>x.toLocaleLowerCase('id')===v.toLocaleLowerCase('id'))){document.getElementById('taxonomyStatus').textContent='Genre tersebut sudah ada.';return}
    const updated=uniq([...genres,v]);
    try{await save('book_genres',updated,'Daftar genre buku yang dapat dikelola Admin');genres=updated;input.value='';render();document.getElementById('taxonomyStatus').textContent='Genre baru berhasil ditambahkan.'}catch(err){document.getElementById('taxonomyStatus').textContent='Gagal menambah genre: '+err.message}
  });

  panel.addEventListener('click',async e=>{
    const rc=e.target.closest('[data-rename-category]'),rg=e.target.closest('[data-rename-genre]');
    const c=e.target.closest('[data-remove-category]'),g=e.target.closest('[data-remove-genre]');
    const status=document.getElementById('taxonomyStatus');
    if(rc||rg){
      const isCategory=!!rc,old=(rc||rg).dataset[isCategory?'renameCategory':'renameGenre'];
      const collection=isCategory?categories:genres;
      const next=prompt('Ubah nama '+(isCategory?'kategori':'genre')+':',old);
      if(next===null)return;
      const value=next.trim();
      if(!value||value.length>90){status.textContent='Nama harus 1–90 karakter.';return;}
      if(collection.some(x=>x!==old&&x.toLocaleLowerCase('id')===value.toLocaleLowerCase('id'))){status.textContent='Nama sudah digunakan.';return;}
      const updated=collection.map(x=>x===old?value:x);
      try{
        await save(isCategory?'book_categories':'book_genres',updated,'Daftar kategori/genre buku yang dapat dikelola Admin');
        if(isCategory)categories=updated;else genres=updated;
        render();status.textContent='Nama berhasil diubah. Buku yang sudah menggunakan nama lama tetap memiliki kategorinya sampai diedit.';
      }catch(err){status.textContent='Gagal mengubah nama: '+err.message;}
      return;
    }
    if(c||g){
      const isCategory=!!c,old=(c||g).dataset[isCategory?'removeCategory':'removeGenre'];
      if(!confirm('Hapus '+(isCategory?'kategori':'genre')+' “'+old+'” dari pilihan?\n\nData buku lama tidak ikut dihapus.'))return;
      const updated=(isCategory?categories:genres).filter(x=>x!==old);
      try{
        await save(isCategory?'book_categories':'book_genres',updated,'Daftar kategori/genre buku yang dapat dikelola Admin');
        if(isCategory)categories=updated;else genres=updated;
        render();status.textContent=(isCategory?'Kategori':'Genre')+' berhasil dihapus dari daftar pilihan.';
      }catch(err){status.textContent='Gagal menghapus pilihan: '+err.message;}
    }
  });
  document.getElementById('taxonomyReload').addEventListener('click',load);

  const observer=new MutationObserver(()=>{if(!adminApp.classList.contains('hidden')&&(!categories.length&&!genres.length))load()});
  observer.observe(adminApp,{attributes:true,attributeFilter:['class']});
});