const SUPABASE_URL = "https://gubjvfdjgcwbwntyezgs.supabase.co";
const SUPABASE_KEY = "sb_publishable_PTEMMAN_M7wpxMz34zImlg_ic357XNP";

const SB = (() => {
  const sessionKey = "eom_supabase_session";
  let refreshing = null;
  const baseHeaders = () => ({"apikey": SUPABASE_KEY,"Content-Type":"application/json"});
  function getSession(){
    try{return JSON.parse(localStorage.getItem(sessionKey)||"null");}
    catch{return null;}
  }
  function jwtExpiry(token){
    if(typeof token!=="string"||token.split(".").length!==3)return 0;
    try{
      const encoded=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
      const padding="=".repeat((4-encoded.length%4)%4);
      const claims=JSON.parse(atob(encoded+padding));
      return Number(claims.exp)||0;
    }catch{return 0;}
  }
  function setSession(s){
    if(!s){localStorage.removeItem(sessionKey);return;}
    const expiry=Number(s.expires_at)||jwtExpiry(s.access_token)||
      (s.expires_in?Math.floor(Date.now()/1000)+Number(s.expires_in):0);
    const safe={...s,expires_at:expiry};
    localStorage.setItem(sessionKey,JSON.stringify(safe));
  }
  function announce(name){
    try{window.dispatchEvent(new Event(name));}catch(e){}
  }
  function isInvalidRefresh(e){
    return /invalid.refresh.token|refresh.token.not.found|refresh_token_not_found|already.used|invalid.grant|session.not.found|refresh.token.expired|token.revoked/i.test(String(e?.message||e||""));
  }
  function authHeaders(token){
    const headers=baseHeaders();
    headers.Authorization="Bearer "+(token||SUPABASE_KEY);
    return headers;
  }
  async function rawRequest(path,opts={}){
    const res=await fetch(SUPABASE_URL+path,opts);
    const body=await res.text();
    let data=null;
    if(body){try{data=JSON.parse(body);}catch{data=body;}}
    if(!res.ok){
      const message=data?.message||data?.error_description||data?.msg||data?.hint||
        data?.details||data?.error||data?.code||body||"HTTP "+res.status;
      const error=new Error(String(message));
      error.status=res.status;
      error.code=data?.code||"";
      throw error;
    }
    return data;
  }
  async function refreshSession(){
    if(refreshing)return refreshing;
    refreshing=(async()=>{
      const before=getSession();
      if(!before?.refresh_token){
        setSession(null);announce("eom:admin-session-expired");return null;
      }
      try{
        const response=await rawRequest("/auth/v1/token?grant_type=refresh_token",{
          method:"POST",headers:baseHeaders(),
          body:JSON.stringify({refresh_token:before.refresh_token})
        });
        if(!response?.access_token||!response?.refresh_token)throw new Error("Sesi baru tidak lengkap.");
        setSession(response);
        announce("eom:admin-session-refreshed");
        return getSession();
      }catch(e){
        const latest=getSession();
        // A second tab may already have rotated the refresh token.
        if(latest?.refresh_token&&latest.refresh_token!==before.refresh_token&&latest.access_token){
          return latest;
        }
        if(isInvalidRefresh(e)||e.status===400||e.status===401){
          setSession(null);
          announce("eom:admin-session-expired");
          return null;
        }
        // Connectivity problems should not silently destroy a valid login.
        throw e;
      }
    })();
    try{return await refreshing;}finally{refreshing=null;}
  }
  async function session(){
    let current=getSession();
    if(!current?.access_token)return null;
    const expiry=Number(current.expires_at)||jwtExpiry(current.access_token);
    if(expiry){
      if(Date.now()/1000>=expiry-90)current=await refreshSession();
    }else if(current.refresh_token){
      current=await refreshSession();
    }
    if(!current?.access_token)return null;
    return current;
  }
  async function login(email,password){
    const data=await rawRequest("/auth/v1/token?grant_type=password",{
      method:"POST",headers:baseHeaders(),body:JSON.stringify({email,password})
    });
    setSession(data);
    return getSession();
  }
  async function signup(email,password,fullName){
    return rawRequest("/auth/v1/signup",{
      method:"POST",headers:baseHeaders(),
      body:JSON.stringify({email,password,data:{full_name:fullName}})
    });
  }
  async function request(path,opts={}){
    try{return await rawRequest(path,opts);}
    catch(e){
      const authorization=opts?.headers?.Authorization||opts?.headers?.authorization||"";
      if(!/^Bearer\s+/i.test(authorization)||path.startsWith("/auth/v1/")||
        !/jwt expired|token.*expired|expired.*jwt|pgrst301/i.test(String(e.message||""))){
        throw e;
      }
      const oldToken=authorization.replace(/^Bearer\s+/i,"").trim();
      if(!oldToken||oldToken===SUPABASE_KEY)throw e;
      let current=getSession();
      if(!current?.access_token)throw new Error("Sesi Admin telah berakhir. Silakan masuk kembali.");
      if(current.access_token===oldToken)current=await refreshSession();
      else current=await session();
      if(!current?.access_token)throw new Error("Sesi Admin telah berakhir. Silakan masuk kembali.");
      const retried={...opts,headers:{...opts.headers,Authorization:"Bearer "+current.access_token}};
      return rawRequest(path,retried);
    }
  }
  async function loggedInToken(token){
    if(!token||token===SUPABASE_KEY)return token;
    const current=await session();
    if(!current?.access_token)throw new Error("Sesi Admin telah berakhir. Silakan masuk kembali.");
    return current.access_token;
  }
  async function logout(){
    const old=getSession();
    setSession(null);
    if(old?.access_token){
      try{await rawRequest("/auth/v1/logout",{method:"POST",headers:authHeaders(old.access_token)});}
      catch(e){}
    }
  }
  async function select(table,query="",token=null){
    return request("/rest/v1/"+table+"?"+query,{headers:authHeaders(await loggedInToken(token))});
  }
  async function insert(table,row,token=null){
    const headers=authHeaders(await loggedInToken(token));
    headers.Prefer="return=representation";
    return request("/rest/v1/"+table,{method:"POST",headers,body:JSON.stringify(row)});
  }
  async function update(table,filter,patch,token=null){
    const headers=authHeaders(await loggedInToken(token));
    headers.Prefer="return=representation";
    return request("/rest/v1/"+table+"?"+filter,{method:"PATCH",headers,body:JSON.stringify(patch)});
  }
  async function remove(table,filter,token=null){
    return request("/rest/v1/"+table+"?"+filter,{
      method:"DELETE",headers:authHeaders(await loggedInToken(token))
    });
  }
  async function rpc(name,args={},token=null){
    return request("/rest/v1/rpc/"+name,{
      method:"POST",headers:authHeaders(await loggedInToken(token)),body:JSON.stringify(args)
    });
  }
  return {login,signup,session,logout,select,insert,update,remove,rpc,getSession,setSession,refreshSession};
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