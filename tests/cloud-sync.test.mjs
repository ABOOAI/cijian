import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {APP_VERSION,BACKUP_FORMAT,BACKUP_VERSION,createLearningStorage,storageSnapshot} from '../src/learning-backup.js';
import {signOutCurrentDevice,synchronizeLearningBackup} from '../src/cloud-sync.js';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const CUSTOM='word-garden.custom.v1',AT='2026-11-11T10:00:00.000Z';
const word=(id,english)=>({id,english,chinese:'释义',example:'An example.',group:'personal'});
const records=(...words)=>({[CUSTOM]:{version:1,words}});
const envelope=data=>({format:BACKUP_FORMAT,formatVersion:BACKUP_VERSION,exportedAt:AT,appVersion:APP_VERSION,data:{storage:data}});

class MemoryStorage{
 constructor(data={}){this.map=new Map(Object.entries(data).map(([key,value])=>[key,JSON.stringify(value)]));}
 get length(){return this.map.size;}key(index){return [...this.map.keys()][index]??null;}getItem(key){return this.map.get(key)??null;}
 setItem(key,value){this.map.set(key,String(value));}removeItem(key){this.map.delete(key);}
}
function repository(remote=null,{failWrite=null}={}){let written=null,calls=0;return {api:{read:async()=>remote,write:async backup=>{calls++;if(failWrite)throw failWrite;written=backup;return {updated_at:AT};}},state:()=>({written,calls})};}

test('first sync creates a validated cloud backup without changing local storage',async()=>{
 const raw=new MemoryStorage(records(word('custom-one','one'))),storage=createLearningStorage(raw),repo=repository();
 const result=await synchronizeLearningBackup({repository:repo.api,storage,at:()=>AT});
 assert.equal(result.created,true);assert.equal(result.localChanged,false);assert.equal(repo.state().calls,1);
 assert.deepEqual(repo.state().written.data.storage,storageSnapshot(storage).records);
});

test('sync safely merges cloud-only identities, saves the union, and atomically commits local data',async()=>{
 const raw=new MemoryStorage(records(word('custom-local','local'))),storage=createLearningStorage(raw),remote={payload:envelope(records(word('custom-cloud','cloud'))),updated_at:'2026-11-10T10:00:00.000Z'},repo=repository(remote);
 const result=await synchronizeLearningBackup({repository:repo.api,storage,at:()=>AT});
 assert.equal(result.created,false);assert.equal(result.localChanged,true);assert.equal(storage.isStale(),true);
 const local=storageSnapshot(createLearningStorage(raw)).records[CUSTOM].words.map(item=>item.id).sort(),cloud=repo.state().written.data.storage[CUSTOM].words.map(item=>item.id).sort();
 assert.deepEqual(local,['custom-cloud','custom-local']);assert.deepEqual(cloud,local);
});

test('same-ID content conflicts retain the local authoring value in cloud and local',async()=>{
 const raw=new MemoryStorage(records(word('custom-shared','local spelling'))),storage=createLearningStorage(raw),remote={payload:envelope(records(word('custom-shared','cloud spelling'))),updated_at:'2026-11-10T10:00:00.000Z'},repo=repository(remote);
 const result=await synchronizeLearningBackup({repository:repo.api,storage,at:()=>AT});
 assert.equal(result.conflicts.content,1);assert.equal(result.localChanged,false);
 assert.equal(repo.state().written.data.storage[CUSTOM].words[0].english,'local spelling');
});

test('invalid remote data fails closed before cloud or local writes',async()=>{
 const original=records(word('custom-safe','safe')),raw=new MemoryStorage(original),storage=createLearningStorage(raw),repo=repository({payload:envelope({foreign:{version:1}}),updated_at:AT});
 await assert.rejects(synchronizeLearningBackup({repository:repo.api,storage,at:()=>AT}));
 assert.equal(repo.state().calls,0);assert.deepEqual(storageSnapshot(storage).records,original);
});

test('a concurrent cloud write failure happens before local atomic commit',async()=>{
 const original=records(word('custom-local','local')),raw=new MemoryStorage(original),storage=createLearningStorage(raw),remote={payload:envelope(records(word('custom-cloud','cloud'))),updated_at:AT},repo=repository(remote,{failWrite:new Error('cloud changed')});
 await assert.rejects(synchronizeLearningBackup({repository:repo.api,storage,at:()=>AT}),/cloud changed/);
 assert.equal(storage.isStale(),false);assert.deepEqual(storageSnapshot(storage).records,original);
});

test('current-device sign out reload path does not wait for the remote revocation request',async()=>{
 let listener=null,scope=null,unsubscribed=false;
 const client={auth:{onAuthStateChange(callback){listener=callback;return {data:{subscription:{unsubscribe(){unsubscribed=true;}}}};},signOut(options){scope=options.scope;queueMicrotask(()=>listener('SIGNED_OUT',null));return new Promise(()=>{});}}};
 await signOutCurrentDevice(client);
 assert.equal(scope,'local');assert.equal(unsubscribed,true);
});
