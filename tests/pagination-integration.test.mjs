import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import {JSDOM,VirtualConsole} from './qa-dom.mjs';

const appURL=new URL('../src/app.js',import.meta.url);
const workspaceKey='word-garden.workspace.v2';
const phraseKey='word-garden.phrases.v1';
const metaKey='word-garden.daily-insights.v1';
const eventPrefix='word-garden.learning-event.v1:';
const today=new Date(2026,9,21,12).getTime();
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const data=async name=>JSON.parse(await readFile(new URL('../src/'+name,import.meta.url),'utf8'));

// Run the actual app with local JSON assets and isolated synthetic browser storage.
// Resolve every named import, including new feature modules, instead of maintaining
// a copy of the production dependency list or using a hardcoded jsdom installation.
async function localFetch(value){
 const requested=value instanceof URL?value:new URL(String(value),appURL);
 assert.equal(requested.protocol,'file:','integration tests must not fetch external resources');
 const bytes=await readFile(fileURLToPath(requested));const text=bytes.toString('utf8');
 return {ok:true,status:200,headers:{get:name=>name==='content-type'&&requested.pathname.endsWith('.mp3')?'audio/mpeg':null},blob:async()=>new Blob([bytes],{type:'audio/mpeg'}),json:async()=>JSON.parse(text),text:async()=>text};
}
async function appImports(source){
 const bindings={},nativeFetch=globalThis.fetch;
 globalThis.fetch=localFetch;
 try{
  for(const match of source.matchAll(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?\r?$/gm)){
   const module=await import(new URL(match[2],appURL));
   for(const spec of match[1].split(',')){
    const [name,alias]=spec.trim().split(/\s+as\s+/);bindings[alias||name]=module[name];
    assert.notEqual(bindings[alias||name],undefined,`missing app import ${spec}`);
   }
  }
 }finally{globalThis.fetch=nativeFetch;}
 return bindings;
}
async function boot({saved={},hash='#custom',at=today,voices=[{lang:'en-US',name:'Synthetic QA voice'}],kokoroError=null,historyContext=null}={}){
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const original=await readFile(appURL,'utf8');
 const bindings=await appImports(original);
 const source=original.replace(/^import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?\r?\n/gm,'').replaceAll('import.meta.url',JSON.stringify(appURL.href));
 const errors=[],media=[],intervals=[],generations=[],vc=new VirtualConsole();
 vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(html,{url:'https://daily-qa.invalid/'+hash,runScripts:'outside-only',virtualConsole:vc,pretendToBeVisual:true});
 const w=dom.window;
 Object.assign(w,bindings,{fetch:localFetch,structuredClone,__WORD_GARDEN_NOW__:at});
 Object.defineProperty(w.crypto,'subtle',{value:webcrypto.subtle});w.crypto.randomUUID=()=>webcrypto.randomUUID();w.scrollTo=()=>{};w.confirm=()=>true;
 w.setInterval=(fn,delay)=>{intervals.push({fn,delay});return intervals.length;};
 // Time only advances when a test explicitly exercises the app's wall clock.
 Object.defineProperty(w.performance,'now',{value:()=>0});
 w.Worker=class{constructor(){this.listeners={};}addEventListener(name,fn){this.listeners[name]=fn;}removeEventListener(name){delete this.listeners[name];}terminate(){this.terminated=true;}postMessage(message){generations.push(message);queueMicrotask(()=>{if(this.terminated)return;const audio=new ArrayBuffer(48),v=new DataView(audio);for(const [offset,text] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])for(let i=0;i<text.length;i++)v.setUint8(offset+i,text.charCodeAt(i));v.setUint32(4,40,true);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,24000,true);v.setUint32(28,48000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);v.setUint32(40,4,true);const event={data:kokoroError?{id:message.id,error:kokoroError}:{id:message.id,audio}};this.onmessage?.(event);this.listeners.message?.(event);});}};
 w.URL.createObjectURL=()=>`blob:qa-${webcrypto.randomUUID()}`;w.URL.revokeObjectURL=()=>{};
 w.Audio=class{constructor(src){this.src=src;media.push(this);}async play(){}pause(){}};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.speechSynthesis={getVoices:()=>voices,cancel(){},speak(utterance){media.push(utterance);utterance.onstart?.();}};
 w.SpeechSynthesisUtterance=function(text){this.text=text;};
 for(const [key,value] of Object.entries(saved))w.localStorage.setItem(key,value);
 if(historyContext)w.history.replaceState({context:historyContext},'',w.location.href);
 await w.eval('(async()=>{'+source+'\n})()');await settle();
 const element=selector=>{const found=w.document.querySelector(selector);assert.ok(found,'missing '+selector);return found;};
 const click=selector=>{const found=element(selector);assert.ok(!found.disabled,'disabled '+selector);found.click();};
 const input=(selector,value)=>{const found=element(selector);found.value=value;found.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const storage=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const key=w.localStorage.key(i);return [key,w.localStorage.getItem(key)];}));
 const events=()=>Object.entries(storage()).filter(([key])=>key.startsWith(eventPrefix)).map(([,raw])=>JSON.parse(raw));
 const metric=name=>element(`[data-daily-metric="${name}"] [data-daily-value]`).textContent;
 const audioEnd=async()=>{for(let i=0;i<100&&!media.some(item=>typeof item.onended==='function'||typeof item.onend==='function');i++)await new Promise(r=>setTimeout(r,5));await settle();const playing=[...media].reverse().find(item=>typeof item.onended==='function'||typeof item.onend==='function');assert.ok(playing,'expected pending audio completion');(playing.onended||playing.onend)();await settle();};
 return {w,dom,errors,intervals,generations,media,bindings,element,click,input,storage,events,metric,audioEnd,
  state:()=>JSON.parse(w.localStorage.getItem(workspaceKey)),
  phrases:()=>JSON.parse(w.localStorage.getItem(phraseKey)),
  close:()=>{w.dispatchEvent(new w.Event('pagehide'));dom.window.close();}};
}

