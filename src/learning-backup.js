import {KNOWN_KEYS,EVENT_PREFIX,isLearningKey,validateStorageRecords} from './backup-validation.js';

export const BACKUP_FORMAT='cijian-learning-backup',BACKUP_VERSION=1,APP_VERSION='1.13.7';
export const MAX_BACKUP_BYTES=24*1024*1024;
export const ACTIVE_KEY='word-garden.backup-active.v1',GEN_PREFIX='word-garden.backup-generation.v1:';
const WORKSPACE='word-garden.workspace.v2',CUSTOM='word-garden.custom.v1',PHRASES='word-garden.phrases.v1',TIMER='vocabulary.effective-practice.v1',NOVELTY='word-garden.practice-novelty.v1',VOICES='word-garden.kokoro-voices.v1';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
export function canonical(value){return JSON.stringify(value,(_,v)=>obj(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);}
function safeTree(value){let nodes=0;const visit=(v,depth)=>{if(++nodes>400000||depth>40)throw Error('备份过大或嵌套过深。');if(typeof v==='number'&&!Number.isFinite(v))throw Error('备份包含无效数字。');if(typeof v==='string'&&v.length>500000)throw Error('备份包含过长文本。');if(obj(v)||Array.isArray(v))for(const [k,x]of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(k))throw Error('备份包含不安全的字段名。');visit(x,depth+1);}};visit(value,0);}
function physicalKeys(raw){return Array.from({length:raw.length},(_,i)=>raw.key(i)).filter(k=>typeof k==='string');}
function readPointer(raw){const value=raw.getItem(ACTIVE_KEY);if(value===null)return null;let x;try{x=JSON.parse(value);}catch{throw Error('本机恢复索引损坏，已保留原数据，请勿清理浏览器。');}if(x?.version!==1||typeof x.generation!=='string'||!/^g-[a-zA-Z0-9-]+$/.test(x.generation))throw Error('本机恢复索引无效，原数据未改动。');return x;}
/** All application stores use this adapter. A restore stages a new generation,
 * then changes ONE localStorage pointer. Failed staging cannot touch live data.
 * Stale tabs refuse writes after that pointer changes. Never clear raw storage. */
