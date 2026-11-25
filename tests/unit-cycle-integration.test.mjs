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
async function boot({saved={},hash='#tasks',at=today,voices=[{lang:'en-US',name:'Synthetic QA voice'}],kokoroError=null,historyContext=null,letterFeedback=null,interceptAdvance=false}={}){
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const original=await readFile(appURL,'utf8');
 const bindings=await appImports(original);
 if(letterFeedback)bindings.createLetterAudio=letterFeedback;
 const source=original.replace(/^import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?\r?\n/gm,'').replaceAll('import.meta.url',JSON.stringify(appURL.href));
 const errors=[],media=[],intervals=[],generations=[],vc=new VirtualConsole();
 vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(html,{url:'https://daily-qa.invalid/'+hash,runScripts:'outside-only',virtualConsole:vc,pretendToBeVisual:true});
 const w=dom.window;
 Object.assign(w,bindings,{fetch:localFetch,structuredClone,__WORD_GARDEN_NOW__:at});
 const pendingAdvance=new Map();let timerId=-1;
 if(interceptAdvance){
  const later=w.setTimeout.bind(w),cancel=w.clearTimeout.bind(w);
  w.setTimeout=(fn,delay,...args)=>{if(delay!==650)return later(fn,delay,...args);const id=timerId--;pendingAdvance.set(id,()=>fn(...args));return id;};
  w.clearTimeout=id=>{if(id<0)pendingAdvance.delete(id);else cancel(id);};
 }
 const finishCorrectFeedback=()=>{const timers=[...pendingAdvance.values()];pendingAdvance.clear();for(const run of timers)run();};
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
 return {w,dom,errors,intervals,generations,media,bindings,element,click,input,storage,events,metric,audioEnd,pendingAdvance,finishCorrectFeedback,
  state:()=>JSON.parse(w.localStorage.getItem(workspaceKey)),
  phrases:()=>JSON.parse(w.localStorage.getItem(phraseKey)),
  close:()=>{w.dispatchEvent(new w.Event('pagehide'));dom.window.close();}};
}

const {BASE:WORDS,UNITS}=await appImports(await readFile(appURL,'utf8'));
import {fresh} from '../src/scheduler.js';
import {freshStrength} from '../src/mastery.js';
import {createLearningStorage,createBackup,parseBackup,mergeLearningRecords,prepareImport,commitImport} from '../src/learning-backup.js';
import {validateStorageRecords} from '../src/backup-validation.js';

const modes=['meaning','listening','dictation','spelling'];
const unitWords=id=>WORDS.filter(w=>w.unitId===id||(w.groupIds||[]).includes(id));
const isPrimary=w=>w.groupIds.includes('primary-school');
const coreWords=id=>unitWords(id).filter(w=>!isPrimary(w));
const extraWords=id=>unitWords(id).filter(isPrimary);
const school=coreWords('unit3');
const outside=unitWords('unit4')[0];
const futureRecord=()=>({...fresh(),phase:'long',reviews:7,successes:7,dueAt:today+86400000,lastAt:today-86400000});
const strengthAt=total=>({...freshStrength(),total,creditedIds:[]});
function fixture({session=null,learned=true}={}){
 const records=Object.fromEntries([...school,outside].map(w=>[w.id,{introduced:learned,skills:Object.fromEntries(modes.map(mode=>[mode,learned?futureRecord():fresh()]))}]));
 const memoryStrength=Object.fromEntries([...school,outside].map(w=>[w.id,strengthAt(learned?20:0)]));
 return {[workspaceKey]:JSON.stringify({version:2,records,memoryStrength,exposure:{},autoCooldown:Object.fromEntries(school.map(w=>[w.id,today+30*60000])),stars:9,session,results:{legacy:{correct:true}},settings:{steps:[1,5]},selectedUnit:'unit3'}),'qa-account-record':'preserve verbatim'};
}
function changeSaved(saved,edit){const next={...saved},state=JSON.parse(next[workspaceKey]);edit(state);next[workspaceKey]=JSON.stringify(state);return next;}
function start(t,id='unit3',part='core'){t.click(`[data-action="unit-cycle"][data-unit-id="${id}"][data-unit-part="${part}"]`);}
function checkpoint(t,wordId,skill){return changeSaved(t.storage(),state=>{const s=state.session;s.index=s.items.findIndex(i=>i.wordId===wordId&&i.skill===skill);assert.ok(s.index>=0);Object.assign(s,{result:null,draft:'',hint:false,hintReason:null,remediation:null,revealed:false,done:false,practiceOnly:false,attemptNo:0});});}
function answerSpelling(t,text){t.input('#spell-input',text);t.click('#check-answer');}
function noErrors(...apps){for(const t of apps)assert.deepEqual(t.errors,[]);}
function closeAll(...apps){for(const t of apps)t?.close();}

