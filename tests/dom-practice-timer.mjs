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
const media=[];class AudioMock{constructor(src){this.src=src;this.paused=false;media.push(this)}async play(){}pause(){this.paused=true}}
const intervals=[];let dom,w;let clockWall=Date.now(),clockMono=0;
async function boot(saved={},hash='#tasks'){
 dom?.window.close();const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));dom=new JSDOM(html,{url:'https://test.invalid/'+hash,runScripts:'outside-only',virtualConsole:vc,pretendToBeVisual:true});w=dom.window;
 Object.assign(w,{...phrasesModule,...phrasesUIModule,...answerFocusModule,...spellingDiffModule,...freshQuestionsModule,...practiceNoveltyModule,...enterPracticeModule,...queuePolicyModule,...customSentencesModule,...localTranslationModule,...practiceTimerModule,...practiceTimeUIModule,...sentenceDictationModule,...reviewTimingModule,...correctionModule,...correctionUIModule,...masteryModule,...contextAudioModule,...adaptiveModule,...adaptiveUIModule,...interactionModule,...dictionaryModule,...audioModule,...scheduler,...custom,isCorrectAnswer,BASE:vocab.WORDS,UNITS:vocab.UNITS,BOOK:vocab.BOOK,fetch:globalThis.fetch});w.__WORD_GARDEN_NOW__=clockWall;Object.defineProperty(w.performance,'now',{value:()=>clockMono});w.Audio=AudioMock;w.crypto.randomUUID=()=>webcrypto.randomUUID();w.scrollTo=()=>{};intervals.length=0;w.setInterval=fn=>{intervals.push(fn);return intervals.length;};w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.speechSynthesis={getVoices:()=>[],cancel(){},speak(){}};w.SpeechSynthesisUtterance=function(t){this.text=t;};
 for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
 await w.eval('(async()=>{'+source+'\n})()');
}
const storage=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return[k,w.localStorage.getItem(k)]}));
const state=()=>JSON.parse(w.localStorage.getItem(key));const el=s=>{const e=w.document.querySelector(s);assert.ok(e,'missing '+s);return e;};
const click=s=>{const e=el(s);assert.ok(!e.disabled,'disabled '+s);e.click();};const val=(s,v)=>{const e=el(s);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}));};
const text=()=>w.document.body.textContent;const check=(v,n)=>{assert.ok(v,n);results.push(n)};


const advance=seconds=>{for(let i=0;i<seconds;i++){clockWall+=1000;clockMono+=1000;w.__WORD_GARDEN_NOW__=clockWall;intervals.forEach(fn=>fn());}};const total=()=>{const x=JSON.parse(w.localStorage.getItem(practiceTimerModule.PRACTICE_TIMER_KEY)||'{"days":{}}');return Object.values(x.days).reduce((a,b)=>a+b,0);};await boot({},'#tasks');advance(5);check(total()===0,'menu waiting does not count');click('[data-view=spelling]');click('[data-practice="starter1-001"]');advance(5);check(total()===5000,'active practice accrues monotonic time');advance(70);check(total()===60000,'60 seconds inactivity pauses');val('#spell-input','unit');advance(2);check(total()===62000,'input resumes timer');w.dispatchEvent(new w.Event('blur'));advance(5);check(total()===62000,'window blur excludes time');w.dispatchEvent(new w.Event('focus'));advance(3);check(total()===62000,'focus alone does not resume abandoned practice');val('#spell-input','unit');advance(1);click('#check-answer');const graded=total();advance(3);check(total()===graded+3000,'answer feedback waiting remains within 60-second window');click('[data-view=sentence-dictation]');advance(2);check(total()===graded+5000,'sentence practice participates');click('#practice-time-button');const dialogTotal=total();advance(4);check(total()===dialogTotal+4000,'in-app history waiting remains within activity window');check(el('#practice-time-dialog').textContent.includes('60秒'),'timer method disclosed');await boot({},'#meaning');click('[data-practice="starter1-001"]');const choice=[...w.document.querySelectorAll('[data-choice]')].find(b=>b.dataset.choice===vocab.WORDS.find(x=>x.id==='starter1-001').chinese);choice.click();check(!!el('.feedback'),'meaning feedback page exists');advance(2);w.dispatchEvent(new w.Event('pagehide'));const savedFeedback=storage(),oldTotal=total();await boot(savedFeedback,'#session');check(!!el('.feedback'),'direct reload restores graded meaning page');advance(65);check(total()===oldTotal+60000,'direct feedback entry starts and caps at60 seconds without prior practice');advance(5);check(total()===oldTotal+60000,'timer tick does not renew feedback idle window');el('.feedback').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));advance(2);check(total()===oldTotal+62000,'interaction on feedback resumes its activity window');w.dispatchEvent(new w.Event('blur'));advance(3);check(total()===oldTotal+62000,'feedback page in background excluded');check(errors.length===0,'no timer DOM runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));dom.window.close();
