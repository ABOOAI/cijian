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
 const text=await readFile(fileURLToPath(requested),'utf8');
 return {ok:true,status:200,json:async()=>JSON.parse(text),text:async()=>text};
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
async function boot({saved={},hash='#daily-insights',at=today}={}){
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const original=await readFile(appURL,'utf8');
 const bindings=await appImports(original);
 const source=original.replace(/^import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?\r?\n/gm,'').replaceAll('import.meta.url',JSON.stringify(appURL.href));
 const errors=[],media=[],intervals=[],vc=new VirtualConsole();
 vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(html,{url:'https://daily-qa.invalid/'+hash,runScripts:'outside-only',virtualConsole:vc,pretendToBeVisual:true});
 const w=dom.window;
 Object.assign(w,bindings,{fetch:localFetch,__WORD_GARDEN_NOW__:at});
 w.crypto.randomUUID=()=>webcrypto.randomUUID();w.scrollTo=()=>{};w.confirm=()=>true;
 w.setInterval=(fn,delay)=>{intervals.push({fn,delay});return intervals.length;};
 // Time only advances when a test explicitly exercises the app's wall clock.
 Object.defineProperty(w.performance,'now',{value:()=>0});
 w.Audio=class{constructor(src){this.src=src;media.push(this);}async play(){}pause(){}};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.speechSynthesis={getVoices:()=>[{lang:'en-US',name:'Synthetic QA voice'}],cancel(){},speak(utterance){media.push(utterance);}};
 w.SpeechSynthesisUtterance=function(text){this.text=text;};
 for(const [key,value] of Object.entries(saved))w.localStorage.setItem(key,value);
 await w.eval('(async()=>{'+source+'\n})()');await settle();
 const element=selector=>{const found=w.document.querySelector(selector);assert.ok(found,'missing '+selector);return found;};
 const click=selector=>{const found=element(selector);assert.ok(!found.disabled,'disabled '+selector);found.click();};
 const input=(selector,value)=>{const found=element(selector);found.value=value;found.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const storage=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const key=w.localStorage.key(i);return [key,w.localStorage.getItem(key)];}));
 const events=()=>Object.entries(storage()).filter(([key])=>key.startsWith(eventPrefix)).map(([,raw])=>JSON.parse(raw));
 const metric=name=>element(`[data-daily-metric="${name}"] [data-daily-value]`).textContent;
 const audioEnd=async()=>{await settle();const playing=[...media].reverse().find(item=>typeof item.onended==='function'||typeof item.onend==='function');assert.ok(playing,'expected pending audio completion');(playing.onended||playing.onend)();await settle();};
 return {w,dom,errors,intervals,bindings,element,click,input,storage,events,metric,audioEnd,
  state:()=>JSON.parse(w.localStorage.getItem(workspaceKey)),
  phrases:()=>JSON.parse(w.localStorage.getItem(phraseKey)),
  close:()=>{w.dispatchEvent(new w.Event('pagehide'));dom.window.close();}};
}

