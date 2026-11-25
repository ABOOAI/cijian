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

const {BASE:WORDS}=await appImports(await readFile(appURL,'utf8'));
import {fresh} from '../src/scheduler.js';
const modes=['meaning','listening','dictation','spelling'];
const customKey='word-garden.custom.v1';
const word={id:'custom-rice',english:'rice',chinese:'米饭',group:'饮食',status:'custom'};
const sentence={id:'custom-sentence-rice',english:'I like rice.',chinese:'我喜欢米饭。',group:'句子'};
const full=()=>({version:1,total:100,skills:Object.fromEntries(modes.map(mode=>[mode,{points:25,lastCreditDay:null}])),events:[],creditedIds:['old-independent-credit']});
const regular=WORDS.filter(w=>w.unitId!=='primary-school'&&!(w.groupIds||[]).includes('primary-school'));
function fixture({mastered=[word],scheduled=[],session=null}={}){
 const records=Object.fromEntries(scheduled.map((w,i)=>[w.id,{introduced:true,skills:{meaning:{...fresh(),phase:'long',reviews:7,successes:7,dueAt:today+60000*(i+1)}}}]));
 return {[workspaceKey]:JSON.stringify({version:2,records,memoryStrength:Object.fromEntries(mastered.map(w=>[w.id,full()])),exposure:{},autoCooldown:{},stars:9,session,results:{legacy:{correct:true}},settings:{steps:[1,5]},selectedUnit:'unit1',sentenceDictation:{customSentences:[sentence],items:{[sentence.id]:{independentCorrect:7,correctCount:7,attempts:7}}}}),[customKey]:JSON.stringify({version:1,words:[word]}),'qa-account-record':'preserve verbatim'};
}
function scope(t,value){const e=t.element('#scope-select');e.value=value;e.dispatchEvent(new t.w.Event('change',{bubbles:true}));}
const start=(t,mode)=>t.click(`[data-action="mastered-start"][data-mode="${mode}"]`);
const rows=t=>[...t.w.document.querySelectorAll('#schedule-panel tbody tr')];
const controls=(t,action)=>[...t.w.document.querySelectorAll(`#schedule-panel [data-action="schedule-${action}"]`)];
function openMastered(t){const primary=t.w.location.hash.startsWith('#preparatory-');t.click('[data-action="mastered-review"]');assert.equal(t.w.location.hash,primary?'#preparatory-mastered-review':'#mastered-review');}

