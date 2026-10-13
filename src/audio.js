/** Whole-word player. One active voice at a time; stale callbacks cannot grade another item. */
export function audioEntryMap(manifest){
 const entries=Array.isArray(manifest?.entries)?manifest.entries:[];
 const out=new Map();
 for(const e of entries){
  const id=e.wordId||e.id,file=e.file||e.audio,text=e.text||e.word;
  if(typeof id!=='string'||typeof text!=='string'||!['af_heart','am_michael'].includes(e.voice)||typeof file!=='string'||!/^audio\/[a-zA-Z0-9_-]+\.mp3$/.test(file))continue;
  out.set(id,{...e,wordId:id,text,file});
 }
 return out;
}
export function createAudioController({AudioCtor=globalThis.Audio,synthesis=globalThis.speechSynthesis,UtteranceCtor=globalThis.SpeechSynthesisUtterance,fetchImpl=null,urlAPI=globalThis.URL,timeoutMs=15000,maxCached=48,onPlaybackState=()=>{}}={}){
 let token=0,active=null,voiceCleanup=null;const cache=new Map(),pending=new Map(),denied=new Map();
 const buffered=typeof fetchImpl==='function'&&typeof urlAPI?.createObjectURL==='function';
 function stop(){onPlaybackState('idle');token++;voiceCleanup?.();voiceCleanup=null;if(active){active.onended=null;active.onerror=null;active.onplaying=null;active.onwaiting=null;active.onstalled=null;try{active.pause();active.currentTime=0;}catch{}active=null;}try{synthesis?.cancel();}catch{}}
 const errorMessage=e=>e?.name==='NotAllowedError'?'浏览器阻止播放，请再次点击朗读按钮。':e?.name==='AbortError'?'音频加载超时，请检查网络后点击重试。':e?.name==='TypeError'?'网络未能取得音频，请检查连接后重试。':e?.name==='NotSupportedError'?'浏览器未能识别音频格式，请重试或选择设备朗读。':e?.message||'音频未能播放，请重试。';
 function evict(){for(const [key,item] of cache){if(cache.size<=maxCached)break;if(active?.src===item.objectURL)continue;urlAPI.revokeObjectURL(item.objectURL);cache.delete(key);}}
 async function prepareFile(url,{retry=false}={}){
  if(!buffered)return url;
  if(cache.has(url)){const item=cache.get(url);cache.delete(url);cache.set(url,item);return item.objectURL;}
  if(denied.has(url))throw denied.get(url);if(pending.has(url))return pending.get(url);
  const load=(async()=>{const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),timeoutMs);try{
   const response=await Promise.resolve().then(()=>fetchImpl(url,{credentials:'same-origin',cache:'default',signal:abort.signal}));
   if(!response.ok){const status=response.status;const failure=new Error(status===401||status===403?`音频服务拒绝了这次请求（${status}），请稍后重试。`:status===404?'这段音频暂未找到（404），请刷新页面后重试。':`音频下载失败（${status}），请点击重试。`);if(status===401||status===403)denied.set(url,failure);throw failure;}
   const type=(response.headers?.get('content-type')||'').split(';')[0];if(type&&!['audio/mpeg','audio/mp3','application/octet-stream'].includes(type))throw new Error('服务器未返回音频文件，请稍后重试。');
   const blob=await response.blob();if(!blob.size)throw new Error('收到的音频为空，请点击重试。');
   denied.delete(url);const objectURL=urlAPI.createObjectURL(blob);cache.set(url,{objectURL});evict();return objectURL;
  }finally{clearTimeout(timer);pending.delete(url);}})();pending.set(url,load);return load;
 }
 async function playFile(url,{onComplete=()=>{},onError=()=>{},onStart=()=>{},onLoading=()=>{},retry=false}={}){
  stop();onPlaybackState('loading');const t=token;let reported=false;
  const fail=message=>{if(t!==token||reported)return;reported=true;onPlaybackState('idle');onError(message);};
  if(typeof AudioCtor!=='function'){fail('音频播放器不可用。');return false;}
  let a,startTimer;try{let source=url;if(buffered){onLoading('正在加载 Kokoro 美音…');const cached=cache.get(url);if(cached){cache.delete(url);cache.set(url,cached);source=cached.objectURL;}else source=await prepareFile(url,{retry});if(t!==token)return false;}
   a=new AudioCtor(source);active=a;a.preload='auto';a.onplaying=()=>{if(t===token&&active===a)onPlaybackState('playing');};a.onwaiting=a.onstalled=()=>{if(t===token&&active===a)onPlaybackState('loading');};a.onended=()=>{if(t===token&&active===a){active=null;onPlaybackState('idle');onComplete();}};a.onerror=()=>{if(t===token&&active===a){active=null;fail(a.error?.code===3?'浏览器无法解码这段音频，请重试或选择设备朗读。':a.error?.code===4?'浏览器未能识别音频格式，请重试或选择设备朗读。':'音频未能加载，请重试或选择设备朗读。');}};
   await Promise.race([a.play(),new Promise((_,reject)=>{startTimer=setTimeout(()=>reject(new Error('音频已下载，但播放启动超时，请点击朗读重试。')),timeoutMs);})]);clearTimeout(startTimer);if(t===token&&active===a){onPlaybackState('playing');onStart();return true;}return false;
  }catch(e){clearTimeout(startTimer);if(a){try{a.pause();}catch{}a.onended=a.onerror=a.onplaying=a.onwaiting=a.onstalled=null;}if(t===token){if(active===a)active=null;fail(errorMessage(e));}return false;}
 }
 function playSpeech(text,{requireUS=false,onComplete=()=>{},onError=()=>{},onStart=()=>{},onLoading=()=>{}}={}){
  stop();onPlaybackState('loading');const t=token;if(!synthesis||typeof UtteranceCtor!=='function'){onPlaybackState('idle');onError('此浏览器不支持设备合成朗读，可跳过听音题。');return false;}
  const voices=()=>synthesis.getVoices().filter(v=>requireUS?/^en[-_]US$/i.test(v.lang):/^en(?:[-_]|$)/i.test(v.lang));
  const speak=()=>{if(t!==token)return false;const available=voices();if(!available.length)return false;voiceCleanup?.();voiceCleanup=null;
   let settled=false;const u=new UtteranceCtor(/^[A-Z]{2,5}$/.test(text)?text.split('').join(' '):text);u.voice=available.find(v=>/^en[-_]US$/i.test(v.lang))||available[0];u.lang=u.voice.lang;u.rate=.85;u.onstart=()=>{if(t===token)onPlaybackState('playing');};u.onpause=()=>{if(t===token)onPlaybackState('loading');};u.onresume=()=>{if(t===token)onPlaybackState('playing');};u.onend=()=>{if(t===token&&!settled){settled=true;onPlaybackState('idle');onComplete();}};u.onerror=()=>{if(t===token&&!settled){settled=true;onPlaybackState('idle');onError('设备声音未能播放，可重试或跳过。');}};try{synthesis.resume?.();synthesis.speak(u);onStart();return true;}catch{settled=true;onPlaybackState('idle');onError('设备声音未能播放，可跳过。');return false;}};
  if(voices().length)return speak();const unavailable=()=>{onPlaybackState('idle');onError(requireUS?'此试学词使用美音。设备没有可用的 en-US 声音，可跳过听音题。':'设备没有英语声音，可跳过听音题，或安装英语语音包。');};
  if(typeof synthesis.addEventListener!=='function'){unavailable();return false;}
  onLoading('正在等待设备加载英语声音…');const changed=()=>{speak();};synthesis.addEventListener('voiceschanged',changed);const timer=setTimeout(()=>{voiceCleanup?.();voiceCleanup=null;if(t===token&&!speak())unavailable();},3000);voiceCleanup=()=>{clearTimeout(timer);synthesis.removeEventListener?.('voiceschanged',changed);};return true;
 }
 function prefetchFile(url){if(!cache.has(url)&&!pending.has(url)&&pending.size>=2)return Promise.resolve(null);return prepareFile(url);}
 return {stop,playFile,playSpeech,prepareFile,prefetchFile};
}
