import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as A from '../src/adaptive.js';
const bank={questions:A.MODULES.flatMap(module=>[0,1,2].map((n)=>({id:module+n,module,conceptId:'concept',prompt:['Choose a fruit','Find the library','Describe the weather'][n],options:['yes','no'],answer:'yes',wordId:'word'})))};
for(const module of A.MODULES)test(`${module}: exact replay survives reload, preserves history and never adds new questions`,()=>{
 let root=A.freshPractice();A.nextRound(root,bank,module);
 while(A.currentQuestion(root,bank,module)){A.submitAnswer(root,bank,module,'yes',1);A.advancePractice(root,bank,module);}
 const p=A.moduleProgress(root,module),queue=[...p.session.queue],history=structuredClone(p.history),novelty=structuredClone(root.novelty);
 p.needs.concept={streak:1,errors:1};
 const replay=A.replayPractice(root,bank,module);assert.ok(replay.replay);assert.deepEqual(replay.queue,queue);
 assert.equal(A.replayPractice(root,bank,module),null);assert.deepEqual(p.history,history);
 root=JSON.parse(JSON.stringify(root));A.pruneMasteredQuestions(root,{...bank,excludedWordIds:['word']},module);
 assert.deepEqual(A.moduleProgress(root,module).session.queue,queue);
 const result=A.submitAnswer(root,bank,module,'yes',2);assert.equal(result.independent,false);
 assert.equal(A.submitAnswer(root,bank,module,'yes',2),null);
 A.advancePractice(root,bank,module);assert.equal(A.moduleProgress(root,module).session.complete,true);
 assert.equal(A.moduleProgress(root,module).needs.concept.streak,1);
 assert.deepEqual(root.novelty,novelty);assert.deepEqual(A.moduleProgress(root,module).history.slice(0,history.length),history);
 A.replayPractice(root,bank,module);A.submitAnswer(root,bank,module,'no',3);A.advancePractice(root,bank,module);
 assert.deepEqual(A.moduleProgress(root,module).session.queue,queue);assert.equal(A.moduleProgress(root,module).session.complete,true);
 A.nextRound(root,bank,module);assert.notEqual(A.currentQuestion(root,bank,module).id,queue[0]);
});
test('replay is only available for a nonempty completed group',()=>{
 const root=A.freshPractice();assert.equal(A.replayPractice(root,bank,'context'),null);
 A.nextRound(root,bank,'context');assert.equal(A.replayPractice(root,bank,'context'),null);
});
test('adaptive completion exposes explicit replay and cloze audio waits for replay answers',()=>{
 const source=fs.readFileSync(new URL('../src/adaptive-ui.js',import.meta.url),'utf8');
 assert.match(source,/btn\('再学一遍','replay',true\)/);
 assert.match(source,/action==='replay'\)replayPractice/);
 assert.match(source,/s\.replay\?s\.attempts\.some/);
});
test('reading replay retains all four questions of the same completed passage',()=>{
 const readingBank=JSON.parse(fs.readFileSync(new URL('../src/adaptive-context-bank.json',import.meta.url),'utf8'));
 let root=A.freshPractice();A.nextRound(root,readingBank,'reading');
 const queue=[...A.moduleProgress(root,'reading').session.queue];assert.equal(queue.length,4);
 while(A.currentQuestion(root,readingBank,'reading')){const q=A.currentQuestion(root,readingBank,'reading');A.submitAnswer(root,readingBank,'reading',q.answer);A.advancePractice(root,readingBank,'reading');}
 A.replayPractice(root,readingBank,'reading');
 for(const id of queue){root=JSON.parse(JSON.stringify(root));assert.equal(A.currentQuestion(root,readingBank,'reading').id,id);A.submitAnswer(root,readingBank,'reading',A.currentQuestion(root,readingBank,'reading').answer);A.advancePractice(root,readingBank,'reading');}
 assert.deepEqual(A.moduleProgress(root,'reading').session.queue,queue);assert.equal(A.moduleProgress(root,'reading').session.complete,true);
});
