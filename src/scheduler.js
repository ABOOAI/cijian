/** One explainable engine: within-session steps and cross-day intervals, independently per skill. */
export const MINUTE=60000, DAY=86400000;
export const SKILLS=['meaning','listening','dictation','spelling','usage'];
export const LABELS={meaning:'翻译辨义',listening:'听力辨义',dictation:'听写',spelling:'默写',usage:'语境运用'};
export const DEFAULT_STEPS=[1,5];
const DAYS=[1,3,7,14,30,60];
export function fresh(){return {phase:'new',step:0,level:0,dueAt:null,lastAt:null,reviews:0,successes:0,lapses:0,mistake:false,clearStreak:0};}
export function valid(r){return r&&['new','short','long'].includes(r.phase)&&['step','level','reviews','successes','lapses','clearStreak'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)&&r.step<=1&&r.level<=5&&(r.dueAt===null||Number.isFinite(r.dueAt)&&r.dueAt>=0)&&(r.lastAt===null||Number.isFinite(r.lastAt)&&r.lastAt>=0)&&typeof r.mistake==='boolean';}
export function schedule(previous,rating,now,{assisted=false,steps=DEFAULT_STEPS}={}){
  if(!Number.isFinite(now)||!['again','hard','good','exposed'].includes(rating))throw Error('Invalid review');
  const r=valid(previous)?{...previous}:fresh();
  if(rating==='exposed'||assisted){
    if(r.phase!=='new')return {record:r,accepted:false,independent:false};
    return {record:{...r,phase:'short',dueAt:now+steps[0]*MINUTE,lastAt:now},accepted:true,independent:false};
  }
  if(r.dueAt>now&&rating!=='again')return {record:r,accepted:false,independent:false};
  r.reviews++;r.lastAt=now;
  if(rating==='again'){r.phase='short';r.step=0;r.level=Math.max(0,r.level-1);r.dueAt=now+steps[0]*MINUTE;r.lapses++;r.mistake=true;r.clearStreak=0;}
  else if(rating==='hard'){r.phase='short';r.step=0;r.dueAt=now+steps[0]*MINUTE;r.clearStreak=0;}
  else{r.successes++;r.clearStreak++;if(r.clearStreak>=2)r.mistake=false;
    if(r.phase==='long'){r.level=Math.min(5,r.level+1);r.dueAt=now+DAYS[r.level]*DAY;}
    else if(r.phase==='new'||r.step===0){r.phase='short';r.step=1;r.dueAt=now+steps[1]*MINUTE;}
    else{r.phase='long';r.dueAt=now+DAYS[r.level]*DAY;}
  }
  return {record:r,accepted:true,independent:true};
}
export function dueItems(words,records,now,skill){return words.flatMap(w=>SKILLS.filter(s=>!skill||s===skill).map(s=>({wordId:w.id,skill:s,record:records[w.id]?.skills?.[s]}))).filter(i=>valid(i.record)&&i.record.dueAt!==null&&i.record.dueAt<=now).sort((a,b)=>a.record.dueAt-b.record.dueAt);}
export function mistakeItems(words,records,skill){return words.flatMap(w=>SKILLS.filter(s=>!skill||s===skill).map(s=>({wordId:w.id,skill:s,record:records[w.id]?.skills?.[s]}))).filter(i=>valid(i.record)&&i.record.mistake).sort((a,b)=>b.record.lapses-a.record.lapses);}
export function migrate(legacy){const records={};for(const [id,r]of Object.entries(legacy||{})){if(!r||!Number.isFinite(r.reviews)||r.reviews<1)continue;records[id]={introduced:true,skills:{meaning:{...fresh(),phase:r.intervalDays<1?'short':'long',level:Math.max(0,DAYS.findIndex(d=>d>=(r.intervalDays||1))),dueAt:Number.isFinite(r.dueAt)?r.dueAt:0,lastAt:r.lastReviewed||0,reviews:r.reviews,successes:0,lapses:r.wrongCount||0,mistake:!!r.mistake,clearStreak:0}},legacy:{...r}};}return records;}
