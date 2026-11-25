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
async function boot({saved={},hash='#custom',at=today,voices=[{lang:'en-US',name:'Synthetic QA voice'}],kokoroError=null}={}){
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

const customKey='word-garden.custom.v1';
const word={id:'custom-rice',english:'rice',chinese:'米饭',group:'饮食',status:'custom'};
const sentence={id:'custom-sentence-rice',english:'I like rice.',chinese:'我喜欢米饭。',group:'句子'};
function savedFixture(extra={}){return {[workspaceKey]:JSON.stringify({version:2,records:{},memoryStrength:{},exposure:{},autoCooldown:{},stars:9,session:null,results:{legacy:{correct:true}},settings:{steps:[1,5]},selectedUnit:'unit1',sentenceDictation:{customSentences:[sentence],items:{[sentence.id]:{independentCorrect:7,correctCount:7,attempts:7}}},...extra}),[customKey]:JSON.stringify({version:1,words:[word]}),'qa-account-record':'preserve verbatim'};}
const learn=(t,id,mode)=>t.click(`[data-custom-learn="${id}"][data-mode="${mode}"]`);

test('custom page exposes every learning mode for legacy words and sentences without transferring old mastery',async()=>{
 const saved=savedFixture(),t=await boot({saved});try{
  assert.equal(t.element('h1').textContent,'自定义单词');
  for(const entry of [word,sentence])for(const mode of ['memory','meaning','listening','dictation','spelling'])t.element(`[data-custom-learn="${entry.id}"][data-mode="${mode}"]`);
  assert.equal(t.state().memoryStrength[sentence.id],undefined);assert.equal(t.state().sentenceDictation.items[sentence.id].independentCorrect,7);
  assert.equal(t.w.localStorage.getItem(customKey),saved[customKey]);assert.equal(t.w.localStorage.getItem('qa-account-record'),'preserve verbatim');assert.equal(t.state().stars,9);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('every custom sentence mode uses the same real word scheduler and awards once across reload',async()=>{
 for(const mode of ['memory','meaning','listening','dictation','spelling']){
  const t=await boot({saved:savedFixture()});let restored;try{
   learn(t,sentence.id,mode);
   if(['listening','dictation'].includes(mode)){assert.equal(mode==='dictation'?t.element('#check-answer').disabled:t.element('[data-choice]').disabled,true);await t.audioEnd();}
   if(mode==='memory'){t.click('[data-action=reveal]');t.click('[data-action=rating][data-rating=good]');}
   else if(['meaning','listening'].includes(mode))t.click(`[data-choice="${sentence.chinese}"]`);
   else{t.input('#spell-input',' i LIKE   rice! ');t.click('#check-answer');}
   const state=t.state(),skill=mode==='memory'?'meaning':mode;
   assert.equal(state.memoryStrength[sentence.id].total,10,mode);assert.ok(state.records[sentence.id].skills[skill].dueAt>today,mode);assert.equal(state.session.result.correct===false,false,mode);
   const before=JSON.stringify(state.memoryStrength[sentence.id]);restored=await boot({saved:t.storage(),hash:'#session'});
   assert.equal(JSON.stringify(restored.state().memoryStrength[sentence.id]),before,mode);assert.equal(restored.state().sentenceDictation.items[sentence.id].independentCorrect,7);assert.deepEqual(t.errors,[]);assert.deepEqual(restored.errors,[]);
  }finally{restored?.close();t.close();}
 }
});
test('custom words retain scoring and dictation cannot submit before real audio completion',async()=>{
 const t=await boot({saved:savedFixture()});try{
  learn(t,word.id,'dictation');t.input('#spell-input','rice');t.element('#spell-form').requestSubmit();assert.equal(t.state().session.result,null);assert.equal(t.state().memoryStrength[word.id],undefined);
  await t.audioEnd();t.click('#check-answer');assert.equal(t.state().session.result.correct,true);assert.equal(t.state().memoryStrength[word.id].total,10);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('failed Kokoro stays locked regardless of available device voices',async()=>{
 const t=await boot({saved:savedFixture(),voices:[{lang:'en-GB',name:'British only'}],kokoroError:'QA model unavailable'});try{
  learn(t,sentence.id,'dictation');for(let i=0;i<100&&!t.w.document.querySelector('[data-audio-kokoro-retry]');i++)await new Promise(r=>setTimeout(r,5));assert.equal(t.w.document.querySelector('[data-audio-device-fallback]'),null);await settle();assert.equal(t.element('#check-answer').disabled,true);assert.match(t.element('#speech-notice').textContent,/QA model unavailable/);
  t.input('#spell-input',sentence.english);t.element('#spell-form').requestSubmit();assert.equal(t.state().session.result,null);assert.equal(t.state().memoryStrength[sentence.id],undefined);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('long sentence spelling accepts the full sentence and practice returns to the custom page',async()=>{
 const long={...sentence,english:'I '.repeat(199)+'go'};assert.equal(long.english.length,400);
 const t=await boot({saved:savedFixture({sentenceDictation:{customSentences:[long],items:{}}})});try{
  learn(t,sentence.id,'spelling');assert.ok(t.element('#spell-input').maxLength>=400);assert.equal(t.w.document.activeElement.id,'spell-input');
  t.input('#spell-input',long.english);t.click('#check-answer');assert.equal(t.state().session.result.correct,true);
  t.click('[data-action=back-parent]');assert.equal(t.element('h1').textContent,'自定义单词');learn(t,sentence.id,'spelling');assert.equal(t.w.document.activeElement.id,'spell-input');assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('sentence manager preserves Chinese-only progress and archives English changes without harming old results',async()=>{
 const t=await boot({saved:savedFixture()});try{
  learn(t,sentence.id,'spelling');t.input('#spell-input',sentence.english);t.click('#check-answer');const strength=JSON.stringify(t.state().memoryStrength[sentence.id]);
  t.click('[data-view=custom]');t.click(`[data-edit="${sentence.id}"]`);t.input('[name=chinese]','我爱吃米饭。');t.element('#custom-sentence-editor').requestSubmit();await settle();
  assert.equal(JSON.stringify(t.state().memoryStrength[sentence.id]),strength);assert.equal(t.state().sentenceDictation.items[sentence.id].independentCorrect,7);
  t.click(`[data-custom-sentence-edit="${sentence.id}"]`);t.input('[name=english]','I like milk.');t.input('[name=chinese]','我喜欢牛奶。');t.element('#custom-sentence-editor').requestSubmit();await settle();
  assert.equal(t.state().memoryStrength[sentence.id],undefined);assert.equal(t.state().customLearningHistory.at(-1).english,sentence.english);assert.equal(t.state().customLearningHistory.at(-1).memoryStrength.total,10);assert.equal(t.state().session,null);
  assert.equal(t.state().sentenceDictation.customHistory.at(-1).progress.independentCorrect,7);assert.equal(t.w.localStorage.getItem('qa-account-record'),'preserve verbatim');assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('legacy sentence without Chinese has usable recall and dictation but no empty-answer choices',async()=>{
 const t=await boot({saved:savedFixture({sentenceDictation:{customSentences:[{...sentence,chinese:''}],items:{}}})});try{
  for(const mode of ['memory','dictation'])t.element(`[data-custom-learn="${sentence.id}"][data-mode="${mode}"]`);
  for(const mode of ['meaning','listening','spelling'])assert.equal(t.w.document.querySelector(`[data-custom-learn="${sentence.id}"][data-mode="${mode}"]`),null);
  assert.match(t.element('#page').textContent,/补充中文/);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('Enter submits once and reload retains custom draft without duplicate awards',async()=>{
 const t=await boot({saved:savedFixture()});let restored;try{
  learn(t,sentence.id,'spelling');t.input('#spell-input',sentence.english);
  restored=await boot({saved:t.storage(),hash:'#session'});assert.equal(restored.element('#spell-input').value,sentence.english);assert.equal(restored.w.document.activeElement.id,'spell-input');
  const input=restored.element('#spell-input');input.dispatchEvent(new restored.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await settle();
  assert.equal(restored.state().session.result.correct,true);assert.equal(restored.state().memoryStrength[sentence.id].total,10);
  restored.element('#page').dispatchEvent(new restored.w.KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true,cancelable:true}));assert.equal(restored.state().memoryStrength[sentence.id].total,10);assert.deepEqual(restored.errors,[]);
 }finally{restored?.close();t.close();}
});
test('failed sentence edit rolls back outer scores, session and English, retains draft, then safely retries',async()=>{
 const t=await boot({saved:savedFixture()});const storageProto=t.w.Storage.prototype,originalSet=storageProto.setItem;try{
  learn(t,sentence.id,'spelling');t.input('#spell-input',sentence.english);t.click('#check-answer');
  t.click('[data-view=custom]');t.click(`[data-edit="${sentence.id}"]`);
  t.input('[name=english]','I like milk.');t.input('[name=chinese]','我喜欢牛奶。');
  const before=t.state(),raw=t.w.localStorage.getItem(workspaceKey);
  storageProto.setItem=function(key,value){if(key===workspaceKey)throw new t.w.DOMException('QA quota full','QuotaExceededError');return originalSet.call(this,key,value);};
  t.element('#custom-sentence-editor').requestSubmit();await settle();
  assert.equal(t.w.localStorage.getItem(workspaceKey),raw);assert.match(t.element('#custom-sentence-error').textContent,/未能保存/);assert.equal(t.element('[name=english]').value,'I like milk.');
  storageProto.setItem=originalSet;
  // Persist the retained draft again, proving the live outer objects rolled back,
  // not merely that a failed storage write left its old bytes untouched.
  t.input('[name=group]','句子');const after=t.state();
  for(const key of ['records','memoryStrength','exposure','autoCooldown','session','customLearningIndex','customLearningHistory','customLearningSessionHistory'])assert.deepEqual(after[key],before[key],key);
  assert.equal(after.sentenceDictation.customSentences[0].english,sentence.english);assert.equal(after.sentenceDictation.items[sentence.id].independentCorrect,7);
  t.element('#custom-sentence-editor').requestSubmit();await settle();assert.equal(t.state().sentenceDictation.customSentences[0].english,'I like milk.');assert.equal(t.state().memoryStrength[sentence.id],undefined);assert.equal(t.state().customLearningHistory.length,1);assert.equal(t.state().customLearningHistory[0].memoryStrength.total,10);assert.equal(t.state().session,null);assert.deepEqual(t.errors,[]);
 }finally{storageProto.setItem=originalSet;t.close();}
});

test('standalone custom-sentences sidebar opens an immediate empty add form and saves a whole sentence',async()=>{
 const t=await boot({hash:'#tasks'});let restored;try{
  assert.equal(t.w.localStorage.getItem(phraseKey),null);
  t.click('[data-view="custom-sentences"]');assert.equal(t.w.location.hash,'#custom-sentences');assert.equal(t.element('h1').textContent,'自定义句子');
  t.element('#custom-sentence-editor');assert.equal(t.w.document.activeElement.name,'english');assert.match(t.element('#page').textContent,/添加自定义句子/);
  t.input('[name=english]','We study English together.');t.input('[name=chinese]','我们一起学习英语。');t.element('#custom-sentence-editor').requestSubmit();await settle();
  const state=t.state(),items=state.sentenceDictation.customSentences;assert.equal(items.length,1);assert.equal(items[0].english,'We study English together.');assert.equal(t.w.localStorage.getItem(customKey),null,'never split sentence into custom words');
  for(const mode of ['memory','meaning','listening','dictation','spelling'])t.element(`[data-sentence-mode="${mode}"][data-sentence-id="${items[0].id}"]`);
  assert.equal(t.w.localStorage.getItem(phraseKey),null,'sentence creation must not write unrelated phrase root');
  restored=await boot({saved:t.storage(),hash:'#custom-sentences'});assert.equal(restored.element('h1').textContent,'自定义句子');restored.element('#custom-sentence-editor');assert.equal(restored.state().sentenceDictation.customSentences.length,1);
  for(const mode of ['memory','meaning','listening','dictation','spelling'])restored.element(`[data-sentence-mode="${mode}"][data-sentence-id="${items[0].id}"]`);
  assert.deepEqual(t.errors,[]);assert.deepEqual(restored.errors,[]);
 }finally{restored?.close();t.close();}
});

test('standalone saved sentence exposes direct mode callbacks with practice return to the same page',async()=>{
 for(const mode of ['memory','meaning','listening','dictation','spelling']){
  const t=await boot({saved:savedFixture(),hash:'#custom-sentences'});try{
   t.click(`[data-sentence-mode="${mode}"][data-sentence-id="${sentence.id}"]`);
   assert.equal(t.w.location.hash,'#session');assert.equal(t.state().session.items[0].wordId,sentence.id);assert.equal(t.state().session.items[0].skill,mode);assert.equal(t.state().session.origin.view,'custom-sentences');
   if(['listening','dictation'].includes(mode))await t.audioEnd();
   if(mode==='memory'){t.click('[data-action=reveal]');t.click('[data-action=rating][data-rating=good]');}
   else if(['meaning','listening'].includes(mode))t.click(`[data-choice="${sentence.chinese}"]`);
   else{t.input('#spell-input',sentence.english);t.click('#check-answer');}
   assert.equal(t.state().memoryStrength[sentence.id].total,10);t.click('[data-action=back-parent]');assert.equal(t.w.location.hash,'#custom-sentences');assert.equal(t.element('h1').textContent,'自定义句子');t.element('#custom-sentence-editor');assert.deepEqual(t.errors,[]);
  }finally{t.close();}
 }
});

test('adding a sentence from standalone page preserves previous word and sentence scores and source stores',async()=>{
 const saved=savedFixture(),t=await boot({saved});try{
  learn(t,word.id,'spelling');t.input('#spell-input',word.english);t.click('#check-answer');t.click('[data-view=custom]');learn(t,sentence.id,'spelling');t.input('#spell-input',sentence.english);t.click('#check-answer');
  const before=t.state(),customRaw=t.w.localStorage.getItem(customKey);
  t.click('[data-view="custom-sentences"]');t.input('[name=english]','My brother has a blue bicycle.');t.input('[name=chinese]','我哥哥有一辆蓝色自行车。');t.element('#custom-sentence-editor').requestSubmit();await settle();
  const after=t.state();assert.equal(after.sentenceDictation.customSentences.length,2);for(const key of ['records','memoryStrength','exposure','autoCooldown','session','results','stars'])assert.deepEqual(after[key],before[key],key);
  assert.deepEqual(after.sentenceDictation.items,before.sentenceDictation.items);assert.equal(t.w.localStorage.getItem(customKey),customRaw);assert.equal(t.w.localStorage.getItem(phraseKey),null);assert.equal(t.w.localStorage.getItem('qa-account-record'),'preserve verbatim');assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

const builtinSentence=(await data('sentence-dictation.json')).groups[0].items[0];
const dueSkill={phase:'short',step:0,level:0,dueAt:today-60000,lastAt:today-120000,reviews:1,successes:0,lapses:0,mistake:false,clearStreak:0};
const trackedSentence=(t,id,mode)=>t.click(`[data-sentence-track-mode="${mode}"][data-sentence-id="${id}"]`);
function scope(t,value){const e=t.element('#scope-select');e.value=value;e.dispatchEvent(new t.w.Event('change',{bubbles:true}));}

test('sentence tracker is a separate deep-linked sidebar module with 50 built-ins and saved custom sentences',async()=>{
 const saved=savedFixture(),t=await boot({saved,hash:'#sentence-track'});try{
  assert.equal(t.element('h1').textContent,'句子记忆追踪');
  t.element('[data-view="track"]');t.element('[data-view="sentence-track"]');
  assert.match(t.element('#scope-select').textContent,/51/);
  assert.equal([...t.w.document.querySelectorAll('h2')].filter(e=>e.textContent==='句子进度与手动练习').length,1);
  for(const mode of ['memory','meaning','listening','dictation','spelling'])t.element(`[data-sentence-track-mode="${mode}"][data-sentence-id="${builtinSentence.id}"]`);
  scope(t,'custom');for(const mode of ['memory','meaning','listening','dictation','spelling'])t.element(`[data-sentence-track-mode="${mode}"][data-sentence-id="${sentence.id}"]`);
  assert.equal(t.w.document.querySelector(`[data-sentence-id="${word.id}"]`),null);
  assert.equal(t.w.localStorage.getItem(customKey),saved[customKey]);assert.deepEqual(t.state().sentenceDictation.items,JSON.parse(saved[workspaceKey]).sentenceDictation.items);assert.deepEqual(t.state().memoryStrength,{});
  t.click('[data-view=track]');assert.equal(t.element('h1').textContent,'记忆追踪');assert.equal(t.w.location.hash,'#track');assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('built-in sentence tracker manual recall awards 10 once, restores across reload and returns to tracker',async()=>{
 const t=await boot({saved:savedFixture(),hash:'#sentence-track'});let restored;try{
  trackedSentence(t,builtinSentence.id,'spelling');assert.equal(t.state().session.origin.view,'sentence-track');
  t.input('#spell-input',builtinSentence.english.toUpperCase());t.click('#check-answer');
  assert.equal(t.state().session.result.correct,true);assert.equal(t.state().memoryStrength[builtinSentence.id].total,10);assert.equal(t.state().records[word.id],undefined);assert.equal(t.state().sentenceDictation.items[sentence.id].independentCorrect,7);
  restored=await boot({saved:t.storage(),hash:'#session'});assert.equal(restored.state().memoryStrength[builtinSentence.id].total,10);restored.click('[data-action=back-parent]');assert.equal(restored.w.location.hash,'#sentence-track');assert.equal(restored.element('h1').textContent,'句子记忆追踪');
  assert.deepEqual(t.errors,[]);assert.deepEqual(restored.errors,[]);
 }finally{restored?.close();t.close();}
});

test('sentence automatic review uses tracking cooldown and does not resume an existing word-review queue',async()=>{
 const prior={id:'qa-old-word-review',origin:{view:'track',filter:'all',learningTrack:'regular'},items:[{wordId:word.id,skill:'meaning'}],index:0,title:'old word review',kind:'review-all',manual:false,cooldownPolicy:'tracking',queuePolicyVersion:2,reviewSkill:'all',result:null,draft:'',startedAt:today,done:false};
 const records={[word.id]:{skills:{meaning:{...dueSkill}}},[builtinSentence.id]:{skills:{meaning:{...dueSkill},spelling:{...dueSkill}}}};
 const t=await boot({saved:savedFixture({session:prior,records}),hash:'#sentence-track'});try{
  t.click('[data-action=review-all][data-skill=all]');const session=t.state().session;
  assert.notEqual(session.id,prior.id);assert.equal(session.origin.view,'sentence-track');assert.equal(session.cooldownPolicy,'tracking');assert.deepEqual(session.items.map(i=>i.wordId),[builtinSentence.id,builtinSentence.id]);
  t.click(`[data-choice="${builtinSentence.chinese}"]`);assert.equal(t.state().memoryStrength[builtinSentence.id].total,10);assert.ok(t.state().autoCooldown[builtinSentence.id]>=today+30*60000);
  t.click('[data-action=next-item]');assert.equal(t.state().session.done,true);assert.equal(t.state().records[builtinSentence.id].skills.spelling.reviews,1,'unpracticed skill retains obligation');assert.equal(t.state().records[word.id].skills.meaning.reviews,1);
  t.click('[data-action=track-nav]');assert.equal(t.w.location.hash,'#sentence-track');assert.equal(t.element('[data-action=review-all][data-skill=all]').disabled,true);
  t.w.__WORD_GARDEN_NOW__=today+31*60000;t.intervals.find(i=>i.delay===15000).fn();assert.equal(t.element('[data-action=review-all][data-skill=all]').disabled,false);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('100 percent sentence is excluded from automatic review but remains manually available without loss',async()=>{
 const total={version:1,total:100,skills:Object.fromEntries(['meaning','listening','dictation','spelling'].map(s=>[s,{points:25,lastCreditDay:null}])),events:[]};
 const saved=savedFixture({records:{[builtinSentence.id]:{skills:{meaning:{...dueSkill},spelling:{...dueSkill}}}},memoryStrength:{[builtinSentence.id]:total}}),t=await boot({saved,hash:'#sentence-track'});try{
  assert.equal(t.element('[data-action=review-all][data-skill=all]').disabled,true);trackedSentence(t,builtinSentence.id,'spelling');t.input('#spell-input','wrong sentence');t.click('#check-answer');assert.equal(t.state().memoryStrength[builtinSentence.id].total,100);t.click('[data-view=sentence-track]');assert.equal(t.element('[data-action=review-all][data-skill=all]').disabled,true);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('custom sentence tracker reuses established strength and original sentence history',async()=>{
 const t=await boot({saved:savedFixture(),hash:'#custom-sentences'});try{
  t.click(`[data-sentence-mode="spelling"][data-sentence-id="${sentence.id}"]`);t.input('#spell-input',sentence.english);t.click('#check-answer');assert.equal(t.state().memoryStrength[sentence.id].total,10);
  t.click('[data-view=sentence-track]');scope(t,'custom');trackedSentence(t,sentence.id,'spelling');t.input('#spell-input',sentence.english);t.click('#check-answer');assert.equal(t.state().memoryStrength[sentence.id].total,20);assert.equal(t.state().sentenceDictation.items[sentence.id].independentCorrect,7);assert.equal(t.state().records[word.id],undefined);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('all five built-in sentence modes use whole-sentence answers and recorded-audio completion gating',async()=>{
 for(const mode of ['memory','meaning','listening','dictation','spelling']){
  const t=await boot({saved:savedFixture(),hash:'#sentence-track',voices:[]});try{
   trackedSentence(t,builtinSentence.id,mode);
   if(['listening','dictation'].includes(mode)){
    assert.equal(mode==='dictation'?t.element('#check-answer').disabled:t.element('[data-choice]').disabled,true);
    if(mode==='dictation'){t.input('#spell-input',builtinSentence.english);t.element('#spell-form').requestSubmit();assert.equal(t.state().session.result,null);}
    assert.match(t.element('.audio-source').textContent,/整句录音/);await t.audioEnd();
   }
   if(mode==='memory'){t.click('[data-action=reveal]');t.click('[data-action=rating][data-rating=good]');}
   else if(['meaning','listening'].includes(mode))t.click(`[data-choice="${builtinSentence.chinese}"]`);
   else{t.input('#spell-input',builtinSentence.english);t.click('#check-answer');}
   assert.equal(t.state().session.result.correct,true,mode);assert.equal(t.state().memoryStrength[builtinSentence.id].total,10,mode);assert.deepEqual(t.errors,[]);
  }finally{t.close();}
 }
});

test('custom Kokoro works without device voices; generation alone never unlocks dictation',async()=>{
 const t=await boot({saved:savedFixture(),voices:[]});try{
  learn(t,sentence.id,'dictation');for(let i=0;i<100&&!t.media.some(x=>x.src?.startsWith('blob:'));i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(t.generations.length,1);assert.equal(t.generations[0].text,sentence.english);assert.match(t.generations[0].voice,/^(af_heart|am_michael)$/);assert.equal(t.media.some(x=>x.text),false,'no device utterance');assert.equal(t.element('#check-answer').disabled,true);
  t.input('#spell-input',sentence.english);t.element('#spell-form').requestSubmit();assert.equal(t.state().session.result,null);await t.audioEnd();assert.equal(t.element('#check-answer').disabled,false);t.click('#check-answer');assert.equal(t.state().memoryStrength[sentence.id].total,10);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('failed Kokoro generation stays ungraded with retry and no device fallback',async()=>{
 const t=await boot({saved:savedFixture(),kokoroError:'QA model unavailable'});try{
  learn(t,word.id,'dictation');for(let i=0;i<100&&!t.w.document.querySelector('[data-audio-kokoro-retry]');i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(t.media.length,0,'no automatic device fallback');assert.equal(t.element('#check-answer').disabled,true);assert.match(t.element('#speech-notice').textContent,/QA model unavailable/);
  t.input('#spell-input',word.english);t.element('#spell-form').requestSubmit();assert.equal(t.state().session.result,null);assert.equal(t.w.document.querySelector('[data-audio-device-fallback]'),null);t.click('[data-audio-kokoro-retry]');await settle();assert.equal(t.media.length,0);assert.equal(t.element('#check-answer').disabled,true);assert.equal(t.state().memoryStrength[word.id],undefined);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('custom collocation and example both use stable Kokoro voice and stop on navigation',async()=>{
 const t=await boot({saved:savedFixture(),hash:'#phrases',voices:[]});try{
  t.input('[name="english"]','take initiative');t.input('[name="chinese"]','主动采取行动');t.input('[name="exampleEn"]','We take initiative at school.');t.input('[name="exampleZh"]','我们在学校主动采取行动。');
  t.element('form').dispatchEvent(new t.w.SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:t.element('#phrase-save-learn')}));await settle();
  t.click('[data-phrase="audio"]');await t.audioEnd();
  assert.equal(t.generations.at(-1).text,'take initiative');assert.match(t.generations.at(-1).voice,/^(af_heart|am_michael)$/);assert.equal(t.media.some(x=>x.text),false);
  const voice=t.generations.at(-1).voice;t.click('[data-phrase="example-audio"]');for(let i=0;i<100&&t.media.length<2;i++)await new Promise(r=>setTimeout(r,5));await t.audioEnd();assert.equal(t.generations.at(-1).text,'We take initiative at school.');assert.equal(t.generations.at(-1).voice,voice);assert.match(t.element('#phrase-audio-status').textContent,/朗读完成/);assert.equal(t.w.document.querySelector('[data-audio-device-fallback]'),null);
  t.click('[data-phrase="audio"]');await settle();const previous=t.media.at(-1).onended;t.click('[data-phrase="stop-audio"]');assert.equal(t.element('#phrase-audio-status').textContent,'已停止。');t.click('[data-phrase="pause"]');previous?.();assert.match(t.element('#page').textContent,/已暂停/);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('all production UI routes exclude device speech and device fallback controls',async()=>{
 for(const name of ['app.js','phrases-ui.js','adaptive-ui.js','sentence-dictation.js','custom-sentences.js']){
  const source=await readFile(new URL('../src/'+name,import.meta.url),'utf8');assert.doesNotMatch(source,/playSpeech|speechSynthesis|SpeechSynthesisUtterance|audioDeviceFallback|改用设备/);
 }
 const app=await readFile(appURL,'utf8');assert.match(app,/playKokoro:\(text,options\)=>customKokoro.play\(text,options\)/);assert.match(app,/else customKokoro.play\(text,\{\.\.\.handlers,id:customId\|\|'text:'\+text\}\)/);
});
