import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudioController} from '../src/audio.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function setup({voices=[{lang:'en-GB'},{lang:'en-US'}],delayed=false,...options}={}){
 let list=voices,listener;const calls=[],events=[],utterances=[];
 const synthesis={getVoices:()=>list,cancel:()=>calls.push('cancel'),speak:u=>utterances.push(u)};
 if(delayed){synthesis.addEventListener=(_name,fn)=>listener=fn;synthesis.removeEventListener=()=>listener=null;}
 const player=createAudioController({synthesis,UtteranceCtor:class{constructor(text){this.text=text;}},onPlaybackState:s=>events.push(s),...options});
 const result={started:0,complete:0,errors:[]};
 const play=()=>player.playSpeech('My custom sentence.',{requireUS:true,onStart:()=>result.started++,onComplete:()=>result.complete++,onError:m=>result.errors.push(m)});
 return {player,result,play,utterances,calls,events,synthesis,setVoices:v=>list=v,voiceChanged:()=>listener?.(),get listener(){return listener;}};
}
test('custom speech requires US voice and does not claim success from speak alone',()=>{
 const t=setup();t.play();const u=t.utterances[0];assert.equal(u.voice.lang,'en-US');assert.equal(u.lang,'en-US');assert.equal(t.result.started,0);assert.equal(t.result.complete,0);u.onstart();u.onstart();assert.equal(t.result.started,1);assert.equal(t.result.complete,0);u.onend();u.onend();assert.equal(t.result.complete,1);assert.deepEqual(t.result.errors,[]);t.player.stop();
});
test('British-only or missing voices never silently substitute for US',()=>{
 for(const voices of [[{lang:'en-GB'}],[{lang:'zh-CN'}],[]]){const t=setup({voices});assert.equal(t.play(),false);assert.equal(t.utterances.length,0);assert.match(t.result.errors[0],/en-US.*美国/);assert.equal(t.result.complete,0);}
});
test('US voice can load later; stale voiceschanged cannot start duplicate speech',()=>{
 const t=setup({voices:[],delayed:true});t.play();const stale=t.listener;t.setVoices([{lang:'en_US'}]);t.voiceChanged();stale();assert.equal(t.utterances.length,1);assert.equal(t.utterances[0].voice.lang,'en_US');t.player.stop();stale();assert.equal(t.utterances.length,1);
});
test('no start event times out once and late end cannot unlock listening',async()=>{
 const t=setup({timeoutMs:5,speechEndTimeoutMs:100});t.play();const u=t.utterances[0];await wait(15);assert.match(t.result.errors[0],/启动超时/);u.onstart();u.onend();u.onerror();assert.equal(t.result.started,0);assert.equal(t.result.complete,0);assert.equal(t.result.errors.length,1);
});
test('start without end has bounded failure; late completion remains invalid',async()=>{
 const t=setup({timeoutMs:50,speechEndTimeoutMs:5});t.play();const u=t.utterances[0];u.onstart();await wait(15);assert.match(t.result.errors[0],/未能完整结束/);u.onend();assert.equal(t.result.started,1);assert.equal(t.result.complete,0);assert.equal(t.result.errors.length,1);
});
test('end without confirmed start is not counted as successful audio',()=>{
 const t=setup();t.play();t.utterances[0].onend();assert.equal(t.result.complete,0);assert.match(t.result.errors[0],/未确认朗读开始/);t.player.stop();
});
test('speech permission error is explicit and never completes',()=>{
 const t=setup();t.play();const u=t.utterances[0];u.onerror({error:'not-allowed'});u.onend();assert.match(t.result.errors[0],/阻止.*朗读按钮/);assert.equal(t.result.complete,0);
});
test('replay and navigation invalidate all old speech events and timeouts',async()=>{
 const t=setup({timeoutMs:5,speechEndTimeoutMs:10});t.play();const old=t.utterances[0];t.play();const fresh=t.utterances[1];old.onstart();old.onend();old.onerror();assert.equal(t.result.started,0);assert.equal(t.result.complete,0);assert.equal(t.result.errors.length,0);fresh.onstart();fresh.onend();t.player.stop();await wait(20);assert.equal(t.result.started,1);assert.equal(t.result.complete,1);assert.equal(t.result.errors.length,0);
});
test('waiting for missing US voices has bounded error and no speech',async()=>{
 const t=setup({voices:[{lang:'en-GB'}],delayed:true,timeoutMs:5});t.play();await wait(15);assert.equal(t.utterances.length,0);assert.match(t.result.errors[0],/en-US/);assert.equal(t.listener,null);
});
test('synchronous voice-service failure is reported once',()=>{
 const t=setup();t.synthesis.speak=()=>{throw Error('service unavailable');};assert.equal(t.play(),false);assert.equal(t.result.started,0);assert.equal(t.result.complete,0);assert.equal(t.result.errors.length,1);t.player.stop();
});
