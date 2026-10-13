export const CORE_SKILLS=['meaning','listening','dictation','spelling'];
export function localDay(at){const d=new Date(at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function freshStrength(){return {version:1,skills:Object.fromEntries(CORE_SKILLS.map(s=>[s,{points:0,lastCreditDay:null}])),events:[]};}
export function validStrength(s){return s?.version===1&&(s.creditedIds===undefined||Array.isArray(s.creditedIds)&&s.creditedIds.every(id=>typeof id==='string'))&&(s.total===undefined||Number.isInteger(s.total)&&s.total>=0&&s.total<=100)&&CORE_SKILLS.every(k=>{const x=s.skills?.[k];return x&&Number.isInteger(x.points)&&x.points>=0&&x.points<=25&&x.points%5===0&&(x.lastCreditDay===null||/^\d{4}-\d{2}-\d{2}$/.test(x.lastCreditDay));})&&Array.isArray(s.events);}
export function seedStrength(record,at=Date.now()){const s=freshStrength();s.seeded=true;for(const skill of CORE_SKILLS){const r=record?.skills?.[skill];if(Number.isSafeInteger(r?.successes)&&r.successes>0&&!r.mistake){s.skills[skill]={points:5,lastCreditDay:localDay(Number.isFinite(r.lastAt)?r.lastAt:at)};}}return s;}
export function strengthScore(s){return validStrength(s)?(s.total??CORE_SKILLS.reduce((n,k)=>n+s.skills[k].points,0)):0;}
export function applyStrength(previous,{id,skill,rating,independent=false,assisted=false,practiceOnly=false,firstIndependent=false,at=Date.now()}){const s=validStrength(previous)?structuredClone(previous):freshStrength(),before=strengthScore(s),day=localDay(at);s.creditedIds??=s.events.filter(e=>e.delta>0).map(e=>e.id);if(s.creditedIds.includes(id)||s.events.some(e=>e.id===id))return {state:s,before,after:before,delta:0,reason:'duplicate'};const target=skill==='memory'||skill==='usage'?'meaning':skill;let reason='optional-skill',delta=0;
 s.total=before;
 if(CORE_SKILLS.includes(target)){
  const r=s.skills[target];
  if(rating==='again'||rating==='hard')reason=rating==='again'?'wrong-no-loss':'uncertain-no-loss';
  else if(rating==='good'){
   if(assisted||practiceOnly)reason='assisted';else if(before>=100)reason='total-cap';else{delta=Math.min(10,100-before);s.total+=delta;r.points=Math.min(25,r.points+delta);r.lastCreditDay=day;reason='independent-correct';}
  }
 }
 const after=strengthScore(s);if(delta>0)s.creditedIds.push(id);s.events.push({id,at,day,skill,rating,delta,reason,before,after});s.events=s.events.slice(-16);return {state:s,before,after,delta,reason};}

export function firstStrengthEligible(strength,record,skill){return CORE_SKILLS.includes(skill)&&validStrength(strength)&&strength.skills[skill].lastCreditDay===null&&strength.skills[skill].points===0&&(record?.reviews||0)===0&&(record?.successes||0)===0&&!record?.mistake&&!strength.events.some(e=>e.skill===skill&&(e.reason==='assisted'||['again','hard'].includes(e.rating)));}
