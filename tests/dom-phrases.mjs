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







const phraseKey=phrasesModule.PHRASE_KEY,pstate=()=>JSON.parse(w.localStorage.getItem(phraseKey)),bank=JSON.parse(await readFile(path.join(root,'src/phrases-bank.json'),'utf8')),pentry=bank.entries[0],press=()=>{w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));w.document.dispatchEvent(new w.KeyboardEvent('keyup',{key:'Enter',bubbles:true}));},audioEnd=async()=>{await Promise.resolve();media.at(-1).onended();};
const old={version:2,records:{},exposure:{},stars:7,session:null,results:{},settings:{steps:[1,5]},selectedUnit:'starter1'};await boot({[key]:JSON.stringify(old)},'#phrases');check(el('h1').textContent==='固定搭配','dedicated phrase sidebar route');const oldBytes=w.localStorage.getItem(key);click(`[data-phrase=one][data-id="${pentry.id}"]`);check(pstate().session.items[0].stage==='study','phrase lesson opens actual study card');click('[data-phrase=audio]');check(media.at(-1).src.includes('collocation-col-001-phrase'),'whole phrase audio uses canonical static file');click('[data-phrase=example-audio]');check(media.at(-1).src.includes('collocation-col-001-example'),'example has its own static recording');press();let q=pstate().session.items[pstate().session.index].question;click(`[data-phrase-choice="${q.options.indexOf(q.answer)}"]`);check(el('[data-answer-result=correct]').textContent.includes('本题正确'),'phrase success retains explicit text and state');press();check(w.document.activeElement.id==='phrase-input','phrase blank receives autofocus');press();check(!pstate().session.result,'empty phrase submit cannot grade');val('#phrase-input','wrong');press();check(pstate().session.correction.step===0,'wrong structure starts three-round correction');check(el('.spelling-comparison .feedback-title').textContent.includes('需要改正')&&!!el('.diff-error-summary'),'phrase errors retain compact text and error summary');const pts=phrasesModule.phraseStrength(pstate(),pentry.id),history=pstate().history.length;for(let step=0;step<3;step++){check(pstate().session.correction.step===step,'correction stage '+(step+1));if(step){check(!el('#page').textContent.includes(pentry.english),'correction English hidden '+step);if(step===2)check(!el('#page').textContent.includes(pentry.chinese),'last correction has no Chinese');check(el('#phrase-submit').disabled,'audio gate correction '+step);await audioEnd();}val('#phrase-input',pentry.english);press();if(step<2)press();}check(pstate().session.correction.done&&phrasesModule.phraseStrength(pstate(),pentry.id)===pts&&pstate().history.length===history,'correction success gives no extra scores or attempts');press();check(pstate().session.items[pstate().session.index].stage==='context','correction immediately transfers into unseen context');const transfer=pstate().session.items[pstate().session.index].question.id;val('#phrase-input','partial');click('[data-phrase=pause]');await boot(storage(),'#phrases');check(text().includes('搭配练习已暂停'),'pause persisted');click('[data-phrase=resume]');check(el('#phrase-input').value==='partial','phrase draft survives pause reload');let guard=0;while(!pstate().session.done&&guard++<30){const item=pstate().session.items[pstate().session.index];if(item.stage==='listen'){check(!el('#page').textContent.includes(pentry.english),'listening stage has no target English');await audioEnd();}if(!pstate().session.result){val('#phrase-input',item.question.answer);press();}press();}check(pstate().session.done,'full vertical phrase lesson completes');check(w.localStorage.getItem(key)===oldBytes,'word and sentence main progress remain byte-identical');check(pstate().contextSeen.length>=2,'migration scenes recorded persistently');click('[data-phrase=tracker]');check(text().includes('固定搭配 · 记忆追踪'),'independent phrase tracker exists');check(el('[data-phrase=review]').disabled,'successful automatic skills not due again immediately');click('[data-phrase=home]');click('[data-phrase=custom]');val('[name=english]','test phrase');val('[name=chinese]','测试搭配');val('[name=exampleEn]','Please use this test phrase today.');el('#phrase-custom-form').requestSubmit();check(pstate().custom.length===1,'custom phrase saves separately');const customId=pstate().custom[0].id;check(pstate().custom[0].contexts.length===1,'exact user example safely becomes one finite gap');click(`[data-phrase=edit][data-id="${customId}"]`);val('[name=english]','<img src=x>');el('#phrase-custom-form').requestSubmit();check(el('#phrase-custom-error').textContent.length>0&&!w.document.querySelector('#page img'),'custom HTML rejected without insertion');check(errors.length===0,'no phrase DOM runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));w.dispatchEvent(new w.Event('pagehide'));await Promise.resolve();dom.window.close();
