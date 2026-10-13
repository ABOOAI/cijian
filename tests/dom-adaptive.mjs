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
const bank=JSON.parse(await readFile(path.join(root,'src/adaptive-context-bank.json'),'utf8'));bank.questions.push(...freshQuestionsModule.listFreshQuestions());
await boot();
for(const module of ['context','reading','cloze','analysis']){
 click(`[data-view="${module}"]`);click('[data-adaptive=start]');const question=()=>bank.questions.find(q=>q.id===el('[data-adaptive-question]').dataset.adaptiveQuestion);
 const first=question();check(!w.document.querySelector('.answer-feedback'),'answer concealed '+module);
 if(module==='cloze')check(!w.document.querySelector('[data-read-practice]'),'cloze audio locked before grading');
 if(module==='analysis')check(!!w.document.querySelector('[data-read-practice]'),'sentence read-aloud available before response');
 click(`[data-adaptive-choice="${first.options.findIndex(x=>x!==first.answer)}"]`);check(el('.answer-feedback').textContent.includes(first.answer),'automatic key and explanation '+module);
 const attemptCount=state().adaptive.modules[module].history.length;await boot(storage(),'#'+module);check(state().adaptive.modules[module].history.length===attemptCount,'refresh cannot duplicate grade '+module);
 if(module==='cloze')check(!!w.document.querySelector('[data-read-practice]'),'cloze audio unlocks after all one-blank passage graded');
 click('[data-adaptive=next]');let second=question();check(second.id!==first.id&&second.conceptId===first.conceptId,'targets unseen same-concept '+module);
 click(`[data-adaptive-choice="${second.options.indexOf(second.answer)}"]`);check(state().adaptive.modules[module].needs[first.conceptId].streak===1,'first new answer is insufficient '+module);
 click('[data-adaptive=next]');let third=question();click(`[data-adaptive-choice="${third.options.indexOf(third.answer)}"]`);check(!state().adaptive.modules[module].needs[first.conceptId],'two independent variants finish remediation '+module);
 click('[data-adaptive=next]');click('[data-adaptive=pause]');await boot(storage(),'#'+module);check(text().includes('练习已暂停'),'pause survives refresh '+module);click('[data-adaptive=resume]');
 let guard=0;while(w.document.querySelector('[data-adaptive-choice]')&&guard++<50){const q=question();click(`[data-adaptive-choice="${q.options.indexOf(q.answer)}"]`);click('[data-adaptive=next]');}check(guard<50,'finite round completes '+module);const seen=state().adaptive.modules[module].seen;click('[data-adaptive=start]');check(!seen.includes(question().id),'new round avoids repeats '+module);check(!!w.document.querySelector('.page-back'),'parent navigation retained '+module);
 click('[data-adaptive=reference]');check(!!w.document.querySelector('#return-adaptive'),'reference route preserved '+module);if(module==='cloze'){const pilot=JSON.parse(await readFile(path.join(root,'src/phonics-context-pilot.json'),'utf8'));check(pilot.passages.every(p=>!text().includes(p.text)),'retained cloze references never display reading passages');}click('#return-adaptive');check(!!w.document.querySelector('[data-adaptive-question]'),'resume from reference '+module);
}
// Device audio fallback and cancellation: only the English sentence is spoken.
let spoken=[],cancelled=0;w.speechSynthesis.getVoices=()=>[{lang:'en-US',name:'Test'}];w.speechSynthesis.speak=u=>spoken.push(u.text);w.speechSynthesis.cancel=()=>cancelled++;w.SpeechSynthesisUtterance=function(t){this.text=t;};
click('[data-view=analysis]');const q=bank.questions.find(q=>q.id===el('[data-adaptive-question]').dataset.adaptiveQuestion);click('[data-read-practice]');check(media.at(-1).src.endsWith(q.audioFile),'sentence uses canonical Kokoro recording');media.at(-1).onerror();click('[data-practice-status] button:last-child');check(spoken.at(-1)===q.sentence,'sentence audio reads only sentence, no question or options');click('[data-stop-practice]');check(cancelled>0&&el('[data-practice-status]').textContent.includes('停止'),'explicit stop cancels audio');const before=cancelled;click('[data-view=reading]');check(cancelled>before,'navigation cancels audio');
click('[data-view=cloze]');check(!w.document.querySelector('[data-read-practice]'),'new cloze question remains audio-locked');const cq=bank.questions.find(q=>q.id===el('[data-adaptive-question]').dataset.adaptiveQuestion);click(`[data-adaptive-choice="${cq.options.indexOf(cq.answer)}"]`);click('[data-read-practice]');check(media.at(-1).src.endsWith(cq.audioFile),'graded cloze uses full canonical Kokoro file');media.at(-1).onerror();click('[data-practice-status] button:last-child');check(spoken.at(-1)===cq.completedPassage,'fallback reads only graded completed cloze');click('[data-view=analysis]');click('[data-adaptive=reference]');click('#legacy-sentence-audio');check(media.at(-1).src.includes('context-'),'legacy example also uses static sentence audio');click('#legacy-sentence-stop');check(media.at(-1).paused,'legacy sentence stop works');click('#settings-button');click('#clear-progress');check(Object.keys(state().adaptive.modules).length>0&&state().adaptive.novelty.ids.length>0,'word progress reset preserves adaptive history and novelty ledger');
check(errors.length===0,'no jsdom runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));await writeFile(path.join(root,'evidence/adaptive-dom-report.json'),JSON.stringify({passed:results.length,checks:results},null,2));dom.window.close();
