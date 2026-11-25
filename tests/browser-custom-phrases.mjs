import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
const {chromium}=await import(process.env.WORD_GARDEN_PLAYWRIGHT ? pathToFileURL(process.env.WORD_GARDEN_PLAYWRIGHT).href : 'playwright');
const baseURL=process.env.TEST_URL||'http://127.0.0.1:4173';
let server;
if(process.env.QA_START_SERVER==='1'){
  server=spawn(process.execPath,[new URL('../server.mjs',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')],{env:{...process.env,WORD_GARDEN_PORT:new URL(baseURL).port},stdio:'ignore',windowsHide:true});
  for(let attempt=0;attempt<100;attempt++){
    try{if((await fetch(baseURL)).ok)break;}catch{}
    if(attempt===99)throw Error('Local QA server did not become ready');
    await new Promise(resolve=>setTimeout(resolve,100));
  }
}
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const results=[],errors=[];
const check=(value,label)=>{assert.ok(value,label);results.push(label);console.log('PASS '+label);};
const key='word-garden.phrases.v1';
const context=await browser.newContext({viewport:{width:1366,height:900}});
await context.addInitScript(()=>{
  // Deterministic device speech events: tests validate gating, not voice quality.
  window.__qaSpeech=[];
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'en-US',name:'QA English'}],cancel(){},resume(){},speak(u){window.__qaSpeech.push(u);u.onstart?.();setTimeout(()=>u.onend?.(),15);}}});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:function(text){this.text=text;}});
});
const page=await context.newPage();
page.on('pageerror',error=>errors.push(error.message));
page.on('dialog',dialog=>dialog.accept());
const state=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const customForm=()=>page.locator('#phrase-custom-form');
async function home(){await page.locator('[data-phrase=home]').first().click();}
async function editor(){await page.locator('[data-phrase=custom]').click();await customForm().waitFor();}
async function fill(en,zh){await page.locator('[name=english]').fill(en);await page.locator('[name=chinese]').fill(zh);}
try{
  await page.goto(baseURL+'/#phrases');
  await page.locator('[data-phrase=custom]').waitFor();
  check(await page.locator('h1').first().textContent()==='固定搭配','original phrase route loads');
  await customForm().waitFor();
  check(await page.locator('#phrase-custom-form').count()===1,'home exposes a single custom entry form without opening management');
  check(await page.locator('#phrase-custom-form').evaluate(el=>!!(el.compareDocumentPosition(document.querySelector('.metrics'))&Node.DOCUMENT_POSITION_FOLLOWING)),'home entry form precedes learning metrics');
  check(await page.locator('[name=english]').evaluate(el=>el===document.activeElement),'home English receives autofocus');
  await mkdir(new URL('../evidence/',import.meta.url),{recursive:true});
  await page.screenshot({path:new URL('../evidence/custom-phrase-home.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'desktop editor has no horizontal overflow');
  await page.locator('#phrase-save-learn').click();
  check((await page.locator('#phrase-custom-error').textContent()).length>0,'empty submit displays validation');
  check(await page.locator('[name=english]').evaluate(el=>el===document.activeElement),'empty submit focuses English');
  await page.locator('[name=english]').fill('meticulous');
  await page.locator('#phrase-lookup').click();
  await page.waitForFunction(()=>document.querySelector('[name=chinese]').value.length>0);
  check((await page.locator('#phrase-match').textContent()).includes('词典'),'existing dictionary resolves advanced word');
  await page.locator('[name=chinese]').fill('细致、一丝不苟的（已核对）');
  await page.locator('#phrase-save-only').click();
  await page.locator('[data-phrase=custom]').waitFor();
  const first=(await state()).custom[0];
  check(first.english==='meticulous'&&first.chinese==='细致、一丝不苟的（已核对）','save-only retains manual meaning correction');
  check((await state()).session===null,'save-only does not create practice session');
  await page.reload();await page.locator('[data-phrase=custom]').waitFor();
  check((await state()).custom[0].id===first.id,'refresh preserves custom entry and stable ID');
  await customForm().waitFor();await fill(' METICULOUS! ','重复测试');await page.locator('#phrase-save-learn').click();
  check((await page.locator('#phrase-custom-error').textContent()).includes('已存在'),'case and punctuation duplicate rejected');
  check((await state()).custom.length===1,'duplicate does not add another record');
  await fill('take initiative','主动采取行动');
  await page.locator('#phrase-custom-form details summary').click();
  await page.locator('[name=exampleEn]').fill('We take initiative when our team needs help.');
  await page.locator('[name=chinese]').press('Enter');
  await page.locator('.phrase-active').waitFor();
  const created=(await state()).custom.find(e=>e.english==='take initiative');
  check(!!created&&JSON.stringify((await state()).session.items.map(i=>i.stage))===JSON.stringify(['study','meaning','recall','listen','context']),'home Enter saves and opens all four available learning skills without management');
  await page.locator('[data-phrase=next]').click();
  let s=await state(),q=s.session.items[s.session.index].question;
  await page.locator(`[data-phrase-choice="${q.options.indexOf(q.answer)}"]`).click();
  await page.locator('[data-phrase=next]').click();
  check(await page.locator('#phrase-input').evaluate(el=>el===document.activeElement),'recall input automatically focused');
  const beforeBlank=(await state()).history.length;
  await page.locator('#phrase-input').press('Enter');
  check((await state()).history.length===beforeBlank,'blank practice answer earns no assessment');
  await page.locator('#phrase-input').fill('wrong phrase');await page.locator('#phrase-input').press('Enter');
  check((await state()).session.correction.step===0,'wrong answer starts three-round correction');
  const beforeCorrection=(await state()).history.length,strength=(await state()).records[created.id].strengthTotal;
  for(let step=0;step<3;step++){
    await page.waitForFunction(()=>!document.querySelector('#phrase-submit')?.disabled);
    await page.locator('#phrase-input').fill(created.english);await page.locator('#phrase-input').press('Enter');
    if(step<2)await page.locator('[data-phrase=correction-next]').click();
  }
  s=await state();check(s.session.correction.done&&s.history.length===beforeCorrection&&s.records[created.id].strengthTotal===strength,'three successful corrections do not inflate score or attempts');
  await page.reload();await page.locator('[data-phrase=correction-complete]').waitFor();
  check((await state()).session.correction.done,'refresh retains completed correction state');
  await page.locator('[data-phrase=correction-complete]').click();
  for(let guard=0;guard<12;guard++){
    s=await state();if(s.session.done)break;q=s.session.items[s.session.index].question;
    if(!s.session.result){await page.waitForFunction(()=>!document.querySelector('#phrase-submit')?.disabled);await page.locator('#phrase-input').fill(q.answer);await page.locator('#phrase-input').press('Enter');}
    await page.locator('[data-phrase=next]').click();
  }
  s=await state();check(s.session.done,'complete custom study/meaning/recall/listening/context session finishes');
  check(Object.keys(s.records[created.id].errors).length>0,'wrong-answer history remains tracked');
  check(s.contextSeen.length===1,'provided context is reserved once without false new scenarios');
  await page.locator('[data-phrase=tracker]').click();
  check((await page.locator('#page').textContent()).includes('错因记录'),'tracker exposes wrong-answer record');
  await page.evaluate(k=>{const r=JSON.parse(localStorage.getItem(k));for(const skill of Object.values(r.records[r.custom.find(e=>e.english==='take initiative').id].skills))skill.dueAt=1;r.session=null;r.ui.panel='tracker';localStorage.setItem(k,JSON.stringify(r));},key);
  await page.reload();await page.locator('[data-phrase=review]').first().waitFor();
  await page.locator('[data-phrase=review]').first().click();
  s=await state();check(s.session.review&&s.session.items.some(i=>i.stage==='listen-choice')&&s.session.items.some(i=>i.stage==='recall'),'due custom record enters existing listening/meaning/spelling review');
  check(!s.session.items.some(i=>i.stage==='context'),'exhausted custom context does not get relabeled as unseen');
  for(let guard=0;guard<12;guard++){
    s=await state();if(s.session.done)break;q=s.session.items[s.session.index].question;
    if(!s.session.result){if(q.kind==='choice'){await page.locator(`[data-phrase-choice="${q.options.indexOf(q.answer)}"]`).click();}else{await page.locator('#phrase-input').fill(q.answer);await page.locator('#phrase-input').press('Enter');}}
    await page.locator('[data-phrase=next]').click();
  }
  check((await state()).session.done,'due review completes normally');
  const isolated=await browser.newContext(),other=await isolated.newPage();await other.goto(baseURL+'/#phrases');await other.locator('[data-phrase=custom]').waitFor();
  check(await other.evaluate(k=>!localStorage.getItem(k)||JSON.parse(localStorage.getItem(k)).custom.length===0,key),'independent browser context cannot see synthetic personal entries');await isolated.close();
  await page.evaluate(k=>{const r=JSON.parse(localStorage.getItem(k));r.custom.push({id:'custom-col-legacy-qa',custom:true,english:'legacy phrase',chinese:'',acceptedAnswers:['legacy phrase','older accepted form'],contexts:[],example:{en:'',zh:''}});r.ui.panel='home';r.ui.tab='custom';localStorage.setItem(k,JSON.stringify(r));localStorage.setItem('word-garden.custom.v1',JSON.stringify({version:1,words:[{id:'custom-qa-word',english:'unrelated',chinese:'无关词'}]}));},key);
  await page.reload();await page.locator('[data-phrase=custom]').waitFor();
  check((await state()).custom.find(e=>e.id==='custom-col-legacy-qa').chinese==='','legacy blank meaning loads without forced migration');
  const unrelated=await page.evaluate(()=>localStorage.getItem('word-garden.custom.v1'));
  await editor();await page.locator('[data-phrase=edit][data-id="custom-col-legacy-qa"]').click();await page.locator('#phrase-save-only').click();
  await page.locator('[data-phrase=custom]').waitFor();
  check((await state()).custom.find(e=>e.id==='custom-col-legacy-qa').acceptedAnswers.includes('older accepted form'),'legacy no-op edit preserves accepted answers');
  check(await page.evaluate(()=>localStorage.getItem('word-garden.custom.v1'))===unrelated,'phrase operations preserve unrelated custom-word storage byte-for-byte');
  await editor();await fill('preserve this draft','保留这个草稿');const beforeFailure=JSON.stringify(await state());
  await page.evaluate(k=>{window.__qaSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===k)throw new DOMException('Synthetic quota failure','QuotaExceededError');return window.__qaSetItem.call(this,name,value);};},key);
  await page.locator('#phrase-save-learn').click();
  check((await page.locator('#phrase-custom-error').textContent()).includes('未能保存'),'quota failure is shown instead of claiming saved');
  check(await page.locator('[name=english]').inputValue()==='preserve this draft'&&JSON.stringify(await state())===beforeFailure,'quota failure preserves draft and persistent records');
  await page.evaluate(()=>Storage.prototype.setItem=window.__qaSetItem);
  check(errors.length===0,'no browser runtime errors');
  await writeFile(new URL('../evidence/custom-phrases-browser.json',import.meta.url),JSON.stringify({passed:results.length,checks:results,errors},null,2));
  console.log(JSON.stringify({passed:results.length,checks:results,errors},null,2));
}catch(error){console.error(JSON.stringify({passed:results.length,errors,body:(await page.locator('#page').textContent()).slice(0,1800)},null,2));throw error;}finally{await context.close();await browser.close();server?.kill();}
