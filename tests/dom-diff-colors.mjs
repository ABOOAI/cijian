import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {renderSentenceDictation} from '../src/sentence-dictation.js';
import {spellingDiffHTML,spellingComparison} from '../src/spelling-diff.js';
const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let checks=0;
for(const [expected,input] of [["I'd like to",'whont'],['friends','frends'],['book','boook'],['cat','cut'],['friend','freind'],['make friends','makefriends'],['make friends','make x friends'],['a long example with many separate words','a long example with many seperate words']]){
 const html=spellingDiffHTML({english:expected},input,esc);const dom=new JSDOM(`<style>${css}</style>${html}`),d=dom.window.document,w=dom.window;const rows=[...d.querySelectorAll('tr')],diff=spellingComparison({english:expected},input);
 assert.equal(rows[0].dataset.diffRow,'expected');assert.equal(rows[1].dataset.diffRow,'entered');assert.equal(rows[0].querySelector('th').textContent,'正确答案（上）');assert.equal(rows[1].querySelector('th').textContent,'你的答案（下）');checks++;
 for(const [i,column] of diff.columns.entries()){
  const top=rows[0].querySelectorAll('td')[i],bottom=rows[1].querySelectorAll('td')[i];
  assert.equal(top.textContent.replace('↔','').replaceAll('\u00a0',' '),column.expected??'∅');assert.equal(bottom.textContent.replace('↔','').replaceAll('\u00a0',' '),column.entered??'∅');
  if(column.kind==='match'){assert.equal(w.getComputedStyle(top).color,'rgb(21, 93, 54)');assert.equal(w.getComputedStyle(bottom).color,'rgb(21, 93, 54)');}
  else{assert.equal(w.getComputedStyle(top).color,'rgb(48, 61, 55)');assert.equal(w.getComputedStyle(bottom).color,'rgb(160, 25, 32)');}
 }
 assert.ok(!d.querySelector('.spelling-diff-table').textContent.includes('SP'));checks++;
 if(input==='whont'){const match=[...rows[1].querySelectorAll('.diff-match')];assert.equal(match.length,1);assert.equal(match[0].textContent,'t');assert.equal(w.getComputedStyle(match[0]).color,'rgb(21, 93, 54)');assert.equal(d.querySelector('.raw-spelling').textContent,'whont');checks++;}
 dom.window.close();
}
assert.equal(spellingDiffHTML({english:'make friends'},'MAKE   friends',esc),'');checks++;
for(const [answer,expectedState,icon,color] of [['wrong','incorrect','本句需要订正','rgb(32, 60, 53)'],['I like tea.','correct','本句正确','rgb(32, 60, 53)']]){const dom=new JSDOM(`<style>${css}</style><main></main>`),d=dom.window.document,root={};const bank={groups:[{id:'g',unitId:'unit1',titleZh:'测试',items:[{id:'s',english:'I like tea.',chinese:'我喜欢茶。'}]}]};renderSentenceDictation({element:d.querySelector('main'),bank,root,esc,save(){},stop(){},play(){}});d.querySelector('textarea').value=answer;d.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));const feedback=d.querySelector('[data-answer-result]');assert.equal(feedback.dataset.answerResult,expectedState);assert.ok(feedback.querySelector('.feedback-title').textContent.includes(icon));assert.equal(feedback.getAttribute('aria-live'),'polite');assert.equal(dom.window.getComputedStyle(feedback).borderLeftWidth,'1px');assert.equal(dom.window.getComputedStyle(feedback).backgroundColor,expectedState==='incorrect'?'rgb(255, 244, 239)':'rgb(232, 245, 237)');assert.ok(!feedback.querySelector('.feedback-title').textContent.includes('✓')&&!feedback.querySelector('.feedback-title').textContent.includes('✕'));checks++;dom.window.close();}
console.log(JSON.stringify({passed:checks,scope:'Expected above, actual below; matched green, actual errors red, expected changes neutral; screenshot, insert/delete/transpose/space/long phrase and accepted correct input'}));
