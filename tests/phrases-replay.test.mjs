import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as P from '../src/phrases.js';
const entry={id:'col-999',english:'look after',chinese:'照顾',meaningOptions:['照顾','离开'],contexts:[{prompt:'They ____ the dog.',fullSentence:'They look after the dog.',answer:'look after'},{prompt:'We ____ the cat.',fullSentence:'We look after the cat.',answer:'look after'}]};
function finish(root){let guard=0;while(!root.session.done&&guard++<30){const item=P.currentPhraseItem(root);if(item.stage!=='study')P.submitPhrase(root,entry,item.question.answer,1);P.advancePhrase(root,[entry],1);}assert.ok(root.session.done);}
test('phrase replay retains exact question/option order, records and due schedules across reload',()=>{
 let root=P.freshPhrases();P.startPhraseSession(root,[entry],{at:1});finish(root);
 const items=JSON.parse(JSON.stringify(root.session.items)),history=structuredClone(root.history),records=structuredClone(root.records),seen=[...root.contextSeen];
 const firstId=root.session.id;P.replayPhraseSession(root,{at:2});assert.notEqual(root.session.id,firstId);
 assert.equal(P.replayPhraseSession(root,{at:2}),null);assert.deepEqual(root.session.items,items);assert.deepEqual(root.history,history);
 root=P.loadPhrases({getItem:()=>JSON.stringify(root)}).root;assert.ok(root.session.replay);finish(root);
 assert.deepEqual(root.records,records);assert.deepEqual(root.contextSeen,seen);assert.deepEqual(root.history.slice(0,history.length),history);
 assert.ok(root.history.slice(history.length).every(r=>r.replay&&r.assisted&&r.delta===0));
 P.replayPhraseSession(root,{at:3});assert.deepEqual(root.session.items,items);
});
test('replay correction does not reserve a new transfer or alter scores and due dates',()=>{
 const root=P.freshPhrases();P.startPhraseSession(root,[entry],{at:1});finish(root);P.replayPhraseSession(root,{at:2});
 const records=structuredClone(root.records),seen=[...root.contextSeen],count=root.session.items.length;
 P.advancePhrase(root,[entry],2);P.submitPhrase(root,entry,'wrong',2);
 for(let step=0;step<3;step++){P.submitPhraseCorrection(root,entry,entry.english,{at:2,audioReady:true});if(step<2)P.nextPhraseCorrection(root);}
 P.advancePhrase(root,[entry],2);assert.equal(root.session.items.length,count);assert.deepEqual(root.contextSeen,seen);assert.deepEqual(root.records,records);
});
test('completed due-review replay does not skip questions due to their newly scheduled dates',()=>{
 const root=P.freshPhrases(),r=P.phraseRecord(root,entry.id);r.skills.meaning.dueAt=0;r.skills.spelling.dueAt=0;
 P.startPhraseSession(root,[entry],{review:true,at:1});finish(root);const count=root.session.items.length;
 P.replayPhraseSession(root,{at:2});P.submitPhrase(root,entry,P.currentPhraseItem(root).question.answer,2);P.advancePhrase(root,[entry],2);
 assert.equal(root.session.index,1);assert.equal(root.session.done,count===1);
});
test('phrase completion places replay after existing return actions and classifies replay events correctly',()=>{
 const source=fs.readFileSync(new URL('../src/phrases-ui.js',import.meta.url),'utf8');
 assert.match(source,/button\('查看搭配记忆追踪','tracker'\).*button\('再学一遍','replay'\)/);
 assert.match(source,/first:!result.replay/);
});
test('review replay excludes items skipped after reaching mastery',()=>{
 const root=P.freshPhrases(),record=P.phraseRecord(root,entry.id);record.strengthTotal=90;
 record.skills.meaning.dueAt=0;record.skills.spelling.dueAt=0;
 P.startPhraseSession(root,[entry],{review:true,at:1});assert.equal(root.session.items.length,2);
 P.submitPhrase(root,entry,P.currentPhraseItem(root).question.answer,1);P.advancePhrase(root,[entry],1);
 assert.equal(root.session.done,true);P.replayPhraseSession(root,{at:2});assert.equal(root.session.items.length,1);assert.equal(root.session.items[0].stage,'meaning');
});