export function createLearningStorage(raw){
 if(!raw)throw Error('浏览器无法访问本机存储。');
 let generation=readPointer(raw)?.generation||null,retired=false;
 const current=()=>{if(retired||(readPointer(raw)?.generation||null)!==generation)throw Error('学习数据已在另一页面恢复，请刷新后继续。');};
 const physical=k=>generation?GEN_PREFIX+generation+':'+k:k;
 const keys=()=>{current();const all=physicalKeys(raw);if(!generation&&all.some(k=>k.startsWith('word-garden.')&&!isLearningKey(k)&&k!==ACTIVE_KEY&&!k.startsWith(GEN_PREFIX)))throw Error('发现当前版本不认识的词间存储数据，暂不导出或覆盖。请使用对应版本。');return all.filter(k=>generation?k.startsWith(GEN_PREFIX+generation+':')&&isLearningKey(k.slice((GEN_PREFIX+generation+':').length)):isLearningKey(k)).map(k=>generation?k.slice((GEN_PREFIX+generation+':').length):k);};
 const api={getItem(k){current();return isLearningKey(k)?raw.getItem(physical(k)):raw.getItem(k);},setItem(k,v){current();if(!isLearningKey(k))throw Error('未知学习存储字段，未写入。');raw.setItem(physical(k),String(v));},removeItem(k){current();if(!isLearningKey(k))throw Error('未知学习存储字段，未删除。');raw.removeItem(physical(k));},key(i){return keys()[i]??null;},get length(){return keys().length;},isStale(){try{current();return false;}catch{return true;}},isPointerKey(k){return k===ACTIVE_KEY;},
  snapshot(){current();const data={};for(const k of keys()){const value=raw.getItem(physical(k));if(value!==null)data[k]=value;}return data;},
  commit(records,expected){current();if(canonical(api.snapshot())!==canonical(expected))throw Error('预览后本机数据有变化，未导入。请重新选择备份并核对。');validateStorageRecords(records);const oldPhysical=keys().map(physical),id='g-'+globalThis.crypto.randomUUID(),prefix=GEN_PREFIX+id+':',written=[];let committed=false;
   try{for(const [k,value]of Object.entries(records)){const p=prefix+k;written.push(p);raw.setItem(p,JSON.stringify(value));}current();if(canonical(api.snapshot())!==canonical(expected))throw Error('导入期间本机数据有变化，未导入。请关闭其他词间标签页后重试。');raw.setItem(ACTIVE_KEY,JSON.stringify({version:1,generation:id}));committed=true;retired=true;
   }catch(error){if(!committed)for(const p of written)try{raw.removeItem(p);}catch{};if(error?.name==='QuotaExceededError')throw Error('本机空间不足，导入未提交，原学习数据完全保留。请释放浏览器空间后重试。');throw error;}
   // Best-effort garbage collection AFTER the atomic commit. A crash beforehand
   // leaves either the old generation or the full new generation, never half.
   for(const p of oldPhysical)try{raw.removeItem(p);}catch{}
   return {ok:true};
  }};return api;
}
export function storageSnapshot(storage){const bytes=storage.snapshot?storage.snapshot():Object.fromEntries(Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(isLearningKey).map(k=>[k,storage.getItem(k)]));const records={};for(const [k,raw]of Object.entries(bytes)){try{records[k]=JSON.parse(raw);}catch{throw Error('本机有无法读取的学习记录，未导出或覆盖：'+k);}}safeTree(records);validateStorageRecords(records);return {bytes,records};}
export function createBackup(storage,{at=new Date().toISOString()}={}){const {records}=storageSnapshot(storage);if(records[TIMER])records[TIMER].lease=null;return {format:BACKUP_FORMAT,formatVersion:BACKUP_VERSION,exportedAt:at,appVersion:APP_VERSION,data:{storage:records}};}
export function parseBackup(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw Error('备份文件超过24MB限制。');let backup;try{backup=JSON.parse(text);}catch{throw Error('文件不是完整、有效的JSON，未改动本机数据。');}safeTree(backup);if(backup?.format!==BACKUP_FORMAT)throw Error('不是词间学习备份文件。旧版进度片段或其他JSON不能直接恢复，请保留原文件。');if(backup.formatVersion!==BACKUP_VERSION)throw Error('不支持此备份格式版本，请使用对应或更新版本的词间。');if(typeof backup.exportedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(backup.exportedAt)||!Number.isFinite(Date.parse(backup.exportedAt))||typeof backup.appVersion!=='string'||!/^\d+\.\d+\.\d+$/.test(backup.appVersion)||!obj(backup.data)||!obj(backup.data.storage))throw Error('备份缺少有效导出时间、应用版本或学习数据。');validateStorageRecords(backup.data.storage);return backup;}
const union=(a=[],b=[],identity=canonical)=>{const result=copy(a),seen=new Set(a.map(identity));for(const v of b){const key=identity(v);if(!seen.has(key)){seen.add(key);result.push(copy(v));}}return result;};
const dict=(a={},b={})=>({...copy(b),...copy(a)});
const novelty=(a={},b={})=>({...copy(b),...copy(a),version:1,...Object.fromEntries(['ids','contents','structures','semanticKeys'].map(k=>[k,union(a[k]||[],b[k]||[])]))});
const idUnion=(a,b)=>union(a||[],b||[],v=>v.id);
function mergeWorkspace(local,incoming,conflicts,contentConflicts){
 const out=dict(local,incoming),protectedIds=new Set([...Object.keys(local.records||{}),...Object.keys(local.memoryStrength||{}),...contentConflicts]);
 // Keep scheduling, scores and counters for one identity together. No arithmetic
 // on cumulative records: neither sum nor max can prove independent evidence.
 for(const field of ['records','memoryStrength','exposure','autoCooldown','customLearningIndex']){out[field]=copy(local[field]||{});for(const [id,v]of Object.entries(incoming[field]||{}))if(!protectedIds.has(id)&&!own(out[field],id))out[field][id]=copy(v);}
 conflicts.records+=Object.keys(incoming.records||{}).filter(id=>protectedIds.has(id)&&canonical(incoming.records[id])!==canonical(local.records?.[id])).length;
 out.results=dict(local.results,incoming.results);out.dailyQuestionSeen=dict(local.dailyQuestionSeen,incoming.dailyQuestionSeen);
 out.customLearningHistory=union(local.customLearningHistory||[],incoming.customLearningHistory||[]);
 out.sessionHistory=union(local.sessionHistory||[],incoming.sessionHistory||[]);
 out.customLearningSessionHistory=union(local.customLearningSessionHistory||[],incoming.customLearningSessionHistory||[]);
 // Keep local completed sessions too: importing an older unfinished copy must
 // never recreate work already scored. Overwrite is the explicit alternative.
 if(local.session){if(incoming.session&&canonical(local.session)!==canonical(incoming.session)){conflicts.sessions++;out.sessionHistory=union(out.sessionHistory,[incoming.session]);}out.session=copy(local.session);}else if(incoming.session){const overlaps=incoming.session.items.some(i=>protectedIds.has(i.wordId));if(overlaps){out.session=null;conflicts.sessions++;out.sessionHistory=union(out.sessionHistory,[incoming.session]);}else out.session=copy(incoming.session);}
 if(local.sentenceDictation&&incoming.sentenceDictation){const a=local.sentenceDictation,b=incoming.sentenceDictation;out.sentenceDictation=dict(a,b);out.sentenceDictation.customSentences=idUnion(a.customSentences,b.customSentences);out.sentenceDictation.items=copy(a.items||{});for(const [id,v]of Object.entries(b.items||{}))if(!contentConflicts.has(id)&&!own(out.sentenceDictation.items,id))out.sentenceDictation.items[id]=copy(v);out.sentenceDictation.customHistory=union(a.customHistory||[],b.customHistory||[]);}
 if(local.adaptive&&incoming.adaptive){out.adaptive=dict(local.adaptive,incoming.adaptive);out.adaptive.novelty=novelty(local.adaptive.novelty,incoming.adaptive.novelty);out.adaptive.modules=dict(local.adaptive.modules,incoming.adaptive.modules);for(const [name,a]of Object.entries(local.adaptive.modules||{})){const b=incoming.adaptive.modules?.[name];if(!b)continue;if(!a.session&&!a.history.length&&!a.seen.length){out.adaptive.modules[name]=copy(b);continue;}const p=out.adaptive.modules[name];p.seen=union(a.seen,b.seen);p.history=union(a.history,b.history);p.needs=dict(a.needs,b.needs);p.verified=union(a.verified,b.verified).filter(id=>!own(p.needs,id));p.round=Math.max(a.round,b.round);if(b.session&&canonical(a.session)!==canonical(b.session))conflicts.sessions++;p.session=copy(a.session);p.backupSessionHistory=union(a.backupSessionHistory||[],b.backupSessionHistory||[]);if(b.session&&canonical(a.session)!==canonical(b.session))p.backupSessionHistory=union(p.backupSessionHistory,[b.session]);}}
 return out;
}
export function mergeLearningRecords(local,incoming){if(canonical(local)===canonical(incoming))return {records:copy(local),conflicts:{records:0,content:0,sessions:0}};const conflicts={records:0,content:0,sessions:0},out=dict(local,incoming),contentConflicts=new Set();
 const collect=(a=[],b=[])=>{const map=new Map(a.map(v=>[v.id,v]));for(const v of b)if(map.has(v.id)&&['english','chinese','example','exampleZh','structure','prep','form','contexts','acceptedAnswers'].some(k=>canonical(map.get(v.id)[k])!==canonical(v[k]))){contentConflicts.add(v.id);conflicts.content++;}};
 collect(local[CUSTOM]?.words,incoming[CUSTOM]?.words);collect(local[WORKSPACE]?.sentenceDictation?.customSentences,incoming[WORKSPACE]?.sentenceDictation?.customSentences);
 if(local[CUSTOM]&&incoming[CUSTOM])out[CUSTOM]={...copy(local[CUSTOM]),words:idUnion(local[CUSTOM].words,incoming[CUSTOM].words)};
 if(local[WORKSPACE]&&incoming[WORKSPACE])out[WORKSPACE]=mergeWorkspace(local[WORKSPACE],incoming[WORKSPACE],conflicts,contentConflicts);
 if(local[PHRASES]&&incoming[PHRASES]){const a=local[PHRASES],b=incoming[PHRASES];collect(a.custom,b.custom);out[PHRASES]=dict(a,b);out[PHRASES].custom=idUnion(a.custom,b.custom);out[PHRASES].records=copy(a.records);for(const [id,r]of Object.entries(b.records))if(!contentConflicts.has(id)&&!own(a.records,id))out[PHRASES].records[id]=copy(r);else if(canonical(a.records[id])!==canonical(r))conflicts.records++;out[PHRASES].history=idUnion(a.history,b.history);out[PHRASES].contextSeen=union(a.contextSeen,b.contextSeen);out[PHRASES].needsTransfer=dict(a.needsTransfer,b.needsTransfer);out[PHRASES].session=copy(a.session||(!Object.keys(a.records).length&&!a.history.length?b.session:null));if(b.session&&canonical(out[PHRASES].session)!==canonical(b.session))conflicts.sessions++;out[PHRASES].backupSessionHistory=union(a.backupSessionHistory||[],b.backupSessionHistory||[]);if(b.session&&canonical(out[PHRASES].session)!==canonical(b.session))out[PHRASES].backupSessionHistory=union(out[PHRASES].backupSessionHistory,[b.session]);}
 if(local[NOVELTY]&&incoming[NOVELTY])out[NOVELTY]=novelty(local[NOVELTY],incoming[NOVELTY]);
 if(out[WORKSPACE]?.adaptive?.novelty||out[NOVELTY]){const n=novelty(out[WORKSPACE]?.adaptive?.novelty,out[NOVELTY]);out[NOVELTY]=n;if(out[WORKSPACE]?.adaptive)out[WORKSPACE].adaptive.novelty=copy(n);}
 if(local[TIMER]&&incoming[TIMER])out[TIMER]={version:1,days:{...copy(incoming[TIMER].days),...copy(local[TIMER].days)},lease:null};
 // Daily totals have no event IDs. On same-day conflict keep local rather than
 // adding (or taking max) values from overlapping browser snapshots.
 if(out[TIMER])out[TIMER].lease=null;
 if(local[VOICES]&&incoming[VOICES])out[VOICES]={...copy(local[VOICES]),items:dict(local[VOICES].items,incoming[VOICES].items),next:Math.max(local[VOICES].next,incoming[VOICES].next)};
 const meta='word-garden.daily-insights.v1';if(local[meta]&&incoming[meta])out[meta]={version:1,startedAt:Math.min(local[meta].startedAt,incoming[meta].startedAt)};
 validateStorageRecords(out);return {records:out,conflicts};
}
export function backupCounts(records){const w=records[WORKSPACE]||{},p=records[PHRASES]||{};return {customWords:records[CUSTOM]?.words.length||0,customSentences:w.sentenceDictation?.customSentences?.length||0,customPhrases:p.custom?.length||0,progress:Object.keys(w.records||{}).length,phraseProgress:Object.keys(p.records||{}).length,events:Object.keys(records).filter(k=>k.startsWith(EVENT_PREFIX)).length,history:(p.history?.length||0)+Object.values(w.adaptive?.modules||{}).reduce((n,m)=>n+(m.history?.length||0),0),days:Object.keys(records[TIMER]?.days||{}).length,unfinished:(w.session&&!w.session.done?1:0)+(p.session&&!p.session.done?1:0)+Object.values(w.adaptive?.modules||{}).filter(m=>m.session&&!m.session.complete).length+Object.values(w.sentenceDictation?.items||{}).filter(i=>i.draft&&!i.result).length};}
export function prepareImport(storage,backup,mode='merge'){if(!['merge','replace'].includes(mode))throw Error('未知导入方式。');const current=storageSnapshot(storage),incoming=copy(backup.data.storage),merged=mode==='merge'?mergeLearningRecords(current.records,incoming):{records:incoming,conflicts:{records:0,content:0,sessions:0}};if(merged.records[TIMER])merged.records[TIMER].lease=null;validateStorageRecords(merged.records);const changed=canonical(current.records)!==canonical(merged.records);return {mode,backup,expected:current.bytes,records:merged.records,conflicts:merged.conflicts,counts:backupCounts(incoming),before:backupCounts(current.records),after:backupCounts(merged.records),changed};}
export function commitImport(storage,plan,{confirmedReplace=false}={}){if(plan.mode==='replace'&&!confirmedReplace)throw Error('覆盖恢复尚未确认，原数据未改动。');if(!plan.changed){if(canonical(storage.snapshot())!==canonical(plan.expected))throw Error('本机数据有变化，请重新核对。');return {ok:true,unchanged:true};}return storage.commit(plan.records,plan.expected);}
