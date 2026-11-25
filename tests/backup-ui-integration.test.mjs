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
 const errors=[],media=[],intervals=[],downloads=[],vc=new VirtualConsole();let reloads=0;
 vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(html,{url:'https://daily-qa.invalid/'+hash,runScripts:'outside-only',virtualConsole:vc,pretendToBeVisual:true});
 const w=dom.window;
 Object.assign(w,bindings,{fetch:localFetch,__WORD_GARDEN_NOW__:at});
 const nativeBind=bindings.bindBackupUI;w.bindBackupUI=options=>nativeBind({...options,reload:()=>{reloads++;}});
 w.Blob=class{constructor(parts,options){this.parts=parts;this.type=options.type;}};w.URL.createObjectURL=blob=>{downloads.push(blob.parts.join(''));return 'blob:https://daily-qa.invalid/test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};const originalTimeout=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>ms===80?(fn(),0):originalTimeout(fn,ms,...args);
 w.crypto.randomUUID=()=>webcrypto.randomUUID();w.scrollTo=()=>{};w.confirm=()=>true;
 w.setInterval=(fn,delay)=>{intervals.push({fn,delay});return intervals.length;};
 // Time only advances when a test explicitly exercises the app's wall clock.
 Object.defineProperty(w.performance,'now',{value:()=>0});
 w.Audio=class{constructor(src){this.src=src;media.push(this);}async play(){}pause(){}};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.speechSynthesis={getVoices:()=>[{lang:'en-US',name:'Synthetic QA voice'}],cancel(){},speak(utterance){media.push(utterance);}};
 w.SpeechSynthesisUtterance=function(text){this.text=text;};
 for(const [key,value] of Object.entries(saved))w.localStorage.setItem(key,value);
 await w.eval('(async()=>{'+source+'\n})()');await settle();
 const element=selector=>{const found=w.document.querySelector(selector);assert.ok(found,'missing '+selector);return found;};
 const click=selector=>{const found=element(selector);assert.ok(!found.disabled,'disabled '+selector);found.click();};
 const input=(selector,value)=>{const found=element(selector);found.value=value;found.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const storage=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const key=w.localStorage.key(i);return [key,w.localStorage.getItem(key)];}));
 const learning=()=>bindings.createLearningStorage(w.localStorage);
 const events=()=>Object.entries(learning().snapshot()).filter(([key])=>key.startsWith(eventPrefix)).map(([,raw])=>JSON.parse(raw));
 const metric=name=>element(`[data-daily-metric="${name}"] [data-daily-value]`).textContent;
 const audioEnd=async()=>{await settle();const playing=[...media].reverse().find(item=>typeof item.onended==='function'||typeof item.onend==='function');assert.ok(playing,'expected pending audio completion');(playing.onended||playing.onend)();await settle();};
 const choose=async value=>{const file=element('#learning-backup-file'),text=typeof value==='string'?value:JSON.stringify(value);Object.defineProperty(file,'files',{configurable:true,value:[{size:new TextEncoder().encode(text).length,text:async()=>text}]});await file.onchange();await settle();};
 return {w,dom,errors,intervals,downloads,choose,learning,reloads:()=>reloads,bindings,element,click,input,storage,events,metric,audioEnd,
  state:()=>JSON.parse(learning().getItem(workspaceKey)),
  phrases:()=>JSON.parse(learning().getItem(phraseKey)),
  close:()=>{w.dispatchEvent(new w.Event('pagehide'));dom.window.close();}};
}

import {createBackup,parseBackup} from '../src/learning-backup.js';
import {makeCustom} from '../src/custom-words.js';
import {freshPhrases,startPhraseSession,advancePhrase,submitPhrase} from '../src/phrases.js';
const customKey='word-garden.custom.v1';
const openSettings=t=>t.click('#settings-button');
const exported=t=>{t.click('#export-learning-backup');assert.equal(t.downloads.length,1,t.element('#learning-backup-status').textContent);return parseBackup(t.downloads[0]);};
const logical=t=>t.learning().snapshot();
function incoming(base,{done=false}={}){const b=structuredClone(base),s=b.data.storage[workspaceKey];s.settings.steps=[5,20];s.session={id:'backup-session',items:[{wordId:'custom-backupword',skill:'spelling'}],index:done?1:0,title:'备份练习',kind:'practice',manual:true,done,draft:'partial backup answer',result:done?{correct:true}:null,startedAt:today,attemptNo:0,practiceOnly:done};s.records={};s.memoryStrength={};s.exposure={};s.autoCooldown={};s.sentenceDictation={items:{'custom-sentence-backup':{draft:'I study',attempts:0,correctCount:0,independentCorrect:0,result:null,revealed:false}},customSentences:[{id:'custom-sentence-backup',english:'I study English.',chinese:'我学习英语。',group:'备份句子'}]};s.customLearningIndex={'custom-sentence-backup':'I study English.'};b.data.storage[customKey]={version:1,words:[makeCustom({english:'backupword',chinese:'备份测试词'},'custom-backupword')]};const p=freshPhrases();p.custom=[{id:'custom-col-backup',custom:true,english:'backup phrase',chinese:'备份搭配',contexts:[],acceptedAnswers:[],example:{en:'',zh:''}}];b.data.storage[phraseKey]=p;return b;}

