/** Replay only a deliberate Control-alone press/release; never claim browser editing chords. */
export function createControlReplay({isEnabled,getContext,onReplay}){
 let armed=false,blocked=false,context=null,composing=false;const keys=new Set();
 const reset=()=>{armed=false;blocked=false;context=null;keys.clear();};
 function keydown(event){
  if(event.key==='Control'){
   if(event.repeat){if(armed)blocked=true;return;}
   armed=true;context=getContext();blocked=composing||event.isComposing||event.altKey||event.shiftKey||event.metaKey||event.defaultPrevented||keys.size>0||!isEnabled();return;
  }
  keys.add(event.code||event.key);if(armed||event.ctrlKey)blocked=true;
 }
 function keyup(event){
  if(event.key!=='Control'){keys.delete(event.code||event.key);return;}
  const replay=armed&&!blocked&&!composing&&!event.isComposing&&!event.repeat&&!event.altKey&&!event.shiftKey&&!event.metaKey&&!event.defaultPrevented&&isEnabled()&&context===getContext();
  reset();if(replay)onReplay();
 }
 return {keydown,keyup,reset,pointerdown(){if(armed)blocked=true;},compositionstart(){composing=true;reset();},compositionend(){composing=false;reset();}};
}
/** Decorative cross-fade: route state and inputs change immediately, with no awaited animation. */
export function createPageTransitions({document,matchMedia}={}){
 let ghost=null,animations=[];
 const reduced=()=>!!matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function clear(){for(const animation of animations)try{animation.cancel();}catch{}animations=[];ghost?.remove();ghost=null;}
 function capture(page){clear();if(!page||reduced()||typeof page.animate!=='function')return;const rect=page.getBoundingClientRect();if(!rect.width||!rect.height)return;
  ghost=page.cloneNode(true);ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));ghost.querySelectorAll('dialog').forEach(el=>el.remove());ghost.className='route-ghost';ghost.setAttribute('aria-hidden','true');ghost.inert=true;Object.assign(ghost.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,maxHeight:`${Math.min(rect.height,document.defaultView.innerHeight)}px`});document.body.append(ghost);
 }
 function enter(page){if(reduced()||!page||typeof page.animate!=='function'){clear();return;}const old=ghost;
  if(old){const exit=old.animate([{opacity:.35,transform:'translateY(0)'},{opacity:0,transform:'translateY(-3px)'}],{duration:90,easing:'ease-out'});exit.onfinish=()=>{old.remove();if(ghost===old)ghost=null;};animations.push(exit);}
  animations.push(page.animate([{opacity:.65,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:160,easing:'ease-out'}));
 }
 return {capture,enter,clear};
}
