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
const click=s=>{const e=el(s);assert.ok(!e.disabled,'disabled '+s);e.click();};const val=(s,v)=>{if(s==='#correction-input'&&state().session?.remediation?.step===1&&!state().session.remediation.feedback)media.at(-1)?.onended?.();const e=el(s);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}));};
const text=()=>w.document.body.textContent;const check=(v,n)=>{assert.ok(v,n);results.push(n)};




await boot({},'#spelling');click('[data-practice="starter1-001"]');check(!w.document.querySelector('.spelling-comparison'),'fresh spelling never reveals answer box');click('#check-answer');check(!w.document.querySelector('.spelling-comparison'),'empty answer has no error comparison');val('#spell-input','unt');click('#check-answer');check(el('.spelling-comparison').compareDocumentPosition(el('#correction-form'))&w.Node.DOCUMENT_POSITION_FOLLOWING,'correct comparison is above spelling input');check(el('.raw-spelling').textContent==='unt'&&el('.diff-missing.diff-target').textContent==='i','missed letter highlighted and exact input retained');await boot(storage(),'#session');check(el('.raw-spelling').textContent==='unt','actual submitted text survives reload');val('#correction-input','unit');click('#correction-submit');click('[data-correction=next]');check(!w.document.querySelector('.spelling-comparison')&&el('#correction-input').value==='','second corrective round hides comparison and clears answer');media.at(-1).onended();val('#correction-input','unit');click('#correction-submit');check(!w.document.querySelector('.spelling-comparison'),'successful answer has no error box');
await boot({},'#dictation');val('#word-search','make friends');click('[data-practice="unit1-001"]');media.at(-1).onended();val('#spell-input','make frends');click('#check-answer');check(el('.raw-spelling').textContent==='make frends','initial dictation comparison retains entered phrase');check(el('.spelling-comparison').compareDocumentPosition(el('#correction-form'))&w.Node.DOCUMENT_POSITION_FOLLOWING,'dictation comparison appears above correction input');val('#correction-input','make friendz');click('#correction-submit');check(el('.raw-spelling').textContent==='make friendz'&&el('#correction-input').value==='make friendz','correction error retains raw answer without overwriting it');check(el('#correction-input').disabled&&el('#correction-submit').disabled,'visible comparison cannot count another answer');await boot(storage(),'#session');check(el('.raw-spelling').textContent==='make friendz'&&el('#correction-input').value==='make friendz','wrong correction and exact input survive reload');const successes=state().session.remediation.successes;click('[data-correction=retry]');check(!w.document.querySelector('.spelling-comparison')&&state().session.remediation.successes===successes,'hide comparison retains correction stage progress');val('#correction-input','make friends');click('#correction-submit');click('[data-correction=next]');check(!w.document.querySelector('.spelling-comparison')&&!el('#page').textContent.includes('make friends'),'hidden second round has no answer leak');val('#correction-input','makefriends');click('#correction-submit');check(el('.diff-missing.diff-target').textContent.trim()===''&&el('.diff-missing.diff-target').classList.contains('diff-space')&&el('.diff-missing.diff-target').getAttribute('aria-label').includes('空格'),'phrase missing boundary explicitly visible');click('[data-correction=retry]');check(!w.document.querySelector('.spelling-comparison')&&!el('#page').textContent.includes('make friends'),'later retry hides target again');click('[data-view=spelling]');click('[data-practice="starter1-002"]');check(!w.document.querySelector('.spelling-comparison'),'next word clears previous comparison');await boot({},'#preparatory-spelling');val('#word-search','hello');click('[data-practice="supplement-primary-hello"]');val('#spell-input','helo');click('#check-answer');check(el('.spelling-comparison').textContent.includes('hello'),'primary vocabulary receives same comparison');const cw=custom.makeCustom({english:'testling',chinese:'测试词',group:'我的词'},'custom-diff');await boot({[custom.CUSTOM_KEY]:JSON.stringify({version:1,words:[cw]})},'#spelling');val('#scope-select','custom');click('[data-practice="custom-diff"]');val('#spell-input','<img src=x onerror=alert(1)>');click('#check-answer');check(!w.document.querySelector('.spelling-comparison img')&&el('.raw-spelling').textContent.startsWith('<img'),'custom wrong text remains escaped plain text');check(errors.length===0,'no comparison DOM runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));w.dispatchEvent(new w.Event('pagehide'));await Promise.resolve();dom.window.close();
