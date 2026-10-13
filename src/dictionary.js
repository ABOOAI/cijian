export const normalizeEnglish=value=>String(value||'').normalize('NFKC').replace(/[‘’]/g,"'").trim().replace(/\s+/g,' ').toLowerCase();
export const dictionaryBucket=value=>normalizeEnglish(value).match(/^[a-z]{1,2}/)?.[0]||'_';
export function sameWord(a,b){
 const acronym=w=>w.status==='official-list'&&/^[A-Z]{2,5}$/.test(w.english);
 if(a.caseSensitive||b.caseSensitive||acronym(a)||acronym(b))return a.english.trim()===b.english.trim();
 return normalizeEnglish(a.english)===normalizeEnglish(b.english);
}
export function parseBatch(text){const items=String(text).split(/[\n\r;,；，\t]+/).map(v=>v.trim()).filter(Boolean);const unique=[];for(const s of items)if(!unique.includes(s))unique.push(s);return unique;}
export function createDictionaryLookup({textbook=[],fetcher=globalThis.fetch,baseURL=new URL('../dictionary/',import.meta.url)}={}){
 const cache=new Map();
 async function shard(kind,bucket){const key=kind+'/'+bucket;if(!cache.has(key)){const p=fetcher(new URL(`${kind}/${bucket}.json`,baseURL)).then(async r=>{if(!r.ok){if(r.status===404)return {};throw Error('词典暂未加载');}return r.json();}).catch(e=>{cache.delete(key);throw e;});cache.set(key,p);}return cache.get(key);}
 return async function lookup(input){
  const original=String(input||'').normalize('NFKC').replace(/[‘’]/g,"'").trim().replace(/\s+/g,' '),key=normalizeEnglish(original);
  if(!key)return {found:false,status:'empty'};
  const local=textbook.find(w=>w.english===original)||textbook.find(w=>((w.caseSensitive||/^[A-Z]{2,5}$/.test(w.english))?w.english===original:normalizeEnglish(w.english)===key));
  if(local)return {found:true,chinese:local.chinese,fullChinese:local.chinese,source:'教材词库',matched:local.english,truncated:false};
  try{
   const bucket=dictionaryBucket(key),data=await shard('shards',bucket);let chinese=Object.hasOwn(data,key)&&typeof data[key]==='string'?data[key]:'';
   if(!chinese)return {found:false,status:'unknown'};
   // Add only dictionary-supplied lemma links; never guess morphology.
   let lemmaNote='';try{const forms=await shard('lemmas',bucket),lemmas=Object.hasOwn(forms,key)?forms[key]:null;if(Array.isArray(lemmas)){const lemma=lemmas.find(x=>typeof x==='string'&&x!==key);if(lemma){const meanings=await shard('shards',dictionaryBucket(lemma));if(typeof meanings[lemma]==='string')lemmaNote=`原形 ${lemma}：${meanings[lemma].split('\n')[0]}`;}}}catch{ /* The exact definition is still usable if optional lemma data cannot load. */ }
   const fullChinese=[chinese,lemmaNote].filter(Boolean).join('\n').replace(/\s+/g,' ').trim(),truncated=fullChinese.length>200;
   return {found:true,chinese:truncated?fullChinese.slice(0,199)+'…':fullChinese,fullChinese,source:'ECDICT 通用词典',matched:key,truncated};
  }catch{return {found:false,status:'unavailable'};}
 };
}
