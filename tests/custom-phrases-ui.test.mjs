import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from './qa-dom.mjs';
import {createPhraseUI} from '../src/phrases-ui.js';
import {freshPhrases,phraseRecord,loadPhrases,PHRASE_KEY} from '../src/phrases.js';
const fixture={id:'col-001',english:'be good at',chinese:'擅长',contexts:[],acceptedAnswers:['be good at']};
const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function setup({lookup=async()=>({found:false,status:'unknown'}),saveResult=true,root=freshPhrases(),panel='custom',bankEntries=[fixture]}={}){
 const dom=new JSDOM('<main id="page"></main>',{url:'https://qa.invalid/',pretendToBeVisual:true});
 const d=dom.window.document,element=d.querySelector('#page');dom.window.confirm=()=>true;
 let saved=null,ui,focusCalls=0;root.ui.panel=panel;
 ui=createPhraseUI({document:d,root,bank:{entries:bankEntries},audio:{},esc:escape,lookup,save:()=>{if(saveResult===false)return false;saved=JSON.stringify(root);return true;},onRender:()=>ui.render(element),stopAudio(){},playFile(){},playKokoro(){},onFocus:()=>{focusCalls++;element.querySelector('input')?.focus();},now:()=>1000});
 ui.render(element);
 const input=(name,value)=>{const e=d.querySelector(`[name=${name}]`);e.value=value;e.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 const submit=async id=>{const f=d.querySelector('form'),b=d.querySelector(id||'#phrase-save-learn');f.dispatchEvent(new dom.window.SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:b}));await settle();};
 return {dom,d,root,ui,element,input,submit,get saved(){return saved;},get focusCalls(){return focusCalls;}};
}
test('custom primary save enters real complete core pipeline; saved state reloads',async()=>{
 const t=setup();try{t.input('english','take initiative');t.input('chinese','主动采取行动');await t.submit();assert.deepEqual(t.root.session.items.map(i=>i.stage),['study','meaning','recall','listen']);assert.equal(t.root.ui.panel,'practice');assert.equal(loadPhrases({getItem:()=>t.saved}).blocked,false);assert.equal(t.root.custom.length,1);}finally{t.dom.window.close();}
});
test('save-only retains item without starting a session and supports an advanced single word',async()=>{
 const t=setup();try{t.input('english','meticulous');t.input('chinese','一丝不苟的');await t.submit('#phrase-save-only');assert.equal(t.root.session,null);assert.equal(t.root.ui.panel,'home');assert.equal(t.root.custom[0].english,'meticulous');}finally{t.dom.window.close();}
});
test('empty English and unknown missing meaning retain draft and focus offending field',async()=>{
 const t=setup();try{await t.submit();assert.equal(t.d.activeElement.name,'english');t.input('english','unknown qa phrase');await t.submit();assert.equal(t.d.activeElement.name,'chinese');assert.equal(t.d.querySelector('[name=english]').value,'unknown qa phrase');assert.equal(t.root.custom.length,0);}finally{t.dom.window.close();}
});
test('dictionary definition is editable and submit waits for blank-meaning lookup',async()=>{
 const t=setup({lookup:async()=>({found:true,chinese:'词典释义',source:'测试词典'})});try{t.input('english','assiduous');await t.submit();assert.equal(t.root.custom[0].chinese,'词典释义');assert.equal(t.root.ui.panel,'practice');}finally{t.dom.window.close();}
});
test('late lookup never overwrites manual Chinese edits',async()=>{
 let resolve;const t=setup({lookup:()=>new Promise(r=>resolve=r)});try{t.input('english','assiduous');t.d.querySelector('#phrase-lookup').click();t.input('chinese','我核对的中文');resolve({found:true,chinese:'迟来的释义',source:'测试词典'});await settle();assert.equal(t.d.querySelector('[name=chinese]').value,'我核对的中文');assert.match(t.d.querySelector('#phrase-match').textContent,/已保留/);}finally{t.dom.window.close();}
});
test('stale English lookup and closed editor callbacks cannot contaminate a new form',async()=>{
 let resolve;const t=setup({lookup:()=>new Promise(r=>resolve=r)});try{t.input('english','first phrase');t.d.querySelector('#phrase-lookup').click();t.input('english','second phrase');resolve({found:true,chinese:'第一条释义'});await settle();assert.equal(t.d.querySelector('[name=chinese]').value,'');t.d.querySelector('#phrase-lookup').click();t.d.querySelector('[data-phrase=home]').click();resolve({found:true,chinese:'第二条释义'});await settle();assert.equal(t.root.custom.length,0);assert.equal(t.root.ui.panel,'home');}finally{t.dom.window.close();}
});
test('duplicate normalization rejects case, repeated whitespace and trailing punctuation',async()=>{
 const root=freshPhrases();root.custom.push({id:'custom-col-old',custom:true,english:'Take initiative',chinese:'主动行动',contexts:[]});const t=setup({root});try{t.input('english',' TAKE   initiative! ');t.input('chinese','测试');await t.submit();assert.equal(root.custom.length,1);assert.match(t.d.querySelector('#phrase-custom-error').textContent,/已存在/);}finally{t.dom.window.close();}
});
test('built-in match reuses original ID; differing manual meaning is never silently discarded',async()=>{
 const t=setup();try{t.input('english','be good at');t.input('chinese','不同释义');await t.submit();assert.equal(t.root.custom.length,0);assert.equal(t.root.session,null);assert.match(t.d.querySelector('#phrase-custom-error').textContent,/不同/);t.d.querySelector('#phrase-use-existing').click();assert.equal(t.root.session.items[0].phraseId,'col-001');assert.equal(t.root.custom.length,0);}finally{t.dom.window.close();}
});
test('storage failure rolls back item and session, retaining the entire editable draft',async()=>{
 const t=setup({saveResult:false});try{const before=JSON.stringify(t.root);t.input('english','take initiative');t.input('chinese','主动行动');await t.submit();assert.equal(JSON.stringify(t.root),before);assert.equal(t.d.querySelector('[name=english]').value,'take initiative');assert.equal(t.d.querySelector('[name=chinese]').value,'主动行动');assert.match(t.d.querySelector('#phrase-custom-error').textContent,/未能保存/);}finally{t.dom.window.close();}
});
test('provided example opens all four skills without inventing a context for absent example',async()=>{
 const t=setup();try{t.input('english','take initiative');t.input('chinese','主动行动');t.input('exampleEn','We take initiative when the team needs help.');await t.submit();assert.equal(t.root.custom[0].contexts.length,1);assert.deepEqual(t.root.session.items.map(i=>i.stage),['study','meaning','recall','listen','context']);assert.equal(t.root.session.items.at(-1).question.answer,'take initiative');}finally{t.dom.window.close();}
});
test('legacy blank-meaning entry remains readable and save-only does not reset unrelated data',async()=>{
 const root=freshPhrases();root.custom.push({id:'custom-col-legacy',custom:true,english:'legacy phrase',chinese:'',contexts:[],example:{en:'',zh:''}});phraseRecord(root,'col-001').skills.meaning.points=20;const record=JSON.stringify(root.records['col-001']);const t=setup({root});try{t.d.querySelector('[data-phrase=edit]').click();await t.submit('#phrase-save-only');assert.equal(root.custom[0].id,'custom-col-legacy');assert.equal(root.custom[0].chinese,'');assert.equal(JSON.stringify(root.records['col-001']),record);assert.equal(loadPhrases({getItem:()=>t.saved}).blocked,false);}finally{t.dom.window.close();}
});
test('physical Enter submits once, IME composition and held Enter do not save',async()=>{
 const t=setup();try{t.input('english','take initiative');t.input('chinese','主动行动');const f=t.d.querySelector('form'),en=f.elements.english;f.dispatchEvent(new t.dom.window.CompositionEvent('compositionstart',{bubbles:true}));en.dispatchEvent(new t.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true,isComposing:true}));await settle();assert.equal(t.root.custom.length,0);f.dispatchEvent(new t.dom.window.CompositionEvent('compositionend',{bubbles:true}));en.dispatchEvent(new t.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));en.dispatchEvent(new t.dom.window.KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true,cancelable:true}));await settle();assert.equal(t.root.custom.length,1);}finally{t.dom.window.close();}
});

