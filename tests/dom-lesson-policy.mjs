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


const answerStep=async()=>{const s=state().session,item=s.items[s.index],word=vocab.WORDS.find(w=>w.id===item.wordId);if(item.skill==='study'){click('[data-action=next-item]');return;}if(['listening','dictation'].includes(item.skill)){await Promise.resolve();media.at(-1).onended();}if(['meaning','listening'].includes(item.skill)){[...w.document.querySelectorAll('[data-choice]')].find(b=>b.dataset.choice===word.chinese).click();}else{val('#spell-input',word.english);click('#check-answer');}click('[data-action=next-item]');};
await boot({},'#tasks');click('[data-action=new-lesson]');check(state().session.items.length===25&&state().session.cooldownPolicy==='none','task center starts complete25-step curriculum without tracking policy');let count=0;while(!state().session.done&&count++<30){await answerStep();if(state().session.index===6){check(state().session.items.length===25,'correct first skill retains later skills');await boot(storage(),'#session');check(state().session.items.length===25,'reload retains full curriculum');}}check(state().session.index===25&&state().session.cooldownSkipped===0,'all25 steps complete without cooldown skips');check(!text().includes('项已暂缓'),'lesson completion has no misleading deferred summary');check([...new Set(state().session.items.map(i=>i.wordId))].every(id=>masteryModule.strengthScore(state().memoryStrength[id])===40),'first lesson credits all four independent skills to40% perword');
await boot({},'#preparatory');click('[data-action=primary-lesson]');check(state().session.items.length===25,'primary curriculum starts25 steps');count=0;while(!state().session.done&&count++<30)await answerStep();check(state().session.index===25&&state().session.cooldownSkipped===0,'primary curriculum completes all skills');check([...new Set(state().session.items.map(i=>i.wordId))].every(id=>masteryModule.strengthScore(state().memoryStrength[id])===40),'primary first lesson also reaches40% perword');
const ids=vocab.WORDS.slice(0,5).map(w=>w.id),short=['study','meaning'].flatMap(skill=>ids.map(wordId=>({wordId,skill}))),old={version:2,records:{},exposure:{},stars:0,results:{},settings:{steps:[1,5]},selectedUnit:'starter1',session:{id:'old-lesson',kind:'lesson',origin:{view:'tasks'},items:short,index:10,done:true,cooldownSkipped:15,startedAt:Date.now(),result:null}};await boot({[key]:JSON.stringify(old)},'#tasks');check(state().session.items.length===25&&!state().session.done&&state().session.index===10,'legacy erroneously shortened lesson restores only uncompleted steps');click('[data-action=resume]');check(state().session.items[state().session.index].skill==='listening','restored lesson resumes first missing skill');check(errors.length===0,'no DOM runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));click('[data-view=tasks]');await Promise.resolve();dom.window.close();
