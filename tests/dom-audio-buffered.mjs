import * as phrasesModule from '../src/phrases.js';
import * as phrasesUIModule from '../src/phrases-ui.js';
import * as answerFocusModule from '../src/answer-focus.js';
import * as spellingDiffModule from '../src/spelling-diff.js';
import * as freshQuestionsModule from '../src/fresh-practice/generator.mjs';
import * as practiceNoveltyModule from '../src/practice-novelty.js';
import * as enterPracticeModule from '../src/enter-practice.js';
import * as queuePolicyModule from '../src/queue-policy.js';
import * as customSentencesModule from '../src/custom-sentences.js';
import * as localTranslationModule from '../src/local-translation.js';
import * as practiceTimerModule from '../src/practice-timer.js';
import * as practiceTimeUIModule from '../src/practice-time-ui.js';
import * as sentenceDictationModule from '../src/sentence-dictation.js';
import {JSDOM,VirtualConsole} from 'jsdom';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import path from 'node:path';import {webcrypto} from 'node:crypto';import assert from 'node:assert/strict';
import * as reviewTimingModule from '../src/review-timing.js';
import * as correctionModule from '../src/correction.js';
import * as correctionUIModule from '../src/correction-ui.js';
import * as masteryModule from '../src/mastery.js';
import * as contextAudioModule from '../src/context-audio.js';
import * as adaptiveModule from '../src/adaptive.js';
import * as adaptiveUIModule from '../src/adaptive-ui.js';
import * as interactionModule from '../src/interactions.js';
import * as dictionaryModule from '../src/dictionary.js';
import * as audioModule from '../src/audio.js';
import * as scheduler from '../src/scheduler.js';import * as custom from '../src/custom-words.js';import {isCorrectAnswer} from '../src/engine.js';
const root=path.resolve(import.meta.dirname,'..'),key='word-garden.workspace.v2',results=[],errors=[];
globalThis.fetch=async url=>{const file=String(url).startsWith('file:')?new URL(url):path.join(root,'src',String(url).split('/').at(-1));return {ok:true,json:async()=>JSON.parse(await readFile(file,'utf8'))};};
const vocab=await import('../src/vocabulary.js');const html=await readFile(path.join(root,'index.html'),'utf8');const source=(await readFile(path.join(root,'src/app.js'),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('import.meta.url',JSON.stringify(new URL('../src/app.js',import.meta.url).href));
const downloads=[],buffers=new Map();const media=[];class AudioMock{constructor(src){this.src=src;this.paused=false;media.push(this)}async play(){}pause(){this.paused=true}}
const intervals=[];let dom,w;
async function boot(saved={},hash='#tasks'){
 dom?.window.close();const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));dom=new JSDOM(html,{url:'https://test.invalid/'+hash,runScripts:'outside-only',virtualConsole:vc,pretendToBeVisual:true});w=dom.window;
 Object.assign(w,{...phrasesModule,...phrasesUIModule,...answerFocusModule,...spellingDiffModule,...freshQuestionsModule,...practiceNoveltyModule,...enterPracticeModule,...queuePolicyModule,...customSentencesModule,...localTranslationModule,...practiceTimerModule,...practiceTimeUIModule,...sentenceDictationModule,...reviewTimingModule,...correctionModule,...correctionUIModule,...masteryModule,...contextAudioModule,...adaptiveModule,...adaptiveUIModule,...interactionModule,...dictionaryModule,...audioModule,...scheduler,...custom,isCorrectAnswer,BASE:vocab.WORDS,UNITS:vocab.UNITS,BOOK:vocab.BOOK,fetch:globalThis.fetch});w.URL.createObjectURL=blob=>{const url='blob:test-'+buffers.size;buffers.set(url,blob);return url;};w.URL.revokeObjectURL=url=>buffers.delete(url);const jsonFetch=w.fetch;w.fetch=async url=>{const relative=String(url).match(/(?:^|\/)audio\/(.+)$/)?.[1];if(relative){downloads.push(relative);const bytes=await readFile(path.join(root,'audio',relative));return {ok:true,status:200,headers:{get:()=> 'audio/mpeg'},blob:async()=>new Blob([bytes],{type:'audio/mpeg'})};}return jsonFetch(url);};w.Audio=AudioMock;w.crypto.randomUUID=()=>webcrypto.randomUUID();w.scrollTo=()=>{};intervals.length=0;w.setInterval=fn=>{intervals.push(fn);return intervals.length;};w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.speechSynthesis={getVoices:()=>[],cancel(){},speak(){}};w.SpeechSynthesisUtterance=function(t){this.text=t;};
 for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
 await w.eval('(async()=>{'+source+'\n})()');
}
const storage=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return[k,w.localStorage.getItem(k)]}));
const state=()=>JSON.parse(w.localStorage.getItem(key));const el=s=>{const e=w.document.querySelector(s);assert.ok(e,'missing '+s);return e;};
const click=s=>{const e=el(s);assert.ok(!e.disabled,'disabled '+s);e.click();};const val=(s,v)=>{const e=el(s);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}));};
const text=()=>w.document.body.textContent;const check=(v,n)=>{assert.ok(v,n);results.push(n)};
await boot();const settle=()=>new Promise(r=>setTimeout(r,30));
for(const module of ['memory','meaning','listening','dictation','spelling']){click(`[data-view="${module}"]`);click('[data-practice="starter1-011"]');await settle();click('[data-action=audio]');await settle();check(media.at(-1).src.startsWith('blob:'),'VR cached recording used in '+module);if(module==='listening'||module==='dictation'){const input=module==='dictation'?'#check-answer':'[data-choice]';check(el(input).disabled,'listening remains locked until audio ended '+module);media.at(-1).onended();check(!el(input).disabled,'audio ended unlocks '+module);}}
check(downloads.filter(f=>f==='starter1-011.mp3').length===1,'same exact VR MP3 downloaded once across five modules');click('[data-view=analysis]');click('[data-adaptive=start]');await settle();const countBeforeSentence=media.length;click('[data-read-practice]');await settle();check(media.length===countBeforeSentence+1&&media.at(-1).src.startsWith('blob:'),'sentence playback uses cached blob');const old=media.at(-1);click('[data-view=cloze]');click('[data-adaptive=start]');await settle();check(old.paused,'navigation stops buffered sentence');check(!w.document.querySelector('[data-read-practice]'),'cloze audio stays gated');click('[data-adaptive-choice]');await settle();const countBeforeCloze=media.length;click('[data-read-practice]');await settle();check(media.length===countBeforeCloze+1&&media.at(-1).src.startsWith('blob:'),'graded cloze playback uses cached blob');check(errors.length===0,'no DOM runtime errors with buffered transport');console.log(JSON.stringify({passed:results.length,checks:results,downloads},null,2));await writeFile(path.join(root,'evidence/buffered-audio-dom-report.json'),JSON.stringify({passed:results.length,checks:results,downloads},null,2));dom.window.close();
