(()=>{
if(window.__EOM_KAPITA_WELCOME_V2)return;window.__EOM_KAPITA_WELCOME_V2=true;
const COPY='Halo, saya Kapita Mobon. Selamat datang di Echo of Mobon. Ruang tempat pengetahuan, cerita, dan suara bertemu. Silakan masuk dan jelajahi jejak literasi bersama kami.';
const KEY='eom_kapita_welcome_seen_v2';
let started=false,finished=false,retryTimer=null,closeTimer=null;
function addStyles(){if(document.getElementById('kapitaWelcomeStyleV2'))return;const s=document.createElement('style');s.id='kapitaWelcomeStyleV2';s.textContent=`
#kapitaWelcome{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:rgba(6,14,17,.78);backdrop-filter:blur(8px);opacity:0;transition:opacity .9s ease}
#kapitaWelcome.show{opacity:1}#kapitaWelcome.hide{opacity:0;pointer-events:none}
#kapitaWelcome .km-card{width:min(92vw,430px);max-height:92vh;overflow:auto;border:1px solid rgba(218,170,73,.46);border-radius:28px;background:linear-gradient(165deg,rgba(7,30,38,.98),rgba(11,66,68,.98));box-shadow:0 18px 70px rgba(0,0,0,.45);padding:18px;text-align:center;color:#fff;position:relative;opacity:0;transform:translateY(34px) scale(.965);transition:opacity 1.05s ease,transform 1.05s cubic-bezier(.2,.8,.2,1)}
#kapitaWelcome.show .km-card{opacity:1;transform:translateY(0) scale(1)}
#kapitaWelcome .km-close{position:absolute;right:12px;top:12px;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.34);color:#fff;font-size:22px;z-index:3}
#kapitaWelcome .km-figure{position:relative;margin:4px auto 12px;width:min(75vw,320px);opacity:0;transform:translateY(18px) scale(.98);transition:opacity 1.15s .25s ease,transform 1.15s .25s cubic-bezier(.2,.8,.2,1)}
#kapitaWelcome.show .km-figure{opacity:1;transform:translateY(0) scale(1)}
#kapitaWelcome .km-figure:before{content:'';position:absolute;inset:9%;border-radius:50%;background:radial-gradient(circle,rgba(225,176,73,.25),transparent 68%);filter:blur(9px);animation:kmGlow 2.8s ease-in-out infinite}
#kapitaWelcome img{position:relative;width:100%;display:block;border-radius:24px;transform-origin:50% 72%;animation:kmBreathe 3s ease-in-out infinite}
#kapitaWelcome.is-speaking img{animation:kmTalk .52s ease-in-out infinite alternate}
#kapitaWelcome .km-bars{height:30px;display:flex;justify-content:center;align-items:flex-end;gap:5px;margin:-3px 0 8px}
#kapitaWelcome .km-bars i{display:block;width:5px;height:6px;border-radius:999px;background:#e0ad4b;opacity:.45;transition:opacity .25s ease}
#kapitaWelcome.is-speaking .km-bars i{animation:kmBar .7s ease-in-out infinite alternate}#kapitaWelcome.is-speaking .km-bars i:nth-child(2){animation-delay:.12s}#kapitaWelcome.is-speaking .km-bars i:nth-child(3){animation-delay:.24s}#kapitaWelcome.is-speaking .km-bars i:nth-child(4){animation-delay:.08s}#kapitaWelcome.is-speaking .km-bars i:nth-child(5){animation-delay:.2s}
#kapitaWelcome .km-title{font-family:Georgia,serif;font-size:1.45rem;margin:2px 0 8px;color:#f3d58c;opacity:0;transform:translateY(10px);transition:opacity .8s .48s ease,transform .8s .48s ease}
#kapitaWelcome.show .km-title{opacity:1;transform:translateY(0)}
#kapitaWelcome .km-copy{font-size:.95rem;line-height:1.55;margin:0 auto 4px;max-width:34ch;color:rgba(255,255,255,.9);opacity:0;transform:translateY(10px);transition:opacity .8s .62s ease,transform .8s .62s ease}
#kapitaWelcome.show .km-copy{opacity:1;transform:translateY(0)}
@keyframes kmBreathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-7px) scale(1.014)}}
@keyframes kmTalk{from{transform:translateY(-3px) rotate(-.35deg) scale(1.012)}to{transform:translateY(3px) rotate(.35deg) scale(.998)}}
@keyframes kmGlow{0%,100%{opacity:.5;transform:scale(.96)}50%{opacity:1;transform:scale(1.06)}}
@keyframes kmBar{from{height:6px;opacity:.4}to{height:27px;opacity:1}}
@media(max-width:420px){#kapitaWelcome .km-card{padding:14px;border-radius:23px}#kapitaWelcome .km-figure{width:min(72vw,285px)}#kapitaWelcome .km-title{font-size:1.28rem}#kapitaWelcome .km-copy{font-size:.9rem}}
@media(prefers-reduced-motion:reduce){#kapitaWelcome *,#kapitaWelcome img{animation:none!important;transition:none!important}}
`;document.head.appendChild(s)}
function pickIndonesianVoice(){const list=window.speechSynthesis?.getVoices?.()||[];return list.find(v=>(v.lang||'').toLowerCase()==='id-id')||list.find(v=>(v.lang||'').toLowerCase().startsWith('id'))||null}
function stopSpeech(){try{window.speechSynthesis?.cancel()}catch{}}
function close(root){if(finished)return;finished=true;if(retryTimer)clearTimeout(retryTimer);if(closeTimer)clearTimeout(closeTimer);stopSpeech();try{sessionStorage.setItem(KEY,'1')}catch{}root.classList.add('hide');setTimeout(()=>root.remove(),950)}
function speakOnce(root){if(finished||started||!root?.isConnected)return false;if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window))return false;stopSpeech();const u=new SpeechSynthesisUtterance(COPY),voice=pickIndonesianVoice();if(voice)u.voice=voice;u.lang='id-ID';u.rate=.84;u.pitch=.76;u.volume=1;u.onstart=()=>{started=true;if(retryTimer)clearTimeout(retryTimer);root.classList.add('is-speaking')};u.onend=()=>{root.classList.remove('is-speaking');closeTimer=setTimeout(()=>close(root),1100)};u.onerror=()=>{root.classList.remove('is-speaking')};try{window.speechSynthesis.speak(u);return true}catch{return false}}
function autoSpeak(root){let attempts=0;const tryNow=()=>{if(finished||started||!root.isConnected)return;attempts++;speakOnce(root);if(!started&&attempts<4)retryTimer=setTimeout(tryNow,1100);else if(!started&&attempts>=4)closeTimer=setTimeout(()=>close(root),5000)};setTimeout(tryNow,900);if('speechSynthesis'in window){window.speechSynthesis.onvoiceschanged=()=>{if(!started&&!finished)tryNow()}}}
function show(){try{if(sessionStorage.getItem(KEY)==='1')return}catch{}addStyles();const root=document.createElement('section');root.id='kapitaWelcome';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Sambutan Kapita Mobon');root.innerHTML=`<div class="km-card"><button class="km-close" type="button" aria-label="Tutup">×</button><div class="km-figure"><img src="assets/kapita-mobon-welcome.jpg?v=2" alt="Kapita Mobon"></div><div class="km-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="km-title">Selamat Datang di Echo of Mobon</div><p class="km-copy">${COPY}</p></div>`;document.body.appendChild(root);requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('show')));root.querySelector('.km-close').addEventListener('click',()=>close(root));autoSpeak(root)}
function init(){if(location.pathname.includes('/admin'))return;show()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();