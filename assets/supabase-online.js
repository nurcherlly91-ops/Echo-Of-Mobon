const SUPABASE_URL = "https://gubjvfdjgcwbwntyezgs.supabase.co";
const SUPABASE_KEY = "sb_publishable_PTEMMAN_M7wpxMz34zImlg_ic357XNP";

const SB = (() => {
  const sessionKey = "eom_supabase_session";
  const baseHeaders = () => ({"apikey": SUPABASE_KEY,"Content-Type": "application/json"});
  function getSession(){try{return JSON.parse(localStorage.getItem(sessionKey)||"null")}catch{return null}}
  function setSession(s){if(s)localStorage.setItem(sessionKey,JSON.stringify(s));else localStorage.removeItem(sessionKey)}
  function authHeaders(token){const h=baseHeaders();h.Authorization=`Bearer ${token||SUPABASE_KEY}`;return h}
  async function request(path,opts={}){const res=await fetch(SUPABASE_URL+path,opts);let data=null;const text=await res.text();if(text){try{data=JSON.parse(text)}catch{data=text}}if(!res.ok){const msg=data?.message||data?.error_description||data?.hint||data?.details||data?.code||text||`HTTP ${res.status}`;throw new Error(msg)}return data}
  async function login(email,password){const data=await request("/auth/v1/token?grant_type=password",{method:"POST",headers:baseHeaders(),body:JSON.stringify({email,password})});setSession(data);return data}
  async function signup(email,password,fullName){return await request("/auth/v1/signup",{method:"POST",headers:baseHeaders(),body:JSON.stringify({email,password,data:{full_name:fullName}})})}
  async function refreshSession(){const s=getSession();if(!s?.refresh_token)return null;try{const data=await request("/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:baseHeaders(),body:JSON.stringify({refresh_token:s.refresh_token})});setSession(data);return data}catch{setSession(null);return null}}
  async function session(){let s=getSession();if(!s)return null;const expiresAt=s.expires_at||0;if(expiresAt&&Date.now()/1000>expiresAt-60)s=await refreshSession();return s}
  async function logout(){const s=getSession();if(s?.access_token){try{await request("/auth/v1/logout",{method:"POST",headers:authHeaders(s.access_token)})}catch{}}setSession(null)}
  async function select(table,query="",token=null){return await request(`/rest/v1/${table}?${query}`,{headers:authHeaders(token)})}
  async function insert(table,row,token=null){const h=authHeaders(token);h.Prefer="return=representation";return await request(`/rest/v1/${table}`,{method:"POST",headers:h,body:JSON.stringify(row)})}
  async function update(table,filter,patch,token=null){const h=authHeaders(token);h.Prefer="return=representation";return await request(`/rest/v1/${table}?${filter}`,{method:"PATCH",headers:h,body:JSON.stringify(patch)})}
  async function remove(table,filter,token=null){const h=authHeaders(token);h.Prefer="return=representation";return await request(`/rest/v1/${table}?${filter}`,{method:"DELETE",headers:h})}
  async function rpc(name,args={},token=null){return await request(`/rest/v1/rpc/${name}`,{method:"POST",headers:authHeaders(token),body:JSON.stringify(args)})}
  return {login,signup,session,logout,select,insert,update,remove,rpc,getSession,setSession}
})();

const EOMONLINE={
  categories:["Novel & Cerpen","Komik & Novel Grafis","Puisi & Drama","Fabel & Dongeng","Biografi & Autobiografi","Pengembangan Diri (Self-Improvement)","Sejarah & Budaya","Sains & Teknologi","Sosial & Politik","Filsafat & Agama","Buku Ajar & Akademik","Panduan Praktis (How-To)","Memoar & Catatan Perjalanan (Travelogue)","Referensi & Ensiklopedia"],
  levels:["TK / PAUD","SD / MI","SMP / MTs","SMA / MA / SMK","Mahasiswa","Umum"],
  esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))},
  fmtDate(s){if(!s)return"-";const d=new Date(s);return isNaN(d)?s:new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:s.includes("T")?"short":undefined}).format(d)},
  rupiah(v){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v||0))},
  populate(el,items,label){if(el)el.innerHTML=`<option value="">${label}</option>`+items.map(x=>`<option>${this.esc(x)}</option>`).join("")},
  async image(file,max=650,quality=.72){if(!file)return"";const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=data});const scale=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*scale);c.height=Math.round(im.height*scale);c.getContext("2d").drawImage(im,0,0,c.width,c.height);return c.toDataURL("image/jpeg",quality)},
  download(name,text,type="text/plain"){const b=new Blob(["\ufeff"+text],{type}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)},
  csv(rows,headers){const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;return [headers.map(h=>q(h.label)).join(","),...rows.map(r=>headers.map(h=>q(r[h.key])).join(","))].join("\n")}
};

document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close)?.close())});

(function(){
  const script=document.currentScript;
  if(!script)return;
  const base=new URL('.',script.src).href;
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  (async()=>{try{
    await load(base+'logo-chunk-1.js?v=20261101-4');
    await load(base+'logo-chunk-2.js?v=20261101-4');
    await load(base+'logo-chunk-3a.js?v=20261101-4');
    await load(base+'logo-chunk-3b.js?v=20261101-4');
    await load(base+'logo-chunk-4.js?v=20261101-4');
    await load(base+'logo-chunk-5.js?v=20261101-4');
    await load(base+'logo-loader.js?v=20261101-4');
  }catch(e){console.error('Echo of Mobon logo loader:',e)}})();
})();