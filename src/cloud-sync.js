import {APP_VERSION,BACKUP_FORMAT,BACKUP_VERSION,createBackup,parseBackup,prepareImport,commitImport} from './learning-backup.js?v=1.13.7';
import {supabaseClientFor} from './supabase-client.js';

export const CLOUD_SYNC_SECTION=`<section class="cloud-sync" aria-labelledby="cloud-sync-title"><h3 id="cloud-sync-title">账户与云端进度</h3><p>当前学习进度只保存在登录账号的 Supabase 云端，不保存到浏览器。学习中每5分钟批量上传一次；切到后台、退出账号或恢复JSON时会立即保存。每个账户的数据彼此独立；语音模型、音频缓存和词典文件不会上传。</p><p>当前账号：<strong id="cloud-account-name"></strong></p><div id="cloud-sync-status" class="inline-note" role="status" aria-live="polite"></div><div class="button-row"><button class="secondary" id="cloud-retry-save" type="button" hidden>重新保存</button><button class="secondary" id="cloud-sign-out" type="button">退出账户</button></div></section>`;
const TABLE='learning_backups';

function envelope(records,at){return {format:BACKUP_FORMAT,formatVersion:BACKUP_VERSION,exportedAt:at,appVersion:APP_VERSION,data:{storage:JSON.parse(JSON.stringify(records))}};}
function remoteBackup(payload){return parseBackup(JSON.stringify(payload));}
function cloudError(message,error){const detail=error?.code?`（${error.code}）`:'';return new Error(message+detail);}

export function createSupabaseBackupRepository(client,userId,{now=()=>new Date().toISOString()}={}){
 return {
  async read(){
   const {data,error}=await client.from(TABLE).select('payload,updated_at').eq('user_id',userId).maybeSingle();
   if(error)throw cloudError('无法读取云端学习记录，请稍后重试。',error);
   return data||null;
  },
  async write(backup,expectedUpdatedAt=null){
   const updatedAt=now();
   if(expectedUpdatedAt===null){
    const {data,error}=await client.from(TABLE).insert({user_id:userId,payload:backup,updated_at:updatedAt}).select('updated_at').single();
    if(error?.code==='23505')throw new Error('另一台设备刚刚创建了云端记录。请重新点击“立即同步”，系统会重新合并。');
    if(error)throw cloudError('无法创建云端学习记录，请稍后重试。',error);
    return data;
   }
   const {data,error}=await client.from(TABLE).update({payload:backup,updated_at:updatedAt}).eq('user_id',userId).eq('updated_at',expectedUpdatedAt).select('updated_at');
   if(error)throw cloudError('无法更新云端学习记录，请稍后重试。',error);
   if(!Array.isArray(data)||data.length!==1)throw new Error('另一台设备刚刚更新了云端记录。请重新点击“立即同步”，系统会重新合并。');
   return data[0];
  }
 };
}

export async function synchronizeLearningBackup({repository,storage,validateReferences=()=>{},at=()=>new Date().toISOString()}={}){
 if(!repository||!storage)throw new Error('云同步尚未初始化。');
 const remote=await repository.read();
 let backup,plan=null;
 if(remote){
  const parsed=remoteBackup(remote.payload);
  validateReferences(parsed.data.storage);
  plan=prepareImport(storage,parsed,'merge');
  validateReferences(plan.records);
  backup=envelope(plan.records,at());
 }else{
  backup=createBackup(storage,{at:at()});
  validateReferences(backup.data.storage);
 }
 // Save the complete merged snapshot first. If local atomic staging later fails,
 // the cloud still contains both sides and the learner can retry safely.
 const saved=await repository.write(backup,remote?.updated_at??null);
 if(plan?.changed)commitImport(storage,plan);
 return {created:!remote,localChanged:!!plan?.changed,conflicts:plan?.conflicts||{records:0,content:0,sessions:0},updatedAt:saved?.updated_at||null};
}

export async function signOutCurrentDevice(client){
 let subscription=null,resolveSignedOut;
 const signedOut=new Promise(resolve=>{resolveSignedOut=resolve;});
 try{
  const result=client.auth.onAuthStateChange?.(event=>{if(event==='SIGNED_OUT')resolveSignedOut();});
  subscription=result?.data?.subscription||null;
  const request=Promise.resolve(client.auth.signOut({scope:'local'})).then(({error}={})=>{if(error)throw error;});
  await (subscription?Promise.race([signedOut,request]):request);
 }finally{subscription?.unsubscribe?.();}
}

function showExitScreen(doc){
 const gate=doc.querySelector('#auth-gate'),app=doc.querySelector('#learning-app');
 if(!gate||!app)return {message(){},restore(){}};
 const previous={gateHidden:gate.hidden,gateHTML:gate.innerHTML,appHidden:app.hidden};
 app.hidden=true;gate.hidden=false;gate.innerHTML='<main class="auth-card auth-loading"><div class="auth-spinner" aria-hidden="true"></div><h1>正在安全退出</h1><p id="account-exit-status" role="status" aria-live="polite">正在保存最后的学习进度…</p></main>';
 return {message(value){const status=gate.querySelector('#account-exit-status');if(status)status.textContent=value;},restore(){gate.innerHTML=previous.gateHTML;gate.hidden=previous.gateHidden;app.hidden=previous.appHidden;}};
}

export function bindCloudSyncUI({dialog,storage,flush=()=>{},pause=()=>{},stop=()=>{},reload=()=>dialog.ownerDocument.defaultView.location.reload(),validateReferences=()=>{}}){
 const doc=dialog.ownerDocument,w=doc.defaultView,$=s=>dialog.querySelector(s),accountName=$('#cloud-account-name'),retry=$('#cloud-retry-save'),signOut=$('#cloud-sign-out'),status=$('#cloud-sync-status'),client=supabaseClientFor(w);let busy=false,unsubscribe=null;
 const show=message=>{status.textContent=message;};
 const setBusy=value=>{busy=value;for(const control of [retry,signOut])if(control)control.disabled=value;};
 accountName.textContent=w.__CIJIAN_ACCOUNT__?.username||'学习账户';
 if(!client||!storage?.flushCloud){show('账号云端组件未能初始化，请刷新页面。');signOut.disabled=true;return;}
 unsubscribe=storage.onStatus?.(({state,message})=>{show(message);retry.hidden=state!=='error';});dialog.addEventListener('close',()=>unsubscribe?.(),{once:true});
 retry.addEventListener('click',async()=>{if(busy)return;setBusy(true);show('正在重新保存…');try{flush();await storage.retryCloud();show(storage.hasPendingCloud?.()?'点击前的进度已保存；新变化将在5分钟内批量保存。':'已保存到账号云端');retry.hidden=true;}catch(error){show('仍未保存：'+(error?.message||'请检查网络。'));}finally{setBusy(false);}});
 signOut.addEventListener('click',async()=>{if(busy)return;setBusy(true);signOut.textContent='正在退出…';show('正在保存最后的学习进度…');const exit=showExitScreen(doc);try{pause();flush();await storage.flushCloud();exit.message('进度已保存，正在结束本机登录…');stop();await signOutCurrentDevice(client);reload();}catch(error){exit.restore();show('尚未退出：'+(error?.message||'请检查网络后重试。'));signOut.textContent='退出账户';}finally{setBusy(false);}});
}
