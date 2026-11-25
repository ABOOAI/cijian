import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as P from '../src/phrases.js';
const bank=JSON.parse(fs.readFileSync(new URL('../src/phrases-bank.json',import.meta.url))),entry=bank.entries[0],now=Date.now();
test('complete vertical phrase lesson targets independent skills, errors require three successful corrections then new context',()=>{const root=P.freshPhrases();P.startPhraseSession(root,bank.entries,{ids:[entry.id],at:now});assert.equal(root.session.items[0].stage,'study');P.advancePhrase(root,bank.entries,now);assert.equal(root.records[entry.id].introduced,true);let q=P.currentPhraseItem(root).question;P.submitPhrase(root,entry,q.answer,now);assert.equal(P.phraseStrength(root,entry.id),10);P.advancePhrase(root,bank.entries,now);P.submitPhrase(root,entry,'wrong',now);const history=root.history.length,points=P.phraseStrength(root,entry.id),originalContext=root.session.items.find(i=>i.stage==='context').question.fullSentence;P.submitPhraseCorrection(root,entry,'wrong',{at:now});assert.equal(root.session.correction.successes,0);P.nextPhraseCorrection(root);for(let step=0;step<3;step++){if(step)assert.equal(P.submitPhraseCorrection(root,entry,entry.english,{at:now,audioReady:false}),null);P.submitPhraseCorrection(root,entry,entry.english,{at:now,audioReady:true});assert.equal(root.session.correction.successes,step+1);if(step<2)P.nextPhraseCorrection(root);}assert.equal(root.history.length,history);assert.equal(P.phraseStrength(root,entry.id),points);P.advancePhrase(root,bank.entries,now);q=P.currentPhraseItem(root).question;assert.equal(q.stage,'context');assert.notEqual(q.fullSentence,originalContext);P.submitPhrase(root,entry,q.answer,now);assert.equal(root.needsTransfer[entry.id],undefined);while(!root.session.done){if(!root.session.result){q=P.currentPhraseItem(root).question;P.submitPhrase(root,entry,q.answer,now);}P.advancePhrase(root,bank.entries,now);}assert.equal(P.phraseDue(root,bank.entries,now).length,0);});
test('same-day independent credit, hints, caps,100 exclusion and manual error never lowers strength',()=>{const root=P.freshPhrases();for(const skill of P.PHRASE_SKILLS)for(let n=0;n<5;n++)P.assessPhrase(root,entry,{skill,stage:skill,answer:'yes'},'yes',{at:now,eventId:skill+n});assert.equal(P.phraseStrength(root,entry.id),100);for(const rec of Object.values(root.records[entry.id].skills))rec.dueAt=1;assert.equal(P.phraseDue(root,[entry],now).length,0);P.assessPhrase(root,entry,{skill:'spelling',answer:'yes'},'wrong',{at:now,eventId:'manual-wrong'});assert.equal(P.phraseStrength(root,entry.id),100);assert.equal(P.phraseDue(root,[entry],now+2*P.DAY).length,0);const before=P.phraseStrength(root,entry.id);P.assessPhrase(root,entry,{skill:'spelling',answer:'yes'},'yes',{at:now,eventId:'hinted',assisted:true});assert.equal(P.phraseStrength(root,entry.id),before);assert.equal(root.records[entry.id].skills.spelling.dueAt,now+P.DAY);});
test('finite contexts stay unseen; context exhaustion does not stop other due skills',()=>{const root=P.freshPhrases();P.phraseRecord(root,entry.id).introduced=true;for(const r of Object.values(root.records[entry.id].skills))r.dueAt=1;let count=0;while(P.reservePhraseContext(root,entry))count++;assert.equal(count,entry.contexts.length);assert.equal(P.reservePhraseContext(root,entry),null);P.startPhraseSession(root,[entry],{review:true,at:now});assert.ok(root.session.items.some(i=>i.stage==='recall'));assert.ok(!root.session.items.some(i=>i.stage==='context'));assert.equal(root.records[entry.id].skills.context.dueAt,1);});
test('grading obeys explicit variants and custom data validation',()=>{assert.equal(P.phraseAnswerCorrect({answer:'is good at',acceptedAnswers:['was good at']},' Was  good at! '),true);assert.equal(P.phraseAnswerCorrect({answer:'is good at'},'excels at'),false);assert.ok(P.validateCustomPhrase({english:'<img>look after'}).error);assert.ok(P.validateCustomPhrase({english:'look after',structurePrompt:'A ____ B'}).error);assert.ok(P.validateCustomPhrase({english:'look after',chinese:'照顾'}).value);const storage={getItem:()=>'{invalid'};assert.equal(P.loadPhrases(storage).blocked,true);assert.equal(P.loadPhrases({getItem:()=>null}).root.version,1);});
test('initial phrase root serialization is separate and reload retains correction stage',()=>{const root=P.freshPhrases();P.startPhraseSession(root,bank.entries,{ids:[entry.id],at:now});P.advancePhrase(root,bank.entries,now);P.submitPhrase(root,entry,'wrong',now);P.submitPhraseCorrection(root,entry,entry.english,{at:now});P.nextPhraseCorrection(root);const text=JSON.stringify(root);assert.equal(P.loadPhrases({getItem:()=>text}).root.session.correction.step,1);assert.notEqual(P.PHRASE_KEY,'word-garden.workspace.v2');});
test('all360 context bodies unique and enough independent contexts can reach100',()=>{const contexts=bank.entries.flatMap(e=>e.contexts);assert.equal(bank.entries.length,60);assert.equal(contexts.length,360);assert.equal(new Set(contexts.map(P.contextKey)).size,360);for(const e of bank.entries)assert.equal(e.contexts.length,6);const root=P.freshPhrases();for(const skill of ['meaning','listening','spelling'])for(let i=0;i<5;i++)P.assessPhrase(root,entry,{skill,stage:skill,answer:'ok'},'ok',{at:now,eventId:skill+i});for(let i=0;i<5;i++){const q=P.reservePhraseContext(root,entry);P.assessPhrase(root,entry,{...q,skill:'context',stage:'context'},q.answer,{at:now,eventId:q.id});}assert.equal(P.phraseStrength(root,entry.id),100);assert.equal(P.availableContexts(root,entry).length,1);});
test('review scheduling follows1/3/7/14/30 days and hints cannot repeat immediately',()=>{const root=P.freshPhrases();for(let i=0;i<5;i++){P.assessPhrase(root,entry,{skill:'meaning',stage:'meaning',answer:'yes'},'yes',{at:now,eventId:'interval'+i});assert.equal(root.records[entry.id].skills.meaning.dueAt,now+P.PHRASE_DAYS[i]*P.DAY);}P.assessPhrase(root,entry,{skill:'meaning',answer:'yes'},'wrong',{at:now,eventId:'wrong'});assert.equal(root.records[entry.id].skills.meaning.dueAt,now+P.DAY);root.records[entry.id].skills.meaning.dueAt=1;P.assessPhrase(root,entry,{skill:'meaning',answer:'yes'},'yes',{at:now,eventId:'hint',assisted:true});assert.equal(root.records[entry.id].skills.meaning.dueAt,now+P.DAY);});
test('review is skill isolated, listening has varied-choice audio task, and incomplete custom remains usable',()=>{const root=P.freshPhrases(),r=P.phraseRecord(root,entry.id);r.skills.listening.dueAt=1;r.skills.spelling.dueAt=now+P.DAY;P.startPhraseSession(root,[entry],{review:true,skill:'listening',at:now});assert.equal(root.session.items.length,1);assert.equal(root.session.items[0].stage,'listen-choice');const positions=new Set();for(const e of bank.entries.slice(0,8)){const st=P.freshPhrases();P.startPhraseSession(st,[e],{ids:[e.id],at:now});const q=st.session.items.find(i=>i.stage==='meaning').question;positions.add(q.options.indexOf(q.answer));}assert.ok(positions.size>1);const c={id:'custom-col-test',english:'look after',chinese:'',custom:true,contexts:[],acceptedAnswers:['look after']},fresh=P.freshPhrases();P.startPhraseSession(fresh,[c],{ids:[c.id],at:now});assert.deepEqual(fresh.session.items.map(i=>i.stage),['study','listen']);});
import {createHash} from 'node:crypto';
test('final built-in phrase and example recordings match all120 canonical texts and file hashes',()=>{const audio=JSON.parse(fs.readFileSync(new URL('../src/phrases-audio.json',import.meta.url)));assert.equal(audio.entries.length,120);for(const e of bank.entries)for(const [kind,text,map]of [['phrase',e.english,audio.phraseFiles],['example',e.example.en,audio.exampleFiles]]){const entryAudio=audio.entries.find(a=>a.id===e.id&&a.kind===kind);assert.equal(entryAudio.text,text);assert.equal(entryAudio.file,map[e.id]);const bytes=fs.readFileSync(new URL('../'+entryAudio.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),entryAudio.sha256);assert.equal(entryAudio.decodeValid,true);assert.ok(entryAudio.durationSeconds>0);}assert.equal(audio.entries.filter(a=>a.voice==='af_heart').length,60);assert.equal(audio.entries.filter(a=>a.voice==='am_michael').length,60);});

