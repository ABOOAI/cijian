// The JSON is the replaceable source of vocabulary facts and their coverage notes.
// Load from the same local origin; no account or external service is required.
const response = await fetch(new URL('./vocabulary-data.json', import.meta.url));
if (!response.ok) throw new Error(`词库读取失败（${response.status}），请刷新重试。`);
const data = await response.json();
const memoryResponse = await fetch(new URL('./memory-hints.json', import.meta.url));
if (!memoryResponse.ok) throw new Error(`记忆提示读取失败（${memoryResponse.status}），请刷新重试。`);
const memories = await memoryResponse.json();
const vocabularyWords = data.units.flatMap(unit => unit.words);
if (memories.schemaVersion !== 1 || memories.count !== vocabularyWords.length ||
    !memories.byId || Object.keys(memories.byId).length !== vocabularyWords.length) {
  throw new Error('记忆提示与词库版本不匹配，请刷新重试。');
}
for (const word of vocabularyWords) {
  const entry = memories.byId[word.id];
  if (!entry || entry.word !== word.word ||
      !['method', 'hint', 'example', 'exampleZh'].every(field =>
        typeof entry.memory?.[field] === 'string' && entry.memory[field].trim())) {
    throw new Error(`记忆提示内容未匹配（${word.id}），请刷新重试。`);
  }
}
const supplementResponse=await fetch(new URL('./supplemental-vocabulary.json',import.meta.url));
if(!supplementResponse.ok)throw new Error('补充词库读取失败，请刷新重试。');
const supplement=await supplementResponse.json();
if(supplement.schemaVersion!==1||!Array.isArray(supplement.words)||!Array.isArray(supplement.groups))throw new Error('补充词库格式不正确。');
const metadata = data.metadata;
const sources = metadata.sources.map(source => ({
  ...source,
  url: source.url.replace(/&amp;/g, '&'),
}));
const isOfficialList = /逐页/.test(metadata.verification || '');
const status = isOfficialList ? 'official-list' : 'reference';
const vocabularySource = (isOfficialList
  ? sources.find(source => /全部纳入/.test(source.use || '')) || sources.find(source => /smartedu/.test(source.url))
  : sources.find(source => /词目|词表/.test(source.use || ''))) || sources[0];

export const BOOK = {
  ...metadata,
  sources,
  status,
  shortLabel: isOfficialList ? '官方现行七上词表' : '2024新版练习词库',
  coverageLabel: '单元词表 + 小学词汇 + 数词、月份、星期',
  scope:`单元词表${vocabularyWords.length}词项，另含小学词汇、数词、月份和星期${supplement.words.length}词项。小学词独立位于预备单元，原课本单元仅保留来源信息；未纳入其他Reference类别。`,
  pronunciation:'补充词表保留教材英式音标；整词朗读为Kokoro美音合成，二者可能不同。未编造未核对的音节分解。',
  totalWords:vocabularyWords.length+supplement.words.length,
  originalUnitWords:vocabularyWords.length,
  supplementalCount:supplement.words.length,
  verification:metadata.verification+' '+supplement.verification,
  supplementSources:supplement.sources,
  source: vocabularySource.url,
  sourceLabel: isOfficialList ? '官方电子课本' : vocabularySource.title,
  checkedAt: metadata.asOf,
};

const textbookUnits = data.units.map(unit => {
  const [label, title] = unit.title.split(' · ');
  return { id: unit.id, label:label.replace(/^Starter Unit (\d+)$/, '教材起始单元$1').replace(/^Unit (\d+)$/, '第$1单元'), title, status };
});

const textbookWords = data.units.flatMap(unit => unit.words.map(word => ({
  id: word.id,
  unitId: unit.id,
  groupIds:[unit.id,...(supplement.memberships[word.id]||[])],
  caseSensitive:supplement.caseSensitiveIds.includes(word.id),
  english: word.word,
  chinese: word.meaning,
  pos: '',
  memory: memories.byId[word.id].memory,
  hint: memories.byId[word.id].memory.hint,
  status,
  source: vocabularySource.url,
  textbookEntry: word.textbookEntry || '',
  sourcePage: word.sourcePage ?? null,
  answers: [...new Set([word.word, ...(word.acceptedAnswers || []), ...(word.aliases || [])])],
})));

export const UNITS=[...textbookUnits,...supplement.groups.map(g=>({id:g.id,label:g.label,title:g.title,status,kind:'supplement'}))];
export const WORDS=[...textbookWords,...supplement.words.map(w=>({
 id:w.id,unitId:w.groupIds[0],groupIds:w.groupIds,english:w.english,chinese:w.chinese,pos:'',
 status,caseSensitive:!!w.caseSensitive,source:vocabularySource.url,sourcePage:w.sourcePage,sourcePdfPage:w.sourcePdfPage,
 textbookEntry:w.textbookEntry||w.english,textbookAlternatives:w.textbookAlternatives||[],textbookInflections:w.textbookInflections||[],textbookIpa:w.textbookIpa,sourceSection:w.section,originalUnit:w.originalUnit,
 answers:[...new Set([w.english,...(w.aliases||[])])],
 memory:w.memory||{method:'基础释义回忆',hint:`遮住英文，根据“${w.chinese}”回忆 ${w.english}，写完再核对。逐词联想与例句尚未编写。`,example:'',exampleZh:''},
 hint:w.memory?.hint||`根据“${w.chinese}”回忆英文，写完再核对。`
}))];
if(new Set(WORDS.map(w=>w.id)).size!==WORDS.length)throw new Error('词库出现重复编号，原学习进度未修改。');
