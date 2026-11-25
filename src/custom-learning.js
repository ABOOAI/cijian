import {makeCustom} from './custom-words.js';
import {gradeSentence,normalizeSentence} from './sentence-dictation.js';

// A view over the original stores: sentence authoring and legacy dictation
// results remain in sentenceDictation; new practice uses the word scheduler.
export function customLearningWords(customWords=[],state={}){
 const words=[...customWords],ids=new Set(words.map(w=>w.id));
 for(const sentence of state.sentenceDictation?.customSentences||[]){
  if(!sentence||typeof sentence.id!=='string'||!sentence.id.startsWith('custom-sentence-')||typeof sentence.english!=='string'||!sentence.english.trim()||ids.has(sentence.id))continue;
  words.push({...makeCustom({english:sentence.english,chinese:sentence.chinese||'',group:sentence.group||'我的句子',hint:sentence.hint||'先理解整句，再按词序回忆；听写和默写沿用单词的复习规则。'},sentence.id),customSentence:true,acceptedAnswers:sentence.acceptedAnswers||[]});
  ids.add(sentence.id);
 }
 return words;
}

export function customLearningSkills(word){
 return String(word?.chinese||'').trim()?['memory','meaning','listening','dictation','spelling']:['memory','dictation'];
}

export {normalizeSentence as normalizeCustomSentence};
export function isCustomSentenceAnswer(word,input){return gradeSentence(word,input).correct===true;}

// Editing English starts a fresh learning identity under the stable authoring
// ID. Keep an immutable snapshot, never transfer an old answer to new text.
// The caller handles any active session containing a returned changed ID.
export function reconcileCustomLearning(state,words,at=Date.now()){
 const next=Object.fromEntries(words.filter(w=>w.customSentence).map(w=>[w.id,w.english]));
 const prior=state.customLearningIndex;
 const result={changedIds:[],removedIds:[],addedIds:[],initialized:!prior};
 if(!prior||typeof prior!=='object'||Array.isArray(prior)){
  state.customLearningIndex=next;
  return result;
 }
 for(const [id,english] of Object.entries(prior)){
  // This index owns only sentence IDs, even if older/imported metadata contains
  // unrelated keys. Never remove a normal word's learning record here.
  if(!id.startsWith('custom-sentence-')||typeof english!=='string')continue;
  if(Object.hasOwn(next,id)&&next[id]===english)continue;
  const removed=!Object.hasOwn(next,id);
  (removed?result.removedIds:result.changedIds).push(id);
  const snapshot={id,english,archivedAt:at,reason:removed?'removed':'english-changed'};
  for(const key of ['records','memoryStrength','exposure','autoCooldown']){
   if(state[key]&&Object.hasOwn(state[key],id)){
    snapshot[key]=structuredClone(state[key][id]);
    delete state[key][id];
   }
  }
  state.customLearningHistory??=[];
  state.customLearningHistory.push(snapshot);
 }
 result.addedIds=Object.keys(next).filter(id=>!Object.hasOwn(prior,id));
 state.customLearningIndex=next;
 return result;
}