test('legacy phrase total preserves value and repeated same skill grows past25',()=>{const r=P.freshPhrases(),record=P.phraseRecord(r,entry.id);record.skills.meaning.points=25;record.skills.spelling.points=20;assert.equal(P.phraseStrength(r,entry.id),45);for(let i=0;i<6;i++){const a=P.assessPhrase(r,entry,{skill:'meaning',answer:'yes'},'yes',{at:now,eventId:'new'+i});assert.equal(a.after,Math.min(100,55+i*10));}const restored=P.loadPhrases({getItem:()=>JSON.stringify(r)});assert.equal(restored.blocked,false);assert.equal(P.phraseStrength(restored.root,entry.id),100);assert.equal(P.assessPhrase(r,entry,{skill:'meaning',answer:'yes'},'yes',{eventId:'new0'}),null);});

test('new custom expressions require a meaning, normalize duplicates, and retain legacy edit compatibility',()=>{
 assert.equal(P.validateCustomPhrase({english:' \t '}).field,'english');
 assert.equal(P.validateCustomPhrase({english:'resilient',chinese:'  '}).field,'chinese');
 const original={id:'custom-col-old',english:"take one's time",chinese:''};
 assert.equal(P.validateCustomPhrase({english:' ＴＡＫＥ  ＯＮＥ’S ＴＩＭＥ! ',chinese:'慢慢来'},[original]).field,'english');
 assert.equal(P.validateCustomPhrase({english:original.english,chinese:''},[original],original.id).value.chinese,'');
 assert.equal(P.validateCustomPhrase({english:original.english,chinese:''},[original],original.id,{requireMeaning:true}).field,'chinese');
 const accepted=P.validateCustomPhrase({english:' Ｒｅｓｉｌｉｅｎｔ ',chinese:' 有韧性的 '});
 assert.equal(accepted.value.english,'Resilient');
 assert.equal(accepted.value.chinese,'有韧性的');
 assert.equal(P.validateCustomPhrase({english:'resilient',chinese:'有\u000b韧性'}).field,'chinese');
});

