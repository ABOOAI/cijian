import test from 'node:test';
import assert from 'node:assert/strict';
import {createCustomKokoro} from '../src/custom-kokoro.js';
import {webcrypto} from 'node:crypto';
const settle=async()=>{for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));};
const waitFor=async(check)=>{for(let i=0;i<200;i++){if(check())return;await new Promise(r=>setTimeout(r,5));}assert.fail('timed out waiting for controller callback');};
const wav=()=>{const b=new ArrayBuffer(48),v=new DataView(b);for(const [offset,text] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])for(let i=0;i<text.length;i++)v.setUint8(offset+i,text.charCodeAt(i));v.setUint32(4,40,true);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,24000,true);v.setUint32(28,48000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);v.setUint32(40,4,true);return b;};
function harness({storage=new Map(),...config}={}){
 const workers=[],plays=[],speech=[],errors=[],started=[],completed=[],loading=[];
 class Worker {constructor(url,options){this.url=url;this.options=options;this.messages=[];this.listeners={};workers.push(this);}postMessage(message){this.messages.push(message);}terminate(){this.terminated=true;}addEventListener(name,fn){this.listeners[name]=fn;}removeEventListener(name){delete this.listeners[name];}respond(data){const e={data};this.onmessage?.(e);this.listeners.message?.(e);}}
 const player={stop(){},playBlob:async(blob,options)=>{plays.push({blob,options});return true;},playSpeech(...args){speech.push(args);}};
 const local={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 const controller=createCustomKokoro({player,storage:local,WorkerCtor:Worker,cacheStorage:null,urlAPI:URL,cryptoAPI:webcrypto,...config});
 const play=(text='I like rice.',id='custom-sentence-rice')=>controller.play(text,{id,onComplete:()=>completed.push(id),onError:m=>errors.push(m),onStart:()=>started.push(id),onLoading:m=>loading.push(m)});
 const pending=()=>workers.flatMap(w=>w.messages.map(message=>({worker:w,message}))).at(-1);
 const respond=async(audio=wav())=>{const request=pending();assert.ok(request,'generation request');request.worker.respond({id:request.message.id,audio});await settle();};
 return {controller,workers,plays,speech,errors,started,completed,loading,play,pending,respond,storage};
}

test('Kokoro generates a WAV and completion is gated on real player completion rather than generation',async()=>{
 const t=harness();const promise=t.play();await waitFor(()=>t.pending());assert.equal(t.plays.length,0);assert.equal(t.completed.length,0);await t.respond();await promise;
 assert.equal(t.plays.length,1);assert.equal(t.plays[0].blob.type,'audio/wav');assert.ok(t.plays[0].blob.size>44);assert.equal(t.completed.length,0);assert.equal(t.speech.length,0);
 t.plays[0].options.onStart();assert.equal(t.started.length,1);assert.equal(t.completed.length,0);t.plays[0].options.onComplete();assert.equal(t.completed.length,1);t.controller.stop();
});

test('Kokoro voice choice is stable for an identity across calls and controller instances',()=>{
 const t=harness();const voice=t.controller.voiceFor('custom-one');assert.match(voice,/^(af_heart|am_michael)$/);assert.equal(t.controller.voiceFor('custom-one'),voice);
 const other=harness({storage:t.storage});assert.equal(other.controller.voiceFor('custom-one'),voice);t.controller.stop();other.controller.stop();
});

test('Kokoro reuses generated text and voice audio rather than regenerating on replay',async()=>{
 const t=harness();const first=t.play();await waitFor(()=>t.pending());await t.respond();await first;const count=t.workers.reduce((n,w)=>n+w.messages.length,0);t.plays[0].options.onComplete();
 await t.play();await settle();assert.equal(t.workers.reduce((n,w)=>n+w.messages.length,0),count);assert.equal(t.plays.length,2);assert.equal(t.speech.length,0);t.controller.stop();
});

test('Kokoro generation failure is explicit and never silently falls back to device speech',async()=>{
 const t=harness();const promise=t.play();await waitFor(()=>t.pending());const r=t.pending();r.worker.respond({id:r.message.id,error:'QA generation failed'});await promise;await settle();assert.equal(t.errors.length,1);assert.equal(t.plays.length,0);assert.equal(t.completed.length,0);assert.equal(t.speech.length,0);t.controller.stop();
});

test('stopping pending generation ignores late audio and cannot complete a stale answer',async()=>{
 const t=harness();const promise=t.play();await waitFor(()=>t.pending());const r=t.pending();t.controller.stop();r.worker.respond({id:r.message.id,audio:wav()});await settle();assert.equal(t.plays.length,0);assert.equal(t.completed.length,0);assert.equal(t.errors.length,0);
});

test('a newer request invalidates an older generation response and stale playback callbacks',async()=>{
 const t=harness();t.play('First sentence.','first');await waitFor(()=>t.pending());const old=t.pending();const newer=t.play('Second sentence.','second');await waitFor(()=>t.pending()?.message.id!==old.message.id);const current=t.pending();
 old.worker.respond({id:old.message.id,audio:wav()});await settle();assert.equal(t.plays.length,0);current.worker.respond({id:current.message.id,audio:wav()});await settle();await newer;assert.equal(t.plays.length,1);const callbacks=t.plays[0].options;t.controller.stop();callbacks.onComplete();callbacks.onStart();assert.equal(t.completed.length,0);assert.equal(t.started.length,0);
});

test('generation timeout and malformed audio stay locked without device fallback',async()=>{
 const timeout=harness({timeoutMs:10});timeout.play();await waitFor(()=>timeout.errors.length);assert.match(timeout.errors[0],/超时/);assert.equal(timeout.speech.length,0);assert.equal(timeout.completed.length,0);timeout.controller.stop();
 const bad=harness();const request=bad.play();await waitFor(()=>bad.pending());await bad.respond(new ArrayBuffer(8));await request;assert.equal(bad.errors.length,1);assert.equal(bad.plays.length,0);assert.equal(bad.speech.length,0);bad.controller.stop();
});

test('changed text with the same stable identity regenerates without changing its voice',async()=>{
 const t=harness();const first=t.play('Original sentence.');await waitFor(()=>t.pending());const voice=t.pending().message.voice;await t.respond();await first;
 const second=t.play('Edited sentence.');await waitFor(()=>t.pending().message.text==='Edited sentence.');assert.equal(t.pending().message.voice,voice);await t.respond();await second;assert.equal(t.plays.length,2);t.controller.stop();
});

test('real audio controller plays generated blobs directly and only ended completes; stop revokes and invalidates',async()=>{
 const {createAudioController}=await import('../src/audio.js');const media=[],revoked=[],events=[];let completed=0;
 const player=createAudioController({AudioCtor:class{constructor(src){this.src=src;media.push(this);}play(){return Promise.resolve();}pause(){}},fetchImpl:()=>{throw Error('generated blob must not be re-fetched');},urlAPI:{createObjectURL:()=>`blob:generated-${media.length}`,revokeObjectURL:url=>revoked.push(url)},onPlaybackState:s=>events.push(s)});
 assert.equal(await player.playBlob(new Blob([wav()],{type:'audio/wav'}),{onComplete:()=>completed++}),true);assert.equal(completed,0);assert.ok(events.includes('playing'));media[0].onended();assert.equal(completed,1);assert.ok(revoked.includes(media[0].src));
 await player.playBlob(new Blob([wav()],{type:'audio/wav'}),{onComplete:()=>completed++});const oldEnd=media[1].onended;player.stop();oldEnd();assert.equal(completed,1);assert.ok(revoked.includes(media[1].src));
});
