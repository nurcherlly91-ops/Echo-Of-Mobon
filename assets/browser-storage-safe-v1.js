/* Echo of Mobon — storage compatibility for restrictive mobile browsers.
   Guest state and learning preferences fall back to tab memory if storage is denied.
   Stored values are never uploaded. Memory-only state disappears after a page reload. */
(function(){
  'use strict';
  function make(kind){
    const memory=new Map();
    function nativeStore(){try{return window[kind]}catch(_){return null}}
    return Object.freeze({
      getItem(key){
        key=String(key);
        if(memory.has(key))return memory.get(key);
        try{const store=nativeStore();return store?store.getItem(key):null}catch(_){return null}
      },
      setItem(key,value){
        key=String(key);value=String(value);
        try{const store=nativeStore();if(store){store.setItem(key,value);memory.delete(key);return}}catch(_){}
        memory.set(key,value);
      },
      removeItem(key){
        key=String(key);memory.delete(key);
        try{nativeStore()?.removeItem(key)}catch(_){}
      },
      clear(){
        memory.clear();try{nativeStore()?.clear()}catch(_){}
      },
      key(index){
        const keys=new Set();
        try{const s=nativeStore();if(s)for(let i=0;i<s.length;i++){const k=s.key(i);if(k!==null)keys.add(k)}}catch(_){}
        for(const k of memory.keys())keys.add(k);
        return [...keys][index]??null;
      },
      get length(){
        const keys=new Set();
        try{const s=nativeStore();if(s)for(let i=0;i<s.length;i++){const k=s.key(i);if(k!==null)keys.add(k)}}catch(_){}
        for(const k of memory.keys())keys.add(k);
        return keys.size;
      }
    });
  }
  window.EOMStorage=Object.freeze({local:make('localStorage'),session:make('sessionStorage')});
})();
/* Shared lexical aliases protect existing classic scripts without replacing browser APIs. */
const localStorage=window.EOMStorage.local;
const sessionStorage=window.EOMStorage.session;
