import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from './qa-dom.mjs';
import {renderCustomSentenceManager} from '../src/custom-sentences.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setup({failure=false,throws=false}={}){
 const dom=new JSDOM('<main></main>',{url:'https://qa.invalid/'}),element=dom.window.document.querySelector('main');dom.window.confirm=()=>true;
 const root={items:{'custom-sentence-old':{correct:1}},customSentences:[{id:'custom-sentence-old',english:'Old sentence.',chinese:'旧句子',group:'测试',createdAt:1}],unrelated:{preserve:42}};let saves=0;
 renderCustomSentenceManager({element,root,esc,save:()=>{saves++;if(throws)throw Error('quota');return !failure;},onSave(){},onClose(){},stop(){},now:()=>10});
 const set=(name,value)=>{const f=element.querySelector('form');f.elements[name].value=value;f.elements[name].dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 const submit=()=>element.querySelector('form').onsubmit({preventDefault(){}});
 return {dom,element,root,set,submit,get saves(){return saves;}};
}
test('failed new sentence save restores root in place and retains typed draft without success UI',async()=>{
 const t=setup({failure:true});try{const identity=t.root;t.set('english','A new sentence.');t.set('chinese','新句子');const before=JSON.stringify(t.root),saves=t.saves;await t.submit();assert.equal(t.root,identity);assert.equal(JSON.stringify(t.root),before);assert.equal(t.saves,saves+1);assert.equal(t.element.querySelector('[name=english]').value,'A new sentence.');assert.match(t.element.querySelector('#custom-sentence-error').textContent,/未能保存/);assert.equal(t.element.querySelectorAll('[data-custom-sentence-practice]').length,1);assert.equal(t.element.querySelector('button.primary').disabled,false);}finally{t.dom.window.close();}
});
test('failed edited sentence save restores archived progress, old text, and the current draft',async()=>{
 const t=setup({failure:true});try{t.element.querySelector('[data-custom-sentence-edit]').click();t.set('english','Edited sentence.');t.set('chinese','修改句子');const before=JSON.stringify(t.root);await t.submit();assert.equal(JSON.stringify(t.root),before);assert.equal(t.root.items['custom-sentence-old'].correct,1);assert.equal(t.root.customHistory,undefined);assert.equal(t.element.querySelector('[name=english]').value,'Edited sentence.');}finally{t.dom.window.close();}
});
test('failed deletion preserves sentence and progress, does not retry write, and keeps editor',()=>{
 const t=setup({failure:true});try{t.element.querySelector('[data-custom-sentence-edit]').click();const before=JSON.stringify(t.root),saves=t.saves;t.element.querySelector('[data-custom-sentence-delete]').click();assert.equal(JSON.stringify(t.root),before);assert.equal(t.saves,saves+1);assert.equal(t.element.querySelector('[name=english]').value,'Old sentence.');assert.match(t.element.querySelector('#custom-sentence-error').textContent,/未能保存/);}finally{t.dom.window.close();}
});
test('throwing storage during delete is also rolled back',()=>{
 const t=setup({throws:true});try{const before=JSON.stringify(t.root);t.element.querySelector('[data-custom-sentence-delete]').click();assert.equal(JSON.stringify(t.root),before);assert.match(t.element.querySelector('#custom-sentence-error').textContent,/未能保存/);}finally{t.dom.window.close();}
});
test('successful edit retains ID, archives changed sentence progress and resets only its result',async()=>{
 const t=setup();try{t.element.querySelector('[data-custom-sentence-edit]').click();t.set('english','Edited sentence.');t.set('chinese','修改句子');await t.submit();assert.equal(t.root.customSentences[0].id,'custom-sentence-old');assert.equal(t.root.customSentences[0].english,'Edited sentence.');assert.equal(t.root.items['custom-sentence-old'],undefined);assert.equal(t.root.customHistory[0].progress.correct,1);assert.deepEqual(t.root.unrelated,{preserve:42});assert.equal(t.root.customDraft,undefined);assert.equal(t.element.querySelector('[name=english]').value,'');}finally{t.dom.window.close();}
});
test('successful delete affects only selected sentence and UI explains American speech and all modes',()=>{
 const t=setup();try{assert.match(t.element.textContent,/Kokoro 本机合成美音/);assert.match(t.element.textContent,/af_heart.*am_michael/);assert.match(t.element.textContent,/手动选择设备后备/);assert.match(t.element.textContent,/记忆、翻译、听辨、听写和默写/);assert.match(t.element.textContent,/记忆规则与单词一致/);t.element.querySelector('[data-custom-sentence-delete]').click();assert.equal(t.root.customSentences.length,0);assert.deepEqual(t.root.items,{});assert.deepEqual(t.root.unrelated,{preserve:42});}finally{t.dom.window.close();}
});