test('custom contexts require whole expressions in the actual saved example',()=>{
 const custom={id:'custom-col-boundary',english:'art',example:{en:'The artist arrived.',zh:'画家到了。'}};
 assert.deepEqual(P.customPhraseContexts(custom),[]);
 assert.deepEqual(P.customPhraseContexts({...custom,example:{en:'art-based learning'}}),[]);
 assert.deepEqual(P.customPhraseContexts({...custom,example:{en:"art's history"}}),[]);
 const q=P.customPhraseContexts({...custom,example:{en:'Art and art help us learn.',zh:'艺术帮助我们学习。'}})[0];
 assert.equal(q.prompt,'按你保存的原句补全：____ and ____ help us learn.');
 assert.equal(q.fullSentence,'Art and art help us learn.');
 assert.equal(q.answer,'art');
 const apostrophe=P.customPhraseContexts({...custom,english:"take one's time",example:{en:'We can TAKE ONE’S TIME.',zh:''}})[0];
 assert.equal(apostrophe.prompt,'按你保存的原句补全：We can ____.');
 assert.equal(P.customPhraseContexts({...custom,english:'look after',example:{en:'They look after the dog.'}}).length,1);
 assert.equal(P.customPhraseContexts({...custom,english:'look after',example:{en:'They look into the matter.'}}).length,0);
});

test('custom advanced vocabulary enters all supplied skills and survives reload, mistakes, corrections and due review',()=>{
 const value=P.validateCustomPhrase({english:'resilient',chinese:'有韧性的',exampleEn:'The resilient tree survived the storm.',exampleZh:'这棵顽强的树熬过了风暴。'}).value;
 const custom={...value,id:'custom-col-resilient',custom:true,meaningOptions:['有韧性的','照顾','擅长']};
 custom.contexts=P.customPhraseContexts(custom);
 const initial=P.freshPhrases();initial.custom.push(custom);
 P.startPhraseSession(initial,[custom],{ids:[custom.id],at:now});
 assert.deepEqual(initial.session.items.map(i=>i.stage),['study','meaning','recall','listen','context']);
 P.advancePhrase(initial,[custom],now);
 P.submitPhrase(initial,custom,'有韧性的',now);
 P.advancePhrase(initial,[custom],now);
 assert.equal(P.currentPhraseItem(initial).stage,'recall');
 P.submitPhrase(initial,custom,'resiliant',now);
 assert.equal(initial.records[custom.id].errors['拼写'],1);
 const stored=JSON.stringify(initial),restored=P.loadPhrases({getItem:key=>key===P.PHRASE_KEY?stored:null});
 assert.equal(restored.blocked,false);
 const root=restored.root;
 assert.equal(root.custom[0].english,'resilient');
 assert.equal(root.session.correction.initialInput,'resiliant');
 const strength=P.phraseStrength(root,custom.id),history=root.history.length;
 for(let step=0;step<3;step++){
  P.submitPhraseCorrection(root,custom,'resilient',{at:now,audioReady:true});
  if(step<2)P.nextPhraseCorrection(root);
 }
 assert.equal(root.session.correction.done,true);
 assert.equal(P.phraseStrength(root,custom.id),strength);
 assert.equal(root.history.length,history);
 P.advancePhrase(root,[custom],now);
 assert.deepEqual(root.session.unavailableTransfers,[custom.id]);
 while(!root.session.done){const q=P.currentPhraseItem(root).question;P.submitPhrase(root,custom,q.answer,now);P.advancePhrase(root,[custom],now);}
 assert.equal(root.records[custom.id].errors['拼写'],1);
 assert.ok(P.phraseDue(root,[custom],now+2*P.DAY).some(i=>i.skill==='spelling'));
 P.startPhraseSession(root,[custom],{review:true,at:now+2*P.DAY});
 assert.deepEqual(root.session.items.map(i=>i.stage).sort(),['listen-choice','meaning','recall']);
 assert.equal(P.availableContexts(root,custom).length,0);
 assert.equal(P.loadPhrases({getItem:()=>JSON.stringify(root)}).blocked,false);
});

