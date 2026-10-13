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

await boot({},'#memory');val('#scope-select','unit1');check(!!w.document.querySelector('[data-action=unit-sentence-dictation]'),'sentence entry follows selected unit words');click('[data-action=unit-sentence-dictation]');check(el('#sentence-unit').value==='unit1','unit entry opens matching sentence unit');check(!!w.document.querySelector('[data-action=back-parent]'),'sentence module retains parent navigation');const bank=JSON.parse(await readFile(path.join(root,'src/sentence-dictation.json'),'utf8')),item=bank.groups.find(g=>g.unitId==='unit1').items[0];const original=JSON.stringify(state().records),strength=JSON.stringify(state().memoryStrength);val(`[data-sentence-input="${item.id}"]`,'');el(`[data-sentence-form="${item.id}"]`).dispatchEvent(new w.Event('submit',{cancelable:true}));check(state().sentenceDictation.items[item.id].attempts===0,'empty form does not grade');val(`[data-sentence-input="${item.id}"]`,item.english);el(`[data-sentence-form="${item.id}"]`).dispatchEvent(new w.Event('submit',{cancelable:true}));check(state().sentenceDictation.items[item.id].result.correct,'sentence graded separately');check(JSON.stringify(state().records)===original&&JSON.stringify(state().memoryStrength)===strength,'sentence result cannot inflate word progress');check(!!w.document.querySelector('[data-action=back-parent]'),'grading preserves return navigation');click('[data-action=back-parent]');check(el('#scope-select').value==='unit1','return preserves originating unit');await boot(storage(),'#sentence-dictation');check(state().sentenceDictation.items[item.id].result.correct,'sentence result survives reload');click('[data-view=preparatory]');check(!w.document.querySelector('[data-action=unit-sentence-dictation]'),'primary vocabulary track not mixed with textbook sentences');click('[data-view=sentence-dictation]');val('#sentence-source','all');val('#sentence-unit','unit1');check(w.document.querySelectorAll('[data-sentence-card]').length===1,'one focused sentence card per unit with all five retained');click('#manage-custom-sentences');check(!w.document.querySelector('[data-sentence-input]'),'custom editing does not expose a dictation answer field or count as practice');val('[name=english]','I like warm soup.');val('[name=chinese]','我喜欢热汤。');el('#custom-sentence-editor').dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,0));const customId=state().sentenceDictation.customSentences[0].id;click(`[data-custom-sentence-practice="${customId}"]`);check(el('#sentence-unit').value==='custom'&&!el(`[data-sentence-card="${customId}"]`).textContent.includes('I like warm soup.'),'custom practice hides English before answer');check(el(`[data-sentence-card="${customId}"]`).textContent.includes('设备英语朗读'),'custom audio honestly labeled device voice');val(`[data-sentence-input="${customId}"]`,'I like warm soup.');el(`[data-sentence-form="${customId}"]`).dispatchEvent(new w.Event('submit',{cancelable:true}));check(state().sentenceDictation.items[customId].result.correct,'custom sentence uses same grading');await boot(storage(),'#sentence-dictation');check(state().sentenceDictation.customSentences[0].id===customId&&state().sentenceDictation.items[customId].result.correct,'custom sentence and progress persist reload');click('[data-view=sentences]');check(w.document.querySelectorAll('.sentence-book-card').length===1,'sentence book uses one shared learning card');const firstBook=el('.sentence-book-card').textContent;click('[data-action=next-page]');check(el('.sentence-book-card').textContent!==firstBook,'sentence book advances one entry');click('[data-action=prev-page]');check(el('.sentence-book-card').textContent===firstBook,'sentence book return restores entry');check(errors.length===0,'no DOM runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));dom.window.close();
