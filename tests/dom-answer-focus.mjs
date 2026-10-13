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






const active=()=>w.document.activeElement;const press=()=>{active().dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));w.document.dispatchEvent(new w.KeyboardEvent('keyup',{key:'Enter',bubbles:true}));};
await boot({},'#spelling');click('[data-practice="starter1-001"]');check(active().id==='spell-input','first word answer automatically focused');val('#spell-input','wrong');press();check(active().id==='correction-input','initial correction input focused');val('#correction-input','unit');press();press();check(active().id==='correction-input'&&state().session.remediation.step===1,'round2 focused after keyboard transition');media.at(-1).onended();val('#correction-input','wrong');press();press();check(active().id==='correction-input'&&active().value==='','wrong round retry focuses empty input');media.at(-1).onended();val('#correction-input','unit');press();press();check(active().id==='correction-input'&&state().session.remediation.step===2,'round3 focused without mouse');val('#correction-input','unit');const input=active();input.setSelectionRange(1,2);media.at(-1).onended();check(active()===input&&active().selectionStart===1&&active().selectionEnd===2,'audio completion preserves active draft and selection');press();press();click('[data-view=dictation]');click('[data-practice="starter1-002"]');check(active().id==='spell-input'&&el('#check-answer').disabled,'dictation input focus does not bypass audio gate');click('[data-view=sentence-dictation]');check(active().hasAttribute('data-sentence-input'),'first unfinished sentence automatically focused');const sentenceId=active().dataset.sentenceInput,bank=JSON.parse(await readFile(path.join(root,'src/sentence-dictation.json'),'utf8')),sentence=bank.groups.flatMap(g=>g.items).find(i=>i.id===sentenceId);val(`[data-sentence-input="${sentenceId}"]`,sentence.english);press();press();check(active().hasAttribute('data-sentence-input')&&active().dataset.sentenceInput!==sentenceId,'next Enter focuses next sentence');const nextId=active().dataset.sentenceInput;val(`[data-sentence-input="${nextId}"]`,'partial');active().setSelectionRange(2,4);intervals.forEach(fn=>fn());check(active().dataset.sentenceInput===nextId&&active().selectionStart===2&&active().selectionEnd===4,'timer refresh never steals active sentence caret');click('#manage-custom-sentences');check(active().name==='english','custom sentence editor focuses English');val('[name=english]','A draft sentence.');active().setSelectionRange(2,5);await Promise.resolve();check(active().name==='english'&&active().selectionStart===2,'async translation availability does not steal caret');click('[data-view=custom]');click('[data-action=add-word]');check(active().name==='english','word dialog focuses first input');click('[data-close=word-dialog]');click('[data-action=batch-words]');check(active().id==='batch-english','batch dialog focuses textarea');click('[data-close=word-dialog]');check(errors.length===0,'no autofocus DOM runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));w.dispatchEvent(new w.Event('pagehide'));await Promise.resolve();dom.window.close();
