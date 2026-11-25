import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from './qa-dom.mjs';
import {createPhraseUI} from '../src/phrases-ui.js';
import {freshPhrases,phraseRecord} from '../src/phrases.js';
import {renderCustomSentenceManager} from '../src/custom-sentences.js';
import {createLearningLedger,buildDailyReport} from '../src/daily-insights.js';
import {renderDailyInsights} from '../src/daily-insights-ui.js';
import {renderAdaptive} from '../src/adaptive-ui.js';
import {freshPractice,moduleProgress} from '../src/adaptive.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setup(){const dom=new JSDOM('<main></main>',{url:'https://qa.invalid/'});dom.window.confirm=()=>true;return {dom,element:dom.window.document.querySelector('main')};}
function jump(t,key,page){const input=t.element.querySelector(`[data-pagination-input="${key}"]`);input.value=page;input.dispatchEvent(new t.dom.window.Event('change',{bubbles:true}));}
const rows=t=>[...t.element.querySelectorAll('.sentence-row')];
test('phrase lists show every entry with independent cursors, filter reset and deletion clamp',()=>{
 const t=setup(),root=freshPhrases();const entries=Array.from({length:13},(_,i)=>({id:`p${i}`,english:`phrase ${i}`,chinese:`释义${i}`,themes:['topic'],unitIds:[i===12?'unit2':'unit1'],contexts:[]}));
 entries.forEach(e=>phraseRecord(root,e.id).introduced=true);root.custom=entries.map((e,i)=>({...e,id:`c${i}`,custom:true}));root.ui.tab='unit';root.ui.filter='all';
 let ui;ui=createPhraseUI({document:t.dom.window.document,root,bank:{entries},audio:{},esc,save:()=>true,onRender:()=>ui.render(t.element),stopAudio(){},playFile(){},playKokoro(){}});
 try{
 ui.render(t.element);assert.equal(rows(t).length,6);assert.equal(t.element.querySelectorAll('[data-pagination-nav]').length,2);
 t.element.querySelector('[name=english]').value='unsaved phrase';jump(t,'phrase-home',3);assert.equal(rows(t).length,1);assert.match(rows(t)[0].textContent,/phrase 12/);assert.equal(t.element.querySelector('[name=english]').value,'unsaved phrase');
 root.ui.panel='tracker';ui.render(t.element);assert.equal(rows(t).length,6);jump(t,'phrase-tracker',2);assert.equal(root.ui.trackerPage,1);assert.equal(root.ui.page,2);
 root.ui.panel='home';ui.render(t.element);assert.equal(rows(t).length,1);const filter=t.element.querySelector('#phrase-filter');filter.value='unit2';filter.dispatchEvent(new t.dom.window.Event('change'));assert.equal(root.ui.page,0);assert.equal(root.ui.trackerPage,0);
 root.ui.panel='custom';ui.render(t.element);jump(t,'phrase-custom',3);assert.equal(rows(t).length,1);t.element.querySelector('[data-phrase=delete]').click();assert.equal(root.ui.customPage,1);assert.equal(rows(t).length,6);assert.equal(root.custom.length,12);
 }finally{t.dom.window.close();}
});
test('custom sentence pagination preserves editor drafts and clamps after last-page deletion',()=>{
 const t=setup(),root={customSentences:Array.from({length:13},(_,i)=>({id:`s${i}`,english:`Sentence ${i}.`,chinese:'句子',group:'测试'}))};
 try{renderCustomSentenceManager({element:t.element,root,esc,onSave(){},onClose(){},stop(){},save:()=>true});assert.equal(rows(t).length,6);
 const field=t.element.querySelector('[name=english]');field.value='Draft survives.';field.dispatchEvent(new t.dom.window.Event('input'));jump(t,'custom-sentences',3);assert.equal(rows(t).length,1);assert.equal(t.element.querySelector('[name=english]').value,'Draft survives.');
 t.element.querySelector('[data-custom-sentence-delete]').click();assert.equal(root.customListPage,1);assert.equal(rows(t).length,6);assert.equal(root.customSentences.length,12);
 }finally{t.dom.window.close();}
});
test('daily priorities expose all records, correct ordinal numbering, day reset and no grading',()=>{
 const t=setup(),report={available:true,day:'2026-11-07',priorities:Array.from({length:23},(_,i)=>({itemId:`i${i}`,label:`Item ${i}`,mode:'spelling'}))},navigation=[];const render=()=>renderDailyInsights({element:t.element,report,esc,onNavigate:(...args)=>navigation.push(args)});
 try{const before=JSON.stringify(report);render();assert.equal(t.element.querySelectorAll('.daily-priority-list li').length,10);jump(t,'daily-priorities',3);assert.equal(t.element.querySelectorAll('.daily-priority-list li').length,3);assert.equal(t.element.querySelector('ol').start,21);assert.equal(JSON.stringify(report),before);t.element.querySelector('[data-daily-item="i22"]').click();assert.deepEqual(navigation,[['spelling','i22']]);report.day='2026-11-08';render();assert.equal(t.element.querySelector('ol').start,1);report.priorities=[];render();assert.match(t.element.querySelector('[data-page-status]').textContent,/1 \/ 1.*0/);
 }finally{t.dom.window.close();}
});
test('all adaptive modules expose old history and preserve expanded details without changing progress',()=>{
 const t=setup(),root=freshPractice(),bank={questions:[],concepts:[]};let module='context';
 for(const mode of ['context','reading','cloze','analysis'])moduleProgress(root,mode).history=Array.from({length:29},(_,i)=>({id:`q${i}`,answer:`answer ${i}`,at:i,correct:true,independent:true}));
 const render=()=>renderAdaptive({root,bank,module,element:t.element,esc,save(){throw Error('Paging must not save progress');},stopAudio(){},onReference(){},onRender:render});
 try{for(const mode of ['context','reading','cloze','analysis']){module=mode;render();const before=JSON.stringify(root);assert.equal(rows(t).length,12);t.element.querySelector('details').open=true;jump(t,'adaptive-history',3);assert.equal(rows(t).length,5);assert.match(rows(t)[4].textContent,/answer 0/);assert.equal(t.element.querySelector('details').open,true);assert.equal(JSON.stringify(root),before);jump(t,'adaptive-history',1);assert.equal(rows(t).length,12);assert.match(rows(t)[0].textContent,/answer 28/);}}finally{t.dom.window.close();}
});

