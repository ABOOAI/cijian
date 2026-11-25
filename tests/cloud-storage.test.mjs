import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {APP_VERSION,BACKUP_FORMAT,BACKUP_VERSION} from '../src/learning-backup.js';
import {CLOUD_SAVE_DELAY,createAccountLearningStorage} from '../src/cloud-storage.js';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const CUSTOM='word-garden.custom.v1',AT='2026-11-11T12:00:00.000Z';
const word=(id,english)=>({id,english,chinese:'释义',example:'An example.',group:'personal'});
const records=(...words)=>({[CUSTOM]:{version:1,words}});
const backup=data=>({format:BACKUP_FORMAT,formatVersion:BACKUP_VERSION,exportedAt:AT,appVersion:APP_VERSION,data:{storage:data}});
const clone=value=>value===null?null:JSON.parse(JSON.stringify(value));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async predicate=>{for(let attempt=0;attempt<50&&!predicate();attempt++)await new Promise(resolve=>setImmediate(resolve));assert.equal(predicate(),true);};

function repository(initial=null){
 let row=initial?{payload:backup(clone(initial)),updated_at:AT}:null,writes=0,fail=null;
 return {api:{read:async()=>clone(row),write:async value=>{writes++;if(fail)throw fail;row={payload:clone(value),updated_at:`${AT}:${writes}`};return {updated_at:row.updated_at};}},state:()=>({row:clone(row),writes}),fail:value=>{fail=value;}};
}

test('account storage hydrates only from cloud and writes changes back to that account',async()=>{
 const repo=repository(records(word('custom-cloud-one','one'))),storage=await createAccountLearningStorage({},'user-a',{repository:repo.api,saveDelay:60000});
 assert.equal(JSON.parse(storage.getItem(CUSTOM)).words[0].id,'custom-cloud-one');
 storage.setItem(CUSTOM,JSON.stringify({version:1,words:[word('custom-cloud-one','one'),word('custom-local-two','two')]}));
 assert.equal(repo.state().writes,0);await storage.flushCloud();
 assert.equal(repo.state().writes,1);assert.deepEqual(repo.state().row.payload.data.storage[CUSTOM].words.map(x=>x.id),['custom-cloud-one','custom-local-two']);
});

test('two accounts remain independent and never share an in-browser progress store',async()=>{
 const a=repository(records(word('custom-account-a','alpha'))),b=repository(records(word('custom-account-b','beta')));
 const sa=await createAccountLearningStorage({},'user-a',{repository:a.api,saveDelay:60000}),sb=await createAccountLearningStorage({},'user-b',{repository:b.api,saveDelay:60000});
 sa.setItem(CUSTOM,JSON.stringify({version:1,words:[word('custom-account-a','alpha'),word('custom-a-only','only a')]}));await sa.flushCloud();
 assert.deepEqual(JSON.parse(sb.getItem(CUSTOM)).words.map(x=>x.id),['custom-account-b']);assert.deepEqual(b.state().row.payload.data.storage[CUSTOM].words.map(x=>x.id),['custom-account-b']);
});

test('failed cloud save is visible, remains retryable, and does not claim success',async()=>{
 const repo=repository(records(word('custom-safe','custom-safe'))),storage=await createAccountLearningStorage({},'user-a',{repository:repo.api,saveDelay:60000}),events=[];storage.onStatus(value=>events.push(value));
 storage.setItem(CUSTOM,JSON.stringify({version:1,words:[word('custom-safe','custom-safe'),word('custom-pending','custom-pending')]}));repo.fail(new Error('network down'));
 await assert.rejects(storage.flushCloud(),/network down/);assert.equal(events.at(-1).state,'error');assert.deepEqual(repo.state().row.payload.data.storage[CUSTOM].words.map(x=>x.id),['custom-safe']);
 repo.fail(null);await storage.retryCloud();assert.equal(events.at(-1).state,'saved');assert.deepEqual(repo.state().row.payload.data.storage[CUSTOM].words.map(x=>x.id),['custom-safe','custom-pending']);
});

test('unchanged values and removing absent keys do not create redundant cloud writes',async()=>{
 const original=records(word('custom-stable','stable')),repo=repository(original),storage=await createAccountLearningStorage({},'user-a',{repository:repo.api,saveDelay:60000}),events=[];storage.onStatus(value=>events.push(value));
 storage.setItem(CUSTOM,JSON.stringify(original[CUSTOM]));storage.removeItem('missing-learning-key');
 assert.equal(storage.hasPendingCloud(),false);await storage.flushCloud();assert.equal(repo.state().writes,0);assert.equal(events.some(value=>value.state==='saving'),false);
});

test('changes inside one save window batch into one latest cloud write',async()=>{
 assert.equal(CLOUD_SAVE_DELAY,5*60*1000);
 const original=records(word('custom-stable','stable')),repo=repository(original),storage=await createAccountLearningStorage({},'user-a',{repository:repo.api,saveDelay:25});
 storage.setItem(CUSTOM,JSON.stringify(records(word('custom-first','first'))[CUSTOM]));await wait(10);
 storage.setItem(CUSTOM,JSON.stringify(records(word('custom-latest','latest'))[CUSTOM]));await wait(35);
 assert.equal(repo.state().writes,1);assert.equal(repo.state().row.payload.data.storage[CUSTOM].words[0].id,'custom-latest');assert.equal(storage.hasPendingCloud(),false);
});

test('a flush saves its starting revision without chasing continuous later activity',async()=>{
 let row={payload:backup(records(word('custom-safe','safe'))),updated_at:AT},writes=0,release;
 const repository={read:async()=>clone(row),write:async value=>{writes++;if(writes===1)await new Promise(resolve=>{release=resolve;});row={payload:clone(value),updated_at:`${AT}:${writes}`};return {updated_at:row.updated_at};}};
 const storage=await createAccountLearningStorage({},'user-a',{repository,saveDelay:60000});
 storage.setItem(CUSTOM,JSON.stringify(records(word('custom-first','first'))[CUSTOM]));const firstFlush=storage.flushCloud();await until(()=>writes===1);
 storage.setItem(CUSTOM,JSON.stringify(records(word('custom-later','later'))[CUSTOM]));release();await firstFlush;
 assert.equal(writes,1);assert.equal(storage.hasPendingCloud(),true);await storage.flushCloud();assert.equal(writes,2);assert.equal(row.payload.data.storage[CUSTOM].words[0].id,'custom-later');
});
