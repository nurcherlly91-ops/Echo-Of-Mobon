document.addEventListener('DOMContentLoaded',()=>{
  const tabs=document.querySelector('.admin-tabs');
  const adminApp=document.getElementById('adminApp');
  if(!tabs||!adminApp)return;

  const tab=document.createElement('button');
  tab.className='tab';
  tab.type='button';
  tab.dataset.tab='taxonomy';
  tab.innerHTML='Kategori & Genre';
  tabs.appendChild(tab);

  const panel=document.createElement('section');
  panel.id='tab-taxonomy';
  panel.className='tab-panel hidden taxonomy-panel';
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
  document.getElementById('tab-settings')?.after(panel);

  let categories=[],genres=[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uniq=list=>[...new Map(list.map(x=>[String(x).trim().toLocaleLowerCase('id'),String(x).trim()])).values()].filter(Boolean);

  function showPanel(){
    document.querySelectorAll('.admin-tabs .tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(x=>x.classList.add('hidden'));
    tab.classList.add('active');
    panel.classList.remove('hidden');
    load();
  }
  tab.addEventListener('click',showPanel);

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
    document.getElementById('categoryList').innerHTML=categories.map((v,i)=>`<div class="taxonomy-item"><span><i>${String(i+1).padStart(2,'0')}</i>${esc(v)}</span><button type="button" class="taxonomy-remove" data-remove-category="${esc(v)}" title="Hapus dari daftar">×</button></div>`).join('')||'<div class="taxonomy-empty">Belum ada kategori.</div>';
    document.getElementById('genreList').innerHTML=genres.map((v,i)=>`<div class="taxonomy-item"><span><i>${String(i+1).padStart(2,'0')}</i>${esc(v)}</span><button type="button" class="taxonomy-remove" data-remove-genre="${esc(v)}" title="Hapus dari daftar">×</button></div>`).join('')||'<div class="taxonomy-empty">Belum ada genre.</div>';
    syncSelect('bookCategory',categories);syncSelect('digitalCategory',categories);
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
    categories=uniq([...categories,v]);
    try{await save('book_categories',categories,'Daftar kategori buku yang dapat dikelola Admin');input.value='';render();document.getElementById('taxonomyStatus').textContent='Kategori baru berhasil ditambahkan.'}catch(err){document.getElementById('taxonomyStatus').textContent='Gagal menambah kategori: '+err.message}
  });

  document.getElementById('genreAddForm').addEventListener('submit',async e=>{
    e.preventDefault();const input=document.getElementById('genreNew'),v=input.value.trim();if(!v)return;
    if(genres.some(x=>x.toLocaleLowerCase('id')===v.toLocaleLowerCase('id'))){document.getElementById('taxonomyStatus').textContent='Genre tersebut sudah ada.';return}
    genres=uniq([...genres,v]);
    try{await save('book_genres',genres,'Daftar genre buku yang dapat dikelola Admin');input.value='';render();document.getElementById('taxonomyStatus').textContent='Genre baru berhasil ditambahkan.'}catch(err){document.getElementById('taxonomyStatus').textContent='Gagal menambah genre: '+err.message}
  });

  panel.addEventListener('click',async e=>{
    const c=e.target.closest('[data-remove-category]'),g=e.target.closest('[data-remove-genre]');
    if(c){const v=c.dataset.removeCategory;if(!confirm(`Hapus kategori “${v}” dari daftar pilihan?\n\nBuku lama yang sudah memakai kategori ini tidak akan ikut terhapus.`))return;categories=categories.filter(x=>x!==v);try{await save('book_categories',categories,'Daftar kategori buku yang dapat dikelola Admin');render();document.getElementById('taxonomyStatus').textContent='Kategori dihapus dari daftar pilihan.'}catch(err){document.getElementById('taxonomyStatus').textContent='Gagal menghapus kategori: '+err.message}}
    if(g){const v=g.dataset.removeGenre;if(!confirm(`Hapus genre “${v}” dari daftar pilihan?\n\nData buku lama tidak akan ikut terhapus.`))return;genres=genres.filter(x=>x!==v);try{await save('book_genres',genres,'Daftar genre buku yang dapat dikelola Admin');render();document.getElementById('taxonomyStatus').textContent='Genre dihapus dari daftar pilihan.'}catch(err){document.getElementById('taxonomyStatus').textContent='Gagal menghapus genre: '+err.message}}
  });
  document.getElementById('taxonomyReload').addEventListener('click',load);

  const observer=new MutationObserver(()=>{if(!adminApp.classList.contains('hidden')&&(!categories.length&&!genres.length))load()});
  observer.observe(adminApp,{attributes:true,attributeFilter:['class']});
});