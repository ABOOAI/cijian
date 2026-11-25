import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {launch,baseUrl,evidence,sleep} from './browser-driver.mjs';
import path from 'node:path';

// Each run launches a new isolated Chrome profile. No existing browser data is opened.
const {cdp:c,child,socket}=await launch();
const checks=[];
const check=(ok,label)=>{assert.ok(ok,label);checks.push(label);};
const countEvents="Object.keys(localStorage).filter(k=>k.startsWith('word-garden.learning-event.v1:')).length";
try{
 await c.viewport(1366,900);
 await c.call('Page.navigate',{url:baseUrl+'/#daily-insights'});
 await c.waitFor('document.querySelector("#daily-insights-title")');
 check(await c.evaluate('document.querySelector("footer").textContent.includes("1.11.6")'),'version 1.11.6 loads');
 check(await c.evaluate('document.querySelector("[data-daily-metric=time] [data-daily-value]").textContent==="未记录"'),'unknown time is not zero');
 check(await c.evaluate(countEvents)===0,'opening report creates no answer events');
 await c.screenshot('daily-insights-empty.png');
 for(const width of [1024,1366,1920]){
  await c.viewport(width,900);
  check(await c.evaluate('document.documentElement.scrollWidth<=innerWidth'),'no page overflow at '+width);
 }
 await c.viewport(1366,900);
 await c.click('[data-view=spelling]');
 await c.setValue('#word-search','make friends');
 await c.click('[data-practice="unit1-001"]');
 check(await c.evaluate('document.activeElement.id==="spell-input"'),'spelling input automatically focused');
 await c.setValue('#spell-input','make friend');await c.key('Enter','Enter');
 await c.waitFor('document.querySelector("#correction-input")');
 await c.setValue('#correction-input','make friends');await c.key('Enter','Enter');
 check(await c.evaluate(countEvents)===2,'one wrong first answer and one correction recorded');
 await c.click('[data-view="daily-insights"]');
 check(await c.evaluate('document.querySelector("[data-daily-metric=accuracy] [data-daily-value]").textContent==="0%"'),'correction does not inflate first-answer accuracy');
 check(await c.evaluate('document.querySelector("[data-daily-mode-row=spelling]").innerText.includes("1 / 1")'),'correct correction shown separately');
 check(await c.evaluate('document.querySelector("[data-daily-item=unit1-001]")!==null'),'actual wrong item has a review navigation button');
 await c.click('#daily-insights-refresh');await c.reload();
 await c.waitFor('document.querySelector("#daily-insights-title")');
 check(await c.evaluate(countEvents)===2,'refresh persists and does not duplicate events');
 await c.evaluate('window.scrollTo(0,0)');await c.screenshot('daily-insights-desktop.png');
 const before=await c.evaluate('localStorage.getItem("word-garden.workspace.v2")');
 await c.click('[data-daily-item="unit1-001"]');
 check(await c.evaluate('localStorage.getItem("word-garden.workspace.v2")')===before,'review navigation preserves saved grades and current session');
 await c.click('[data-view=phrases]');
 check(await c.evaluate('!!document.querySelector("#phrase-custom-form")'),'existing direct phrase input remains visible');
 await c.click('[data-view="daily-insights"]');
 const runtimeErrors=c.events.filter(event=>event.method==='Runtime.exceptionThrown');
 check(runtimeErrors.length===0,'no browser runtime exceptions');
 const result={passed:checks.length,checks,runtimeErrors};
 await writeFile(path.join(evidence,'daily-insights-browser.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
}finally{try{await c.call('Browser.close');}catch{}socket.close();child.kill();}
