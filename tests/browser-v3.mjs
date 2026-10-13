import { launch, evidence, baseUrl, sleep } from './browser-driver.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import assertNode from 'node:assert/strict';

const checks=[];
const TIME=Date.UTC(2026,9,4,12);
const KEY='word-garden.progress.v1';
const GAME='word-garden.game.v1';
const ASSIST='word-garden.assistance.v1';
const SESSION='word-garden.session.v1';
function check(pass,label,detail) {checks.push({pass:!!pass,label,detail});assertNode.ok(pass,`${label}: ${JSON.stringify(detail)}`);}
async function progress(cdp) {return cdp.evaluate(`JSON.parse(localStorage.getItem('${KEY}')||'{"records":{}}').records`);}
async function reset(cdp,payload=null,game=null) {
  await cdp.evaluate(`localStorage.clear();sessionStorage.clear();${payload?`localStorage.setItem('${KEY}',${JSON.stringify(JSON.stringify(payload))});`:''}${game?`localStorage.setItem('${GAME}',${JSON.stringify(JSON.stringify(game))});`:''}`);
  await cdp.reload();
}
async function visible(cdp,selector) {return cdp.evaluate(`!!document.querySelector(${JSON.stringify(selector)})?.getClientRects().length`);}
async function layout(cdp,width,height=844) {
  await cdp.viewport(width,height);
  const state=await cdp.evaluate(`(() => {window.scrollTo(0,0);return {width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth};})()`);
  check(state.document<=state.width&&state.body<=state.width,`No horizontal overflow at ${width}x${height}`,state);
}
async function actionOnScreen(cdp,selector,label) {
  const state=await cdp.evaluate(`(() => {window.scrollTo(0,0);const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight};})()`);
  check(state.top>=0&&state.bottom<=state.height,label,state);
}
async function revealRate(cdp,rating) {await cdp.click('#reveal-button');await cdp.click(`[data-rating=${rating}]`);}
async function run(cdp) {
  await cdp.call('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__WORD_GARDEN_NOW__=${TIME};window.__testVoices=[];window.__spoken=[];
    window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices(){return window.__testVoices;},speak(u){window.__spoken.push(u);},cancel(){},addEventListener(){}}});
  `});
  await cdp.call('Page.navigate',{url:baseUrl});
  await cdp.waitFor('!!document.querySelector("#unit-select option")');
  await reset(cdp);
  const vocab=await cdp.evaluate(`import('./src/vocabulary.js').then(d=>({words:d.WORDS,units:d.UNITS}))`);
  const [a,b,c,d,e,f]=vocab.words;
  check(vocab.words.length===289&&vocab.units.length===10,'289 original words across all ten units');
  check(new Set(vocab.words.map(w=>w.id)).size===289,'All original word IDs are unique');
  check(vocab.words.every(w=>['method','hint','example','exampleZh'].every(k=>w.memory[k]?.trim())),'All four memory fields exist for every word');
  check(await visible(cdp,'#home-view'),'Fresh open shows today tasks');
  check(!await visible(cdp,'#unit-select'),'All units are below the first task');
  check(await visible(cdp,'#today-new')&&!await visible(cdp,'#today-review'),'New learner has one recommended learning action');
  for(const width of [320,375,414,768]) {
    await layout(cdp,width,width===375?667:844);
    await actionOnScreen(cdp,'#today-new',`Today learning action visible at ${width}px`);
  }
  await cdp.viewport(375,667);await cdp.screenshot('v3-mobile-home-new.png');
  await cdp.click('#today-new');
  check(await visible(cdp,'#quest-next'),'Today enters the first word directly');
  check(await cdp.evaluate('!document.querySelector(".memory-hint").open'),'Study hint starts folded');
  check(await cdp.evaluate('document.querySelector("#difficulty-select").value==="easy"'),'Short lesson starts without mandatory listening');
  await actionOnScreen(cdp,'#quest-next','First study action visible at 375x667');
  await cdp.screenshot('v3-mobile-study.png');
  await cdp.click('#learning-content .memory-hint summary');
  check(await cdp.evaluate('document.querySelector(".memory-hint").open'),'Dedicated memory prompt expands');
  check(Object.keys(await progress(cdp)).length===0,'Reading a hint creates no mastered record');
  await cdp.click('#back-today');check(await visible(cdp,'#resume-session'),'Returning to today offers resume');
  await cdp.reload();await cdp.click('#resume-session');
  check(await cdp.evaluate(`document.querySelector('.word').textContent===${JSON.stringify(a.english)}`),'Refresh and resume preserve the current word');
  check(await cdp.evaluate('!document.querySelector(".memory-hint").open'),'Resumed hint remains folded');
  await cdp.click('[data-mode=spell]');
  check(await cdp.evaluate('!document.querySelector("#learning-content .memory-hint")&&!document.querySelector("#learning-content .english-answer")'),'Spelling DOM exposes no memory prompt or answer before submission');
  await cdp.setValue('#spell-input',a.english);await cdp.click('#check-answer');
  const assistedNew=(await progress(cdp))[a.id];
  check(assistedNew?.reviews===1&&assistedNew.streak===0&&!assistedNew.mistake&&assistedNew.dueAt===TIME+10*60000,'Hint-assisted new spelling schedules ten-minute review without independent mastery');
  check(await cdp.evaluate('document.querySelector(".feedback").innerText.includes("辅助练习")'),'Assisted spelling is explained next to feedback');
  check(await cdp.evaluate(`localStorage.getItem('${GAME}')===null`),'Hint-assisted correctness gives no star');

  const engine=await import('../src/engine.js');
  const due=engine.scheduleReview(null,'good',TIME-engine.DAY);
  const future=engine.scheduleReview(null,'good',TIME);
  const mistake=engine.scheduleReview(null,'again',TIME-10*engine.MINUTE);
  const stable=engine.scheduleReview(engine.scheduleReview(null,'good',TIME-4*engine.DAY),'good',TIME-3*engine.DAY);
  const payload={version:1,records:{[a.id]:due,[b.id]:future,[c.id]:mistake,[d.id]:stable}};
  const game={version:1,stars:7,completedLevels:[`${a.unitId}:0`]};
  await reset(cdp,payload,game);
  check(JSON.stringify(await progress(cdp))===JSON.stringify(payload.records),'Old v1 localStorage records survive unchanged on open');
  check(await cdp.evaluate(`localStorage.getItem('${GAME}')===${JSON.stringify(JSON.stringify(game))}`),'Old stars and completed group IDs survive unchanged');
  check(await visible(cdp,'#today-review')&&await visible(cdp,'#today-new'),'Due learner can review first or switch directly to new words');
  check(await cdp.evaluate('document.querySelector("#today-review").classList.contains("primary")&&!document.querySelector("#today-new").classList.contains("primary")'),'Due review is the single recommended action');
  await cdp.viewport(375,667);await cdp.screenshot('v3-mobile-home-due.png');
  await actionOnScreen(cdp,'#today-review','Due review is visible at 375x667');
  await cdp.click('#today-new');
  check(await cdp.evaluate(`document.querySelector('.word').textContent===${JSON.stringify(e.english)}`),'Recommended new group skips already learned words');
  await cdp.click('#back-today');await cdp.click('#today-review');
  check(await cdp.evaluate('document.querySelector("[data-view=due]").getAttribute("aria-current")==="page"'),'Review practice keeps the review entry selected');
  await cdp.click('#reveal-button');await cdp.click('#learning-content .memory-hint summary');await cdp.reload();
  check(await cdp.evaluate('document.querySelector("#learn-view").hidden===false&&!document.querySelector(".memory-hint").open'),'Refresh restores pending review and folds its prompt');
  await cdp.click('[data-rating=good]');
  check(JSON.stringify(await progress(cdp))===JSON.stringify(payload.records),'Hint-assisted review after refresh preserves original due interval and streak');
  await cdp.click('[data-mode=spell]');await cdp.setValue('#spell-input',a.english);await cdp.click('#check-answer');
  check(JSON.stringify(await progress(cdp))===JSON.stringify(payload.records),'Switching from assisted review to spelling also preserves progress');
  await cdp.click('[data-view=due]');await cdp.click('#start-review');await cdp.click('[data-mode=quest]');await cdp.click('[data-mode=flash]');
  check(await cdp.evaluate(`document.querySelector('#session-context').textContent===${JSON.stringify(vocab.units.find(u=>u.id===a.unitId).label)}&&Number(document.querySelector('#card-counter').textContent.split('/')[1])===5`),'Quest to flash keeps queue and label in the same five-word group');

  await reset(cdp,payload,game);await cdp.click('#today-review');await revealRate(cdp,'good');
  let saved=await progress(cdp);
  check(saved[a.id].reviews===due.reviews+1&&saved[a.id].intervalDays===3,'Independent due recall advances the original schedule');
  check(await cdp.evaluate(`JSON.parse(localStorage.getItem('${GAME}')).stars===8`),'Independent due recall awards one star');
  await cdp.reload();
  check(await visible(cdp,'#next-button')&&!await visible(cdp,'#reveal-button'),'Refresh preserves the submitted result instead of reopening scoring');
  const once=JSON.stringify(await progress(cdp));
  await cdp.evaluate(`document.querySelector('[data-rating=good]')?.click();document.querySelector('#spell-form')?.dispatchEvent(new Event('submit',{cancelable:true}));`);
  check(JSON.stringify(await progress(cdp))===once,'Repeated submission after refresh cannot score the same result again');
  await cdp.click('#next-button');await revealRate(cdp,'again');
  check((await progress(cdp))[c.id].mistake===true,'Wrong review retains the word in mistakes');
  await cdp.click('[data-view=mistakes]');
  check(await cdp.evaluate('!document.querySelector(".answer-list").open'),'Answer list is collapsed before recall');
  await cdp.click('#start-mistakes');await cdp.click('[data-mode=spell]');
  check(await cdp.evaluate('!document.querySelector("#learning-content .memory-hint")'),'Mistake spelling still hides hints before submission');
  await cdp.setValue('#spell-input','incorrect-answer');await cdp.click('#check-answer');
  check(await cdp.evaluate(`document.querySelector('.english-answer').textContent===${JSON.stringify(c.english)}&&document.querySelector('.feedback').innerText.includes(${JSON.stringify(c.chinese)})&&document.querySelector('.memory-hint').open`),'Wrong spelling shows correct English, Chinese and the original word prompt');
  const wrong=JSON.stringify(await progress(cdp));
  await cdp.click('#retry-answer');
  check(await cdp.evaluate('!document.querySelector(".english-answer")&&!document.querySelector(".memory-hint")'),'Retry hides the answer again');
  await cdp.setValue('#spell-input',c.english);await cdp.click('#check-answer');
  check(JSON.stringify(await progress(cdp))===wrong,'Immediate correct retry does not extend an interval or remove the mistake');
  await cdp.screenshot('v3-mobile-error-retry.png');

  await reset(cdp);
  await cdp.click('#today-new');
  for(let i=0;i<5;i++)await cdp.click('#quest-next');
  check(await cdp.evaluate('document.querySelector("#session-label").textContent.includes("辨义")'),'Short lesson moves from study to recall');
  for(let i=0;i<5;i++) {await cdp.evaluate(`document.querySelectorAll('[data-choice]')[Array.from(document.querySelectorAll('[data-choice]')).findIndex(el=>el.dataset.choice===${JSON.stringify(vocab.words[i].chinese)})].click()`);await cdp.click('#quest-next');}
  check(await visible(cdp,'#spell-input'),'Short lesson reaches spelling');
  await cdp.setValue('#spell-input',a.english);await cdp.reload();
  check(await cdp.evaluate(`document.querySelector('#spell-input').value===${JSON.stringify(a.english)}`),'Unsubmitted spelling input survives refresh');
  for(let i=0;i<5;i++){await cdp.setValue('#spell-input',vocab.words[i].english);await cdp.click('#check-answer');await cdp.click('#quest-next');}
  check(await visible(cdp,'.quest-complete'),'Five-word short lesson finishes');
  check(Object.keys(await progress(cdp)).length===5,'Completing a new group records exactly its five words');
  check(await cdp.evaluate(`JSON.parse(localStorage.getItem('${GAME}')).stars===5`),'A successful group awards exactly five stars');
  await cdp.click('[data-go-view=due]');
  check(!await visible(cdp,'#start-review'),'Newly learned future words do not appear due early');

  await reset(cdp);await cdp.click('#today-new');await cdp.click('[data-mode=listen]');
  check(await cdp.evaluate('document.querySelector("#check-answer").disabled'),'Listening is locked until English audio is available');
  await cdp.click('#play-audio');
  check(await visible(cdp,'#speech-notice'),'Missing English voice has visible feedback');
  await cdp.click('#skip-listening');
  check(Object.keys(await progress(cdp)).length===0,'Skipping unavailable audio changes no progress');
  await cdp.click('#next-button');
  await cdp.evaluate(`window.__testVoices=[{name:'Test English',lang:'en-GB'}]`);await cdp.click('#play-audio');
  check(await cdp.evaluate('!document.querySelector("#check-answer").disabled&&window.__spoken.length===1'),'Available English audio unlocks listening input');
  await cdp.setValue('#spell-input',b.english);await cdp.click('#check-answer');
  check((await progress(cdp))[b.id]?.reviews===1,'Listening correct answer uses the same original schedule');
  await cdp.click('#back-today');
  await cdp.evaluate('history.back()');await sleep(100);
  check(await visible(cdp,'#learn-view'),'Browser Back restores the active learning screen');

  const many={version:1,records:Object.fromEntries(vocab.words.slice(0,7).map(w=>[w.id,due]))};
  await reset(cdp,many);await cdp.click('#today-review');
  check(await cdp.evaluate('document.querySelector("#card-counter").textContent==="1 / 5"'),'Review starts with at most five words');
  for(let i=0;i<5;i++){await revealRate(cdp,'good');await cdp.click('#next-button');}
  check(await visible(cdp,'#continue-review'),'Remaining due words get a clear next small round');
  await cdp.click('#continue-review');
  check(await cdp.evaluate('document.querySelector("#card-counter").textContent==="1 / 2"'),'Next round contains only the two remaining due words');
  for(let i=0;i<2;i++){await revealRate(cdp,'good');await cdp.click('#next-button');}
  check(await visible(cdp,'[data-go-view=home]'),'Review completion has an explicit exit to today');

  const all={version:1,records:Object.fromEntries(vocab.words.map(w=>[w.id,future]))};
  await reset(cdp,all);await cdp.click('[data-view=learn]');
  check(await visible(cdp,'#quest-next'),'All-learned user can still open unit practice');
  for(const width of [320,375,414,768]) await layout(cdp,width);
  await cdp.viewport(375,667);await cdp.call('Emulation.setPageScaleFactor',{pageScaleFactor:2});
  check(await cdp.evaluate('document.documentElement.scrollWidth<=innerWidth'),'200% zoom creates no horizontal document overflow');
  await cdp.call('Emulation.setPageScaleFactor',{pageScaleFactor:1});

  await reset(cdp,{version:1,records:{[a.id]:future}});await cdp.click('[data-view=due]');
  check(await cdp.evaluate('document.querySelector("#due-count").textContent==="0"&&!document.querySelector("#start-review")'),'Future and unseen words stay out of the due queue');
  check(await cdp.evaluate('document.querySelector(".next-due").innerText.includes("下一次到期")'),'Empty due view shows the earliest scheduled review');
  await cdp.evaluate(`window.__WORD_GARDEN_NOW__=${future.dueAt};document.dispatchEvent(new Event('visibilitychange'));`);
  check(await cdp.evaluate('document.querySelector("#due-count").textContent==="1"&&!!document.querySelector("#start-review")'),'Returning to foreground updates count and due view at equality boundary');
  await cdp.click('#start-review');
  check(await cdp.evaluate(`document.querySelector('.word').textContent===${JSON.stringify(a.english)}&&document.querySelector('#card-counter').textContent==='1 / 1'`),'Time-advanced queue contains only the learned due word');
  await cdp.reload();
  check(await cdp.evaluate('document.querySelector("#due-count").textContent==="0"'),'Refresh recomputes due count from current time, not a cached count');
  const overdue={version:1,records:{[a.id]:due,[b.id]:engine.scheduleReview(null,'good',TIME-engine.DAY-5*engine.MINUTE)}};
  await reset(cdp,overdue);await cdp.click('#today-review');
  check(await cdp.evaluate(`document.querySelector('.word').textContent===${JSON.stringify(b.english)}`),'More overdue words are practiced first');
  await cdp.evaluate('sessionStorage.clear();localStorage.setItem("word-garden.progress.v1","{broken");');await cdp.reload();
  check(await cdp.evaluate(`localStorage.getItem('${KEY}')==='{broken'&&!document.querySelector('#storage-notice').hidden`),'Damaged original progress is preserved and explained');
  check(!cdp.events.some(event=>event.method==='Runtime.exceptionThrown'),'No uncaught runtime exceptions during browser checks');
}

await mkdir(evidence,{recursive:true});
const browser=await launch();
try {
  await run(browser.cdp);
  await writeFile(path.join(evidence,'browser-v3-results.json'),JSON.stringify({baseUrl,passed:checks.length,checks},null,2));
  console.log(`PASS: ${checks.length} v3 browser checks; screenshots and report in ${evidence}`);
}catch(error){
  await writeFile(path.join(evidence,'browser-v3-results.json'),JSON.stringify({baseUrl,checks,error:error.stack},null,2));
  await browser.cdp.screenshot('v3-failure.png').catch(()=>{});
  throw error;
}finally{
  await browser.cdp.call('Browser.close').catch(()=>{});
  browser.socket.close();
  // Terminate only the dedicated child spawned by this test if still running.
  if(browser.child.exitCode===null)spawnSync('taskkill',['/PID',String(browser.child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore',timeout:3000});
}
