// Reuse authoring IDs, text and recordings. This adapter never imports historical
// dictation results as mastery and never splits sentences into word records.
export function builtinSentenceWords(bank={groups:[]}){
 const seen=new Set();
 return (bank.groups||[]).flatMap(group=>(group.items||[]).flatMap(item=>{
  if(!item.id||seen.has(item.id))return [];
  seen.add(item.id);
  return [{...item,unitId:group.unitId,group:group.unitLabelZh||group.titleZh,
   status:'sentence',customSentence:true,ipa:'',hint:'先理解整句，再盖住英语按词序回忆。',
   acceptedAnswers:item.acceptedAnswers||[],sourceLabel:item.sourceLabel||group.sourceLabel||'现有句库'}];
 }));
}
