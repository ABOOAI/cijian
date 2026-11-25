import {APP_VERSION,BACKUP_FORMAT,BACKUP_VERSION,createLearningStorage,mergeLearningRecords,parseBackup} from './learning-backup.js?v=1.13.7';
import {createSupabaseBackupRepository} from './cloud-sync.js';

const TIMER='vocabulary.effective-practice.v1';
export const CLOUD_SAVE_DELAY=5*60*1000;
const envelope=(records,at=new Date().toISOString())=>({format:BACKUP_FORMAT,formatVersion:BACKUP_VERSION,exportedAt:at,appVersion:APP_VERSION,data:{storage:records}});

class MemoryStorage{
 constructor(records={}){this.map=new Map(Object.entries(records).map(([key,value])=>[key,JSON.stringify(value)]));this.keys=[...this.map.keys()];}
 get length(){return this.map.size;}
 key(index){return this.keys[index]??null;}
 getItem(key){return this.map.get(key)??null;}
 setItem(key,value){if(!this.map.has(key))this.keys.push(key);this.map.set(key,String(value));}
 removeItem(key){if(!this.map.delete(key))return;const index=this.keys.indexOf(key);if(index>=0)this.keys.splice(index,1);}
}

export async function createAccountLearningStorage(client,userId,{saveDelay=CLOUD_SAVE_DELAY,repository=createSupabaseBackupRepository(client,userId)}={}){
 if(!client||!userId)throw Error('缺少有效登录账户。');
 const remote=await repository.read();
 let cloudRecords=remote?parseBackup(JSON.stringify(remote.payload)).data.storage:{},expectedUpdatedAt=remote?.updated_at??null;
 const raw=new MemoryStorage(cloudRecords);let active=createLearningStorage(raw),logicalKeys=Object.keys(cloudRecords),revision=0,syncedRevision=0,timer=null,saving=null,lastError=null,preserveRemoteUnion=false;
 const listeners=new Set(),emit=(state,message)=>{for(const listener of listeners)try{listener({state,message,pending:revision!==syncedRevision});}catch{}};
 const snapshot=()=>{const records={};for(const [key,value]of Object.entries(active.snapshot())){try{records[key]=JSON.parse(value);}catch{throw Error('账号中有无法读取的学习记录：'+key);}}if(records[TIMER])records[TIMER].lease=null;return records;};
 async function writeOnce(){
  if(saving)return saving;
  if(syncedRevision===revision)return;
  const target=revision;
  saving=(async()=>{
    emit('saving','正在保存到账号云端…');
    const local=snapshot();let attempts=0,outgoing=preserveRemoteUnion?mergeLearningRecords(local,cloudRecords).records:local;
    while(true){
     try{const saved=await repository.write(envelope(outgoing),expectedUpdatedAt);expectedUpdatedAt=saved?.updated_at??expectedUpdatedAt;cloudRecords=outgoing;break;}
     catch(error){
      if(++attempts>1||!/另一台设备/.test(error?.message||''))throw error;
      const latest=await repository.read();cloudRecords=latest?parseBackup(JSON.stringify(latest.payload)).data.storage:{};expectedUpdatedAt=latest?.updated_at??null;
      preserveRemoteUnion=true;outgoing=mergeLearningRecords(local,cloudRecords).records;
     }
    }
    syncedRevision=Math.max(syncedRevision,target);lastError=null;emit(revision===syncedRevision?'saved':'pending',revision===syncedRevision?'已保存到账号云端':'本轮已保存；新进度将在5分钟内批量保存');
  })().catch(error=>{lastError=error;emit('error','云端保存失败：'+(error?.message||'请检查网络后重试'));throw error;}).finally(()=>{saving=null;});
  return saving;
 }
 const arm=()=>{if(timer)return;timer=setTimeout(async()=>{timer=null;try{await writeOnce();}catch{}if(revision!==syncedRevision&&!lastError)arm();},saveDelay);};
 const schedule=()=>{revision++;lastError=null;emit('pending','进度已记录，将在5分钟内批量保存到账号云端');arm();};
 const api={
  getItem:key=>active.getItem(key),setItem(key,value){const next=String(value),current=active.getItem(key);if(current===next)return;active.setItem(key,next);if(current===null)logicalKeys.push(key);schedule();},removeItem(key){if(active.getItem(key)===null)return;active.removeItem(key);logicalKeys=logicalKeys.filter(value=>value!==key);schedule();},key:index=>logicalKeys[index]??null,get length(){return logicalKeys.length;},snapshot:()=>active.snapshot(),isStale:()=>active.isStale(),isPointerKey:key=>active.isPointerKey?.(key)||false,rescanOnSnapshot:false,
  commit(records,expected){const result=active.commit(records,expected);active=createLearningStorage(raw);logicalKeys=Object.keys(records);schedule();return result;},
  async flushCloud(){if(timer){clearTimeout(timer);timer=null;}const goal=revision;while(syncedRevision<goal){if(saving)await saving;if(syncedRevision<goal)await writeOnce();}return {ok:true};},
  hasPendingCloud(){return revision!==syncedRevision||!!timer||!!saving;},
  retryCloud(){return api.flushCloud();},
  onStatus(listener){listeners.add(listener);listener({state:lastError?'error':revision===syncedRevision?'saved':saving?'saving':'pending',message:lastError?'云端保存失败：'+(lastError.message||'请检查网络后重试'):revision===syncedRevision?'账号云端已就绪':saving?'正在保存到账号云端…':'进度已记录，将在5分钟内批量保存到账号云端',pending:revision!==syncedRevision});return ()=>listeners.delete(listener);}
 };
 return api;
}
