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
await boot();check(w.document.querySelectorAll('.nav-button').length===17,'all 15 navigation modules render');
click('[data-view="custom"]');click('[data-action="add-word"]');val('[name="english"]','testling');val('[name="chinese"]','测试自定义词');val('[name="example"]','This testling is a test word.');val('[name="exampleZh"]','这是一个测试词。');val('[name="hint"]','<img src=x onerror="window.XSS=1">');click('#custom-form .primary');let id=JSON.parse(w.localStorage.getItem(custom.CUSTOM_KEY)).words[0].id;
check(id.startsWith('custom-'),'custom stable namespace');check(!w.XSS&&!w.document.querySelector('#page img'),'XSS inert');await boot(storage(),'#custom');check(text().includes('testling'),'custom persists after reload');
click('[data-edit]');val('[name="group"]','课外词');click('#custom-form .primary');check(JSON.parse(w.localStorage.getItem(custom.CUSTOM_KEY)).words[0].id===id,'edit retains identity');
click('[data-action="add-word"]');val('[name="english"]','TESTLING');val('[name="chinese"]','重复');click('#custom-form .primary');check(el('#form-error').textContent.includes('已在'),'duplicate rejected in actual UI');click('[data-close="word-dialog"]');
for(const module of ['memory','meaning','listening','dictation','spelling']){click(`[data-view="${module}"]`);val('#scope-select','custom');check(text().includes('testling'),'custom visible in '+module);click('[data-action="module-start"]');check(state().session.items[0].wordId===id,'custom trains in '+module);if(['listening','dictation'].includes(module)){click('[data-action="audio"]');check(text().includes('设备没有英语声音'),'missing audio honestly disclosed in '+module);}}
w.__WORD_GARDEN_NOW__=Date.now()+120000;val('#spell-input','wrong');click('#check-answer');check(el('.correction-answer').textContent.includes('testling')&&el('.correction-answer').textContent.includes('测试自定义词'),'wrong answer shows EN+ZH');check(state().records[id].skills.spelling.mistake,'custom error scheduled');let reviews=state().records[id].skills.spelling.reviews;await boot(storage(),'#session');check(state().records[id].skills.spelling.reviews===reviews,'refresh does not score again');val('#correction-input','testling');click('#correction-submit');check(state().records[id].skills.spelling.successes===0,'copy retry gives no independent success');
click('[data-view="mistakes"]');check(text().includes('testling'),'custom appears in error list');click('[data-view="track"]');check(text().includes('testling'),'custom appears in schedule');w.__WORD_GARDEN_NOW__=state().records[id].skills.spelling.dueAt+1;click('[data-view="track"]');click('[data-action="skill-review"][data-skill="spelling"]');check(state().session.items.every(i=>i.skill==='spelling'),'skill due queue isolated');val('#spell-input','testling');click('#check-answer');check(state().records[id].skills.spelling.successes===1,'due independent recall counted');
click('[data-view="sentences"]');val('#scope-select','custom');check(text().includes('This testling is a test word.'),'custom sentence in sentence book');click('#show-en');check(!el('.single-sentence-practice').textContent.includes('testling'),'English hidden independently');click('[data-context-word]');check(text().includes('This ____ is a test word.'),'custom example enters context cloze');val('#spell-input','testling');click('#check-answer');check(el('.feedback').textContent.includes('答对了'),'custom example answer works');check(!!state().records[id].skills.usage,'custom context has independent usage record');
click('[data-view="cloze"]');click('[data-adaptive="reference"]');val('#reading-source','custom');check(text().includes('短文内容尚未编写')&&text().includes('testling'),'custom passage coverage explicit and visible');
click('[data-view="custom"]');w.confirm=()=>false;click('[data-delete]');check(JSON.parse(w.localStorage.getItem(custom.CUSTOM_KEY)).words.length===1,'cancel deletion preserves word');w.confirm=()=>true;click('[data-delete]');check(JSON.parse(w.localStorage.getItem(custom.CUSTOM_KEY)).words.length===0,'confirmed delete succeeds');check(!state().records[id],'custom deletion removes orphan progress');
click('[data-view="tasks"]');click('[data-action="new-lesson"]');check(el('.phonics').textContent.includes('20词核对包'),'verified pilot before word learning');check(text().includes('分音节录音暂不可用')&&!w.document.querySelector('.chunk button'),'no fake syllable audio');check(state().exposure['starter1-001']>Date.now(),'visible study answer persists assistance immediately');
// Pilot exercise keeps the same question and answer key after scoring.
click('[data-view="context"]');click('[data-adaptive="reference"]');check(!w.document.querySelector('[data-context-word]'),'old pilot bank is read-only in context references');click('#return-adaptive');click('[data-adaptive=start]');click('[data-adaptive-choice]');check(!!el('.answer-feedback'),'fresh context usage answer submits');
for(const module of ['reading','cloze','analysis']){click(`[data-view="${module}"]`);click('[data-adaptive=start]');check(!!w.document.querySelector('[data-adaptive-choice]'),'real questions in '+module);}
click('[data-view="reading"]');check(!w.document.querySelector('.answer-feedback'),'reading answers hidden before submit');click('[data-adaptive-choice]');check(!!w.document.querySelector('.answer-feedback'),'reading explanation after submit');await boot(storage(),'#reading');check(!!w.document.querySelector('.answer-feedback'),'reading result survives refresh');click('[data-view="cloze"]');check(el('.reading-text').textContent.includes('____'),'cloze source does not reveal blanks');click('[data-adaptive-choice]');check(!!w.document.querySelector('.answer-feedback'),'cloze answer explanation works');
const previous=storage();delete previous[key];previous['word-garden.progress.v1']=JSON.stringify({version:1,records:{'starter1-001':{reviews:4,dueAt:1700000000000,lastReviewed:1699999900000,wrongCount:1,streak:2,mistake:false,intervalDays:3}}});await boot(previous);check(Object.keys(state().records['starter1-001'].skills).join(',')==='meaning','legacy retained in one compatibility queue only');check(!!state().records['starter1-001'].legacy,'full legacy snapshot retained');check(text().includes('不代表翻译已独立验证'),'migration uncertainty disclosed');check(w.localStorage.getItem('word-garden.progress.v1')===previous['word-garden.progress.v1'],'legacy source never overwritten');
click('#settings-button');val('[name="steps"]','2,10');click('#steps-form button');check(state().settings.steps.join(',')==='2,10','short steps configurable');click('[data-close="settings-dialog"]');