test('new daily page reports missing observations honestly and keeps prior records byte-identical',async()=>{
 const legacy=JSON.stringify({version:2,records:{},exposure:{},stars:7,session:null,results:{'old-question':{correct:true}},settings:{steps:[1,5]},selectedUnit:'unit1'});
 const oldPhrase=JSON.stringify({version:1,records:{},custom:[{id:'custom-col-old',custom:true,english:'legacy phrase',chinese:'',contexts:[]}],history:[],contextSeen:[],needsTransfer:{},session:null,ui:{panel:'home',tab:'unit',filter:'all',page:0}});
 const saved={[workspaceKey]:legacy,[phraseKey]:oldPhrase,'word-garden.progress.v1':'{"version":1,"records":{}}','word-garden.custom.v1':'{"version":1,"words":[]}','qa-unrelated-record':'keep exactly'};
 const t=await boot({saved});try{
  assert.equal(t.element('h1').textContent,'今日学情');assert.ok(t.element('[data-view="daily-insights"]'));
  assert.match(t.metric('accuracy'),/暂无|未记录/);assert.match(t.metric('time'),/未记录/);
  assert.match(t.metric('attempts'),/0/);assert.equal(t.events().length,0);
  for(const [key,raw] of Object.entries(saved))assert.equal(t.w.localStorage.getItem(key),raw,key);
  assert.ok(t.w.localStorage.getItem(metaKey));
  t.click('#daily-insights-refresh');assert.equal(t.events().length,0);assert.equal(t.w.localStorage.getItem(workspaceKey),legacy);
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('a real word first error and guided corrections stay distinct across report refresh and reload',async()=>{
 const t=await boot();let restored;try{
  t.click('[data-view=spelling]');t.input('#word-search','make friends');t.click('[data-practice="unit1-001"]');
  t.input('#spell-input','make friend');t.click('#check-answer');
  const answers=t.events().filter(event=>event.kind==='answer');assert.equal(answers.length,1);
  assert.equal(answers[0].correct,false);assert.equal(answers[0].first,true);assert.equal(answers[0].assisted,false);
  assert.equal(t.state().session.remediation.step,0);
  for(let step=0;step<3;step++){
   if(step){t.click('[data-correction=next]');await t.audioEnd();}
   assert.equal(t.state().session.remediation.step,step);
   t.input('#correction-input','make friends');t.click('#correction-submit');
  }
  assert.equal(t.state().session.remediation.done,true);
  const before=t.events(),corrections=before.filter(event=>event.kind==='correction');
  assert.equal(corrections.length,3);assert.ok(corrections.every(event=>event.relatedId===answers[0].id));
  assert.equal(corrections.filter(event=>event.completed).length,1);
  assert.equal(before.filter(event=>event.kind==='answer'&&event.first&&!event.assisted).length,1);
  t.click('[data-view="daily-insights"]');assert.match(t.metric('accuracy'),/0%/);
  t.click('#daily-insights-refresh');t.click('[data-view=tasks]');t.click('[data-view="daily-insights"]');
  assert.deepEqual(t.events(),before);
  restored=await boot({saved:t.storage()});assert.deepEqual(restored.events(),before);assert.match(restored.metric('accuracy'),/0%/);
  assert.deepEqual(t.errors,[]);assert.deepEqual(restored.errors,[]);
 }finally{restored?.close();t.close();}
});

test('daily page uses recorded timer data without inventing past per-question or per-mode history',async()=>{
 const timerKey='vocabulary.effective-practice.v1';
 const timer=JSON.stringify({version:1,days:{'2026-10-21':720000,'2026-10-20':300000},lease:null});
 const t=await boot({saved:{[timerKey]:timer}});try{
  assert.equal(t.metric('time'),'12分0秒');assert.match(t.metric('accuracy'),/暂无|未记录/);
  assert.equal(t.events().length,0);assert.equal(t.w.localStorage.getItem(timerKey),timer);
  assert.match(t.element('#daily-insights-mode-table').parentElement.parentElement.textContent,/时长未按模式记录/);
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('memory self-ratings and hinted word answers never enter independent first-answer accuracy',async()=>{
 const t=await boot();try{
  t.click('[data-view=memory]');t.input('#word-search','make friends');t.click('[data-practice="unit1-001"]');
  t.click('[data-action=reveal]');t.click('[data-action=rating][data-rating=good]');
  assert.equal(t.events().filter(event=>event.kind==='self').length,1);
  t.click('[data-view=spelling]');t.input('#word-search','make friends');t.click('[data-practice="unit1-001"]');
  t.click('[data-action=hint]');t.input('#spell-input','make friends');t.click('#check-answer');
  const events=t.events();assert.ok(events.some(event=>event.kind==='answer'&&event.assisted));
  assert.equal(events.filter(event=>event.kind==='answer'&&event.first&&!event.assisted).length,0);
  t.click('[data-view="daily-insights"]');assert.match(t.metric('accuracy'),/暂无|未记录/);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('live word listening, phrase and sentence submissions keep distinct learning modes',async()=>{
 const t=await boot();try{
  t.click('[data-view=listening]');t.input('#word-search','make friends');t.click('[data-practice="unit1-001"]');
  await t.audioEnd();t.click('[data-choice="交朋友"]');
  const listening=t.events().at(-1);assert.equal(listening.kind,'answer');
  t.click('[data-view=phrases]');
  const bank=await data('phrases-bank.json'),phrase=bank.entries[0];
  // Select the default unit fixture through the existing public practice button.
  const phraseButton=t.w.document.querySelector(`[data-phrase=one][data-id="${phrase.id}"]`)||t.element('[data-phrase=one]');
  phraseButton.click();t.click('[data-phrase=next]');
  const session=t.phrases().session,item=session.items[session.index];
  t.click(`[data-phrase-choice="${item.question.options.indexOf(item.question.answer)}"]`);
  const phraseEvent=t.events().at(-1);assert.equal(phraseEvent.kind,'answer');
  t.click('[data-view="sentence-dictation"]');
  const card=t.element('[data-sentence-input]'),sentenceId=card.dataset.sentenceInput;
  const sentences=await data('sentence-dictation.json'),sentence=sentences.groups.flatMap(group=>group.items).find(item=>item.id===sentenceId);
  assert.ok(sentence);t.input('[data-sentence-input]',sentence.english);t.element('[data-sentence-form]').requestSubmit();
  const sentenceEvent=t.events().at(-1);assert.equal(sentenceEvent.kind,'answer');
  assert.equal(new Set([listening.mode,phraseEvent.mode,sentenceEvent.mode]).size,3);
  assert.equal(sentenceEvent.mode,'sentence');
  t.click('[data-view="daily-insights"]');assert.match(t.metric('accuracy'),/100%/);
  for(const event of [listening,phraseEvent,sentenceEvent])assert.ok(t.element(`[data-daily-mode-row="${event.mode}"]`));
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('daily refresh crosses the local date boundary without inventing events or sharing another storage space',async()=>{
 const t=await boot();let isolated;try{
  t.click('[data-view=spelling]');t.input('#word-search','make friends');t.click('[data-practice="unit1-001"]');
  t.input('#spell-input','make friends');t.click('#check-answer');
  const events=t.events();assert.equal(events.length,1);
  t.click('[data-view="daily-insights"]');assert.match(t.metric('accuracy'),/100%/);
  t.w.__WORD_GARDEN_NOW__=new Date(2026,9,22,12).getTime();t.click('#daily-insights-refresh');
  assert.match(t.metric('accuracy'),/暂无|未记录/);assert.match(t.metric('attempts'),/0/);assert.deepEqual(t.events(),events);
  isolated=await boot();assert.equal(isolated.events().length,0);assert.match(isolated.metric('accuracy'),/暂无|未记录/);
  assert.deepEqual(t.errors,[]);assert.deepEqual(isolated.errors,[]);
 }finally{isolated?.close();t.close();}
});

test('daily review links only navigate and do not change scores or manufacture answer events',async()=>{
 const t=await boot();try{
  t.click('[data-view=spelling]');t.input('#word-search','make friends');t.click('[data-practice="unit1-001"]');
  t.input('#spell-input','wrong');t.click('#check-answer');t.click('[data-view="daily-insights"]');
  const events=t.events(),workspace=t.w.localStorage.getItem(workspaceKey),phrase=t.w.localStorage.getItem(phraseKey);
  t.click('#daily-insights-priorities [data-daily-item]');
  assert.notEqual(t.w.location.hash,'#daily-insights');assert.deepEqual(t.events(),events);
  assert.equal(t.w.localStorage.getItem(workspaceKey),workspace);assert.equal(t.w.localStorage.getItem(phraseKey),phrase);
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