test('legacy custom entries and unrelated learning stores remain untouched on read',()=>{
 const root=P.freshPhrases();root.custom.push({id:'custom-col-legacy',english:'look up',chinese:'',custom:true,contexts:[],acceptedAnswers:['look up']});
 const oldRecord=P.phraseRecord(root,'col-1');oldRecord.skills.meaning.points=15;
 const serialized=JSON.stringify(root),values=new Map([[P.PHRASE_KEY,serialized],['word-garden.workspace.v2','personal-word-data'],['word-garden.custom.v1','personal-custom-data']]);
 const readKeys=[];
 const loaded=P.loadPhrases({getItem:key=>{readKeys.push(key);return values.get(key);},setItem:()=>assert.fail('loading must never write')});
 assert.equal(loaded.blocked,false);
 assert.equal(loaded.root.custom[0].chinese,'');
 assert.equal(P.phraseStrength(loaded.root,'col-1'),15);
 assert.equal(values.get(P.PHRASE_KEY),serialized);
 assert.deepEqual(readKeys,[P.PHRASE_KEY]);
 const separate=P.loadPhrases({getItem:()=>null}).root;
 assert.equal(separate.custom.length,0);
 assert.notEqual(separate.records,loaded.root.records);
});

test('custom phrase without an example retains the complete core lesson and persisted correction/review path',()=>{
 const custom={...P.validateCustomPhrase({english:'in the long run',chinese:'从长远来看'}).value,id:'custom-col-long-run',custom:true,meaningOptions:['从长远来看','立刻','偶然']};
 custom.contexts=P.customPhraseContexts(custom);
 let root=P.freshPhrases();root.custom.push(custom);
 P.startPhraseSession(root,[custom],{ids:[custom.id],at:now});
 assert.deepEqual(root.session.items.map(i=>i.stage),['study','meaning','recall','listen']);
 P.advancePhrase(root,[custom],now);
 P.submitPhrase(root,custom,'立刻',now);
 P.submitPhraseCorrection(root,custom,custom.english,{at:now});P.nextPhraseCorrection(root);
 root.session.paused=true;
 root=P.loadPhrases({getItem:()=>JSON.stringify(root)}).root;
 assert.equal(root.session.correction.step,1);assert.equal(root.session.paused,true);
 root.session.paused=false;
 for(let step=1;step<3;step++){P.submitPhraseCorrection(root,custom,custom.english,{at:now,audioReady:true});if(step<2)P.nextPhraseCorrection(root);}
 P.advancePhrase(root,[custom],now);
 while(!root.session.done){const q=P.currentPhraseItem(root).question;P.submitPhrase(root,custom,q.answer,now);P.advancePhrase(root,[custom],now);}
 assert.equal(P.phraseStrength(root,custom.id),20);
 assert.equal(root.needsTransfer[custom.id],true);
 assert.equal(root.records[custom.id].skills.context.dueAt,null);
 P.startPhraseSession(root,[custom],{review:true,at:now+2*P.DAY});
 root=P.loadPhrases({getItem:()=>JSON.stringify(root)}).root;
 assert.deepEqual(root.session.items.map(i=>i.stage).sort(),['listen-choice','meaning','recall']);
 assert.equal(root.history.filter(e=>!e.correct).length,1);
 assert.equal(root.custom[0].english,'in the long run');
});
