// Offline-capable, same-origin Kokoro-82M v1.0 synthesis. Custom text remains
// inside this worker; no synthesis API, device voice or remote text request.
const ROOT=new URL('../vendor/kokoro/',import.meta.url);
const nativeFetch=globalThis.fetch.bind(globalThis);
let currentId=null,ttsPromise=null,queue=Promise.resolve();
const progress=message=>{if(currentId!==null)postMessage({id:currentId,progress:message});};
async function asset(relative){
 const url=new URL(relative,ROOT).href;
 let cache;try{cache=await caches.open('cijian-kokoro-model-q8-v1');const hit=await cache.match(url);if(hit)return hit;}catch{}
 const response=await nativeFetch(url,{credentials:'same-origin',cache:'force-cache'});
 if(!response.ok)throw new Error(`Kokoro 资源下载失败（${response.status}），请检查网络后重试。`);
 if(cache)try{await cache.put(url,response.clone());}catch{}
 return response;
}
async function assembled(folder,type){
 const manifest=await (await asset(folder+'chunks.json')).json(),parts=[];let loaded=0;
 for(const chunk of manifest.chunks){progress(`首次准备 Kokoro 美音资源：${Math.round(loaded/manifest.bytes*100)}%（约${Math.ceil(manifest.bytes/1048576)} MB，仅首次下载）`);const data=await (await asset(folder+chunk.file)).arrayBuffer();if(data.byteLength!==chunk.bytes)throw new Error('Kokoro 资源分片不完整，请重试。');const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');if(digest!==chunk.sha256){try{const cache=await caches.open('cijian-kokoro-model-q8-v1');await cache.delete(new URL(folder+chunk.file,ROOT).href);}catch{}throw new Error('Kokoro 资源校验失败，已移除损坏缓存，请重试。');}parts.push(data);loaded+=data.byteLength;}
 progress('正在本机初始化 Kokoro 美音模型…');
 return new Response(new Blob(parts),{headers:{'content-type':type,'content-length':String(loaded)}});
}
// Transformers' upstream filenames are mapped to pinned local artifacts. This
// wrapper is worker-local and rejects unrecognised external network requests.
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input.url||String(input),ROOT);
 if(url.hostname==='huggingface.co'){
  const match=url.pathname.match(/^\/onnx-community\/Kokoro-82M-v1\.0-ONNX\/resolve\/(?:main|1939ad2a8e416c0acfeecc08a694d14ef25f2231)\/(.+)$/);
  if(!match)throw new Error('Kokoro 拒绝了非预期的资源地址。');
  const name=match[1];
  if(name==='onnx/model_quantized.onnx'){
   return assembled('model/','application/octet-stream');
  }
  if(['config.json','tokenizer.json','tokenizer_config.json','voices/af_heart.bin','voices/am_michael.bin'].includes(name))return asset('model/'+name);
  return new Response('Not found',{status:404});
 }
 if(url.href===new URL('wasm/ort-wasm-simd-threaded.jsep.wasm',ROOT).href)return assembled('wasm/','application/wasm');
 if(url.origin!==ROOT.origin)throw new Error('Kokoro 仅允许读取本站模型资源。');
 return nativeFetch(input,init);
};
async function loadTTS(){
 if(!ttsPromise)ttsPromise=(async()=>{progress('正在准备 Kokoro 本机美音（首次需下载模型）…');const {KokoroTTS,env}=await import('../vendor/kokoro/kokoro.web.js');env.wasmPaths=new URL('wasm/',ROOT).href;return KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'wasm'});})().catch(error=>{ttsPromise=null;throw error;});
 return ttsPromise;
}
function wav(samples,rate=24000){
 const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);
 const str=(offset,value)=>{for(let i=0;i<value.length;i++)v.setUint8(offset+i,value.charCodeAt(i));};
 str(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i]))throw new Error('Kokoro 生成了无效音频，请重试。');const x=Math.max(-1,Math.min(1,samples[i]));v.setInt16(44+i*2,Math.round(x*(x<0?32768:32767)),true);}return buffer;
}
self.onmessage=({data})=>{
 const {id,text,voice}=data||{};
 queue=queue.then(async()=>{currentId=id;try{
  if(typeof text!=='string'||!text.trim()||text.length>1200||!['af_heart','am_michael'].includes(voice))throw new Error('Kokoro 朗读参数无效。');
  const tts=await loadTTS();progress('正在本机生成 Kokoro 美音…');
  // Lossless bounded chunks: preserve punctuation and every token, including
  // abbreviations and punctuation without following spaces. Bound each input
  // well below the model's 510-phoneme context rather than truncate silently.
  const chunks=[];let chunk='';
  for(const token of text.trim().match(/\S+\s*/g)||[]){
   if(chunk.length+token.length>120&&chunk){chunks.push(chunk.trim());chunk='';}
   if(token.length>120){if(chunk){chunks.push(chunk.trim());chunk='';}for(let i=0;i<token.length;i+=120)chunks.push(token.slice(i,i+120).trim());}
   else chunk+=token;
  }
  if(chunk.trim())chunks.push(chunk.trim());
  const samples=[];
  for(const chunk of chunks){const result=await tts.generate(chunk.trim(),{voice,speed:.9});if(!result.audio?.length)throw new Error('Kokoro 未生成有效音频，请重试。');samples.push(result.audio);}
  const joined=new Float32Array(samples.reduce((n,x)=>n+x.length,0));let offset=0;for(const sample of samples){joined.set(sample,offset);offset+=sample.length;}
  const audio=wav(joined);postMessage({id,audio,voice,engine:'Kokoro-82M-v1.0-q8',sampleRate:24000},[audio]);
 }catch(error){postMessage({id,error:error?.message||'Kokoro 本机生成失败，请重试。'});}finally{currentId=null;}});
};