await boot();
for(const module of ['memory','meaning','listening','dictation','spelling']){
 click(`[data-view="${module}"]`);click('[data-practice="starter1-001"]');click('[data-action="audio"]');
 check(media.at(-1).src.endsWith('/audio/starter1-001.mp3'),'same fixed Kokoro file in '+module);
 check(text().includes('Kokoro · 女声 · 美音'),'female voice label in '+module);
 if(['listening','dictation'].includes(module)){
  const selector=module==='listening'?'[data-choice]':'#check-answer';check(el(selector).disabled,'audio completion required in '+module);
  const previous=media.at(-1),stale=previous.onended;click('[data-action="audio"]');check(previous.paused,'replay cancels preceding audio in '+module);stale();check(el(selector).disabled,'stale end ignored in '+module);media.at(-1).onended();check(!el(selector).disabled,'new end unlocks '+module);
 }
}
check(state().exposure['starter1-001']>Date.now(),'audio in written recall is an assistance cue');val('#spell-input','unit');click('#check-answer');check(state().records['starter1-001'].skills.spelling.successes===0,'hearing a written-recall answer does not grant independent mastery');
click('[data-view="dictation"]');click('[data-practice="starter1-001"]');click('[data-action="audio"]');const interrupted=media.at(-1),late=interrupted.onended;
click('[data-view="dictation"]');click('[data-practice="starter1-002"]');check(interrupted.paused,'navigation stops prior word audio');late();check(el('#check-answer').disabled,'prior item callback cannot unlock next item');click('[data-action="audio"]');check(media.at(-1).src.endsWith('/audio/starter1-002.mp3')&&text().includes('Kokoro · 男声 · 美音'),'second canonical word uses stable male voice');
media.at(-1).onerror();check(text().includes('改用设备朗读'),'file failure offers explicit device fallback');check(el('#check-answer').disabled,'file failure never unlocks answer');click('#speech-notice .text-button:last-child');check(text().includes('设备后备朗读'),'fallback voice accurately labeled');
click('[data-view="sentences"]');click('[data-audio-word="starter1-001"]');check(media.at(-1).src.endsWith('/audio/starter1-001.mp3'),'sentence book uses same word recording');
click('[data-view="context"]');if(w.document.querySelector('[data-adaptive=start]'))click('[data-adaptive=start]');check(!w.document.querySelector('[data-action=audio]'),'context no longer exposes word audio');click('[data-read-context]');check(media.at(-1).src.includes('audio/context-safe-'),'context exercise uses blank-safe sentence recording');