test('actual ledger report exposes every distinct wrong item across daily UI pages',()=>{
 const t=setup(),data=new Map(),at=new Date(2026,10,7,12).getTime();
 const storage={get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};
 const ledger=createLearningLedger({storage,now:()=>at});
 for(let i=0;i<27;i++)ledger.record({id:`wrong-${i}`,at,mode:'spelling',itemId:`word-${String(i).padStart(2,'0')}`,label:`Word ${i}`,kind:'answer',first:true,assisted:false,correct:false});
 const report=buildDailyReport(ledger.snapshot(),{at}),seen=[];
 try{assert.equal(report.available,true);assert.equal(report.priorities.length,27);const before=JSON.stringify(ledger.snapshot());renderDailyInsights({element:t.element,report,esc});
 for(let page=1;page<=3;page++){if(page>1)jump(t,'daily-priorities',page);seen.push(...[...t.element.querySelectorAll('[data-daily-item]')].map(b=>b.dataset.dailyItem));assert.equal(t.element.querySelectorAll('.daily-priority-list li').length,page===3?7:10);}
 assert.deepEqual(seen,report.priorities.map(item=>item.itemId));assert.equal(new Set(seen).size,27);assert.equal(JSON.stringify(ledger.snapshot()),before);
 }finally{t.dom.window.close();}
});
