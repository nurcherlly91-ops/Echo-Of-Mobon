(function(){
'use strict';
const VERSION='2026.11.03.1', VKEY='eom_maintenance_version', HKEY='eom_maintenance_last_health';
function clean(){try{const prefixes=['kapita','eom_kapita','EOM_KAPITA','eom_game_center_beta'];for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&prefixes.some(p=>k.toLowerCase().startsWith(p.toLowerCase())))localStorage.removeItem(k);}localStorage.setItem(VKEY,VERSION);}catch(e){}}
async function health(){if(!navigator.onLine)return{ok:false,offline:true};try{const r=await fetch('./?eom_health='+Date.now(),{cache:'no-store'}),x={ok:r.ok,status:r.status,time:new Date().toISOString()};window.EOM_MAINTENANCE_STATUS=x;try{localStorage.setItem(HKEY,JSON.stringify(x))}catch(e){}return x}catch(e){const x={ok:false,error:String(e),time:new Date().toISOString()};window.EOM_MAINTENANCE_STATUS=x;return x}}
function init(){clean();const last=Number(sessionStorage.getItem('eom_health_checked_at')||0);if(Date.now()-last>1800000){sessionStorage.setItem('eom_health_checked_at',String(Date.now()));health();}document.addEventListener('visibilitychange',()=>{if(!document.hidden&&navigator.onLine){const x=Number(sessionStorage.getItem('eom_health_checked_at')||0);if(Date.now()-x>3600000){sessionStorage.setItem('eom_health_checked_at',String(Date.now()));health();}}});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();window.EOMMaintenance={health,clean,version:VERSION};
})();
