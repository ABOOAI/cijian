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

test('sentence center is a practice entry with task layout and scope-preserving practice',async()=>{
 const t=await boot({saved:savedFixture(),hash:'#sentence-center'});try{
 assert.equal(t.element('h1').textContent,'句子中心');t.element('.workspace .unit-grid');t.element('.metrics');t.element('.rail');
 t.click('[data-sentence-unit="custom"]');t.click('[data-action="sentence-center-start"][data-mode="spelling"]');
 assert.deepEqual(t.state().session.items,[{wordId:sentence.id,skill:'spelling'}]);assert.equal(t.state().session.origin.view,'sentence-center');
 t.input('#spell-input',sentence.english);t.click('#check-answer');t.click('[data-action="next-item"]');
 const prior=t.state(),record=prior.records[sentence.id],strength=prior.memoryStrength[sentence.id],stars=prior.stars;
 t.click('[data-action="session-replay"]');assert.equal(t.state().session.index,0);assert.equal(t.state().session.draft,'');assert.equal(t.state().session.result,null);assert.equal(t.state().sessionHistory.length,1);
 t.input('#spell-input',sentence.english);t.click('#check-answer');t.click('[data-action="next-item"]');assert.equal(t.state().session.done,true);
 assert.deepEqual(t.state().records[sentence.id],record);assert.equal(t.state().memoryStrength[sentence.id].total,strength.total);assert.deepEqual(t.state().memoryStrength[sentence.id].creditedIds,strength.creditedIds);assert.equal(t.state().stars,stars);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('replay retains every completed word/study item even at 100 percent and across reload',async()=>{
 const initial={id:'completed',items:[{wordId:word.id,skill:'study'},{wordId:word.id,skill:'meaning'},{wordId:sentence.id,skill:'memory'}],index:3,title:'完成的混合轮',done:true,origin:{view:'custom',filter:'all'},kind:'lesson',manual:true};
 const t=await boot({saved:savedFixture({session:initial}),hash:'#session'});let r;try{
 t.click('[data-action="session-replay"]');t.click('[data-action="next-item"]');assert.equal(t.state().records[word.id],undefined,'study replay must not introduce or reset');
 r=await boot({saved:t.storage(),hash:'#session'});assert.equal(r.state().session.index,1);assert.equal(r.state().session.practiceOnly,true);
 r.click(`[data-choice="${word.chinese}"]`);r.click('[data-action="next-item"]');assert.equal(r.state().session.practiceOnly,true);
 r.click('[data-action="reveal"]');r.click('[data-action="rating"][data-rating="good"]');r.click('[data-action="next-item"]');assert.equal(r.state().session.done,true);assert.equal(r.state().stars,9);assert.deepEqual(r.state().session.items,initial.items);assert.deepEqual(r.state().results,{legacy:{correct:true}});assert.deepEqual(r.errors,[]);
 }finally{r?.close();t.close();}
});
test('sentence center never silently replaces unfinished word work and custom manager returns to center',async()=>{
 const pending={id:'pending',items:[{wordId:word.id,skill:'meaning'}],index:0,title:'未完单词',done:false,origin:{view:'custom'},kind:'practice',manual:true,result:null,draft:''};
 const t=await boot({saved:savedFixture({session:pending}),hash:'#sentence-center'});try{
 t.click('[data-action="sentence-center-start"][data-mode="memory"]');assert.equal(t.state().session.id,'pending');assert.equal(t.w.location.hash,'#session');assert.deepEqual(t.errors,[]);
 }finally{t.close();}
 const c=await boot({saved:savedFixture(),hash:'#sentence-center'});try{c.click('[data-action="custom-sentences"]');assert.match(c.element('.page-back').textContent,/返回句子中心/);c.click('[data-action="back-parent"]');assert.equal(c.element('h1').textContent,'句子中心');}finally{c.close();}
});