test('tracking sixth card opens all mastered words in current scope without 10/15 truncation',async()=>{
 const picked=regular.slice(0,19),t=await boot({saved:fixture({mastered:[...picked,word,sentence]}),hash:'#track'});
 try{
  assert.equal(t.w.document.querySelectorAll('.skill-grid > .skill-card').length,6);
  assert.ok(t.element('.skill-grid > .skill-card:last-child').hasAttribute('data-mastered-card'));
  openMastered(t);for(const mode of modes)t.element(`[data-action="mastered-start"][data-mode="${mode}"]`);
  start(t,'meaning');const s=t.state().session;
  assert.equal(s.kind,'mastered-review');assert.equal(s.manual,true);
  assert.deepEqual(new Set(s.items.map(i=>i.wordId)),new Set([...picked,word].map(w=>w.id)));
  assert.equal(s.items.length,20);assert.ok(s.items.every(i=>i.skill==='meaning'));
  t.click('[data-action="back-parent"]');assert.equal(t.w.location.hash,'#mastered-review');
  t.click('[data-action="back-parent"]');assert.equal(t.w.location.hash,'#track');
  scope(t,'custom');openMastered(t);t.w.confirm=()=>true;start(t,'spelling');
  assert.deepEqual(t.state().session.items,[{wordId:word.id,skill:'spelling'}]);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('empty mastered scope has disabled mode controls and cannot replace saved work',async()=>{
 const t=await boot({saved:fixture({mastered:[]}),hash:'#mastered-review'});try{
  for(const mode of modes)assert.equal(t.element(`[data-action="mastered-start"][data-mode="${mode}"]`).disabled,true);
  assert.equal(t.state().session,null);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

for(const mode of modes)test(`mastered ${mode} uses real flow, survives reload and preserves mastery and independent records`,async()=>{
 const t=await boot({saved:fixture({mastered:[word,sentence],scheduled:[regular[30]]}),hash:'#track',voices:[]});let r;
 try{
  scope(t,'custom');openMastered(t);start(t,mode);const id=t.state().session.id;
  assert.equal(t.state().session.origin.view,'mastered-review');
  if(mode==='spelling')t.input('#spell-input','ri');
  r=await boot({saved:t.storage(),hash:'#session',voices:[]});assert.equal(r.state().session.id,id);
  if(mode==='spelling')assert.equal(r.element('#spell-input').value,'ri');
  if(['listening','dictation'].includes(mode)){
   assert.equal(r.element(mode==='dictation'?'#check-answer':'[data-choice]').disabled,true);
   if(mode==='dictation'){r.input('#spell-input',word.english);r.element('#spell-form').requestSubmit();assert.equal(r.state().session.result,null);}
   await r.audioEnd();assert.ok(r.generations.length>0,'Kokoro synthesizes custom words');assert.equal(r.media.some(x=>x.text),false,'no system voice fallback');
  }
  if(['meaning','listening'].includes(mode))r.click(`[data-choice="${word.chinese}"]`);
  else{r.input('#spell-input',word.english);r.click('#check-answer');}
  assert.equal(r.state().session.result.correct,true);r.click('[data-action="next-item"]');assert.equal(r.state().session.done,true);
  assert.equal(r.state().memoryStrength[word.id].total,100);assert.deepEqual(r.state().memoryStrength[word.id].creditedIds,['old-independent-credit']);
  assert.deepEqual(r.state().records[regular[30].id],JSON.parse(fixture({scheduled:[regular[30]]})[workspaceKey]).records[regular[30].id]);
  assert.equal(r.state().sentenceDictation.items[sentence.id].independentCorrect,7);assert.deepEqual(r.state().results,{legacy:{correct:true}});assert.equal(r.storage()['qa-account-record'],'preserve verbatim');assert.deepEqual(r.errors,[]);
 }finally{r?.close();t.close();}
});

test('same mastered queue resumes while replacing another queue requires confirmation',async()=>{
 const t=await boot({saved:fixture(),hash:'#track'});try{
  scope(t,'custom');openMastered(t);start(t,'spelling');t.input('#spell-input','ri');const pending=t.state().session;
  t.click('[data-action="back-parent"]');let confirmations=0;t.w.confirm=()=>{confirmations++;return false;};
  start(t,'spelling');assert.equal(t.state().session.id,pending.id);assert.equal(t.state().session.draft,'ri');assert.equal(confirmations,0);
  t.click('[data-action="back-parent"]');start(t,'meaning');assert.equal(confirmations,1);assert.deepEqual(t.state().session,pending);assert.equal(t.w.location.hash,'#mastered-review');
  t.w.confirm=()=>true;start(t,'meaning');assert.notEqual(t.state().session.id,pending.id);assert.equal(t.state().session.items[0].skill,'meaning');assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('Kokoro failure keeps mastered dictation gated with no device voice fallback',async()=>{
 const t=await boot({saved:fixture(),hash:'#track',kokoroError:'QA model unavailable'});try{
  scope(t,'custom');openMastered(t);start(t,'dictation');
  for(let i=0;i<100&&!t.w.document.querySelector('[data-audio-kokoro-retry]');i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(t.element('#check-answer').disabled,true);t.input('#spell-input',word.english);t.element('#spell-form').requestSubmit();assert.equal(t.state().session.result,null);
  assert.equal(t.media.length,0);assert.equal(t.w.document.querySelector('[data-audio-device-fallback]'),null);assert.equal(t.state().memoryStrength[word.id].total,100);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('schedule traverses every row, clamps bounds and preserves its page through mastered review and back',async()=>{
 const scheduled=regular.slice(25,44),t=await boot({saved:fixture({scheduled}),hash:'#track'});try{
  assert.equal(rows(t).length,6);assert.equal(controls(t,'prev').length,2);assert.equal(controls(t,'next').length,2);assert.ok(controls(t,'prev').every(b=>b.disabled));
  const seen=[];for(let page=0;page<4;page++){seen.push(...rows(t).map(r=>r.cells[0].textContent));if(page<3)t.click('#schedule-panel [data-action="schedule-next"]');}
  assert.deepEqual(seen,scheduled.map(w=>w.english));assert.equal(rows(t).length,1);assert.ok(controls(t,'next').every(b=>b.disabled));
  const status=t.element('[data-schedule-page-status]').textContent;openMastered(t);t.click('[data-action="back-parent"]');assert.equal(t.element('[data-schedule-page-status]').textContent,status);
  t.click('#schedule-panel [data-action="schedule-prev"]');assert.equal(rows(t).length,6);
  scope(t,'custom');assert.equal(rows(t).length,0);assert.ok(controls(t,'prev').every(b=>b.disabled));assert.ok(controls(t,'next').every(b=>b.disabled));
  scope(t,'all');assert.equal(rows(t)[0].cells[0].textContent,scheduled[0].english);assert.ok(controls(t,'prev').every(b=>b.disabled));assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('single-page schedule disables both header and footer controls',async()=>{
 const t=await boot({saved:fixture({scheduled:regular.slice(25,29)}),hash:'#track'});try{
  assert.equal(rows(t).length,4);assert.equal(controls(t,'prev').length,2);assert.equal(controls(t,'next').length,2);assert.ok([...controls(t,'prev'),...controls(t,'next')].every(b=>b.disabled));assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('sentence schedule pages independently of sentence-list pagination',async()=>{
 const bank=await data('sentence-dictation.json'),sentences=bank.groups.flatMap(g=>g.items).slice(0,19);
 const t=await boot({saved:fixture({mastered:[],scheduled:sentences}),hash:'#sentence-track'});try{
  const seen=[];for(let page=0;page<4;page++){seen.push(...rows(t).map(r=>r.cells[0].textContent));if(page<3)t.click('#schedule-panel [data-action="schedule-next"]');}
  assert.deepEqual(seen,sentences.map(s=>s.english));assert.ok(controls(t,'next').every(b=>b.disabled));
  const status=t.element('[data-schedule-page-status]').textContent;
  t.click('[data-action="next-page"]');assert.equal(t.element('[data-schedule-page-status]').textContent,status);
  scope(t,'custom');assert.equal(rows(t).length,0);assert.ok(controls(t,'prev').every(b=>b.disabled));assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('saved history restores schedule on reload and clamps stale page indices',async()=>{
 const saved=fixture({scheduled:regular.slice(25,44)}),t=await boot({saved,hash:'#track'});let r;try{
  t.click('#schedule-panel [data-action="schedule-next"]');const context=t.w.history.state.context;
  r=await boot({saved:t.storage(),hash:'#track',historyContext:context});assert.equal(rows(r)[0].cells[0].textContent,regular[31].english);
  for(const [schedulePage,first] of [[999,regular[43]],[-10,regular[25]]]){
   r.w.dispatchEvent(new r.w.PopStateEvent('popstate',{state:{context:{...context,schedulePage}}}));assert.equal(rows(r)[0].cells[0].textContent,first.english);
  }
  assert.ok(controls(r,'prev').every(b=>b.disabled));assert.deepEqual(r.errors,[]);
 }finally{r?.close();t.close();}
});

test('mastered entry cannot silently overwrite a different unfinished session',async()=>{
 const pending={id:'existing-lesson',items:[{wordId:regular[30].id,skill:'meaning'}],index:0,title:'未完成新课',kind:'lesson',manual:false,cooldownPolicy:'none',queuePolicyVersion:2,origin:{view:'tasks',filter:'all',learningTrack:'regular'},draft:'',result:null,done:false};
 const t=await boot({saved:fixture({session:pending}),hash:'#track'});try{
  scope(t,'custom');openMastered(t);let prompts=0;t.w.confirm=()=>{prompts++;return false;};start(t,'meaning');assert.equal(prompts,1);assert.deepEqual(t.state().session,pending);
  t.w.confirm=()=>true;start(t,'meaning');assert.equal(t.state().session.kind,'mastered-review');assert.deepEqual(t.state().sessionHistory.at(-1),pending);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('wrong mastered answer keeps 100 percent and preserves other independent skill records',async()=>{
 const saved=fixture({scheduled:[regular[30]]}),state=JSON.parse(saved[workspaceKey]);state.records[word.id]={introduced:true,skills:Object.fromEntries(modes.map(mode=>[mode,{...fresh(),phase:'long',reviews:9,successes:8,dueAt:today-60000,lastAt:today-86400000}]))};saved[workspaceKey]=JSON.stringify(state);
 const t=await boot({saved,hash:'#track'});try{
  scope(t,'custom');openMastered(t);start(t,'spelling');t.input('#spell-input','incorrect answer');t.click('#check-answer');
  assert.equal(t.state().session.result.correct,false);assert.equal(t.state().memoryStrength[word.id].total,100);
  assert.equal(t.state().session.remediation.wordId,word.id);assert.equal(t.state().session.remediation.step,0);assert.equal(t.state().session.remediation.successes,0);t.element('#correction-form');
  for(let round=0;round<3;round++){if(round)await t.audioEnd();t.input('#correction-input',word.english);t.click('#correction-submit');if(round<2)t.click('[data-correction=next]');}
  assert.equal(t.state().session.remediation.done,true);assert.equal(t.state().session.remediation.successes,3);assert.equal(t.state().memoryStrength[word.id].total,100);assert.deepEqual(t.state().records[regular[30].id],state.records[regular[30].id]);
  for(const mode of ['meaning','listening','dictation'])assert.deepEqual(t.state().records[word.id].skills[mode],state.records[word.id].skills[mode]);
  assert.ok(t.state().records[word.id].skills.spelling.reviews>=9);assert.ok(t.state().records[word.id].skills.spelling.successes>=8);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('preparatory mastered review queues only primary words and keeps preparatory scope on back',async()=>{
 const primary=WORDS.filter(w=>w.unitId==='primary-school'||(w.groupIds||[]).includes('primary-school')).slice(0,17);
 assert.equal(primary.length,17);
 const t=await boot({saved:fixture({mastered:[...primary,...regular.slice(0,3),word,sentence]}),hash:'#preparatory-track'});try{
  assert.equal(t.element('#scope-select').value,'primary-school');openMastered(t);start(t,'meaning');
  assert.equal(t.state().session.origin.learningTrack,'primary');assert.equal(t.state().session.origin.filter,'primary-school');
  assert.deepEqual(t.state().session.items.map(i=>i.wordId),primary.map(w=>w.id));
  t.click('[data-action="back-parent"]');assert.equal(t.element('#scope-select').value,'primary-school');
  t.click('[data-action="back-parent"]');assert.equal(t.w.location.hash,'#preparatory-track');assert.equal(t.element('#scope-select').value,'primary-school');assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
