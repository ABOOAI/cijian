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



await boot({},'#tasks');click('[data-action=new-lesson]');for(let i=0;i<5;i++)click('[data-action=next-item]');const initial=storage(),item=state().session.items[state().session.index],word=vocab.WORDS.find(w=>w.id===item.wordId);check(el('.learning-card .strength-caption').textContent.includes('0%'),'new word visibly shows0% on exercise card');const choose=()=>[...w.document.querySelectorAll('[data-choice]')].find(b=>b.dataset.choice===word.chinese).click();choose();check(state().session.result.firstStrengthCredit&&state().session.result.strengthChange.after===10,'first independent answer before initial study interval immediately adds10%');await boot(initial,'#session');w.__WORD_GARDEN_NOW__=state().records[word.id].skills.meaning.dueAt+1;choose();check(state().session.result.strengthChange.delta===10&&state().session.result.strengthChange.after===10,'same independent answer afterdue adds10%');check(el('.learning-card .strength-caption').textContent.includes('10%')&&el('.strength-change').textContent.includes('0% → 10%'),'card and feedback visibly update to10%');click('[data-view=memory]');val('#word-search',word.english);check(el('.strength-caption').textContent.includes('10%'),'word list retains saved10%');await boot(storage(),'#memory');val('#word-search',word.english);check(el('.strength-caption').textContent.includes('10%'),'strength persists reload');const cw=custom.makeCustom({english:'testling',chinese:'测试词',group:'我的单词'},'custom-first-credit');const cr={...scheduler.fresh(),phase:'short',dueAt:Date.now()+60000,lastAt:Date.now()};await boot({[custom.CUSTOM_KEY]:JSON.stringify({version:1,words:[cw]}),[key]:JSON.stringify({version:2,records:{[cw.id]:{introduced:true,skills:{spelling:cr}}},exposure:{},stars:0,results:{},session:null,settings:{steps:[1,5]},selectedUnit:'custom'})},'#spelling');val('#scope-select','custom');click(`[data-practice="${cw.id}"]`);val('#spell-input','testling');click('#check-answer');check(state().session.result.strengthChange.delta===10,'custom word first independent answer also gains10 before initial due');const legacy=masteryModule.freshStrength();legacy.skills.meaning.points=25;legacy.skills.meaning.lastCreditDay='2020-01-01';await boot({[key]:JSON.stringify({version:2,records:{},memoryStrength:{'starter1-001':legacy},exposure:{},stars:0,results:{},session:null,settings:{steps:[1,5]}})},'#meaning');click('[data-practice="starter1-001"]');const correctMeaning=vocab.WORDS.find(x=>x.id==='starter1-001').chinese;const btn=[...w.document.querySelectorAll('[data-choice]')].find(x=>x.dataset.choice===correctMeaning);btn.click();check(state().session.result.strengthChange.before===25&&state().session.result.strengthChange.after===35,'same previously capped skill visibly adds10 to legacy total25');btn.click();check(masteryModule.strengthScore(state().memoryStrength['starter1-001'])===35,'repeat submit cannot double-credit');await boot(storage(),'#meaning');click('[data-practice="starter1-001"]');[...w.document.querySelectorAll('[data-choice]')].find(x=>x.dataset.choice!==correctMeaning).click();check(masteryModule.strengthScore(state().memoryStrength['starter1-001'])===35,'wrong answer after reload preserves35');check(errors.length===0,'new strength paths have no runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));click('[data-view=tasks]');await Promise.resolve();dom.window.close();