// The expanded unit remains actionable even when all entries have been learned.
test('fully learned Unit 3 starts all 43 words including mastered, future-due and cooling words',async()=>{
 assert.equal(school.length,43);
 const saved=changeSaved(fixture(),s=>{s.memoryStrength[school[0].id]=strengthAt(100);});
 const t=await boot({saved});try{
  start(t);const state=t.state(),s=state.session;
  assert.equal(s.kind,'unit-cycle');assert.equal(s.unitId,'unit3');assert.equal(s.manual,true);assert.equal(s.cooldownPolicy,'none');assert.equal(s.round,1);assert.equal(s.practiceOnly,false);assert.notEqual(s.replay,true);
  assert.equal(s.items.length,215);assert.deepEqual([...new Set(s.items.map(i=>i.wordId))],school.map(w=>w.id));
  for(const w of school)assert.deepEqual(s.items.filter(i=>i.wordId===w.id).map(i=>i.skill),['study',...modes]);
  assert.equal(new Set(s.items.map(i=>i.wordId+':'+i.skill)).size,215);
  // Five-word chunks keep study and recall close together, including the last short chunk.
  assert.deepEqual(s.items.slice(0,5).map(i=>i.skill),Array(5).fill('study'));
  assert.deepEqual(s.items.slice(5,10).map(i=>i.skill),Array(5).fill('meaning'));
  assert.deepEqual(s.items.slice(-3).map(i=>i.skill),Array(3).fill('spelling'));
  assert.deepEqual(state.records,JSON.parse(saved[workspaceKey]).records);
  assert.equal(state.memoryStrength[school[0].id].total,100);
  assert.equal(state.autoCooldown[school[0].id],today+30*60000);
  assert.deepEqual(state.results,{legacy:{correct:true}});assert.equal(t.storage()['qa-account-record'],'preserve verbatim');noErrors(t);
 }finally{t.close();}
});

test('every textbook and supplement card starts only its complete unit without new-word filtering',async()=>{
 const t=await boot({saved:fixture({learned:false})});try{
  for(const unit of UNITS.filter(u=>u.id!=='primary-school')){
   start(t,unit.id);const s=t.state().session,expected=coreWords(unit.id);
   assert.ok(expected.length>0,unit.id);assert.equal(s.unitId,unit.id);assert.equal(s.items.length,expected.length*5,unit.id);
   assert.deepEqual([...new Set(s.items.map(i=>i.wordId))],expected.map(w=>w.id),unit.id);
   assert.equal(s.manual,true);t.click('[data-action="back-parent"]');
  }
  noErrors(t);
 }finally{t.close();}
});

