document.addEventListener('DOMContentLoaded',()=>{
const $=id=>document.getElementById(id);let token=null,user=null,data={books:[],digital:[],members:[],visitors:[],requests:[],loans:[],fines:[],settings:[]},digitalCover='';
const loadHealth=document.createElement('div');
loadHealth.id='adminLoadHealth';loadHealth.className='admin-load-health';
loadHealth.setAttribute('role','status');loadHealth.setAttribute('aria-live','polite');
document.querySelector('#adminApp .admin-head')?.after(loadHealth);
function showHealth(message,type='loading'){
 if(!loadHealth)return;
 loadHealth.textContent=message;loadHealth.dataset.state=type;
}
EOMONLINE.populate($('bookCategory'),EOMONLINE.categories,'Pilih kategori');EOMONLINE.populate($('bookLevel'),EOMONLINE.levels,'Pilih tingkat');EOMONLINE.populate($('digitalCategory'),EOMONLINE.categories,'Pilih kategori');
function loginView(on){$('loginCard').classList.toggle('hidden',!on);$('adminApp').classList.toggle('hidden',on);$('logoutBtn').classList.toggle('hidden',on)}
async function ensureAuth(){
 try{
  const s=await SB.session();
  if(!s?.access_token){loginView(true);$('loginStatus').textContent='Sesi Admin berakhir. Silakan masuk kembali.';return;}
  token=s.access_token;user=s.user;
  const info=await SB.rpc('admin_session_info',{},token),p=Array.isArray(info)?info[0]:info;
  if(!p?.allowed){await SB.logout();throw new Error('Akun ini belum memiliki akses Admin.');}
  loginView(false);
  await refreshAll();
 }catch(e){
  loginView(true);
  $('loginStatus').textContent=e.message||'Tidak dapat memverifikasi sesi Admin. Silakan masuk kembali.';
 }
}
$('loginForm').onsubmit=async e=>{e.preventDefault();$('loginStatus').textContent='Memeriksa akses...';try{await SB.login($('adminEmail').value.trim(),$('adminPassword').value);$('adminPassword').value='';await ensureAuth()}catch(err){$('loginStatus').textContent='Login gagal: '+err.message}};
$('logoutBtn').onclick=async()=>{await SB.logout();location.reload()};$('refreshBtn').onclick=refreshAll;
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.add('hidden'));b.classList.add('active');$('tab-'+b.dataset.tab).classList.remove('hidden')});
async function refreshAll(){
 showHealth('⏳ Memuat koleksi dan data perpustakaan…','loading');
 try{
  const valid=await SB.session();
  if(!valid?.access_token)throw new Error('Sesi Admin berakhir. Silakan masuk kembali.');
  token=valid.access_token;
  const d=await SB.rpc('admin_dashboard_data',{},token)||{};
  data.books=Array.isArray(d.books)?d.books:[];
  data.digital=Array.isArray(d.digital)?d.digital:[];
  data.members=Array.isArray(d.members)?d.members:[];
  data.visitors=Array.isArray(d.visitors)?d.visitors:[];
  data.requests=Array.isArray(d.requests)?d.requests:[];
  data.loans=Array.isArray(d.loans)?d.loans:[];
  data.fines=Array.isArray(d.fines)?d.fines:[];
  data.settings=Array.isArray(d.settings)?d.settings:[];
  render();
  showHealth('✅ Data berhasil dimuat: '+data.books.filter(b=>b.active!==false).length+' buku fisik, '+data.digital.length+' buku digital, '+data.members.length+' anggota, '+data.visitors.length+' kunjungan.','ok');
 }catch(e){
  const message=String(e?.message||e);
  showHealth('⚠️ Data belum berhasil dimuat. Tekan Muat Ulang. Jika tetap gagal, keluar dan login kembali. Detail: '+message.slice(0,160),'error');
  if(/jwt expired|sesi admin.*berakhir|refresh.token|invalid.jwt|token.*expired/i.test(message)){
   token=null;loginView(true);
   $('loginStatus').textContent='Sesi login Admin telah berakhir. Silakan masuk kembali agar data dan fitur dapat digunakan.';
  }else{
   alert('Data Admin belum dapat dimuat: '+message+'. Coba tekan Muat Ulang saat jaringan stabil.');
  }
 }
}
function render(){$('statBooks').textContent=data.books.filter(b=>b.active!==false).length;$('statDigital').textContent=data.digital.length;$('statMembers').textContent=data.members.length;$('statVisitors').textContent=data.visitors.length;$('statRequests').textContent=data.requests.filter(x=>x.status==='Menunggu').length;renderBooks();renderDigital();renderMembers();renderVisitors();renderRequests();renderSettings()}
function renderBooks(){
 const sequence=window.EOMRACK?.enumerate(data.books) || {ordered:data.books.filter(b=>b.active!==false),positions:new Map(),counts:new Map()};
 const archived=data.books.filter(b=>b.active===false).sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'id'));
 const rows=[...sequence.ordered,...archived];
 const shelfCount=sequence.counts.size;
 const summary='<div class="eom-rack-summary"><strong>📚 '+sequence.ordered.length+' judul aktif · '+shelfCount+' rak</strong><span>Nomor posisi rak otomatis 001, 002, 003… dan langsung tersusun ulang jika koleksi diarsipkan, dipulihkan, atau dipindah rak.</span><small>Kode koleksi/QR asli tidak diubah agar riwayat peminjaman dan label buku tetap aman.</small></div>';
 $('booksTable').innerHTML=summary+'<table><tr><th>No. Rak</th><th>Kode Tetap</th><th>Judul</th><th>Penulis</th><th>Rak</th><th>Stok</th><th>Status</th><th>Aksi</th></tr>'+
  rows.map(b=>{
   const isArchived=b.active===false,p=sequence.positions.get(String(b.id));
   return '<tr class="'+(isArchived?'eom-row-archived':'')+'"><td><b class="eom-rack-index">'+EOMONLINE.esc(p?.code||'—')+'</b></td>'+
    '<td>'+EOMONLINE.esc(b.collection_code||'-')+'</td>'+
    '<td>'+EOMONLINE.esc(b.title)+(b.genre?'<div class="eom-genre-in-admin">🏷️ '+EOMONLINE.esc(b.genre)+'</div>':'')+'</td>'+
    '<td>'+EOMONLINE.esc(b.author||'-')+'</td>'+
    '<td>'+EOMONLINE.esc(b.rack_no||'-')+'</td>'+
    '<td>'+EOMONLINE.esc((b.qty_available??0)+'/'+(b.qty_total??0))+'</td>'+
    '<td>'+EOMONLINE.esc(isArchived?'Diarsipkan':(b.book_status||'-'))+'</td>'+
    '<td><button class="btn" data-edit-book="'+EOMONLINE.esc(b.id)+'">Ubah</button> '+
    '<button class="btn ghost mini-btn" data-edit-book-genres="'+EOMONLINE.esc(b.id)+'">Genre 1–5</button> '+
    (isArchived?'<button class="btn ghost mini-btn" data-restore-book="'+EOMONLINE.esc(b.id)+'">Pulihkan</button>':
     '<button class="btn danger mini-btn" data-archive-book="'+EOMONLINE.esc(b.id)+'">Arsipkan</button>')+'</td></tr>';
  }).join('')+
  (rows.length?'':'<tr><td colspan="8">Belum ada buku fisik.</td></tr>')+'</table>'+
  (archived.length?'<p class="muted">'+archived.length+' buku diarsipkan (tidak dihitung dalam nomor urut atau katalog publik).</p>':'');
 document.querySelectorAll('[data-edit-book]').forEach(x=>x.onclick=()=>editBook(x.dataset.editBook));
 document.querySelectorAll('[data-edit-book-genres]').forEach(x=>x.onclick=()=>window.EOMMULTIGENRE?.editExisting(x.dataset.editBookGenres));
 document.querySelectorAll('[data-archive-book]').forEach(x=>x.onclick=()=>toggleArchiveBook(x.dataset.archiveBook,false));
 document.querySelectorAll('[data-restore-book]').forEach(x=>x.onclick=()=>toggleArchiveBook(x.dataset.restoreBook,true));
}
async function toggleArchiveBook(id,restore){
 const selected=data.books.find(x=>String(x.id)===String(id));
 if(!selected)return;
 const promptText=restore?
   'Pulihkan “'+selected.title+'” ke katalog? Nomor posisi rak akan dihitung ulang otomatis.':
   'Arsipkan “'+selected.title+'” dari katalog aktif?\n\nNomor urut rak akan menutup celah secara otomatis. Kode tetap, QR, dan riwayat peminjaman tidak dihapus.';
 if(!confirm(promptText))return;
 try{
   const s=await SB.session();if(!s?.access_token)throw new Error('Sesi Admin berakhir. Silakan login kembali.');
   const current=await SB.rpc('admin_dashboard_data',{},s.access_token)||{};
   const live=(current.books||[]).find(x=>String(x.id)===String(id));
   if(!live)throw new Error('Buku tidak ditemukan pada katalog.');
   if(!restore){
     const openLoans=(current.loans||[]).filter(l=>String(l.book_id)===String(id)&&['Dipinjam','Terlambat'].includes(l.status));
     const openRequests=(current.requests||[]).filter(x=>String(x.book_id)===String(id)&&x.status==='Menunggu');
     if(openLoans.length||openRequests.length)throw new Error('Buku masih dipinjam atau memiliki permohonan aktif. Selesaikan dahulu sebelum diarsipkan.');
   }
   await SB.rpc('admin_update_book',{p_id:id,p_data:{active:!!restore}},s.access_token);
   await refreshAll();
   alert(restore?'Buku berhasil dipulihkan. Nomor urut rak telah disesuaikan.':'Buku telah diarsipkan. Nomor urut rak aktif langsung tersusun ulang.');
 }catch(e){alert('Gagal mengubah status buku: '+e.message);}
}
async function editBook(id){const b=data.books.find(x=>x.id===id);if(!b)return;const title=prompt('Judul buku:',b.title||'');if(title===null)return;const author=prompt('Penulis:',b.author||'');if(author===null)return;const category=prompt('Kategori:',b.category||'');if(category===null)return;const level=prompt('Tingkat pembaca:',b.reader_level||'');if(level===null)return;const rack=prompt('Nomor rak:',b.rack_no??1);if(rack===null)return;const total=prompt('Jumlah total:',b.qty_total??1);if(total===null)return;const available=prompt('Jumlah tersedia:',b.qty_available??0);if(available===null)return;const status=prompt('Status buku:',b.book_status||'Tersedia');if(status===null)return;const description=prompt('Deskripsi:',b.description||'');if(description===null)return;try{await SB.rpc('admin_update_book',{p_id:id,p_data:{title,author,category,reader_level:level,rack_no:Number(rack||1),qty_total:Number(total||0),qty_available:Number(available||0),book_status:status,description}},token);await refreshAll();alert('Data buku berhasil disimpan.')}catch(e){alert('Gagal menyimpan: '+e.message)}}
$('addBookBtn').onclick=()=>{$('bookForm').reset();$('bookQty').value=1;$('bookDialog').showModal()};
$('bookForm').onsubmit=async e=>{e.preventDefault();const rack=Number($('bookRack').value||1),qty=Number($('bookQty').value||1);try{await SB.insert('books',{title:$('bookTitle').value.trim(),author:$('bookAuthor').value.trim()||null,category:$('bookCategory').value||null,reader_level:$('bookLevel').value||null,rack_no:rack,qty_total:qty,qty_available:qty,book_status:'Tersedia',description:$('bookDescription').value.trim()||null,active:true},token);$('bookDialog').close();await refreshAll();alert('Buku berhasil ditambahkan.')}catch(err){alert(err.message)}};
function renderDigital(){$('digitalTable').innerHTML=`<table><tr><th>Judul</th><th>Penulis</th><th>Kategori</th><th>Jenis</th><th>Dibaca</th><th>Status</th><th>Aksi</th></tr>${data.digital.map(b=>`<tr><td>${EOMONLINE.esc(b.title)}</td><td>${EOMONLINE.esc(b.author||'-')}</td><td>${EOMONLINE.esc(b.category||'-')}</td><td>${String(b.external_url||'').includes('/digital-books/')?'PDF':EOMONLINE.esc(b.content_type||'-')}</td><td>${b.read_count||0}</td><td>${b.is_published?'Published':'Draft'}</td><td><button class="btn" data-edit-digital="${b.id}">Ubah</button></td></tr>`).join('')||'<tr><td colspan="7">Belum ada buku digital.</td></tr>'}</table>`;document.querySelectorAll('[data-edit-digital]').forEach(x=>x.onclick=()=>editDigital(x.dataset.editDigital))}
async function editDigital(id){const b=data.digital.find(x=>x.id===id);if(!b)return;const title=prompt('Judul buku digital:',b.title||'');if(title===null)return;const author=prompt('Penulis:',b.author||'');if(author===null)return;const category=prompt('Kategori:',b.category||'');if(category===null)return;const summary=prompt('Ringkasan:',b.summary||'');if(summary===null)return;const copyright_status=prompt('Status hak cipta (Original/Public Domain/Licensed/Other):',b.copyright_status||'Original');if(copyright_status===null)return;const published=confirm('Publikasikan buku ini? Klik OK untuk Published, Cancel untuk Draft.');try{await SB.rpc('admin_update_digital_book',{p_id:id,p_data:{title,author,category,summary,copyright_status,is_published:published}},token);await refreshAll();alert('Data buku digital berhasil disimpan.')}catch(e){alert('Gagal menyimpan: '+e.message)}}
$('addDigitalBtn').onclick=()=>{digitalCover='';$('digitalForm').reset();$('digitalDialog').showModal()};$('digitalCover').onchange=async e=>{if(e.target.files[0])digitalCover=await EOMONLINE.image(e.target.files[0],900,.78)};
function safeName(n='buku.pdf'){return n.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-')||'buku.pdf'}
async function uploadPdf(file){if(file.size>50*1024*1024)throw new Error('Ukuran PDF maksimal 50 MB.');const s=await SB.session();if(!s?.access_token)throw new Error('Sesi Admin berakhir. Silakan login kembali.');token=s.access_token;const name=`${Date.now()}-${safeName(file.name)}`,url=`${SUPABASE_URL}/storage/v1/object/digital-books/${encodeURIComponent(name)}`;const r=await fetch(url,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/pdf','x-upsert':'false'},body:file});if(!r.ok)throw new Error((await r.text())||'Upload PDF gagal');return `${SUPABASE_URL}/storage/v1/object/public/digital-books/${encodeURIComponent(name)}`}
$('digitalForm').onsubmit=async e=>{e.preventDefault();try{const file=$('digitalPdf').files[0];let external=$('digitalUrl').value.trim()||null;if(file){if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name))throw new Error('File harus PDF.');external=await uploadPdf(file)}if(!external)throw new Error('Pilih PDF atau isi URL legal.');await SB.insert('digital_books',{title:$('digitalTitle').value.trim(),author:$('digitalAuthor').value.trim()||null,category:$('digitalCategory').value||null,cover_url:digitalCover||null,copyright_status:$('digitalCopyright').value,content_type:'url',external_url:external,safe_content:true,is_published:true,read_count:0},token);$('digitalDialog').close();await refreshAll();alert('Buku digital berhasil dipublikasikan.')}catch(err){alert(err.message)}};
function renderMembers(){$('membersTable').innerHTML=`<table><tr><th>No Anggota</th><th>Nama</th><th>Kontak</th><th>Status</th><th>Keanggotaan</th><th>Aksi</th></tr>${data.members.map(m=>`<tr><td>${EOMONLINE.esc(m.member_no||'-')}</td><td>${EOMONLINE.esc(m.full_name)}</td><td>${EOMONLINE.esc(m.phone||'-')}</td><td>${EOMONLINE.esc(m.occupation_status||'-')}</td><td>${EOMONLINE.esc(m.membership_status||'-')}</td><td><button class="btn" data-edit-member="${m.id}">Ubah</button></td></tr>`).join('')||'<tr><td colspan="6">Belum ada anggota.</td></tr>'}</table>`;document.querySelectorAll('[data-edit-member]').forEach(x=>x.onclick=()=>editMember(x.dataset.editMember))}
async function editMember(id){const m=data.members.find(x=>x.id===id);if(!m)return;const full_name=prompt('Nama lengkap:',m.full_name||'');if(full_name===null)return;const phone=prompt('Nomor kontak:',m.phone||'');if(phone===null)return;const address=prompt('Alamat:',m.address||'');if(address===null)return;const occupation_status=prompt('Status/pekerjaan:',m.occupation_status||'');if(occupation_status===null)return;const school_institution=prompt('Sekolah/instansi:',m.school_institution||'');if(school_institution===null)return;const membership_status=prompt('Status keanggotaan:',m.membership_status||'Aktif');if(membership_status===null)return;const notes=prompt('Catatan:',m.notes||'');if(notes===null)return;try{await SB.rpc('admin_update_member',{p_id:id,p_data:{full_name,phone,address,occupation_status,school_institution,membership_status,notes}},token);await refreshAll();alert('Data anggota berhasil disimpan.')}catch(e){alert('Gagal menyimpan: '+e.message)}}
function renderVisitors(){$('visitorsTable').innerHTML=`<table><tr><th>Waktu</th><th>Nama</th><th>Kontak</th><th>Alamat</th><th>Status</th><th>Tujuan</th></tr>${data.visitors.map(v=>`<tr><td>${v.created_at?new Date(v.created_at).toLocaleString('id-ID'):'-'}</td><td>${EOMONLINE.esc(v.full_name||'-')}</td><td>${EOMONLINE.esc(v.phone||'-')}</td><td>${EOMONLINE.esc(v.address||'-')}</td><td>${EOMONLINE.esc(v.visitor_status||'-')}</td><td>${EOMONLINE.esc(v.purpose||'-')}</td></tr>`).join('')||'<tr><td colspan="6">Belum ada kunjungan.</td></tr>'}</table>`}
async function approve(id){const r=data.requests.find(x=>x.id===id);if(!r)return;const settings=Object.fromEntries(data.settings.map(x=>[x.key,x.value]));let due=r.requested_return_date;if(!due){const d=new Date();d.setDate(d.getDate()+Number(settings.default_loan_days||7));due=d.toISOString().slice(0,10)}try{await SB.insert('loans',{request_id:r.id,member_id:r.member_id,borrower_name:r.borrower_name,borrower_phone:r.borrower_phone,book_id:r.book_id,due_date:due,status:'Dipinjam',created_by:user.id,delivery_requested:!!r.delivery_requested,delivery_address:r.delivery_address||null,delivery_fee:Number(r.delivery_fee||0)},token);await SB.update('loan_requests',`id=eq.${id}`,{status:'Disetujui'},token);await refreshAll()}catch(e){alert(e.message)}}
async function reject(id){try{await SB.update('loan_requests',`id=eq.${id}`,{status:'Ditolak'},token);await refreshAll()}catch(e){alert(e.message)}}
async function returned(id){try{await SB.update('loans',`id=eq.${id}`,{status:'Dikembalikan',returned_at:new Date().toISOString()},token);try{await SB.rpc('refresh_loan_fine',{p_loan_id:id},token)}catch{}await refreshAll()}catch(e){alert(e.message)}}
function renderRequests(){const pending=data.requests.filter(r=>r.status==='Menunggu');const book=id=>data.books.find(b=>b.id===id)?.title||'-';$('requestsTable').innerHTML=`${pending.length?`<h3>Permohonan Menunggu</h3><table><tr><th>Peminjam</th><th>Buku</th><th>Jatuh Tempo</th><th>Pengantaran</th><th>Aksi</th></tr>${pending.map(r=>`<tr><td>${EOMONLINE.esc(r.borrower_name)}<br><small>${EOMONLINE.esc(r.borrower_phone||'')}</small></td><td>${EOMONLINE.esc(book(r.book_id))}</td><td>${EOMONLINE.esc(r.requested_return_date||'-')}</td><td>${r.delivery_requested?'Ya':'Tidak'}</td><td><button class="btn primary" data-approve="${r.id}">Setujui</button> <button class="btn danger" data-reject="${r.id}">Tolak</button></td></tr>`).join('')}</table>`:''}<h3>Peminjaman</h3><table><tr><th>Peminjam</th><th>Buku</th><th>Jatuh Tempo</th><th>Status</th><th>Denda</th><th>Pengantaran</th><th>Aksi</th></tr>${data.loans.map(l=>`<tr><td>${EOMONLINE.esc(l.borrower_name)}</td><td>${EOMONLINE.esc(l.book_title||book(l.book_id))}</td><td>${EOMONLINE.esc(l.due_date||'-')}</td><td>${EOMONLINE.esc(l.status)}</td><td>${EOMONLINE.rupiah(l.fine_amount||0)}</td><td>${l.delivery_requested?'Ya - '+EOMONLINE.rupiah(l.delivery_fee||0):'Tidak'}</td><td>${['Dipinjam','Terlambat'].includes(l.status)?`<button class="btn primary" data-return="${l.id}">Kembalikan</button>`:''}</td></tr>`).join('')||'<tr><td colspan="7">Belum ada peminjaman.</td></tr>'}</table>`;document.querySelectorAll('[data-approve]').forEach(x=>x.onclick=()=>approve(x.dataset.approve));document.querySelectorAll('[data-reject]').forEach(x=>x.onclick=()=>reject(x.dataset.reject));document.querySelectorAll('[data-return]').forEach(x=>x.onclick=()=>returned(x.dataset.return))}
function setting(key,def=''){const x=data.settings.find(s=>s.key===key);return x?x.value:def}
function renderSettings(){$('setInstitution').value=setting('institution_name','');$('setAdminPhone').value=setting('admin_phone','');$('setLoanDays').value=setting('default_loan_days',10);$('setDailyFine').value=setting('daily_fine',0);$('setDeliveryFee').value=setting('delivery_fee',0);const cats=setting('book_categories',[]),genres=setting('book_genres',[]);$('setCategories').value=Array.isArray(cats)?cats.join('\n'):String(cats||'');$('setGenres').value=Array.isArray(genres)?genres.join('\n'):String(genres||'')}
$('settingsForm').onsubmit=async e=>{e.preventDefault();$('settingsStatus').textContent='Menyimpan...';const rows=[['institution_name',$('setInstitution').value.trim(),'Nama pengelola aplikasi'],['admin_phone',$('setAdminPhone').value.trim(),'Nomor Admin / WhatsApp yang tampil di Portal Tamu'],['default_loan_days',Number($('setLoanDays').value||10),'Lama peminjaman standar dalam hari'],['daily_fine',Number($('setDailyFine').value||0),'Denda keterlambatan per hari dalam Rupiah'],['delivery_fee',Number($('setDeliveryFee').value||0),'Biaya pengantaran buku dalam Rupiah'],['book_categories',$('setCategories').value.split('\n').map(x=>x.trim()).filter(Boolean),'Daftar kategori buku yang dapat dikelola Admin'],['book_genres',$('setGenres').value.split('\n').map(x=>x.trim()).filter(Boolean),'Daftar genre buku yang dapat dikelola Admin']];try{for(const [p_key,p_value,p_description] of rows)await SB.rpc('admin_save_setting',{p_key,p_value,p_description},token);$('settingsStatus').textContent='Pengaturan berhasil disimpan.';await refreshAll()}catch(err){$('settingsStatus').textContent='Gagal: '+err.message}}
window.addEventListener('eom:admin-session-expired',()=>{
 token=null;loginView(true);
 $('loginStatus').textContent='Sesi login Admin telah berakhir. Silakan masuk kembali.';
});
window.addEventListener('eom:admin-session-refreshed',()=>{
 const current=SB.getSession();if(current?.access_token)token=current.access_token;
});
document.addEventListener('visibilitychange',async()=>{
 if(document.hidden||$('adminApp').classList.contains('hidden'))return;
 try{
  const current=await SB.session();
  if(current?.access_token)token=current.access_token;
  else{token=null;loginView(true);$('loginStatus').textContent='Sesi Admin berakhir. Silakan masuk kembali.';}
 }catch(e){console.warn('Pembaruan sesi saat membuka tab gagal:',e.message);}
});
ensureAuth();
});