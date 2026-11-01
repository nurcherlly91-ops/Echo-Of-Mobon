document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('forgotPasswordBtn');
  const emailEl=document.getElementById('adminEmail');
  const status=document.getElementById('loginStatus');

  if(btn&&emailEl&&status){
    btn.addEventListener('click',async()=>{
      const email=emailEl.value.trim();
      if(!email){status.textContent='Isi email Admin terlebih dahulu.';return;}
      btn.disabled=true;
      status.textContent='Mengirim tautan reset kata sandi...';
      try{
        const redirect='https://echoofmobon.com/admin/reset-password.html';
        const r=await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`,{
          method:'POST',
          headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
          body:JSON.stringify({email})
        });
        if(!r.ok){let m=await r.text();try{const j=JSON.parse(m);m=j.msg||j.message||m}catch{};throw new Error(m||'Gagal mengirim email reset.');}
        status.textContent='Tautan reset sudah dikirim. Buka email Admin lalu tekan tautan pemulihan.';
      }catch(e){status.textContent='Reset gagal: '+e.message}
      finally{btn.disabled=false;}
    });
  }

  const reportMap=[
    ['tab-books','Data Buku Fisik'],
    ['tab-digital','Data Buku Digital'],
    ['tab-members','Data Anggota'],
    ['tab-visitors','Buku Tamu'],
    ['tab-requests','Peminjaman & Denda']
  ];

  function addDeleteButtons(){
    document.querySelectorAll('[data-edit-book]').forEach(edit=>{
      const id=edit.dataset.editBook,cell=edit.parentElement;
      if(!cell||cell.querySelector(`[data-delete-book="${id}"]`))return;
      const b=document.createElement('button');
      b.className='btn danger admin-delete-btn';
      b.type='button';
      b.dataset.deleteBook=id;
      b.textContent='Hapus';
      cell.append(' ',b);
    });
    document.querySelectorAll('[data-edit-digital]').forEach(edit=>{
      const id=edit.dataset.editDigital,cell=edit.parentElement;
      if(!cell||cell.querySelector(`[data-delete-digital="${id}"]`))return;
      const b=document.createElement('button');
      b.className='btn danger admin-delete-btn';
      b.type='button';
      b.dataset.deleteDigital=id;
      b.textContent='Hapus';
      cell.append(' ',b);
    });
  }

  function addReportButtons(){
    reportMap.forEach(([id,title])=>{
      const panel=document.getElementById(id),head=panel?.querySelector('.panel-head');
      if(!head||head.querySelector('.report-actions'))return;
      const box=document.createElement('div');
      box.className='report-actions';
      box.innerHTML=`<button type="button" class="btn report-pdf" data-report-pdf="${id}" data-report-title="${title}">Unduh PDF</button><button type="button" class="btn ghost report-print" data-report-print="${id}" data-report-title="${title}">Print</button>`;
      head.appendChild(box);
    });
  }

  function enhance(){addDeleteButtons();addReportButtons();}
  const observer=new MutationObserver(enhance);
  observer.observe(document.body,{childList:true,subtree:true});
  enhance();

  async function sessionToken(){
    const s=await SB.session();
    if(!s?.access_token)throw new Error('Sesi Admin berakhir. Silakan login kembali.');
    return s.access_token;
  }

  document.addEventListener('click',async e=>{
    const delBook=e.target.closest('[data-delete-book]');
    if(delBook){
      const row=delBook.closest('tr');
      const title=row?.cells?.[1]?.innerText?.trim()||'buku ini';
      if(!confirm(`Hapus buku fisik “${title}”?\n\nJika buku memiliki riwayat peminjaman, sistem akan mengarsipkannya agar laporan lama tetap aman.`))return;
      delBook.disabled=true;
      try{
        const token=await sessionToken();
        const r=await SB.rpc('admin_delete_book',{p_id:delBook.dataset.deleteBook},token);
        alert(r?.archived?'Buku memiliki riwayat peminjaman, sehingga dipindahkan ke status Diarsipkan dan tidak tampil di katalog tamu.':'Buku fisik berhasil dihapus.');
        document.getElementById('refreshBtn')?.click();
      }catch(err){alert('Gagal menghapus buku: '+err.message)}finally{delBook.disabled=false}
      return;
    }

    const delDigital=e.target.closest('[data-delete-digital]');
    if(delDigital){
      const row=delDigital.closest('tr');
      const title=row?.cells?.[0]?.innerText?.trim()||'buku digital ini';
      if(!confirm(`Hapus buku digital “${title}” dari katalog?\n\nTindakan ini menghapus data buku digital dari aplikasi.`))return;
      delDigital.disabled=true;
      try{
        const token=await sessionToken();
        await SB.rpc('admin_delete_digital_book',{p_id:delDigital.dataset.deleteDigital},token);
        alert('Buku digital berhasil dihapus.');
        document.getElementById('refreshBtn')?.click();
      }catch(err){alert('Gagal menghapus buku digital: '+err.message)}finally{delDigital.disabled=false}
      return;
    }

    const pdf=e.target.closest('[data-report-pdf]');
    if(pdf){await downloadPdf(pdf.dataset.reportPdf,pdf.dataset.reportTitle);return;}
    const print=e.target.closest('[data-report-print]');
    if(print){printSection(print.dataset.reportPrint,print.dataset.reportTitle);return;}
  });

  function extractTable(table){
    const rows=[...table.querySelectorAll('tr')];
    if(!rows.length)return null;
    const allHead=[...rows[0].cells].map(c=>c.innerText.trim());
    const keep=allHead.map((h,i)=>({h,i})).filter(x=>x.h.toLowerCase()!=='aksi');
    const head=keep.map(x=>x.h);
    const body=rows.slice(1).map(r=>keep.map(x=>r.cells[x.i]?.innerText?.trim()||''));
    return {head,body};
  }

  function loadScript(src,test){
    if(test())return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const old=[...document.scripts].find(s=>s.src===src);
      if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return;}
      const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }

  async function ensurePdfLib(){
    await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);
    await loadScript('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js',()=>!!window.jspdf?.jsPDF?.API?.autoTable);
  }

  async function downloadPdf(sectionId,title){
    const section=document.getElementById(sectionId);if(!section)return;
    const tables=[...section.querySelectorAll('table')].map(extractTable).filter(Boolean);
    if(!tables.length){alert('Belum ada data untuk dibuat PDF.');return;}
    try{
      await ensurePdfLib();
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
      doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('ECHO OF MOBON',14,15);
      doc.setFontSize(11);doc.setTextColor(120,82,18);doc.text('Literasi Suara Fayfiye',14,22);
      doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');doc.setFontSize(12);doc.text(title,14,31);
      doc.setFontSize(8);doc.text('Dicetak: '+new Date().toLocaleString('id-ID'),14,37);
      let y=43;
      tables.forEach((t,i)=>{
        if(i>0){y=(doc.lastAutoTable?.finalY||y)+10;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('Bagian '+(i+1),14,y);y+=3;}
        doc.autoTable({startY:y,head:[t.head],body:t.body,theme:'grid',styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[130,91,23],textColor:[255,248,224]},alternateRowStyles:{fillColor:[250,246,235]},margin:{left:14,right:14}});
        y=doc.lastAutoTable.finalY+6;
      });
      const name=title.toLowerCase().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
      doc.save(`echo-of-mobon-${name}.pdf`);
    }catch(err){
      alert('Pembuatan PDF otomatis gagal. Sistem akan membuka mode Print; pilih “Save as PDF / Simpan sebagai PDF”.');
      printSection(sectionId,title);
    }
  }

  function printSection(sectionId,title){
    const section=document.getElementById(sectionId);if(!section)return;
    const clone=section.cloneNode(true);
    clone.querySelectorAll('button,.report-actions').forEach(x=>x.remove());
    clone.querySelectorAll('table').forEach(table=>{
      const first=table.querySelector('tr');if(!first)return;
      const heads=[...first.cells];
      heads.forEach((h,i)=>{if(h.innerText.trim().toLowerCase()==='aksi'){table.querySelectorAll('tr').forEach(r=>r.cells[i]?.remove())}});
    });
    const w=window.open('','_blank','width=1100,height=800');
    if(!w){alert('Popup diblokir browser. Izinkan popup untuk fitur Print.');return;}
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#172b3b}header{border:3px double #b4862c;padding:14px;margin-bottom:18px;text-align:center}h1{font-family:Georgia,serif;margin:0;color:#073b58}.sub{color:#9a6b19;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #b9b1a0;padding:6px;vertical-align:top}th{background:#efe2bd;color:#30220b}tr:nth-child(even){background:#faf7ef}.panel-head{display:none}h3{margin-top:20px}.print-meta{font-size:9px;color:#666;margin-bottom:12px}</style></head><body><header><h1>ECHO OF MOBON</h1><div class="sub">Literasi Suara Fayfiye</div><h2>${title}</h2></header><div class="print-meta">Dicetak: ${new Date().toLocaleString('id-ID')}</div>${clone.innerHTML}</body></html>`);
    w.document.close();w.focus();setTimeout(()=>w.print(),350);
  }
});