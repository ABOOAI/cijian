import {sameWord} from './dictionary.js';
export const CUSTOM_KEY='word-garden.custom.v1';
const clean=s=>typeof s==='string'?s.normalize('NFC').trim().replace(/\s+/g,' '):'';
export const canonical=s=>clean(s).toLocaleLowerCase('en').replace(/[’‘]/g,"'");
export function validateWord(input,words,editingId){
 const data={english:clean(input.english),chinese:clean(input.chinese),example:clean(input.example),exampleZh:clean(input.exampleZh),hint:clean(input.hint),group:clean(input.group)||'我的单词'};
 if(!data.english||!data.chinese)return {error:'英语和中文释义都要填写。'};
 if(!/[a-zA-Z]/.test(data.english)||!/^[-a-zA-Z0-9\s.,'’()!?/&]+$/.test(data.english))return {error:'英语词项请使用英文字母、空格和常见英文标点。'};
 for(const [key,max]of Object.entries({english:100,chinese:200,example:500,exampleZh:500,hint:500,group:40}))if(data[key].length>max)return {error:`${({english:'英语',chinese:'中文',example:'例句',exampleZh:'例句译文',hint:'记忆提示',group:'分组'})[key]}请控制在${max}字以内。`};
 if(words.some(w=>w.id!==editingId&&sameWord(w,data)))return {error:'这个英语词项已在词库中，请搜索现有词条。'};
 return {data};
}
export function makeCustom(data,id=`custom-${globalThis.crypto.randomUUID()}`){return {...data,id,unitId:'custom',status:'custom',answers:[data.english],memory:{method:'我的记忆提示',hint:data.hint||'可以在编辑中补充自己的记忆方法。',example:data.example||'',exampleZh:data.exampleZh||''}};}
export function loadCustom(storage){try{const raw=storage?.getItem(CUSTOM_KEY);if(!raw)return {words:[],notice:''};const x=JSON.parse(raw);if(x.version!==1||!Array.isArray(x.words)||x.words.some(w=>typeof w.id!=='string'||!w.id.startsWith('custom-')||!w.english||!w.chinese))throw Error();return {words:x.words.map(w=>makeCustom(w,w.id)),notice:''};}catch{return {words:[],notice:'自定义词数据无法读取。原始内容保留，暂时禁止覆盖。',damaged:true};}}
export function saveCustom(storage,words){try{storage.setItem(CUSTOM_KEY,JSON.stringify({version:1,words}));return true;}catch{return false;}}
