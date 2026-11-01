document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('resetPasswordForm');
  const status=document.getElementById('resetStatus');
  const save=document.getElementById('savePasswordBtn');
  const p1=document.getElementById('newPassword');
  const p2=document.getElementById('confirmPassword');
  const hash=new URLSearchParams(location.hash.replace(/^#/,''));
  const accessToken=hash.get('access_token');
  const err=hash.get('error_description')||hash.get('error');
  if(err){status.textContent='Tautan reset tidak valid atau sudah kedaluwarsa: '+decodeURIComponent(err);form.classList.add('hidden');return;}
  if(!accessToken){status.textContent='Tautan reset belum lengkap. Buka halaman ini melalui tautan pemulihan yang dikirim ke email Admin.';form.classList.add('hidden');return;}
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(p1.value.length<8){status.textContent='Kata sandi minimal 8 karakter.';return;}
    if(p1.value!==p2.value){status.textContent='Kedua kata sandi tidak sama.';return;}
    save.disabled=true;status.textContent='Menyimpan kata sandi baru...';
    try{
      const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{method:'PUT',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({password:p1.value})});
      if(!r.ok){let m=await r.text();try{const j=JSON.parse(m);m=j.msg||j.message||m}catch{};throw new Error(m||'Gagal memperbarui kata sandi.');}
      p1.value='';p2.value='';form.classList.add('hidden');status.innerHTML='Kata sandi Admin berhasil diperbarui. <a href="./">Masuk ke Admin</a>.';
      history.replaceState(null,'',location.pathname);
    }catch(e){status.textContent='Gagal: '+e.message}
    finally{save.disabled=false;}
  });
});