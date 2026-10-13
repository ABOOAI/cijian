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
const intervals=[];let dom,w;
async function boot(saved={},hash='#tasks'){
 dom?.window.close();const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));dom=new JSDOM(html,{url:'https://test.invalid/'+hash,runScripts:'outside-only',virtualConsole:vc,pretendToBeVisual:true});w=dom.window;
 Object.assign(w,{...phrasesModule,...phrasesUIModule,...answerFocusModule,...spellingDiffModule,...freshQuestionsModule,...practiceNoveltyModule,...enterPracticeModule,...queuePolicyModule,...customSentencesModule,...localTranslationModule,...practiceTimerModule,...practiceTimeUIModule,...sentenceDictationModule,...reviewTimingModule,...correctionModule,...correctionUIModule,...masteryModule,...contextAudioModule,...adaptiveModule,...adaptiveUIModule,...interactionModule,...dictionaryModule,...audioModule,...scheduler,...custom,isCorrectAnswer,BASE:vocab.WORDS,UNITS:vocab.UNITS,BOOK:vocab.BOOK,fetch:globalThis.fetch});w.Audio=AudioMock;w.crypto.randomUUID=()=>webcrypto.randomUUID();w.scrollTo=()=>{};intervals.length=0;w.setInterval=fn=>{intervals.push(fn);return intervals.length;};w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.speechSynthesis={getVoices:()=>[],cancel(){},speak(){}};w.SpeechSynthesisUtterance=function(t){this.text=t;};
 for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
 await w.eval('(async()=>{'+source+'\n})()');
}
const storage=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return[k,w.localStorage.getItem(k)]}));
const state=()=>JSON.parse(w.localStorage.getItem(key));const el=s=>{const e=w.document.querySelector(s);assert.ok(e,'missing '+s);return e;};
const click=s=>{const e=el(s);assert.ok(!e.disabled,'disabled '+s);e.click();};const val=(s,v)=>{const e=el(s);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}));};
const text=()=>w.document.body.textContent;const check=(v,n)=>{assert.ok(v,n);results.push(n)};
await boot();
check(el('#corpus-count').textContent.includes('711'),'total711 canonical word count shown');
check(!!w.document.querySelector('[data-view=preparatory]'),'primary sidebar entry');for(const group of ['reference-numerals','reference-months','reference-weekdays'])check(!!w.document.querySelector(`[data-unit="${group}"]`),'task center group '+group);
const examples={'primary-school':'supplement-primary-hello','reference-numerals':'supplement-cardinals-one','reference-months':'supplement-months-january','reference-weekdays':'supplement-weekdays-monday'};
for(const [group,id]of Object.entries(examples))for(const module of ['memory','meaning','listening','dictation','spelling']){if(group==='primary-school'){click('[data-view=preparatory]');click(`[data-mode="${module}"]`);}else{click(`[data-view="${module}"]`);val('#scope-select',group);}check(!!w.document.querySelector(`[data-practice="${id}"]`),group+' visible in '+module);click(`[data-practice="${id}"]`);check(state().session.items[0].wordId===id,'canonical stable ID in '+group+'/'+module);click('[data-action=audio]');check(media.at(-1).src.endsWith('/audio/'+id+'.mp3'),'new Kokoro recording in '+group+'/'+module);}
click('[data-view=preparatory]');click('[data-mode=memory]');click('[data-action=next-page]');check(!!w.document.querySelector('[data-action=prev-page]'),'large primary group is paginated');const lastPrimary=vocab.WORDS.filter(w=>w.groupIds.includes('primary-school')).at(-1);val('#word-search',lastPrimary.english);check(!!w.document.querySelector(`[data-practice="${lastPrimary.id}"]`),'last primary word can be directly searched and practiced');
// The primary-school list is also associated with the matching textbook unit.
click('[data-view=spelling]');val('#scope-select','starter1');val('#word-search','hello');check(!w.document.querySelector('[data-practice="supplement-primary-hello"]'),'primary hello excluded from StarterUnit1 filter');click('[data-view=preparatory]');click('[data-mode=spelling]');click('[data-practice="supplement-primary-hello"]');w.__WORD_GARDEN_NOW__=Date.now()+120000;val('#spell-input','wrong');click('#check-answer');const saved=state().records['supplement-primary-hello'];check(saved.skills.spelling.mistake,'new primary error enters skill scheduler');click('[data-view=preparatory]');click('[data-mode=mistakes]');check(text().includes('hello'),'primary mistake visible in its group');click('[data-view=preparatory]');click('[data-mode=track]');check(text().includes('hello'),'primary progress visible in review tracker');const snapshot=storage();await boot(snapshot,'#preparatory-track');check(state().records['supplement-primary-hello'].skills.spelling.lapses===saved.skills.spelling.lapses,'new-word progress survives reload');
click('[data-view=preparatory]');click('[data-action=primary-lesson]');check(text().includes('教材音标 · 英式记号'),'new lesson displays sourcedIPA with accurate accent label');check(text().includes('音节与拼写分块尚未核对'),'no fabricated syllable breakdown');
check(errors.length===0,'no DOM runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));await writeFile(path.join(root,'evidence/supplement-dom-report.json'),JSON.stringify({passed:results.length,checks:results},null,2));dom.window.close();
