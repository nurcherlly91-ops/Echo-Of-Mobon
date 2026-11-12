(function(){'use strict';
let memorySession=null;
function valid(s){
 return !!(s&&typeof s.guest_token==='string'&&s.guest_token&&s.visit_id&&s.expires_at&&Date.parse(s.expires_at)>Date.now());
}
function current(){
 if(valid(memorySession))return memorySession;
 memorySession=null;
 try{
  const saved=JSON.parse(sessionStorage.getItem('eom_guest_verified')||'null');
  if(valid(saved)){memorySession=saved;return saved;}
 }catch(_){ /* Restricted browser storage: memory-only session is supported. */ }
 return null;
}
function activate(s){
 if(!valid(s))return false;
 memorySession=s;
 try{sessionStorage.setItem('eom_guest_verified',JSON.stringify(s));}catch(_){}
 return true;
}
function show(){const d=document.getElementById('guestDialog');if(!d)return;if(!d.open)d.showModal();const f=d.querySelector('#guestName');if(f)f.focus();}
window.EOMGuestAccess={current:current,activate:activate,require:function(){if(current())return true;show();return false;},openGuestBook:show};
document.addEventListener('submit',function(e){if(current())return;const t=e.target instanceof Element?e.target:null;if(t&&t.closest('#guestDialog'))return;if(t&&t.closest('main,dialog')){e.preventDefault();e.stopImmediatePropagation();show();}},true);
document.addEventListener('focusin',function(e){if(current())return;const t=e.target instanceof Element?e.target:null;if(!t||!t.matches('input,textarea,select')||t.closest('#guestDialog,#languageSelect'))return;if(t.closest('main,.entry-strip,dialog'))show();},true);
document.addEventListener('click',function(e){
 if(current())return;
 const t=e.target instanceof Element?e.target.closest('button,a,select,[role=button]'):null;
 if(!t||t.closest('#guestDialog,#eomWhatsappAdmin,#guestEntryCard,#guestEntryBtn,#languageSelect,.brand'))return;
 if(!t.closest('main,.entry-strip,.topnav,.topbar,dialog'))return;
 e.preventDefault();e.stopImmediatePropagation();show();
},true);
})();
