'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
function checkRestrictedBrowserStorage(){
  const window={};
  for(const name of ['localStorage','sessionStorage']){
    Object.defineProperty(window,name,{get(){throw Error('Access denied')}});
  }
  const source=fs.readFileSync('assets/browser-storage-safe-v1.js','utf8');
  vm.runInNewContext(source,{window,Map,Object,String,Set});
  for(const kind of ['local','session']){
    const store=window.EOMStorage[kind];
    store.setItem('probe','works');
    assert.equal(store.getItem('probe'),'works');
    store.removeItem('probe');
    assert.equal(store.getItem('probe'),null);
  }
  console.log('Browser storage fallback: OK');
}
checkRestrictedBrowserStorage();
const src = fs.readFileSync('assets/supabase-online.js', 'utf8');
function find(name) {
  const line = src.split('\n').find(x => x.startsWith('const '+name+' = '));
  if (!line) throw Error('Missing client configuration: '+name);
  const value = line.split('"')[1];
  if (!value) throw Error('Invalid client configuration: '+name);
  return value;
}
const base=find('SUPABASE_URL'), apikey=find('SUPABASE_KEY');
const headers={'apikey':apikey,'Authorization':'Bearer '+apikey,'Content-Type':'application/json'};
async function check(label,path,method='GET',data=undefined){
  const response=await fetch(base+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(label+': HTTP '+response.status);
  const result=await response.json();
  console.log(label+': OK');
  return result;
}
(async()=>{
  const books=await check('Katalog fisik','/rest/v1/books?select=id,title&active=eq.true&limit=1');
  assert(Array.isArray(books)&&books.length===1,'Katalog buku kosong');
  const digital=await check('Katalog digital','/rest/v1/digital_books?select=id&is_published=eq.true&safe_content=eq.true&limit=1');
  assert(Array.isArray(digital),'Katalog digital gagal dibaca');
  const settings=await check('Pengaturan layanan','/rest/v1/rpc/public_library_settings','POST',{});
  assert(settings&&typeof settings==='object','Pengaturan layanan tidak valid');
  const wisdom=await check('Kata Bijak Tamu','/functions/v1/eom-exam-platform','POST',{action:'wisdom-list'});
  assert(wisdom&&Array.isArray(wisdom.rows),'Layanan Kata Bijak Tamu tidak valid');
})().catch(err=>{console.error('Smoke test gagal:',err.message);process.exitCode=1});