import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from './qa-dom.mjs';
import {renderSentenceDictation} from '../src/sentence-dictation.js';

const bank={groups:[
 {id:'group-a',unitId:'unit1',titleZh:'练习一',items:[
  {id:'a',sourceKind:'listening-script',english:'I like books.',chinese:'我喜欢书。'},
  {id:'b',sourceKind:'listening-script',english:'It is blue.',chinese:'它是蓝色的。'},
  {id:'excluded',sourceKind:'original-extension',english:'A cat sleeps.',chinese:'猫在睡觉。'}
 ]},
 {id:'group-b',unitId:'unit2',titleZh:'练习二',items:[{id:'other',english:'It is red.',chinese:'它是红色的。'}]}
]};
const progress=(draft,at=1)=>({draft,attempts:2,correctCount:1,independentCorrect:1,revealed:true,result:{correct:true,at},analyticsRunId:'old-'+draft,analyticsFirstId:'old-first'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setup(root){
 const dom=new JSDOM('<main></main>'),element=dom.window.document.querySelector('main'),events=[];
 let saved='',stops=0;
 const render=()=>renderSentenceDictation({element,bank,root,esc,save:()=>saved=JSON.stringify(root),stop:()=>stops++,play(){},now:()=>99,onLearningEvent:e=>events.push(e)});
 render();
 return {dom,element,root,events,render,q:s=>element.querySelector(s),get saved(){return saved;},get stops(){return stops;}};
}
function completed(){
 return {groupId:'group-a',source:'listening-script',unitId:'unit1',layoutVersion:2,page:1,completedGroupId:'group-a',cursorByGroup:{'group-a':1,'group-b':3},items:{a:progress('I like books.'),b:progress('It is blue.'),excluded:progress('excluded draft'),other:progress('other draft')},customSentences:[{id:'custom',english:'Keep me.'}],learningHistory:[{id:'preserve'}]};
}
function submit(t,value){
 t.q('[data-sentence-input]').value=value;
 t.q('[data-sentence-form]').dispatchEvent(new t.dom.window.Event('submit',{cancelable:true}));
}
test('completion replay clears only selected scope and preserves history, totals, and other cursors',()=>{
 const root=completed(),before=structuredClone(root),t=setup(root);
 try{
  assert.equal(t.q('#sentence-replay').textContent,'再学一遍');
  assert.ok(t.q('#sentence-return-last').compareDocumentPosition(t.q('#sentence-replay'))&t.dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  t.q('#sentence-replay').click();
  assert.equal(t.stops,1);
  assert.equal(root.completedGroupId,undefined);
  assert.equal(root.page,0);
  assert.equal(root.cursorByGroup['group-b'],3);
  for(const id of ['a','b']){
   const p=root.items[id];
   assert.equal(p.draft,'');assert.equal(p.result,null);assert.equal(p.revealed,true);
   assert.equal(p.attempts,2);assert.equal(p.correctCount,1);assert.equal(p.independentCorrect,1);
   assert.deepEqual(p.runHistory[0],{...before.items[id],endedAt:99});
  }
  assert.deepEqual(root.items.excluded,before.items.excluded);
  assert.deepEqual(root.items.other,before.items.other);
  assert.deepEqual(root.customSentences,before.customSentences);
  assert.deepEqual(root.learningHistory,before.learningHistory);
  assert.equal(t.q('textarea').value,'');assert.equal(t.q('textarea').disabled,false);
  assert.equal(t.dom.window.document.activeElement,t.q('textarea'));
  assert.ok(!t.element.textContent.includes('I like books.'));
  const restored=setup(JSON.parse(t.saved));
  try{assert.equal(restored.q('textarea').value,'');assert.equal(restored.q('textarea').disabled,false);assert.equal(restored.q('#sentence-replay'),null);}
  finally{restored.dom.window.close();}
 }finally{t.dom.window.close();}
});
test('replay preserves assisted scoring and counters accumulate without adding independent evidence',()=>{
 const t=setup(completed());
 try{
  t.q('#sentence-replay').click();submit(t,'I like books.');
  assert.equal(t.root.items.a.attempts,3);assert.equal(t.root.items.a.independentCorrect,1);
  assert.equal(t.root.items.a.result.assisted,true);
  assert.equal(t.events.at(-1).first,false);assert.equal(t.events.at(-1).kind,'correction');
  assert.ok(t.events.at(-1).id.includes('old-'));
  const firstId=t.events.at(-1).relatedId;
  t.q('[data-sentence-retry]').click();submit(t,'I like books.');
  assert.equal(t.root.items.a.independentCorrect,1);assert.equal(t.root.items.a.attempts,4);
  assert.equal(t.events.at(-1).kind,'correction');assert.equal(t.events.at(-1).relatedId,firstId);
  t.q('[data-sentence-nextitem]').click();assert.equal(t.q('textarea').value,'');
  submit(t,'It is blue.');t.q('[data-sentence-nextitem]').click();
  assert.ok(t.q('#sentence-replay'));
  t.q('#sentence-replay').click();
  assert.equal(t.root.items.a.runHistory.length,2);
  assert.equal(t.root.items.a.runHistory[0].draft,'I like books.');
  assert.equal(t.root.items.a.runHistory[1].attempts,4);
  assert.equal(t.root.items.a.runHistory[1].runHistory,undefined);
  assert.equal(t.root.items.a.attempts,4);
 }finally{t.dom.window.close();}
});
