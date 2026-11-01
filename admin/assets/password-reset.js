document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('forgotPasswordBtn');
  const emailEl=document.getElementById('adminEmail');
  const status=document.getElementById('loginStatus');
  if(!btn||!emailEl||!status)return;
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
      if(!r.ok){let m=await r.text();try{m=JSON.parse(m).msg||JSON.parse(m).message||m}catch{};throw new Error(m||'Gagal mengirim email reset.');}
      status.textContent='Tautan reset sudah dikirim. Buka email Admin lalu tekan tautan pemulihan.';
    }catch(e){status.textContent='Reset gagal: '+e.message}
    finally{btn.disabled=false;}
  });
});