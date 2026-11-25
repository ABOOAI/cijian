// Typing feedback is separate from assessment audio. It only reads the letter
// the learner just entered, never the expected answer or a restored draft.
const letterAudioRevision='ipa-full-1';
const alphabet='abcdefghijklmnopqrstuvwxyz';
export const letterClipPath=letter=>`audio/letter-${letter}.mp3`;
export function typedLetter(event){
 if(event?.isComposing||event?.inputType!=='insertText'||typeof event.data!=='string'||!/^[a-z]$/i.test(event.data))return null;
 return event.data.toLowerCase();
}
export function createLetterAudio({
 Context=globalThis.AudioContext||globalThis.webkitAudioContext,
 fetchImpl=globalThis.fetch?.bind(globalThis),
}={}){
 let context=null, active=null, epoch=0, tail=Promise.resolve();
 const clips=new Map(), decoded=new Map();
 function load(letter){
  if(!clips.has(letter)){
   const promise=Promise.resolve().then(async()=>{
    const url=new URL('../'+letterClipPath(letter),import.meta.url);
    url.searchParams.set('v',letterAudioRevision);
    const response=await fetchImpl(url,{credentials:'same-origin',cache:'force-cache'});
    if(!response.ok)throw new Error('Letter audio unavailable');
    return response.arrayBuffer();
   }).catch(error=>{clips.delete(letter);throw error;});
   clips.set(letter,promise);
  }
  return clips.get(letter);
 }
 function prepare(){
  if(typeof Context!=='function'||!fetchImpl)return;
  for(const letter of alphabet)load(letter).catch(()=>{});
 }
 function buffer(letter,ctx){
  if(!decoded.has(letter)){
   const promise=load(letter).then(data=>ctx.decodeAudioData(data.slice(0))).catch(error=>{decoded.delete(letter);throw error;});
   decoded.set(letter,promise);
  }
  return decoded.get(letter);
 }
 function playInput(event){
  const letter=typedLetter(event),field=event?.currentTarget;
  if(!letter||!field||field.disabled||typeof Context!=='function'||!fetchImpl)return;
  let ctx,ready;
  try{
   ctx=context??=new Context();
   // Resume synchronously in the real input gesture, before fetching/decoding.
   ready=ctx.state==='running'?Promise.resolve():Promise.resolve(ctx.resume());
  }catch{return;}
  const request=epoch;
  const audio=Promise.all([ready,buffer(letter,ctx)]).catch(()=>null);
  tail=tail.then(async()=>{
   const result=await audio;
   if(!result||request!==epoch||field.isConnected===false||field.disabled)return;
   await new Promise(resolve=>{
    const source=ctx.createBufferSource();
    const finish=()=>{if(active?.source===source)active=null;source.disconnect();resolve();};
    source.buffer=result[1];source.connect(ctx.destination);source.onended=finish;
    active={source,finish};
    try{source.start();}catch{finish();}
   });
  }).catch(()=>{});
 }
 function stop(){
  epoch++;tail=Promise.resolve();
  if(!active)return;
  const {source,finish}=active;source.onended=null;
  try{source.stop();}catch{}
  finish();
 }
 return {prepare,playInput,stop};
}
