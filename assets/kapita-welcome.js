(()=>{
if(window.__EOM_KAPITA_WELCOME_V3)return;window.__EOM_KAPITA_WELCOME_V3=true;
const KEY='eom_kapita_welcome_seen_v3';
function addStyles(){if(document.getElementById('kapitaVideoWelcomeStyle'))return;const s=document.createElement('style');s.id='kapitaVideoWelcomeStyle';s.textContent=`
#kapitaVideoWelcome{position:fixed;inset:0;z-index:2147483000;background:rgba(3,9,12,.97);display:grid;place-items:center;opacity:0;transition:opacity .9s ease;overflow:hidden}
#kapitaVideoWelcome.show{opacity:1}#kapitaVideoWelcome.hide{opacity:0;pointer-events:none}
#kapitaVideoWelcome .kv-shell{position:relative;width:100%;height:100%;display:grid;place-items:center;background:radial-gradient(circle at 50% 42%,rgba(196,147,57,.12),transparent 48%),linear-gradient(180deg,#061014,#020608)}
#kapitaVideoWelcome video{width:100%;height:100%;object-fit:contain;background:#000;opacity:0;transform:scale(1.025);transition:opacity 1s ease,transform 1.4s cubic-bezier(.2,.8,.2,1);filter:brightness(1.08) contrast(1.04) saturate(1.05)}
#kapitaVideoWelcome.show video.ready{opacity:1;transform:scale(1)}
#kapitaVideoWelcome .kv-close{position:absolute;right:max(16px,env(safe-area-inset-right));top:max(16px,env(safe-area-inset-top));z-index:3;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.42);color:white;font-size:25px;line-height:1;backdrop-filter:blur(8px)}
#kapitaVideoWelcome .kv-brand{position:absolute;left:0;right:0;bottom:max(18px,env(safe-area-inset-bottom));z-index:2;text-align:center;color:rgba(255,255,255,.86);font:600 12px/1.3 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;text-shadow:0 2px 12px #000;pointer-events:none}
@media(max-width:680px){#kapitaVideoWelcome video{object-fit:contain}#kapitaVideoWelcome .kv-brand{font-size:10px;bottom:max(12px,env(safe-area-inset-bottom))}}
@media(prefers-reduced-motion:reduce){#kapitaVideoWelcome,#kapitaVideoWelcome video{transition:none!important}}
`;document.head.appendChild(s)}
function close(root){if(!root||!root.isConnected)return;try{sessionStorage.setItem(KEY,'1')}catch{}root.classList.add('hide');const v=root.querySelector('video');try{v.pause()}catch{}setTimeout(()=>root.remove(),900)}
async function startVideo(v,root){v.muted=false;v.volume=1;try{await v.play();return}catch(e){}
  try{v.muted=true;await v.play();}catch(e){setTimeout(()=>close(root),4500)}
}
function show(){try{if(sessionStorage.getItem(KEY)==='1')return}catch{}addStyles();const root=document.createElement('section');root.id='kapitaVideoWelcome';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Sambutan Kapita Mobon');root.innerHTML=`<div class="kv-shell"><video playsinline webkit-playsinline preload="auto" src="assets/kapita-welcome-v3.mp4?v=20261102-3"></video><button class="kv-close" type="button" aria-label="Tutup">×</button><div class="kv-brand">Echo of Mobon · Literasi Suara Fayfiye</div></div>`;document.body.appendChild(root);const v=root.querySelector('video');requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('show')));v.addEventListener('loadeddata',()=>v.classList.add('ready'),{once:true});v.addEventListener('canplay',()=>v.classList.add('ready'),{once:true});v.addEventListener('ended',()=>setTimeout(()=>close(root),500),{once:true});v.addEventListener('error',()=>setTimeout(()=>close(root),1200),{once:true});root.querySelector('.kv-close').addEventListener('click',()=>close(root));setTimeout(()=>startVideo(v,root),300);
  document.addEventListener('pointerdown',function unlock(){if(root.isConnected&&v.muted){v.muted=false;v.volume=1;v.play().catch(()=>{});}document.removeEventListener('pointerdown',unlock,true)},true);
}
function init(){if(location.pathname.includes('/admin'))return;show()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();