import {fresh} from '../src/scheduler.js';
import {pageSlice,paginationHTML,bindPagination} from '../src/pagination.js';
const customKey='word-garden.custom.v1',timerKey='vocabulary.effective-practice.v1';
const {BASE:WORDS}=await appImports(await readFile(appURL,'utf8'));
const customWords=Array.from({length:19},(_,i)=>({id:'custom-page-'+i,english:'pageword '+String(i).padStart(2,'0'),chinese:'分页词 '+i,group:i<18?'第一页组':'独立组',example:'I see pageword '+String(i).padStart(2,'0')+'.'}));
const customSentences=Array.from({length:19},(_,i)=>({id:'custom-sentence-page-'+i,english:'This is sentence '+i+'.',chinese:'这是句子'+i,group:'我的句子'}));
function fixture({words=customWords,sentences=[],mistakes=false}={}){
 const records=Object.fromEntries(words.map(w=>[w.id,{introduced:true,skills:{meaning:{...fresh(),phase:'long',lapses:mistakes?1:0,mistake:mistakes,dueAt:today+60000}}}]));
 return {[customKey]:JSON.stringify({version:1,words}),[workspaceKey]:JSON.stringify({version:2,records,settings:{steps:[1,5]},exposure:{},autoCooldown:{},memoryStrength:{},stars:9,results:{original:{correct:true}},sentenceDictation:{customSentences:sentences,items:{}}}),'qa-unrelated':'verbatim'};
}
function change(t,selector,value){const e=t.element(selector);e.value=value;e.dispatchEvent(new t.w.Event('change',{bubbles:true}));}
function pageNav(t,key='main'){return t.element(`[data-pagination-nav="${key}"]`);}
function move(t,page,key='main'){t.click(`[data-pagination="${key}"][data-page="${page}"]`);}
function allPages(t,selector,key='main',extract=e=>e.textContent.trim()){
 const seen=[];let limit=300;
 while(limit--){seen.push(...[...t.w.document.querySelectorAll(selector)].map(extract));const next=pageNav(t,key).querySelectorAll('button')[1];if(next.disabled)break;next.click();}
 assert.ok(limit>0,'pagination must terminate');return seen;
}
test('page boundaries, empty/invalid indices, no mutation and escaping',()=>{
 for(const total of [0,1,5,6,7,12,13,200]){
  const source=Array.from({length:total},(_,i)=>i),before=[...source],seen=[];
  for(let p=0;p<pageSlice(source).pages;p++)seen.push(...pageSlice(source,p).items);
  assert.deepEqual(seen,before);assert.deepEqual(source,before);
  assert.equal(pageSlice(source,-10).page,0);assert.equal(pageSlice(source,Infinity).page,0);assert.equal(pageSlice(source,999).page,pageSlice(source).pages-1);
 }
 assert.ok(!paginationHTML(pageSlice([]),{key:'<x>',label:'"bad'}).includes('aria-label=""bad'));
});
test('all custom words reachable with top/bottom paging and unchanged learning records',async()=>{
 const t=await boot({saved:fixture()});try{
  const before=t.state(),raw=t.storage()[customKey];
  assert.equal(t.w.document.querySelectorAll('[data-pagination-nav="main"]').length,2);
  const seen=allPages(t,'tbody tr .word-en');assert.deepEqual(seen,customWords.map(w=>w.english));assert.equal(new Set(seen).size,19);
  assert.match(pageNav(t).textContent,/第 4 \/ 4 页 · 共 19 项/);assert.equal(t.w.document.querySelectorAll('tbody tr').length,1);
  move(t,2);assert.equal(t.w.document.activeElement.dataset.paginationNav,'main');
  assert.deepEqual(t.state().records,before.records);assert.deepEqual(t.state().memoryStrength,before.memoryStrength);assert.equal(t.storage()[customKey],raw);assert.equal(t.storage()['qa-unrelated'],'verbatim');assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('search/group filter reset, last-item deletion clamps, stale route page clamps',async()=>{
 const t=await boot({saved:fixture(),historyContext:{page:999}});try{
  assert.match(pageNav(t).textContent,/第 4 \/ 4/);t.click('[data-delete="custom-page-18"]');assert.match(pageNav(t).textContent,/第 3 \/ 3/);assert.equal(t.w.document.querySelectorAll('tbody tr').length,6);
  t.input('#word-search','pageword 00');assert.match(pageNav(t).textContent,/第 1 \/ 1 页 · 共 1/);assert.equal(t.w.document.querySelectorAll('tbody tr').length,1);
  t.input('#word-search','no matches');assert.ok(t.element('.empty'));assert.equal(t.w.document.querySelectorAll('tbody tr').length,0);
  t.input('#word-search','');move(t,1);change(t,'#custom-group-filter','第一页组');assert.match(pageNav(t).textContent,/第 1 \/ 3/);
  assert.equal(JSON.parse(t.storage()[customKey]).words.length,18);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
for(const route of ['memory','meaning','listening','dictation','spelling'])test(`${route} learning list traverses all filtered words`,async()=>{
 const t=await boot({saved:fixture(),hash:'#'+route});try{
  change(t,'#scope-select','custom');assert.deepEqual(allPages(t,'tbody tr .word-en'),customWords.map(w=>w.english));
  change(t,'#scope-select','unit1');assert.match(pageNav(t).textContent,/第 1 \//);assert.ok(t.w.document.querySelectorAll('tbody tr').length<=6);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('all 343 preparatory words remain accessible without duplicates',async()=>{
 const t=await boot({hash:'#preparatory'});try{
  const expected=WORDS.filter(w=>w.unitId==='primary-school'||w.groupIds?.includes('primary-school')).map(w=>w.english);
  assert.deepEqual(allPages(t,'tbody tr .word-en'),expected);assert.equal(expected.length,343);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('sentence progress and schedule have independent, bounded pages',async()=>{
 const t=await boot({saved:fixture({sentences:customSentences}),hash:'#sentence-track'});try{
  const seen=allPages(t,'.sentence-row .word-en');assert.equal(seen.length,69);assert.equal(new Set(seen).size,69);assert.match(pageNav(t).textContent,/第 12 \/ 12/);
  assert.match(pageNav(t,'schedule').textContent,/第 1 \/ 1/);change(t,'#scope-select','custom');assert.deepEqual(allPages(t,'.sentence-row .word-en'),customSentences.map(s=>s.english));assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('mistake list pages through every capability and capability filter resets',async()=>{
 const t=await boot({saved:fixture({mistakes:true}),hash:'#mistakes'});try{
  change(t,'#scope-select','custom');const seen=allPages(t,'tbody tr .word-en');assert.deepEqual(seen,customWords.map(w=>w.english));
  change(t,'#skill-filter','meaning');assert.match(pageNav(t).textContent,/第 1 \/ 4/);change(t,'#skill-filter','spelling');assert.ok(t.element('.empty'));assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('context custom and textbook lists page independently, only visible references count as exposure',async()=>{
 const t=await boot({saved:fixture(),hash:'#context'});try{
  t.click('[data-adaptive="reference"]');const base=pageNav(t).textContent;
  assert.deepEqual(allPages(t,'[data-edit]','context-custom',e=>e.dataset.edit),customWords.map(w=>w.id));assert.equal(pageNav(t).textContent,base);
  const pilot=await data('phonics-context-pilot.json');assert.deepEqual(allPages(t,'[data-audio-word]','main',e=>e.dataset.audioWord),pilot.entries.map(e=>e.id));assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('cloze references traverse all passages without revealing locked answers',async()=>{
 const t=await boot({saved:fixture(),hash:'#cloze'});try{
  t.click('[data-adaptive="reference"]');const bank=await data('adaptive-context-bank.json'),expected=[...new Map(bank.questions.filter(q=>q.module==='cloze').map(q=>[q.passageId||q.title,q])).values()];
  assert.equal(allPages(t,'#page > section.panel > h2').length,expected.length);assert.equal(t.w.document.querySelectorAll('[data-practice-passage]').length,0);
  change(t,'#reading-source','custom');assert.deepEqual(allPages(t,'tbody tr .word-en'),customWords.map(w=>w.english));assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('practice time displays every stored day beyond previous 30-day cutoff',async()=>{
 const days=Object.fromEntries(Array.from({length:47},(_,i)=>[new Date(2026,7,i+1).toISOString().slice(0,10),(i+1)*60000]));
 const saved=fixture();saved[timerKey]=JSON.stringify({version:1,days,lease:null});const t=await boot({saved});try{
  t.click('#practice-time-button');const seen=allPages(t,'#practice-time-dialog > p','practice-days',p=>p.textContent).filter(s=>/^2026-/.test(s));assert.equal(seen.length,47);assert.equal(new Set(seen).size,47);assert.deepEqual(JSON.parse(t.storage()[timerKey]).days,days);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('page input clamps and keyboard navigation does not submit learning',async()=>{
 const t=await boot({saved:fixture()});try{
  change(t,'[data-pagination-input="main"]','999');assert.match(pageNav(t).textContent,/第 4 \/ 4/);
  change(t,'[data-pagination-input="main"]','0');assert.match(pageNav(t).textContent,/第 1 \/ 4/);
  const input=t.element('[data-pagination-input="main"]');input.value='3';input.dispatchEvent(new t.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));assert.match(pageNav(t).textContent,/第 3 \/ 4/);assert.equal(t.state().session??null,null);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
