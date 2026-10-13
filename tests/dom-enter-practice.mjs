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




const down=(target=w.document.activeElement,extra={})=>target.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true,...extra})),up=()=>w.document.dispatchEvent(new w.KeyboardEvent('keyup',{key:'Enter',bubbles:true})),enter=(target,extra={})=>{down(target,extra);up();};
await boot({},'#tasks');click('[data-action=new-lesson]');enter(w.document.body);check(state().session.index===1,'Enter advances study step');down(w.document.body);down(w.document.body,{repeat:true});check(state().session.index===2,'held Enter cannot skip multiple study cards');up();click('[data-view=spelling]');click('[data-practice="starter1-001"]');el('#spell-input').focus();enter();check(!state().session.result,'empty Enter validates without grading');val('#spell-input','unit');enter(undefined,{isComposing:true});check(!state().session.result,'IME composition Enter does not submit');enter();check(state().session.result.correct&&!state().session.done,'first Enter grades only');down(w.document.body);down(w.document.body,{repeat:true});check(state().session.done,'distinct second Enter advances once');up();
click('[data-view=spelling]');click('[data-practice="starter1-001"]');val('#spell-input','unit');el('#spell-input').focus();enter();check(state().session.result.strengthChange.after===20&&state().session.result.ordinaryStrengthCredit,'fresh ordinary same-day answer gains another10 before its review due');const sameAnswer=state().session.result.strengthChange.after;down(w.document.body,{repeat:true});up();check(masteryModule.strengthScore(state().memoryStrength['starter1-001'])===sameAnswer,'held Enter cannot duplicate strength credit');await boot({},'#dictation');click('[data-practice="starter1-001"]');val('#spell-input','unit');el('#spell-input').focus();enter();check(!state().session.result,'Enter respects dictation audio gate');media.at(-1).onended();enter();check(state().session.result.correct,'Enter submits after audio ends');
await boot({},'#meaning');click('[data-practice="starter1-001"]');enter(w.document.body);check(!state().session.result,'choice Enter never guesses an unselected option');const correct=[...w.document.querySelectorAll('[data-choice]')].find(b=>b.dataset.choice===vocab.WORDS.find(w=>w.id==='starter1-001').chinese);correct.focus();enter();check(state().session.result.correct,'focused choice Enter uses that option exactly once');
for(const mode of ['context','reading','cloze','analysis']){await boot({},'#'+mode);click('[data-adaptive=start]');enter(w.document.body);check(!state().adaptive.modules[mode].session.feedback,mode+' requires selected choice');const choice=el('[data-adaptive-choice]');choice.focus();enter();check(!!state().adaptive.modules[mode].session.feedback,mode+' focused Enter grades');const first=state().adaptive.modules[mode].session.attempts.length;enter(w.document.body);check(state().adaptive.modules[mode].session.attempts.length===first&&!state().adaptive.modules[mode].session.feedback,mode+' next Enter advances without answering');}
await boot({},'#sentence-dictation');const bank=JSON.parse(await readFile(path.join(root,'src/sentence-dictation.json'),'utf8')),one=bank.groups[0].items[0],two=bank.groups[0].items[1];enter(w.document.body);check(!state().sentenceDictation.items[one.id].result,'sentence Enter requires active card');val(`[data-sentence-input="${one.id}"]`,one.english);el(`[data-sentence-input="${one.id}"]`).focus();enter();check(state().sentenceDictation.items[one.id].result.correct&&!state().sentenceDictation.items[two.id]?.result,'sentence Enter grades only focused card');enter(w.document.body);check(w.document.activeElement.dataset.sentenceInput===two.id&&!state().sentenceDictation.items[two.id]?.result,'next Enter focuses next sentence without submitting it');const sentenceBefore=media.length;w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Control',code:'ControlLeft',bubbles:true}));w.document.dispatchEvent(new w.KeyboardEvent('keyup',{key:'Control',code:'ControlLeft',bubbles:true}));check(media.length===sentenceBefore+1,'Control replays only active sentence');check(down(w.document.activeElement,{shiftKey:true})===true,'Shift Enter retains newline in sentence answer');up();click('#manage-custom-sentences');el('[name=english]').focus();val('[name=english]','An editing sentence.');const textarea=el('[name=english]');check(down(textarea)===true,'custom multiline Enter default remains untouched');up();click('#settings-button');enter(w.document.body);check(el('#settings-dialog').open,'open modal blocks global practice action');check(errors.length===0,'no Enter runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));w.dispatchEvent(new w.Event('pagehide'));await Promise.resolve();dom.window.close();
