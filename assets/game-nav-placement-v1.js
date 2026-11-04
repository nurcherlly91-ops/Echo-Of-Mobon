(function(){
  'use strict';
  function arrange(){
    const game=document.getElementById('eomGameEntry');
    const grid=document.querySelector('.entry-strip');
    const nav=document.querySelector('.topnav');
    const physical=nav&&nav.querySelector('a[href="#physical"]');
    if(nav&&physical&&!document.getElementById('eomGameNav')){
      const link=document.createElement('a');
      link.id='eomGameNav';
      link.href='#game-edukasi';
      link.textContent='🎮 Game Edukasi';
      link.addEventListener('click',function(event){
        if(window.EOMGameCenter){event.preventDefault();window.EOMGameCenter.open();}
      });
      physical.insertAdjacentElement('afterend',link);
    }
    if(!game||!grid)return false;
    if(game.dataset.gridCardReady!=='1'){
      game.className='entry-card';
      game.innerHTML='<span class="entry-icon">🎮</span><strong>Game Edukasi</strong><small>Belajar sambil bermain.</small>';
      game.dataset.gridCardReady='1';
    }
    const borrow=grid.querySelector('#borrowBooksEntryCard');
    if(borrow){
      if(game.parentElement!==grid||game.previousElementSibling!==borrow){
        borrow.insertAdjacentElement('afterend',game);
      }
      return true;
    }
    const myShelf=grid.querySelector('#myLibraryBtn');
    if(myShelf){
      if(game.parentElement!==grid||game.previousElementSibling!==myShelf){
        myShelf.insertAdjacentElement('afterend',game);
      }
    }else if(game.parentElement!==grid){
      grid.appendChild(game);
    }
    return false;
  }
  function init(){
    if(arrange())return;
    const observer=new MutationObserver(function(){if(arrange())observer.disconnect();});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(function(){arrange();observer.disconnect();},10000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();