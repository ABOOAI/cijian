import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createLetterAudio,letterClipPath,typedLetter} from '../src/letter-audio.js';

const input=(data,currentTarget={},other={})=>({inputType:'insertText',data,currentTarget,...other});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function rig(){
 const started=[],stopped=[],requests=[];
 let unblock=()=>{};
 class Context{
  state='suspended';
  destination={};
  resume(){this.state='running';return Promise.resolve();}
  async decodeAudioData(data){return new Uint8Array(data)[0];}
  createBufferSource(){return {connect(){},disconnect(){},start(){started.push(String.fromCharCode(this.buffer));unblock=()=>this.onended?.();},stop(){stopped.push(String.fromCharCode(this.buffer));}};}
 }
 const fetchImpl=async url=>{
  assert.equal(url.searchParams.get('v'),'ipa-full-1','new assets bypass old browser cache');
  const letter=url.pathname.match(/letter-([a-z])\.mp3$/)[1];
  requests.push(letter);
  return {ok:true,arrayBuffer:async()=>Uint8Array.of(letter.charCodeAt(0)).buffer};
 };
 return {audio:createLetterAudio({Context,fetchImpl}),started,stopped,requests,finish:()=>unblock()};
}
test('reads ASCII letter names only for single typed characters',()=>{
 assert.equal(typedLetter(input('A')),'a');
 assert.equal(typedLetter(input('z')),'z');
 for(const e of [input(' '),input('.'),input('1'),input('好'),input('apple'),input('',{}, {inputType:'deleteContentBackward'}),input('A',{}, {inputType:'insertFromPaste'}),input('a',{}, {isComposing:true}),input('e',{}, {inputType:'insertCompositionText'}),input('x',{}, {inputType:'historyUndo'})])assert.equal(typedLetter(e),null);
});
test('fast typing queues every letter in order, including consecutive duplicates',async()=>{
 const {audio,started,requests,finish}=rig();audio.prepare();
 for(const letter of 'aPPle')audio.playInput(input(letter));
 await tick();assert.deepEqual(started,['a']);
 for(const letter of 'pple'){finish();await tick();assert.equal(started.at(-1),letter);}
 finish();assert.deepEqual(started,['a','p','p','l','e']);assert.equal(requests.length,26);assert.equal(new Set(requests).size,26);
});
test('leaving or replaying cancels active and pending typing sounds, never playing into the next question',async()=>{
 const {audio,started,stopped,finish}=rig();
 audio.playInput(input('a'));audio.playInput(input('p'));await tick();
 audio.stop();audio.playInput(input('b'));await tick();
 assert.deepEqual(started,['a','b']);assert.deepEqual(stopped,['a']);finish();await tick();
 audio.playInput(input('x',{disabled:true}));audio.playInput(input('y',{isConnected:false}));await tick();assert.deepEqual(started,['a','b']);
});
test('all 26 letter clips are packaged and ready without loading a model',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../audio/letter-ipa-manifest.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(manifest).length,26);
 assert.equal(manifest.P.ipa,'piː');assert.equal(manifest.E.ipa,'iː');
 for(const letter of 'abcdefghijklmnopqrstuvwxyz'){
  const clip=await readFile(new URL('../'+letterClipPath(letter),import.meta.url));
  const entry=manifest[letter.toUpperCase()];
  assert.equal(entry.filename,'letter-'+letter+'.mp3');
  assert.ok(entry.duration_ms>=1200,letter);
  assert.equal(createHash('sha256').update(clip).digest('hex'),entry.sha256,'exact approved clip '+letter);
 }
});