test('every primary button starts precisely its corresponding supplemental unit without mixing textbook words',async()=>{
 const t=await boot({saved:fixture({learned:false})});
 try{
  const counts={starter3:37,unit1:50,unit2:48,unit3:29,unit4:24,unit5:21,unit6:15,unit7:22};
  assert.equal(t.w.document.querySelectorAll('[data-unit-part="primary"]').length,8);
  for(const [id,n] of Object.entries(counts)){
   start(t,id,'primary');const s=t.state().session;
   assert.equal(s.unitId,id);assert.equal(s.unitPart,'primary');assert.equal(s.items.length,n*5);
   assert.deepEqual([...new Set(s.items.map(i=>i.wordId))],extraWords(id).map(w=>w.id));
   assert.ok(s.title.includes('小学词汇'));
   t.click('[data-action="back-parent"]');
  }
  noErrors(t);
 }finally{t.close();}
});
test('unit core new lesson excludes Primary words and same-unit Primary resume, replay and switch keep sessions separate',async()=>{
 const word=extraWords('unit3').find(w=>w.english==='front');
 assert.equal(word.id,'supplement-primary-front');
 const t=await boot({saved:fixture()});let r,done;
 try{
  assert.equal(t.element('[data-action="new-lesson"]').disabled,true);
  start(t,'unit3','primary');
  r=await boot({saved:checkpoint(t,word.id,'spelling'),hash:'#session'});
  r.input('#spell-input','draft');
  r.click('[data-action="back-parent"]');
  const saved=r.state();
  r.w.confirm=()=>{throw Error('same part should resume without replacing');};
  start(r,'unit3','primary');
  assert.equal(r.element('#spell-input').value,'draft');
  assert.notEqual(r.state().session.legacyMixed,true);
  assert.equal(r.state().session.id,saved.session.id);
  r.click('[data-action="back-parent"]');r.w.confirm=()=>false;start(r,'unit3','core');
  assert.equal(r.state().session.id,saved.session.id);
  r.w.confirm=()=>true;start(r,'unit3','core');
  assert.equal(r.state().session.unitPart,'core');
  assert.equal(r.state().sessionHistory.at(-1).draft,'draft');
  done=await boot({saved:changeSaved(t.storage(),st=>{st.session.done=true;}),hash:'#session'});
  done.click('[data-action="session-replay"]');
  assert.equal(done.state().session.unitPart,'primary');
  assert.equal(done.state().session.round,2);
  assert.deepEqual(done.state().session.items,t.state().session.items);
  noErrors(t,r,done);
 }finally{closeAll(done,r,t);}
});
test('old mixed cycle remains reachable from continue but new textbook entry will not reuse its queue',async()=>{
 const t=await boot({saved:fixture()});let old;
 try{
  start(t); const other=extraWords('unit3')[0];
  const saved=changeSaved(t.storage(),st=>{delete st.session.unitPart;st.session.items.push({wordId:other.id,skill:'study'});});
  old=await boot({saved});
  assert.match(old.element('.resume').textContent,/旧版混合练习仍保留/);
  old.click('[data-action="resume"]');assert.equal(old.state().session.id,t.state().session.id);
  old.click('[data-action="back-parent"]');old.w.confirm=()=>true;
  start(old);
  assert.equal(old.state().session.unitPart,'core');assert.notEqual(old.state().session.id,t.state().session.id);
  assert.ok(!old.state().session.items.some(i=>i.wordId===other.id));
  assert.ok(old.state().sessionHistory.at(-1).items.some(i=>i.wordId===other.id));
  noErrors(t,old);
 }finally{closeAll(old,t);}
});

test('study of learned words preserves their schedule; first study marks new words once',async()=>{
 for(const learned of [true,false]){
  const saved=fixture({learned}),before=JSON.parse(saved[workspaceKey]),t=await boot({saved});try{
   start(t);t.click('[data-action="next-item"]');const state=t.state(),w=school[0];
   assert.equal(state.records[w.id].introduced,true);
   if(learned)assert.deepEqual(state.records[w.id],before.records[w.id]);
   else for(const mode of modes){assert.equal(state.records[w.id].skills[mode].reviews,0);assert.equal(state.records[w.id].skills[mode].successes,0);}
   assert.deepEqual(state.records[outside.id],before.records[outside.id]);assert.equal(state.stars,before.stars);noErrors(t);
  }finally{t.close();}
 }
});

