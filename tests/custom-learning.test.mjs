import test from 'node:test';
import assert from 'node:assert/strict';
import {customLearningWords,customLearningSkills,reconcileCustomLearning,isCustomSentenceAnswer} from '../src/custom-learning.js';
import {makeCustom} from '../src/custom-words.js';

const sentence={id:'custom-sentence-a',english:'I like rice.',chinese:'我喜欢米饭。',group:'饮食'};
const fixture=()=>({sentenceDictation:{customSentences:[{...sentence}],items:{[sentence.id]:{independentCorrect:20}}},records:{other:{skills:{meaning:{successes:2}}}},memoryStrength:{},exposure:{},autoCooldown:{},session:{items:[{wordId:sentence.id,skill:'dictation'}]}});

test('adapter retains stable IDs, source storage, long sentences and original custom words',()=>{
 const state=fixture(),original=JSON.stringify(state),word=makeCustom({english:'rice',chinese:'米饭'},'custom-rice');
 state.sentenceDictation.customSentences[0].english='A '.repeat(150).trim()+'.';
 const words=customLearningWords([word],state);
 assert.equal(words[0],word);assert.equal(words[1].id,sentence.id);assert.equal(words[1].customSentence,true);assert.equal(words[1].unitId,'custom');assert.equal(words[1].english.length,300);
 assert.equal(state.sentenceDictation.items[sentence.id].independentCorrect,20);
 assert.equal(customLearningWords([],JSON.parse(original)).length,1);
 assert.deepEqual(customLearningSkills(words[1]),['memory','meaning','listening','dictation','spelling']);
});
test('legacy blank Chinese remains readable but never generates blank meaning or spelling questions',()=>{
 const state=fixture();state.sentenceDictation.customSentences[0].chinese='';
 const word=customLearningWords([],state)[0];assert.deepEqual(customLearningSkills(word),['memory','dictation']);assert.equal(word.english,sentence.english);
});
test('first migration preserves all records and cannot infer mastery from old sentence dictation',()=>{
 const state=fixture(),before=JSON.stringify(state);
 const result=reconcileCustomLearning(state,customLearningWords([],state),1000);
 assert.equal(result.initialized,true);assert.deepEqual(result.changedIds,[]);assert.equal(state.records[sentence.id],undefined);assert.equal(state.memoryStrength[sentence.id],undefined);
 const copy={...state};delete copy.customLearningIndex;assert.deepEqual(copy,JSON.parse(before));
});
test('English change archives only sentence learning data and leaves active session for caller',()=>{
 const state=fixture();reconcileCustomLearning(state,customLearningWords([],state));
 for(const key of ['records','memoryStrength','exposure','autoCooldown'])state[key][sentence.id]={test:key};
 const session=JSON.stringify(state.session),other=JSON.stringify(state.records.other);
 state.sentenceDictation.customSentences[0].english='I like milk.';
 const result=reconcileCustomLearning(state,customLearningWords([],state),2000);
 assert.deepEqual(result.changedIds,[sentence.id]);assert.deepEqual(result.removedIds,[]);
 for(const key of ['records','memoryStrength','exposure','autoCooldown']){assert.equal(state[key][sentence.id],undefined);assert.deepEqual(state.customLearningHistory[0][key],{test:key});}
 assert.equal(state.customLearningHistory[0].english,sentence.english);assert.equal(state.customLearningHistory[0].archivedAt,2000);assert.equal(JSON.stringify(state.records.other),other);assert.equal(JSON.stringify(state.session),session);
 assert.deepEqual(reconcileCustomLearning(state,customLearningWords([],state)).changedIds,[]);assert.equal(state.customLearningHistory.length,1);
});
test('Chinese and group edits preserve progress while removal archives only the removed sentence',()=>{
 const state=fixture();reconcileCustomLearning(state,customLearningWords([],state));state.records[sentence.id]={introduced:true};
 state.sentenceDictation.customSentences[0].chinese='米饭很好吃';state.sentenceDictation.customSentences[0].group='新分组';
 assert.deepEqual(reconcileCustomLearning(state,customLearningWords([],state)).changedIds,[]);assert.deepEqual(state.records[sentence.id],{introduced:true});
 state.sentenceDictation.customSentences=[];const result=reconcileCustomLearning(state,customLearningWords([],state),3000);
 assert.deepEqual(result.removedIds,[sentence.id]);assert.equal(state.customLearningHistory[0].reason,'removed');assert.equal(state.records[sentence.id],undefined);assert.ok(state.records.other);assert.equal(state.sentenceDictation.items[sentence.id].independentCorrect,20);
});
test('new sentence has no fabricated progress; collisions do not duplicate rows',()=>{
 const state=fixture();reconcileCustomLearning(state,customLearningWords([],state));state.sentenceDictation.customSentences.push({...sentence,id:'custom-sentence-b'});
 const result=reconcileCustomLearning(state,customLearningWords([],state));assert.deepEqual(result.addedIds,['custom-sentence-b']);assert.equal(state.records['custom-sentence-b'],undefined);
 assert.equal(customLearningWords([makeCustom(sentence,sentence.id)],state).length,2);
});
test('sentence grading shares existing punctuation, whitespace, case and contraction rules',()=>{
 assert.equal(isCustomSentenceAnswer(sentence,'  i LIKE   rice! '),true);assert.equal(isCustomSentenceAnswer(sentence,'I like milk.'),false);assert.equal(isCustomSentenceAnswer(sentence,''),false);
 assert.equal(isCustomSentenceAnswer({english:"I'm at school."},'I am at school'),true);
 assert.equal(isCustomSentenceAnswer({english:'I like rice.',acceptedAnswers:['Rice is what I like.']},'rice is what i like'),true);
});
