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








const phraseKey=phrasesModule.PHRASE_KEY,pstate=()=>JSON.parse(w.localStorage.getItem(phraseKey)),bank=JSON.parse(await readFile(path.join(root,'src/phrases-bank.json'),'utf8')),phraseSeed=()=>{const r=phrasesModule.freshPhrases();r.ui.panel='tracker';r.ui.tab='all';for(const e of bank.entries.slice(0,12)){const p=phrasesModule.phraseRecord(r,e.id);p.introduced=true;p.skills.meaning.dueAt=1;}return r;};
await boot({[phraseKey]:JSON.stringify(phraseSeed())},'#phrases');click('[data-phrase=review]');check(pstate().session.items.length===12&&pstate().session.review,'review-all includes12 independent due skills without five-item limit');const initialId=pstate().session.id;click('[data-phrase=hint]');let q=pstate().session.items[0].question;click(`[data-phrase-choice="${q.options.indexOf(q.answer)}"]`);check(pstate().session.result.delta===0,'hinted meaning answer has no strength credit');click('[data-phrase=next]');check(!pstate().session.hint,'hint flag resets on next independent task');click('[data-phrase=pause]');await boot(storage(),'#phrases');click('[data-phrase=resume]');check(pstate().session.id===initialId&&pstate().session.index===1,'all-review pause reload retains pending position');while(!pstate().session.done){const s=pstate().session;q=s.items[s.index].question;click(`[data-phrase-choice="${q.options.indexOf(q.answer)}"]`);click('[data-phrase=next]');}check(pstate().history.length===12,'each review event graded once');click('[data-phrase=tracker]');check(el('[data-phrase=review]').disabled,'all-review completion excludes same due cycle');val('#phrase-tracking-kind','words');check(el('#tracking-kind').value==='words','tracking domain can return to original word tracker');val('#tracking-kind','phrases');check(text().includes('固定搭配 · 记忆追踪'),'original tracker can select phrase domain');
const listen=phrasesModule.freshPhrases();listen.ui.panel='tracker';listen.ui.tab='all';for(const e of bank.entries.slice(0,2)){const r=phrasesModule.phraseRecord(listen,e.id);r.introduced=true;r.skills.listening.dueAt=1;}await boot({[phraseKey]:JSON.stringify(listen)},'#phrases');click('[data-phrase=review][data-skill=listening]');check(pstate().session.items.every(i=>i.question.skill==='listening'),'skill-specific review remains isolated');check([...w.document.querySelectorAll('[data-phrase-choice]')].every(b=>b.disabled),'listen-choice cannot answer before audio completes');check(!el('#page').textContent.includes(bank.entries[0].english),'listening choice does not reveal phrase title');await Promise.resolve();const original=media.at(-1),late=original.onended;original.onerror();check([...w.document.querySelectorAll('[data-phrase-choice]')].every(b=>b.disabled),'audio failure leaves listening choice gated');click('#phrase-audio-status button');await Promise.resolve();media.at(-1).onended();q=pstate().session.items[0].question;click(`[data-phrase-choice="${q.options.indexOf(q.answer)}"]`);click('[data-phrase=next]');late();check([...w.document.querySelectorAll('[data-phrase-choice]')].every(b=>b.disabled),'stale prior audio cannot unlock next phrase');const count=media.length;w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Control',code:'ControlLeft',ctrlKey:true,bubbles:true}));w.document.dispatchEvent(new w.KeyboardEvent('keyup',{key:'Control',code:'ControlLeft',ctrlKey:false,bubbles:true}));check(media.length===count+1&&media.at(-1).src.includes('col-002-phrase'),'Ctrl replays the current phrase only');
const exhausted=phrasesModule.freshPhrases(),e=bank.entries[0],r=phrasesModule.phraseRecord(exhausted,e.id);r.introduced=true;r.skills.context.dueAt=1;exhausted.contextSeen=e.contexts.map(phrasesModule.contextKey);exhausted.ui.panel='tracker';exhausted.ui.tab='all';await boot({[phraseKey]:JSON.stringify(exhausted)},'#phrases');check(text().includes('无未见新场景')&&el('[data-phrase=review]').disabled,'exhausted-only context shows honest pending state');
await boot({},'#phrases');check(w.document.querySelectorAll('[data-phrase=one]').length===15,'phrase list paginates fifteen entries');const first=el('[data-phrase=one]').dataset.id;click('[data-phrase=page-next]');check(el('[data-phrase=one]').dataset.id!==first,'next page changes entries');click('[data-phrase=previous]');check(el('[data-phrase=one]').dataset.id===first,'previous page restores correct slice');click(`[data-phrase=one][data-id="${first}"]`);const related=w.document.querySelector('[data-phrase=related]');check(!!related,'verified matching phrase has related module link');related.click();check(!!w.document.querySelector('[data-adaptive=start]'),'related module opens eligible unseen questions');click('[data-action=back-parent]');check(el('h1').textContent==='固定搭配练习','related module returns to phrase parent without losing session');check(errors.length===0,'no phrase review DOM runtime errors');console.log(JSON.stringify({passed:results.length,checks:results},null,2));w.dispatchEvent(new w.Event('pagehide'));await Promise.resolve();dom.window.close();