// Real defect regression: the periodic badge refresh replaces menu markup.
intervals.forEach(fn=>fn());click('[data-view="spelling"]');check(el('#page h1').textContent==='默写','sidebar still works after periodic replacement');
val('#scope-select','starter2');click('[data-action="module-start"]');check(!!el('[data-action="back-parent"]'),'learning has explicit parent return');click('[data-action="back-parent"]');check(el('#scope-select').value==='starter2'&&el('#page h1').textContent==='默写','parent return restores module and unit filter');
for(const module of ['memory','meaning','listening','dictation','spelling','track','mistakes','sentences','context','reading','cloze','analysis','custom']){click(`[data-view="${module}"]`);check(!!w.document.querySelector('.page-back [data-action="back-parent"]'),'parent button in '+module);}
click('[data-action="add-word"]');val('[name="english"]','apricot');click('#custom-form .primary');for(let i=0;i<40&&el('#word-dialog').open;i++)await new Promise(r=>setTimeout(r,20));check(JSON.parse(w.localStorage.getItem(custom.CUSTOM_KEY)).words.some(x=>x.english==='apricot'&&x.chinese.includes('杏')),'single English-only save automatically supplies Chinese');
click('[data-action="batch-words"]');val('#batch-english','pineapple\nwatermelon\nzzxxyynotaword');click('#batch-match');for(let i=0;i<100&&el('#batch-match').disabled;i++)await new Promise(r=>setTimeout(r,20));check(w.document.querySelectorAll('[data-batch-select]:checked').length===2,'batch selects only reliably matched entries');check(el('#batch-preview').textContent.includes('未找到'),'unknown batch item stays explicit and unselected');click('#batch-save');check(JSON.parse(w.localStorage.getItem(custom.CUSTOM_KEY)).words.some(x=>x.english==='pineapple'&&x.chinese.includes('菠萝')),'batch English-only import has real Chinese');check(!JSON.parse(w.localStorage.getItem(custom.CUSTOM_KEY)).words.some(x=>x.english==='zzxxyynotaword'),'batch unknown never saved with invented meaning');


click('[data-view="spelling"]');val('#scope-select','starter3');click('[data-action="module-start"]');
await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('history back timed out')),1000);w.addEventListener('popstate',()=>{clearTimeout(timeout);resolve()},{once:true});w.history.back();});check(el('#scope-select').value==='starter3','browser Back restores exact prior unit');
await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('history forward timed out')),1000);w.addEventListener('popstate',()=>{clearTimeout(timeout);resolve()},{once:true});w.history.forward();});check(!!w.document.querySelector('.learning-card'),'browser Forward restores active exercise');
click('[data-view="reading"]');click('[data-adaptive="reference"]');val('#passage-select','1');click('[data-action="analysis-nav"]');click('[data-action="back-parent"]');check(el('#page h1').textContent==='阅读理解'&&el('#passage-select').value==='1','sentence analysis returns to originating passage');
click('[data-view="custom"]');click('[data-action="add-word"]');val('[name="english"]','apricot');val('[name="chinese"]','我的释义');await new Promise(r=>setTimeout(r,350));check(el('[name="chinese"]').value==='我的释义','late automatic lookup preserves manual Chinese edit');click('[data-close="word-dialog"]');


// Autoplay and Control-only replay on the live app DOM; media events are simulated.
click('[data-view="listening"]');let startCount=media.length;click('[data-action="module-start"]');check(media.length===startCount+1,'listening autoplays when the question enters');check(el('[data-choice]').disabled,'automatic playback still waits for ended');
const ctrl=(type,extra={})=>w.document.dispatchEvent(new w.KeyboardEvent(type,{key:'Control',code:'ControlLeft',ctrlKey:type==='keydown',bubbles:true,...extra}));
startCount=media.length;ctrl('keydown');ctrl('keyup');check(media.length===startCount+1,'Control alone replays current listening word');
for(const keyName of ['c','v','a']){startCount=media.length;ctrl('keydown');w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:keyName,code:'Key'+keyName.toUpperCase(),ctrlKey:true,bubbles:true}));w.document.dispatchEvent(new w.KeyboardEvent('keyup',{key:keyName,ctrlKey:true,bubbles:true}));ctrl('keyup');check(media.length===startCount,'Ctrl+'+keyName+' does not replay or intercept editing');}
media.at(-1).onended();const beforeAnswer=media.length;click('[data-choice]');check(media.length===beforeAnswer,'feedback rerender does not autoplay again');click('[data-action="next-item"]');check(media.length===beforeAnswer+1,'next listening question autoplays once');
click('[data-view="dictation"]');startCount=media.length;click('[data-action="module-start"]');check(media.length===startCount+1,'dictation question autoplays');el('#spell-input').focus();val('#spell-input','draft stays');startCount=media.length;el('#spell-input').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Control',code:'ControlLeft',ctrlKey:true,bubbles:true}));el('#spell-input').dispatchEvent(new w.KeyboardEvent('keyup',{key:'Control',code:'ControlLeft',ctrlKey:false,bubbles:true}));check(media.length===startCount+1&&el('#spell-input').value==='draft stays','Control replay works in dictation input without changing text');
startCount=media.length;ctrl('keydown');click('[data-action="back-parent"]');ctrl('keyup');check(media.length===startCount,'Control release after leaving does not play another question');

check(errors.length===0,'no uncaught DOM runtime errors');await mkdir(path.join(root,'evidence'),{recursive:true});await writeFile(path.join(root,'evidence/dom-v4-report.json'),JSON.stringify({passed:results.length,checks:results,limitations:'JSDOM validates DOM interactions and storage, not browser rendering, CSS layout, speech output or screenshots.'},null,2));console.log(JSON.stringify({passed:results.length,checks:results},null,2));dom.window.close();