test('same-unit entry resumes a saved draft after navigation and reload without replacement prompts',async()=>{
 const t=await boot({saved:fixture()});let r,reloaded;
 try{
  start(t);r=await boot({saved:checkpoint(t,school[3].id,'spelling'),hash:'#session'});
  r.input('#spell-input','unfinished draft');const pending=r.state().session;
  r.click('[data-action="back-parent"]');let confirmations=0;r.w.confirm=()=>{confirmations++;return false;};
  start(r);assert.equal(confirmations,0);assert.deepEqual(r.state().session,pending);assert.equal(r.element('#spell-input').value,'unfinished draft');
  reloaded=await boot({saved:r.storage(),hash:'#tasks'});reloaded.w.confirm=()=>{throw Error('same-unit resume must not ask to discard');};
  start(reloaded);assert.deepEqual(reloaded.state().session,pending);assert.equal(reloaded.element('#spell-input').value,'unfinished draft');noErrors(t,r,reloaded);
 }finally{closeAll(reloaded,r,t);}
});

test('switching units confirms before replacing pending work and archives it without touching progress',async()=>{
 const t=await boot({saved:fixture()});try{
  start(t);t.click('[data-action="next-item"]');t.click('[data-action="back-parent"]');const pending=t.state().session,before=t.state().records;
  let prompts=0;t.w.confirm=()=>{prompts++;return false;};start(t,'unit4');assert.equal(prompts,1);assert.deepEqual(t.state().session,pending);assert.equal(t.w.location.hash,'#tasks');
  t.w.confirm=()=>{prompts++;return true;};start(t,'unit4');assert.equal(prompts,2);assert.notEqual(t.state().session.id,pending.id);assert.equal(t.state().session.unitId,'unit4');
  assert.deepEqual(t.state().sessionHistory.at(-1),pending);assert.deepEqual(t.state().records,before);noErrors(t);
 }finally{t.close();}
});

test('completing a cycle opens another full normal round and credits independent answers again that day',async()=>{
 const target=school.at(-1),t=await boot({saved:fixture()});let first,second,again;
 try{
  start(t);first=await boot({saved:checkpoint(t,target.id,'spelling'),hash:'#session'});const before=first.state(),old=before.session;
  answerSpelling(first,target.english);assert.equal(first.state().memoryStrength[target.id].total,30);assert.deepEqual(first.state().records[target.id],before.records[target.id]);
  assert.equal(first.events().length,1);first.click('[data-action="next-item"]');assert.equal(first.state().session.done,true);
  first.click('[data-action="session-replay"]');const next=first.state().session;
  assert.notEqual(next.id,old.id);assert.equal(next.round,2);assert.equal(next.unitId,'unit3');assert.equal(next.items.length,215);assert.equal(next.practiceOnly,false);assert.notEqual(next.replay,true);
  assert.deepEqual(next.items,old.items);assert.equal(first.state().sessionHistory.at(-1).id,old.id);
  second=await boot({saved:checkpoint(first,target.id,'spelling'),hash:'#session'});
  answerSpelling(second,target.english);assert.equal(second.state().memoryStrength[target.id].total,40);assert.equal(second.events().filter(e=>e.itemId===target.id).length,2);
  assert.equal(second.state().memoryStrength[target.id].creditedIds.length,2);assert.deepEqual(second.state().records[target.id],before.records[target.id]);
  const once=second.state();second.element('#spell-form').requestSubmit();assert.deepEqual(second.state(),once);
  again=await boot({saved:second.storage(),hash:'#session'});again.element('#spell-form').requestSubmit();assert.equal(again.state().memoryStrength[target.id].total,40);assert.equal(again.events().filter(e=>e.itemId===target.id).length,2);
  assert.deepEqual(again.state().records[outside.id],before.records[outside.id]);noErrors(t,first,second,again);
 }finally{closeAll(again,second,first,t);}
});