test('phrase home shows one immediately usable entry form above the learning metrics',()=>{
 const t=setup({panel:'home'});try{
  assert.equal(t.d.querySelector('h1').textContent,'固定搭配');
  assert.equal(t.d.querySelectorAll('#phrase-custom-form').length,1);
  const form=t.d.querySelector('#phrase-custom-form'),metrics=t.d.querySelector('.metrics');
  assert.ok(form.compareDocumentPosition(metrics)&t.dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  for(const selector of ['[name=english]','[name=chinese]','#phrase-lookup','#phrase-save-learn','#phrase-save-only'])assert.ok(form.querySelector(selector),selector);
  assert.equal(t.d.activeElement.name,'english');
  assert.equal(t.root.ui.panel,'home');
 }finally{t.dom.window.close();}
});
test('home lookup, manual correction and save-only work without entering management',async()=>{
 const t=setup({panel:'home',lookup:async input=>({found:input==='meticulous',chinese:'细致的',source:'测试词典'})});try{
  t.input('english','meticulous');t.d.querySelector('#phrase-lookup').click();await settle();
  assert.equal(t.d.querySelector('[name=chinese]').value,'细致的');
  t.input('chinese','一丝不苟的（已核对）');await t.submit('#phrase-save-only');
  assert.equal(t.root.ui.panel,'home');assert.equal(t.root.session,null);
  assert.equal(t.d.activeElement.name,'english');
  assert.equal(t.root.custom[0].chinese,'一丝不苟的（已核对）');
  const row=t.d.querySelector(`[data-phrase=one][data-id="${t.root.custom[0].id}"]`).closest('article');
  assert.match(row.textContent,/meticulous/);assert.match(row.textContent,/一丝不苟/);
  const reloaded=loadPhrases({getItem:()=>t.saved});assert.equal(reloaded.blocked,false);
  const next=setup({panel:'home',root:reloaded.root});try{
   assert.equal(next.root.custom[0].id,t.root.custom[0].id);
   assert.ok(next.d.querySelector(`[data-phrase=one][data-id="${t.root.custom[0].id}"]`));
   assert.equal(next.d.querySelectorAll('#phrase-custom-form').length,1);
  }finally{next.dom.window.close();}
 }finally{t.dom.window.close();}
});
test('home manual entry and Enter start the existing lesson directly, without manager navigation',async()=>{
 const t=setup({panel:'home'});try{
  t.input('english','take initiative');t.input('chinese','主动采取行动');
  const input=t.d.querySelector('[name=chinese]');
  input.dispatchEvent(new t.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await settle();
  assert.equal(t.root.custom.length,1);assert.equal(t.root.ui.panel,'practice');
  assert.deepEqual(t.root.session.items.map(i=>i.stage),['study','meaning','recall','listen']);
  assert.equal(loadPhrases({getItem:()=>t.saved}).root.session.items[0].phraseId,t.root.custom[0].id);
 }finally{t.dom.window.close();}
});
test('home empty validation and failed storage retain the visible draft and cannot start a lesson',async()=>{
 const t=setup({panel:'home',saveResult:false});try{
  await t.submit();assert.equal(t.root.custom.length,0);assert.equal(t.d.activeElement.name,'english');
  t.input('english','keep this draft');t.input('chinese','保留草稿');const before=JSON.stringify(t.root);
  await t.submit();assert.equal(JSON.stringify(t.root),before);assert.equal(t.root.session,null);
  assert.equal(t.d.querySelector('[name=english]').value,'keep this draft');assert.match(t.d.querySelector('#phrase-custom-error').textContent,/未能保存/);
 }finally{t.dom.window.close();}
});
test('home duplicate prevention and the original management editor share the same stored entry',async()=>{
 const root=freshPhrases();root.custom.push({id:'custom-col-existing',custom:true,english:'take initiative',chinese:'主动行动',contexts:[],example:{en:'',zh:''},acceptedAnswers:['take initiative','show initiative']});
 const t=setup({panel:'home',root});try{
  t.input('english','TAKE  initiative!');t.input('chinese','重复');await t.submit();
  assert.equal(root.custom.length,1);assert.match(t.d.querySelector('#phrase-custom-error').textContent,/已存在/);
  t.d.querySelector('[data-phrase=custom]').click();assert.equal(root.ui.panel,'custom');
  assert.equal(t.d.querySelectorAll('#phrase-custom-form').length,1);
  t.d.querySelector('[data-phrase=edit][data-id="custom-col-existing"]').click();
  assert.equal(t.d.querySelector('[name=english]').value,'take initiative');await t.submit('#phrase-save-only');
  assert.equal(root.custom.length,1);assert.equal(root.custom[0].id,'custom-col-existing');
  assert.deepEqual(root.custom[0].acceptedAnswers,['take initiative','show initiative']);
  assert.equal(root.ui.panel,'home');assert.equal(t.d.querySelectorAll('#phrase-custom-form').length,1);
 }finally{t.dom.window.close();}
});
test('home filters continue to update current state after a failed save replaces the rollback snapshot',async()=>{
 const root=freshPhrases();root.ui.page=1;
 const bankEntries=Array.from({length:17},(_,i)=>({...fixture,id:`col-${i+1}`,english:`fixture phrase ${i+1}`,unitIds:[i===16?'unit2':'unit1']}));
 const t=setup({panel:'home',saveResult:false,root,bankEntries});try{
  const originalUI=root.ui;
  t.input('english','keep this draft');t.input('chinese','保留草稿');await t.submit('#phrase-save-only');
  assert.notEqual(root.ui,originalUI);assert.equal(root.ui.page,1);
  assert.equal(root.custom.length,0);assert.match(t.d.querySelector('#phrase-custom-error').textContent,/未能保存/);
  const filter=t.d.querySelector('#phrase-filter'),focusCalls=t.focusCalls;filter.focus();filter.value='unit2';
  filter.dispatchEvent(new t.dom.window.Event('change',{bubbles:true}));
  assert.equal(root.ui.filter,'unit2');assert.equal(root.ui.page,0);
  assert.equal(t.d.querySelector('#phrase-filter').value,'unit2');
  assert.equal(t.d.querySelectorAll('[data-phrase=one]').length,1);
  assert.equal(t.d.querySelector('[data-phrase=one]').dataset.id,'col-17');
  assert.equal(t.focusCalls,focusCalls);assert.notEqual(t.d.activeElement.name,'english');
  t.ui.render(t.element);assert.equal(t.d.querySelector('#phrase-filter').value,'unit2');
  assert.equal(t.d.querySelector('[data-phrase=one]').dataset.id,'col-17');
 }finally{t.dom.window.close();}
});
test('home pagination and category changes do not send focus back to the entry form',()=>{
 const root=freshPhrases();root.ui.tab='custom';
 root.custom=Array.from({length:16},(_,i)=>({id:`custom-col-page-${i+1}`,custom:true,english:`custom phrase ${i+1}`,chinese:`自定义 ${i+1}`,contexts:[]}));
 const t=setup({panel:'home',root});try{
  assert.equal(t.d.activeElement.name,'english');const initialFocusCalls=t.focusCalls;
  const clickFocused=selector=>{const button=t.d.querySelector(selector);assert.equal(button.disabled,false);button.focus();button.click();assert.equal(t.focusCalls,initialFocusCalls);assert.notEqual(t.d.activeElement.name,'english');};
  clickFocused('[data-pagination=phrase-home][data-page="1"]');assert.equal(root.ui.page,1);
  assert.equal(t.d.querySelectorAll('[data-phrase=one]').length,6);assert.equal(t.d.querySelector('[data-phrase=one]').dataset.id,'custom-col-page-7');
  clickFocused('[data-pagination=phrase-home][data-page="0"]');assert.equal(root.ui.page,0);assert.equal(t.d.querySelectorAll('[data-phrase=one]').length,6);
  clickFocused('[data-phrase=tab][data-tab=theme]');assert.equal(root.ui.tab,'theme');
  clickFocused('[data-phrase=tab][data-tab=custom]');assert.equal(root.ui.tab,'custom');assert.equal(t.d.querySelectorAll('[data-phrase=one]').length,6);
 }finally{t.dom.window.close();}
});
