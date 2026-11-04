(function(){'use strict';
function current(){try{const s=JSON.parse(sessionStorage.getItem('eom_guest_verified')||'null');return s&&s.guest_token&&s.visit_id&&Date.parse(s.expires_at)>Date.now()?s:null;}catch{return null;}}
function show(){const d=document.getElementById('guestDialog');if(!d)return;if(!d.open)d.showModal();const f=d.querySelector('#guestName');if(f)f.focus();}
window.EOMGuestAccess={current:current,require:function(){if(current())return true;show();return false;},openGuestBook:show};
document.addEventListener('click',function(e){
 if(current())return;
 const t=e.target instanceof Element?e.target.closest('button,a,select,[role=button]'):null;
 if(!t||t.closest('#guestDialog,#eomWhatsappAdmin,#guestEntryCard,#guestEntryBtn,#languageSelect,.brand'))return;
 if(!t.closest('main,.entry-strip,.topnav,.topbar,dialog'))return;
 e.preventDefault();e.stopImmediatePropagation();show();
},true);
})();