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

const original=JSON.parse(await readFile(path.join(root,'src/adaptive-context-bank.json'),'utf8')),bank={...original,questions:[...original.questions,...freshQuestionsModule.listFreshQuestions()]};const seed=module=>({[key]:JSON.stringify({version:2,records:{},exposure:{},stars:0,session:null,results:{},settings:{steps:[1,5]},selectedUnit:'starter1',adaptive:{version:1,modules:{[module]:{seen:original.questions.filter(q=>q.module===module).map(q=>q.id),history:[],needs:{},verified:[],round:6,session:null}}}})});for(const module of ['context','reading','cloze']){await boot(seed(module),'#'+module);check(!w.document.querySelector('[data-adaptive=review]'),'old-review button absent '+module);click('[data-adaptive=start]');const first=bank.questions.find(q=>q.id===el('[data-adaptive-question]').dataset.adaptiveQuestion);check(first.id.startsWith('fresh-'),'old exhausted bank receives fresh scenario '+module);click(`[data-adaptive-choice="${first.options.findIndex(a=>a!==first.answer)}"]`);click('[data-adaptive=next]');const next=bank.questions.find(q=>q.id===el('[data-adaptive-question]').dataset.adaptiveQuestion);check(next.id!==first.id&&next.conceptId===first.conceptId,'remediation uses unseen same-concept scene '+module);const reserved=state().adaptive.novelty.ids.slice();click('[data-adaptive=pause]');await boot(storage(),'#'+module);check(text().includes('练习已暂停'),'pause survives reload '+module);click('[data-adaptive=resume]');check(el('[data-adaptive-question]').dataset.adaptiveQuestion===next.id,'resume retains pending new question '+module);click('#settings-button');click('#clear-progress');check(state().adaptive.novelty.ids.includes(first.id)&&state().adaptive.modules[module].history.length===1,'score reset preserves exposed questions and history '+module);let saved=storage(),reset=state();reset.adaptive={version:1,modules:{}};saved[key]=JSON.stringify(reset);await boot(saved,'#'+module);click('[data-adaptive=start]');check(!reserved.includes(el('[data-adaptive-question]').dataset.adaptiveQuestion),'independent novelty ledger blocks reset bypass '+module);const allSeen=seed(module),full=JSON.parse(allSeen[key]);full.adaptive.modules[module].seen=bank.questions.filter(q=>q.module===module).map(q=>q.id);await boot({[key]:JSON.stringify(full)},'#'+module);check(!w.document.querySelector('[data-adaptive=review]')&&!w.document.querySelector('[data-adaptive=start]')&&text().includes('新场景已用完'),'true finite exhaustion never cycles old questions '+module);}check(errors.length===0,'no DOM runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));w.dispatchEvent(new w.Event('pagehide'));dom.window.close();
