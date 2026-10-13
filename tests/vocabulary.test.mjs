import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isCorrectAnswer } from '../src/engine.js';

const data=JSON.parse(fs.readFileSync(new URL('../src/vocabulary-data.json',import.meta.url),'utf8'));
const supplement=JSON.parse(fs.readFileSync(new URL('../src/supplemental-vocabulary.json',import.meta.url),'utf8'));
const memories=JSON.parse(fs.readFileSync(new URL('../src/memory-hints.json',import.meta.url),'utf8'));
const words=data.units.flatMap(unit=>unit.words.map(word=>({...word,unitId:unit.id})));
const official=/逐页/.test(data.metadata.verification||'');

test('vocabulary has ten nonempty units, unique stable ids and usable Chinese meanings',()=>{
  assert.equal(data.units.length,10);
  assert.equal(new Set(data.units.map(u=>u.id)).size,10);
  assert.equal(new Set(words.map(w=>w.id)).size,words.length);
  for(const unit of data.units) assert.ok(unit.words.length>0);
  for(const word of words){
    assert.ok(typeof word.id==='string'&&word.id.length>0);
    assert.ok(typeof word.word==='string'&&word.word.trim()===word.word&&word.word.length>0);
    assert.ok(typeof word.meaning==='string'&&/[\u3400-\u9fff]/u.test(word.meaning),word.word);
    assert.ok(!/[\uFFFD\u0000]/u.test(word.meaning+word.word),word.word);
  }
});

test('official dataset total, unit counts and source page boundaries match its contract',()=>{
  if(!official) {assert.equal(words.length,277);return;}
  assert.equal(data.metadata.totalWords,289);
  assert.equal(words.length,289);
  const expected=[15,5,9,38,30,43,32,36,42,39];
  assert.deepEqual(data.units.map(u=>u.words.length),expected);
  for(const unit of data.units) assert.equal(unit.words.length,data.metadata.unitCounts[unit.id]);
  for(const word of words.filter(w=>w.sourcePage!==undefined)){
    assert.ok(word.sourcePage>=106&&word.sourcePage<=112,word.word);
    assert.equal(word.sourcePdfPage,word.sourcePage+9);
  }
  assert.ok(data.metadata.sourceFingerprint?.sha256);
  assert.deepEqual(data.metadata.sourceFingerprint.vocabularyPrintedPages,[106,107,108,109,110,111,112]);
  assert.deepEqual(data.metadata.sourceFingerprint.vocabularyPdfPages,[115,116,117,118,119,120,121]);
  assert.ok(data.metadata.scope.includes('小学')||data.metadata.scope.includes('Primary School'));
});

test('textbook alternatives and accepted spellings are all accepted without accepting typos',()=>{
  for(const word of words){
    const answers=[...new Set([word.word,...(word.acceptedAnswers||[]),...(word.aliases||[])])];
    const practice={english:word.word,answers};
    for(const spelling of answers) assert.equal(isCorrectAnswer(practice,spelling),true,`${word.word}: ${spelling}`);
    assert.equal(isCorrectAnswer(practice,`${word.word}zzz`),false,word.word);
  }
  if(official){
    const find=english=>words.find(w=>w.word===english);
    for(const [english,alternative] of [['centre','center'],['gym','gymnasium'],['kilo','kilogramme'],['yogurt','yoghurt']]){
      const word=find(english);assert.ok(word,english);
      assert.equal(isCorrectAnswer({english,answers:[...(word.aliases||[]),...(word.acceptedAnswers||[])]},alternative),true);
    }
  }
});

test('current unit membership comes from parent units rather than stable id prefixes',()=>{
  if(!official) return;
  assert.equal(words.find(w=>w.word==='everyone').unitId,'starter1');
  assert.equal(words.find(w=>w.word==='need').unitId,'unit1');
  assert.equal(words.find(w=>w.word==='violin').unitId,'unit5');
  assert.equal(words.find(w=>w.word==='post').unitId,'unit7');
  assert.ok(words.some(w=>!w.id.startsWith(`${w.unitId}-`)));
  assert.ok(words.some(w=>w.word==='WHO'));
  assert.ok(words.some(w=>w.word==='circle'));
  assert.ok(!words.some(w=>w.word==='CD'));
});