test('actual settings exports every saved store and preview/cancel/malformed files preserve learning data',async()=>{const t=await boot({saved:{'unrelated':'keep'}});try{openSettings(t);assert.ok(t.element('#import-learning-backup'));const b=exported(t);assert.equal(b.formatVersion,1);assert.ok(b.data.storage[workspaceKey]);assert.ok(b.data.storage[phraseKey]);assert.ok(b.data.storage[metaKey]);assert.equal(b.data.storage.unrelated,undefined);const before=logical(t);await t.choose(incoming(b));assert.equal(t.element('#learning-backup-preview').hidden,false);assert.equal(t.element('#learning-backup-mode').value,'merge');assert.deepEqual(logical(t),before);t.click('#cancel-learning-backup');assert.equal(t.element('#learning-backup-preview').hidden,true);assert.deepEqual(logical(t),before);for(const value of ['{broken','{"format":"foreign","data":{}}','{"format":"cijian-learning-backup","formatVersion":999}']){await t.choose(value);assert.match(t.element('#learning-backup-status').textContent,/未导入/);assert.deepEqual(logical(t),before);}assert.equal(t.w.localStorage.getItem('unrelated'),'keep');assert.deepEqual(t.errors,[]);}finally{t.close();}});

test('replace requires explicit mode and browser confirmation; restored content/settings/draft survive fresh app and repeat merge',async()=>{const t=await boot();let restored,again;try{openSettings(t);const b=incoming(exported(t));const event={version:1,id:'backup:event',at:today,day:'2026-10-21',offset:new Date(today).getTimezoneOffset(),mode:'spelling',itemId:'custom-backupword',label:'backupword',kind:'answer',first:true,assisted:false,correct:true};b.data.storage[eventPrefix+encodeURIComponent(event.id)]=event;const before=logical(t);await t.choose(b);const mode=t.element('#learning-backup-mode');mode.value='replace';mode.dispatchEvent(new t.w.Event('change'));let asks=0;t.w.confirm=()=>{asks++;return false;};t.click('#confirm-learning-backup');assert.equal(asks,1);assert.deepEqual(logical(t),before);assert.equal(t.reloads(),0);t.w.confirm=()=>{asks++;return true;};t.click('#confirm-learning-backup');assert.equal(asks,2);assert.equal(t.reloads(),1);assert.deepEqual(t.state().settings.steps,[5,20]);assert.equal(t.state().session.draft,'partial backup answer');restored=await boot({saved:t.storage(),hash:'#custom'});assert.match(restored.element('#page').textContent,/backupword/);restored.click('[data-view=custom-sentences]');assert.match(restored.element('#page').textContent,/I study English/);restored.click('[data-view=phrases]');assert.equal(restored.phrases().custom[0].english,'backup phrase');restored.click('[data-view=tasks]');restored.click('[data-action=resume]');assert.equal(restored.element('#spell-input').value,'partial backup answer');assert.equal(restored.state().records['custom-backupword'],undefined);openSettings(restored);assert.equal(restored.element('#steps-form select').value,'5,20');const beforeEvents=restored.events();assert.equal(beforeEvents.length,1);await restored.choose(b);restored.click('#confirm-learning-backup');assert.equal(restored.reloads(),1);again=await boot({saved:restored.storage()});assert.deepEqual(again.events(),beforeEvents);assert.equal(JSON.parse(again.learning().getItem(customKey)).words.length,1);assert.equal(again.state().session.draft,'partial backup answer');assert.deepEqual(t.errors,[]);assert.deepEqual(restored.errors,[]);assert.deepEqual(again.errors,[]);}finally{again?.close();restored?.close();t.close();}});

test('real word and phrase correction state exports, and completed session is restored without another grade',async()=>{const t=await boot();let restored;try{t.click('[data-view=spelling]');t.input('#word-search','make friends');t.click('[data-practice="unit1-001"]');t.input('#spell-input','make friend');t.click('#check-answer');assert.equal(t.state().session.remediation.step,0);openSettings(t);const b=exported(t);assert.equal(b.data.storage[workspaceKey].session.remediation.initialInput,'make friend');assert.equal(Object.keys(b.data.storage).filter(k=>k.startsWith(eventPrefix)).length,1);const bank=await data('phrases-bank.json'),p=freshPhrases(),e=bank.entries[0];startPhraseSession(p,bank.entries,{ids:[e.id],at:today});advancePhrase(p,bank.entries,today);submitPhrase(p,e,'wrong',today);b.data.storage[phraseKey]=p;const completed=incoming(b,{done:true});completed.data.storage[phraseKey]=p;await t.choose(completed);const mode=t.element('#learning-backup-mode');mode.value='replace';mode.dispatchEvent(new t.w.Event('change'));t.click('#confirm-learning-backup');restored=await boot({saved:t.storage(),hash:'#session'});assert.equal(restored.state().session.done,true);assert.equal(restored.state().session.result.correct,true);assert.equal(restored.events().length,1);assert.equal(restored.phrases().session.correction.step,0);openSettings(restored);const roundtrip=exported(restored);assert.deepEqual(roundtrip.data.storage[phraseKey].session,p.session);assert.deepEqual(restored.errors,[]);}finally{restored?.close();t.close();}});
