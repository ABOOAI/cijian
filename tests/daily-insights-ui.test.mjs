import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from './qa-dom.mjs';
import {renderDailyInsights} from '../src/daily-insights-ui.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function setup(report){
 const dom=new JSDOM('<main></main>'),element=dom.window.document.querySelector('main'),navigation=[];
 let refreshes=0;
 renderDailyInsights({element,report,esc:escape,onRefresh:()=>refreshes++,onNavigate:(...args)=>navigation.push(args)});
 return {dom,element,navigation,metric:name=>element.querySelector(`[data-daily-metric="${name}"] [data-daily-value]`).textContent,get refreshes(){return refreshes;}};
}
const base={available:true,day:'2026-10-21',timeMs:null,dueCount:0,total:0,independentAttempts:0,independentCorrect:0,accuracy:null,wrong:0,assisted:0,self:0,corrections:0,correctionCorrect:0,correctionCompleted:0,modes:[],priorities:[],partial:true,startedAt:new Date(2026,9,21,12).getTime()};

test('daily UI distinguishes unknown time, absent first answers and actual observed zero',()=>{
 const t=setup(base);try{
  assert.equal(t.metric('time'),'未记录');assert.equal(t.metric('accuracy'),'暂无可核对首答');
  assert.equal(t.metric('attempts'),'0');assert.equal(t.metric('due'),'0 项');
  assert.match(t.element.querySelector('#daily-insights-coverage').textContent,/升级前.*无法完整还原/);
  assert.ok(t.element.querySelector('#daily-insights-empty'));
  assert.match(t.element.querySelector('#daily-insights-advice').textContent,/样本较少/);
 }finally{t.dom.window.close();}
});
test('unavailable ledger displays no fabricated statistics or recommendations while timer stays independent',()=>{
 const t=setup({...base,available:false,timeMs:125000,dueCount:null,total:5,independentAttempts:5,independentCorrect:5,accuracy:100,priorities:[{mode:'spelling',itemId:'private',label:'must not show'}]});try{
  assert.equal(t.metric('accuracy'),'无法读取');assert.equal(t.metric('attempts'),'无法读取');
  assert.equal(t.metric('time'),'2分5秒');assert.equal(t.metric('due'),'无法读取');
  assert.ok(t.element.querySelector('#daily-insights-availability'));
  assert.equal(t.element.querySelector('[data-daily-item]'),null);assert.doesNotMatch(t.element.textContent,/must not show/);
 }finally{t.dom.window.close();}
});
test('daily table separates hints, self-ratings and corrections and uses cautious small-sample advice',()=>{
 const mode={id:'spelling',firstAttempts:4,independentAttempts:2,independentCorrect:1,accuracy:50,wrong:1,assisted:2,self:3,corrections:5,correctionCorrect:3};
 const t=setup({...base,total:12,independentAttempts:2,independentCorrect:1,accuracy:50,wrong:1,correctionCompleted:1,modes:[mode]});try{
  assert.equal(t.metric('accuracy'),'50%');
  const cells=[...t.element.querySelectorAll('[data-daily-mode-row="spelling"] td')].map(cell=>cell.textContent);
  assert.deepEqual(cells,['4','50%1 / 2','1','2','3','5 / 3']);
  assert.match(t.element.querySelector('#daily-insights-advice').textContent,/2次无提示首答.*样本较少/);
  assert.match(t.element.querySelector('#daily-insights-method').textContent,/提示辅助、自评、订正提交均不进入/);
 }finally{t.dom.window.close();}
});
test('daily refresh and review only request callbacks, preserving report and escaping custom labels',()=>{
 const report={...base,priorities:[{mode:'spelling',itemId:'custom-qa',label:'<img src=x onerror=alert(1)>',reason:'<script>bad</script>',wrong:1,independentCorrect:0,correctionCompleted:0}]};
 const before=JSON.stringify(report),t=setup(report);try{
  assert.equal(t.element.querySelector('img,script'),null);assert.match(t.element.textContent,/<img src=x/);
  t.element.querySelector('#daily-insights-refresh').click();assert.equal(t.refreshes,1);
  t.element.querySelector('[data-daily-navigate="spelling"]').click();
  t.element.querySelector('[data-daily-navigate="track"]').click();
  assert.deepEqual(t.navigation,[['spelling','custom-qa'],['track',undefined]]);
  assert.equal(JSON.stringify(report),before);
 }finally{t.dom.window.close();}
});