test('all 289 stable word ids have matching, dedicated memory hints and original bilingual examples',()=>{
  assert.equal(memories.schemaVersion,1);
  assert.equal(memories.count,289);
  assert.equal(Object.keys(memories.byId).length,289);
  assert.deepEqual(Object.keys(memories.byId).sort(),words.map(w=>w.id).sort());
  const hints=new Set();
  for(const word of words){
    const entry=memories.byId[word.id];
    assert.equal(entry.word,word.word,word.id);
    assert.deepEqual(Object.keys(entry.memory).sort(),['method','hint','example','exampleZh'].sort());
    for(const [field,value] of Object.entries(entry.memory)){
      assert.ok(typeof value==='string'&&value.length>0&&value.trim()===value,`${word.id}: ${field}`);
      assert.ok(!/[\uFFFD\u0000]/u.test(value),`${word.id}: ${field}`);
    }
    for(const field of ['method','hint','exampleZh']){
      assert.ok(/[\u3400-\u9fff]/u.test(entry.memory[field]),`${word.id}: ${field}`);
    }
    assert.ok(/[A-Za-z]/u.test(entry.memory.example),word.id);
    hints.add(entry.memory.hint);
  }
  assert.equal(hints.size,289,'prompts are per-word rather than repeated unit-level text');
});

let adapterImport=0;
async function loadAdapter(memoryData=memories){
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async request=>{
    const path=new URL(request).pathname;
    if(path.endsWith('/vocabulary-data.json')) return new Response(JSON.stringify(data));
    if(path.endsWith('/supplemental-vocabulary.json')) return new Response(JSON.stringify(supplement));
    if(path.endsWith('/memory-hints.json')) return new Response(JSON.stringify(memoryData));
    throw new Error(`Unexpected fetch: ${path}`);
  };
  try{
    const moduleURL=new URL('../src/vocabulary.js',import.meta.url);
    moduleURL.searchParams.set('test',String(++adapterImport));
    return await import(moduleURL.href);
  }finally{globalThis.fetch=originalFetch;}
}

test('vocabulary adapter preserves word facts, answers and parent units while exposing memory fields',async()=>{
  const adapter=await loadAdapter();
  assert.equal(adapter.WORDS.length,289+supplement.words.length);
  assert.deepEqual(adapter.WORDS.slice(0,289).map(w=>w.id),words.map(w=>w.id));
  for(let i=0;i<words.length;i++){
    const raw=words[i],word=adapter.WORDS[i];
    assert.equal(word.unitId,raw.unitId);
    assert.equal(word.english,raw.word);
    assert.equal(word.chinese,raw.meaning);
    assert.deepEqual(word.answers,[...new Set([raw.word,...(raw.acceptedAnswers||[]),...(raw.aliases||[])])]);
    assert.deepEqual(word.memory,memories.byId[raw.id].memory);
    assert.equal(word.hint,word.memory.hint);
  }
});

test('vocabulary adapter rejects incomplete hints or a mismatched original word',async()=>{
  const incomplete=structuredClone(memories);
  delete incomplete.byId[words[0].id];
  await assert.rejects(loadAdapter(incomplete),/记忆提示与词库版本不匹配/);
  const mismatched=structuredClone(memories);
  mismatched.byId[words[0].id].word='wrong word';
  await assert.rejects(loadAdapter(mismatched),/记忆提示内容未匹配/);
  const empty=structuredClone(memories);
  empty.byId[words[0].id].memory.hint='';
  await assert.rejects(loadAdapter(empty),/记忆提示内容未匹配/);
});
