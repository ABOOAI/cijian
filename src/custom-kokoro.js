// Local-only Kokoro synthesis: stable voice assignment and bounded browser audio cache.
// Text is sent only to this origin's dedicated Web Worker, never a remote TTS API.
const VOICE_KEY='word-garden.kokoro-voices.v1',CACHE_NAME='word-garden.kokoro-audio.v1';
const VOICES=['af_heart','am_michael'];
export function createCustomKokoro({player,storage=globalThis.localStorage,WorkerCtor=globalThis.Worker,cacheStorage=globalThis.caches,cryptoAPI=globalThis.crypto,timeoutMs=240000,maxCached=64}={}){
 let epoch=0,worker=null,serial=0;const requests=new Map(),inflight=new Map(),memory=new Map();
 let voiceState={next:0,items:{}};
 try{const x=JSON.parse(storage?.getItem(VOICE_KEY)||'null');if(x&&Number.isSafeInteger(x.next)&&x.next>=0&&x.items&&typeof x.items==='object'&&!Array.isArray(x.items))voiceState={next:x.next,items:Object.fromEntries(Object.entries(x.items).filter(([,v])=>VOICES.includes(v)))};}catch{}
 function voiceFor(id){const key=String(id||'custom');if(Object.hasOwn(voiceState.items,key))return voiceState.items[key];const voice=VOICES[voiceState.next++%2];Object.defineProperty(voiceState.items,key,{value:voice,writable:true,enumerable:true,configurable:true});try{storage?.setItem(VOICE_KEY,JSON.stringify(voiceState));}catch{}return voice;}
 function stop(){epoch++;}
 function rejectWorker(message){for(const r of requests.values()){clearTimeout(r.timer);r.reject(new Error(message));}requests.clear();worker?.terminate();worker=null;}
 function getWorker(){if(worker)return worker;if(typeof WorkerCtor!=='function')throw new Error('此浏览器不支持本机 Kokoro。请使用新版浏览器后重试，或跳过听音题。');worker=new WorkerCtor(new URL('./kokoro-worker.js',import.meta.url),{type:'module'});worker.onmessage=event=>{const data=event.data||{},r=requests.get(data.id);if(!r)return;if(data.progress){r.progress(String(data.progress));return;}clearTimeout(r.timer);requests.delete(data.id);if(data.error)r.reject(new Error(String(data.error)));else if(data.audio instanceof ArrayBuffer&&data.audio.byteLength>44)r.resolve(new Blob([data.audio],{type:'audio/wav'}));else r.reject(new Error('Kokoro 未返回有效音频，请重试。'));};worker.onerror=()=>rejectWorker('Kokoro 模型或运行库加载失败，请检查网络后重试；没有改用设备声音。');return worker;}
 async function keyFor(text,voice){const bytes=new TextEncoder().encode(`kokoro-82m-v1-q8-speed0.9\n${voice}\n${text}`);if(!cryptoAPI?.subtle)return null;const digest=await cryptoAPI.subtle.digest('SHA-256',bytes);return new URL('/__local_kokoro__/'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join(''),globalThis.location?.origin||'https://local.invalid').href;}
 async function cached(key){if(!key)return null;if(memory.has(key)){const b=memory.get(key);memory.delete(key);memory.set(key,b);return b;}try{const c=await cacheStorage?.open(CACHE_NAME),r=await c?.match(key);if(r){const b=await r.blob();if(b.size>44&&b.type==='audio/wav')return b;}}catch{}return null;}
 async function remember(key,blob){if(!key)return;memory.set(key,blob);while(memory.size>maxCached)memory.delete(memory.keys().next().value);try{const c=await cacheStorage?.open(CACHE_NAME);if(!c)return;await c.put(key,new Response(blob,{headers:{'content-type':'audio/wav'}}));const keys=await c.keys();for(const old of keys.slice(0,Math.max(0,keys.length-maxCached)))await c.delete(old);}catch{/* Quota/private-mode failures affect cache only, not playback or learning records. */}}
 function synthesize(text,voice,progress){const w=getWorker(),id=++serial;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>rejectWorker('Kokoro 下载或生成超时，请检查网络后重试；听音题尚未解锁。'),timeoutMs);timer.unref?.();requests.set(id,{resolve,reject,progress,timer});w.postMessage({id,text,voice});});}
 async function play(text,{id,...hooks}={}){
  stop();player.stop();const ticket=epoch,alive=()=>ticket===epoch;
  const safe={onLoading:message=>{if(alive())hooks.onLoading?.(message);},onStart:()=>{if(alive())hooks.onStart?.();},onComplete:()=>{if(alive())hooks.onComplete?.();},onError:message=>{if(alive())hooks.onError?.(message);}};
  text=String(text||'').trim();if(!text||text.length>1200){safe.onError('Kokoro 朗读内容为空或过长，请缩短后重试。');return false;}
  const voice=voiceFor(id||'text:'+text);safe.onLoading(`正在准备 Kokoro ${voice==='af_heart'?'女声':'男声'}美音；首次需下载本机模型，之后缓存复用…`);
  try{const key=await keyFor(text,voice);let blob=await cached(key);if(!alive())return false;
   if(!blob){const pendingKey=key||voice+'\n'+text;if(!inflight.has(pendingKey)){const p=synthesize(text,voice,safe.onLoading).then(async b=>{await remember(key,b);return b;}).finally(()=>inflight.delete(pendingKey));inflight.set(pendingKey,p);}blob=await inflight.get(pendingKey);}
   if(!alive())return false;safe.onLoading('Kokoro 整段美音已生成，正在播放…');return await player.playBlob(blob,{...hooks,...safe});
  }catch(error){safe.onError(error?.message||'Kokoro 生成失败，请重试；没有自动切换设备声音。');return false;}
 }
 return {play,stop,voiceFor};
}