test('cycle hints and three-step corrections do not award strength and a wrong answer never subtracts it',async()=>{
 const target=school[1],t=await boot({saved:fixture()});let hinted,wrong;
 try{
  start(t);const saved=checkpoint(t,target.id,'spelling');hinted=await boot({saved,hash:'#session'});
  hinted.click('[data-action="hint"]');answerSpelling(hinted,target.english);assert.equal(hinted.state().session.result.assisted,true);assert.equal(hinted.state().memoryStrength[target.id].total,20);
  wrong=await boot({saved,hash:'#session'});answerSpelling(wrong,'an incorrect answer');assert.equal(wrong.state().memoryStrength[target.id].total,20);assert.equal(wrong.state().session.remediation.step,0);
  for(let round=0;round<3;round++){if(round)await wrong.audioEnd();wrong.input('#correction-input',target.english);wrong.click('#correction-submit');if(round<2)wrong.click('[data-correction=next]');}
  assert.equal(wrong.state().session.remediation.done,true);assert.equal(wrong.state().session.remediation.successes,3);assert.equal(wrong.state().memoryStrength[target.id].total,20);
  assert.equal(wrong.state().records[target.id].skills.spelling.lapses,1);assert.equal(wrong.state().records[target.id].skills.spelling.reviews,8);
  assert.ok(wrong.events().filter(e=>e.kind==='correction').every(e=>e.assisted));noErrors(t,hinted,wrong);
 }finally{closeAll(wrong,hinted,t);}
});

test('100 percent words still get a complete cycle and remain capped without changing unrelated records',async()=>{
 const target=school[0],saved=changeSaved(fixture(),s=>{s.memoryStrength[target.id]=strengthAt(100);}),t=await boot({saved});let r;
 try{
  start(t);r=await boot({saved:checkpoint(t,target.id,'spelling'),hash:'#session'});const before=r.state();answerSpelling(r,target.english);
  assert.equal(r.state().memoryStrength[target.id].total,100);assert.equal(r.state().session.items.filter(i=>i.wordId===target.id).length,5);
  assert.deepEqual(r.state().records[target.id],before.records[target.id]);assert.deepEqual(r.state().records[outside.id],before.records[outside.id]);assert.deepEqual(r.state().memoryStrength[target.id].creditedIds,[]);noErrors(t,r);
 }finally{closeAll(r,t);}
});

