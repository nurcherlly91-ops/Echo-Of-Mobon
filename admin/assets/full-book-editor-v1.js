(function(){
'use strict';
function init(){
 if(window.__eomFullBookEdit||!document.getElementById('booksTable')||typeof SB==='undefined')return;
 window.__eomFullBookEdit=true;
 const dialog=document.createElement('dialog');
 dialog.id='eomFullBookDialog';dialog.className='eom-full-edit-dialog';
 dialog.innerHTML='<form id="eomFullBookForm" class="modal eom-full-edit-form">'+
 '<header class="eom-edit-head"><div><small>PERPUSTAKAAN FISIK · ECHO OF MOBON</small><h2>✏️ Edit Lengkap Buku Fisik</h2></div><button id="eomEditClose" type="button" class="close" aria-label="Tutup">×</button></header>'+
 '<p class="muted">Perbaiki data buku yang sudah tersimpan tanpa membuat entri baru.</p>'+
 '<div id="eomEditIdentity" class="eom-edit-identity"></div>'+
 '<div class="eom-edit-grid"><label>Judul Buku *<input id="eomEditTitle" maxlength="250" required></label><label>Nama Penulis<input id="eomEditAuthor" maxlength="240"></label></div>'+
 '<div class="eom-edit-grid"><label>Kategori<select id="eomEditCategory"></select></label><label>Tingkat Pembaca<select id="eomEditLevel"></select></label></div>'+
 '<div class="eom-edit-genres"><div class="eom-edit-genres-header"><strong>🏷️ Genre Buku (Pilih 1–5)</strong><b id="eomEditGenreCount">0/5</b></div>'+
 '<p>Genre dapat lebih dari satu sesuai isi buku, misalnya Fiksi, Horor, Misteri.</p>'+
 '<input type="search" id="eomEditGenreSearch" placeholder="Cari genre..." aria-label="Cari genre">'+
 '<div id="eomEditChosenGenres" class="eom-edit-chosen-genres"></div>'+
 '<div id="eomEditGenres" class="eom-edit-genre-grid" role="group" aria-label="Pilihan genre"></div></div>'+
 '<div class="eom-edit-grid"><label>Penerbit<input id="eomEditPublisher"></label><label>Tahun Terbit<input id="eomEditYear" type="number" min="1000" max="2100"></label></div>'+
 '<label>ISBN (jika ada)<input id="eomEditIsbn" maxlength="32"></label>'+
 '<section class="eom-edit-cover"><div><img id="eomEditCoverPreview" class="hidden" alt="Sampul buku"><div id="eomEditNoCover" class="eom-edit-no-cover">📖<small>Belum ada foto</small></div></div>'+
 '<div><strong>📸 Foto Sampul Buku</strong><p>Foto lama tetap tersimpan jika tidak diganti.</p>'+
 '<label class="btn ghost eom-edit-upload">Pilih Foto Baru<input id="eomEditCoverFile" type="file" accept="image/*"></label>'+
 '<label class="eom-edit-remove-cover"><input id="eomEditRemoveCover" type="checkbox"> Hapus foto sampul lama</label>'+
 '<small>Foto maksimal 15 MB, dikompresi sebelum disimpan.</small></div></section>'+
 '<div class="eom-edit-grid"><label>Nomor Rak *<input id="eomEditRack" type="number" min="1" step="1" required></label>'+
 '<label>Status Buku<select id="eomEditStatus"><option>Tersedia</option><option>Rusak</option><option>Hilang</option><option>Nonaktif</option></select></label></div>'+
 '<div class="eom-edit-grid"><label>Jumlah Total *<input id="eomEditTotal" type="number" min="0" required></label><label>Jumlah Tersedia *<input id="eomEditAvailable" type="number" min="0" required></label></div>'+
 '<p class="eom-edit-hint">Jumlah tersedia tidak boleh melebihi jumlah total. Nomor posisi rak diperbarui otomatis, tetapi kode koleksi dan QR tetap permanen.</p>'+
 '<label>Deskripsi / Sinopsis<textarea id="eomEditDescription" rows="5"></textarea></label>'+
 '<div id="eomEditMessage" role="status" aria-live="polite" class="eom-edit-message"></div>'+
 '<div class="eom-edit-actions"><button id="eomEditCancel" type="button" class="btn ghost">Batal</button><button id="eomEditSave" type="submit" class="btn primary">💾 Simpan Semua Perubahan</button></div></form>';
 document.body.appendChild(dialog);
 const $=id=>document.getElementById(id),form=$('eomFullBookForm');
 let book=null,genres=[],choices=[],replacement=null,originalCover='',busy=false,serial=0,loading=false;
 const knownGenres=['Fiksi','Nonfiksi','Horor','Misteri','Thriller','Fantasi','Romantis','Petualangan','Anak-anak','Dongeng','Fabel','Cerpen','Komik','Sains','Budaya','Sejarah','Pendidikan','Agama','Umum'];
 function message(text,bad=false){
   $('eomEditMessage').textContent=text||'';
   $('eomEditMessage').classList.toggle('error',bad);
 }
 function unique(a){const seen=new Set();return (a||[]).map(x=>String(x||'').trim()).filter(x=>{const key=x.toLocaleLowerCase('id');if(!key||seen.has(key))return false;seen.add(key);return true;});}
 function splitGenres(s){return unique(String(s||'').split(/\s*,\s*/)).slice(0,5);}
 function selectOptions(select,values,current,label){
   select.replaceChildren();
   const first=document.createElement('option');first.value='';first.textContent=label;select.appendChild(first);
   for(const value of unique([...(values||[]),...(current?[current]:[])])){
     const item=document.createElement('option');item.value=value;item.textContent=value;select.appendChild(item);
   }
   select.value=current||'';
 }
 function showGenres(){
   $('eomEditGenreCount').textContent=genres.length+'/5';
   const chosen=$('eomEditChosenGenres');chosen.replaceChildren();
   if(!genres.length){const e=document.createElement('em');e.textContent='Belum ada genre dipilih';chosen.appendChild(e);}
   for(const genre of genres){
     const button=document.createElement('button');button.type='button';button.className='eom-edit-genre-pill';
     button.textContent=genre+' ×';
     button.setAttribute('aria-label','Hapus '+genre);
     button.onclick=()=>{genres=genres.filter(x=>x!==genre);showGenres();};
     chosen.appendChild(button);
   }
   const box=$('eomEditGenres');box.replaceChildren();
   const search=$('eomEditGenreSearch').value.trim().toLocaleLowerCase('id');
   const visible=choices.filter(x=>x.toLocaleLowerCase('id').includes(search));
   for(const name of visible){
     const label=document.createElement('label');label.className='eom-edit-genre-item';
     const check=document.createElement('input');check.type='checkbox';check.value=name;check.checked=genres.includes(name);
     check.onchange=()=>{
       if(check.checked){
         if(genres.length>=5){check.checked=false;message('Maksimal lima genre. Hapus salah satu pilihan dahulu.',true);return;}
         genres=unique([...genres,name]);
       }else genres=genres.filter(x=>x!==name);
       message('');showGenres();
     };
     const span=document.createElement('span');span.textContent=name;label.append(check,span);box.appendChild(label);
   }
   if(!visible.length){const note=document.createElement('small');note.textContent='Genre tidak ditemukan.';box.appendChild(note);}
 }
 function preview(src){
   const img=$('eomEditCoverPreview'),empty=$('eomEditNoCover');
   if(typeof src==='string'&&/^(data:image\/|https:\/\/)/i.test(src)){
     img.src=src;img.classList.remove('hidden');empty.classList.add('hidden');
   }else{img.removeAttribute('src');img.classList.add('hidden');empty.classList.remove('hidden');}
 }
 async function open(id){
   if(busy||loading)return;
   const run=++serial;loading=true;book=null;replacement=null;
   if(!dialog.open)dialog.showModal();
   form.classList.add('loading');message('⏳ Memuat data buku dan foto sampul...');
   try{
     const s=await SB.session();if(!s?.access_token)throw new Error('Sesi admin berakhir. Masuk kembali.');
     const [rows,d]=await Promise.all([
       SB.select('books','select=*&id=eq.'+encodeURIComponent(id)+'&limit=1',s.access_token),
       SB.rpc('admin_dashboard_data',{},s.access_token)
     ]);
     if(run!==serial||!dialog.open)return;
     if(!rows?.length)throw new Error('Buku tidak ditemukan.');
     book=rows[0];
     const settings=Array.isArray(d?.settings)?d.settings:[];
     const val=(key,fallback)=>{const result=settings.find(x=>x.key===key)?.value;return Array.isArray(result)?result:fallback;};
     $('eomEditIdentity').textContent='Kode koleksi: '+(book.collection_code||'—')+' · QR dan riwayat peminjaman tidak berubah.';
     $('eomEditTitle').value=book.title||'';
     $('eomEditAuthor').value=book.author||'';
     selectOptions($('eomEditCategory'),val('book_categories',EOMONLINE.categories),book.category,'Pilih kategori');
     selectOptions($('eomEditLevel'),EOMONLINE.levels,book.reader_level,'Pilih tingkat');
     $('eomEditPublisher').value=book.publisher||'';
     $('eomEditYear').value=book.publication_year??'';
     $('eomEditIsbn').value=book.isbn||'';
     $('eomEditRack').value=book.rack_no||1;
     $('eomEditTotal').value=book.qty_total??1;
     $('eomEditAvailable').value=book.qty_available??1;
     $('eomEditStatus').value=book.book_status||'Tersedia';
     $('eomEditDescription').value=book.description||'';
     $('eomEditCoverFile').value='';$('eomEditRemoveCover').checked=false;
     originalCover=book.cover_url||'';preview(originalCover);
     genres=splitGenres(book.genre);
     choices=unique([...val('book_genres',knownGenres),...knownGenres,...genres]);
     $('eomEditGenreSearch').value='';showGenres();message('');
   }catch(e){if(run===serial)message('❌ Data gagal dibuka: '+e.message,true);}
   finally{if(run===serial){loading=false;form.classList.remove('loading');}}
 }
 function close(){if(busy)return;serial++;dialog.close();book=null;replacement=null;}
 $('eomEditClose').onclick=close;$('eomEditCancel').onclick=close;
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 dialog.addEventListener('close',()=>serial++);
 $('eomEditGenreSearch').oninput=showGenres;
 $('eomEditRemoveCover').onchange=e=>{
   if(e.target.checked){replacement=null;$('eomEditCoverFile').value='';preview('');}
   else preview(originalCover);
 };
 $('eomEditCoverFile').onchange=async()=>{
   const file=$('eomEditCoverFile').files?.[0];if(!file)return;
   if(!file.type.startsWith('image/')||file.size>15*1024*1024){
     message('Pilih foto JPG/PNG/WebP dengan ukuran maksimal 15 MB.',true);
     $('eomEditCoverFile').value='';return;
   }
   const run=serial;message('📷 Memproses foto...');
   try{
     const cover=await EOMONLINE.image(file,900,.78);
     if(run!==serial)return;
     if(!cover.startsWith('data:image/')||cover.length>1000000)throw new Error('Foto terlalu besar setelah dikompresi.');
     replacement=cover;$('eomEditRemoveCover').checked=false;preview(cover);
     message('✅ Foto baru siap. Tekan Simpan Semua Perubahan.');
   }catch(e){if(run===serial){replacement=null;message('Gagal membaca foto: '+e.message,true);}}
 };
 form.addEventListener('submit',async e=>{
   e.preventDefault();if(busy||loading)return;
   if(!book){message('Data buku belum lengkap dimuat.',true);return;}
   const title=$('eomEditTitle').value.trim();
   if(!title){message('Judul wajib diisi.',true);return;}
   if(genres.length<1||genres.length>5){message('Pilih 1–5 genre terlebih dahulu.',true);return;}
   const rack=Number($('eomEditRack').value),total=Number($('eomEditTotal').value),available=Number($('eomEditAvailable').value);
   if(!Number.isSafeInteger(rack)||rack<1||!Number.isSafeInteger(total)||!Number.isSafeInteger(available)||total<0||available<0||available>total){
     message('Nomor rak atau jumlah stok tidak valid (stok tersedia tidak boleh melebihi total).',true);return;
   }
   const yearText=$('eomEditYear').value.trim();
   if(yearText&&(Number(yearText)<1000||Number(yearText)>2100)){message('Tahun terbit harus 1000–2100.',true);return;}
   const patch={
     title,author:$('eomEditAuthor').value.trim(),
     genre:genres.join(', '),category:$('eomEditCategory').value,
     reader_level:$('eomEditLevel').value,publisher:$('eomEditPublisher').value.trim(),
     publication_year:yearText,isbn:$('eomEditIsbn').value.trim(),
     rack_no:rack,qty_total:total,qty_available:available,
     book_status:$('eomEditStatus').value,description:$('eomEditDescription').value.trim(),
     _expected_updated_at:book.updated_at
   };
   if(replacement!==null)patch.cover_url=replacement;
   else if($('eomEditRemoveCover').checked)patch.cover_url='';
   const savedId=book.id,coverChanged=Object.hasOwn(patch,'cover_url');
   const save=$('eomEditSave');save.disabled=true;busy=true;message('⏳ Menyimpan perubahan...');
   try{
     const s=await SB.session();if(!s?.access_token)throw new Error('Sesi admin berakhir.');
     await SB.rpc('admin_update_book',{p_id:savedId,p_data:patch},s.access_token);
     dialog.close();book=null;
     document.dispatchEvent(new CustomEvent('eom:book-full-edit-saved',{detail:{id:savedId,coverChanged}}));
     document.getElementById('refreshBtn')?.click();
     alert('✅ Data buku fisik berhasil diperbarui. Kode koleksi dan riwayat peminjaman tetap aman.');
   }catch(err){message('❌ Gagal menyimpan: '+err.message,true);}
   finally{busy=false;save.disabled=false;}
 });
 window.EOMFULLBOOKEDIT={open};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();