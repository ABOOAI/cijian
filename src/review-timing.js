export const WORD_REST_MS=30*60*1000;
export function restUntil(cooldowns,id){const value=cooldowns?.[id];return Number.isFinite(value)&&value>=0?value:0;}
export function isResting(cooldowns,id,at=Date.now()){return restUntil(cooldowns,id)>at;}
export function effectiveDue(record,cooldowns,id){return record?.dueAt===null||record?.dueAt===undefined?null:Math.max(record.dueAt,restUntil(cooldowns,id));}
export function restedCooldown(cooldowns,id,at=Date.now()){return {...cooldowns,[id]:Math.max(restUntil(cooldowns,id),at+WORD_REST_MS)};}