test('JSON backup roundtrip keeps cycle draft, round, historical session and deduplicated answer evidence',async()=>{
 const target=school.at(-1),t=await boot({saved:fixture()});let scored,resumed;
 try{
  start(t);scored=await boot({saved:checkpoint(t,target.id,'spelling'),hash:'#session'});answerSpelling(scored,target.english);scored.click('[data-action="next-item"]');scored.click('[data-action="session-replay"]');
  resumed=await boot({saved:checkpoint(scored,school[1].id,'spelling'),hash:'#session'});resumed.input('#spell-input','saved cycle draft');
  const backup=createBackup(createLearningStorage(resumed.w.localStorage),{at:new Date(today).toISOString()}),parsed=parseBackup(JSON.stringify(backup));
  validateStorageRecords(parsed.data.storage,{wordIds:new Set(WORDS.map(w=>w.id))});
  assert.deepEqual(parsed.data.storage[workspaceKey].session,resumed.state().session);assert.equal(parsed.data.storage[workspaceKey].session.round,2);assert.equal(parsed.data.storage[workspaceKey].sessionHistory.length,1);
  const merged=mergeLearningRecords(parsed.data.storage,parsed.data.storage).records;
  assert.deepEqual(merged,parsed.data.storage);assert.deepEqual(mergeLearningRecords(merged,parsed.data.storage).records,merged);
  const map=new Map(),raw={get length(){return map.size;},key:i=>[...map.keys()][i]??null,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
  let destination=createLearningStorage(raw);commitImport(destination,prepareImport(destination,parsed));destination=createLearningStorage(raw);
  const restored=createBackup(destination,{at:backup.exportedAt});assert.deepEqual(restored,backup);const plan=prepareImport(destination,parsed);assert.equal(plan.changed,false);assert.equal(commitImport(destination,plan).unchanged,true);
  assert.equal(resumed.storage()['qa-account-record'],'preserve verbatim');noErrors(t,scored,resumed);
 }finally{closeAll(resumed,scored,t);}
});

test('typing A–Z stays silent in word dictation, sentence dictation and written recall',async()=>{
 const t=await boot({saved:fixture()});let dictation,written,sentence;
 try{
  start(t);const settings=checkpoint(t,school[0].id,'dictation');
  const heard=[];
  const feedback=()=>({prepare(){heard.push('prepare');},stop(){},playInput(event){heard.push(event.data);}});
  dictation=await boot({saved:settings,hash:'#session',letterFeedback:feedback});
  written=await boot({saved:checkpoint(t,school[0].id,'spelling'),hash:'#session',letterFeedback:feedback});
  sentence=await boot({saved:fixture(),hash:'#sentence-dictation',letterFeedback:feedback});
  for(const [app,selector] of [[dictation,'#spell-input'],[written,'#spell-input'],[sentence,'[data-sentence-input]']]){
   const field=app.element(selector);for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){field.value+=letter;field.dispatchEvent(new app.w.InputEvent('input',{bubbles:true,inputType:'insertText',data:letter}));}
  }
  assert.deepEqual(heard,[]);
  assert.equal(dictation.state().session.draft,'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  assert.equal(written.state().session.draft,'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  assert.equal(Object.values(sentence.state().sentenceDictation.items)[0].draft,'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  noErrors(t,dictation,written,sentence);
 }finally{closeAll(t,dictation,written,sentence);}
});

test('study cards automatically read one new word and let the learner replay it',async()=>{
 const t=await boot({saved:fixture()});
 const waitForCount=async n=>{
  for(let i=0;i<100&&t.media.length<n;i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(t.media.length,n);
 };
 try{
  start(t);
  await waitForCount(1);
  assert.equal(t.element('.learning-card .word').textContent,school[0].english);
  t.click('[data-action="next-item"]');
  await waitForCount(2);
  assert.equal(t.element('.learning-card .word').textContent,school[1].english);
  assert.notEqual(t.media[1].src,t.media[0].src,'new card plays its own audio');
  t.click('[data-action="audio"]');
  await waitForCount(3);
  assert.equal(t.media[2].src,t.media[1].src,'manual replay keeps the same word');
  for(let i=2;i<5;i++){
   t.click('[data-action="next-item"]');
   await waitForCount(i+2);
  }
  t.click('[data-action="next-item"]');
  assert.equal(t.state().session.items[t.state().session.index].skill,'meaning');
  await new Promise(r=>setTimeout(r,30));
  assert.equal(t.media.length,6,'no extra automatic playback in meaning');
  noErrors(t);
 }finally{closeAll(t);}
});

test('correct translation advances once, wrong stays, and last correct ends the round',async()=>{
 const initial=await boot({saved:fixture()});let t,last;
 const select=(app,correct)=>{
  const session=app.state().session,entry=school.find(word=>word.id===session.items[session.index].wordId);
  [...app.w.document.querySelectorAll('[data-choice]')].find(b=>(b.dataset.choice===entry.chinese)===correct).click();
 };
 try{
  start(initial);
  const saved=checkpoint(initial,school[0].id,'meaning');
  t=await boot({saved,hash:'#session',interceptAdvance:true});
  const index=t.state().session.index;
  select(t,true);
  assert.equal(t.state().session.index,index);
  assert.equal(t.pendingAdvance.size,1);
  assert.match(t.element('[data-answer-result="correct"]').textContent,/答对了/);
  t.finishCorrectFeedback();
  assert.equal(t.state().session.index,index+1);
  select(t,true);
  t.click('[data-action="next-item"]');
  assert.equal(t.pendingAdvance.size,0,'manual continue cancels the auto timer');
  t.finishCorrectFeedback();
  assert.equal(t.state().session.index,index+2);
  select(t,false);
  assert.equal(t.pendingAdvance.size,0);
  t.finishCorrectFeedback();
  assert.equal(t.state().session.index,index+2);
  assert.ok(t.element('[data-answer-result="incorrect"]'));
  const single=changeSaved(saved,s=>{const i=s.session.index;s.session.items=s.session.items.slice(i,i+1);s.session.index=0;});
  last=await boot({saved:single,hash:'#session',interceptAdvance:true});
  select(last,true);
  last.finishCorrectFeedback();
  assert.equal(last.state().session.done,true);
  assert.match(last.element('h1').textContent,/本轮练习完成/);
  noErrors(t,last);
 }finally{closeAll(initial,t,last);}
});
