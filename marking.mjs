export const MARKING_VERSION='20261020-strict-1';
export function normaliseAnswer(value){return String(value??'').normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[.,!?;]+$/g,'').replace(/\s+/g,' ');}
export function validRule(rule){return !!rule&&typeof rule==='object'&&!Array.isArray(rule)&&['words','number','mixed'].includes(rule.kind)&&Number.isInteger(rule.maxWords)&&rule.maxWords>=0&&rule.maxWords<=5&&Number.isInteger(rule.maxNumbers)&&rule.maxNumbers>=0&&rule.maxNumbers<=2;}
export function answerUnits(value){
 const text=normaliseAnswer(value);
 // A clock time, decimal or grouped integer is one numeric entry. Adjacent
 // am/pm still counts as a word. Hyphenated words remain single words.
 const numbers=text.match(/\d+(?:(?:[,:.]\d+))*/g)||[];
 const remainder=text.replace(/\d+(?:(?:[,:.]\d+))*/g,' ').trim();
 const words=remainder?remainder.split(/\s+/).filter(token=>/[\p{L}]/u.test(token)):[];
 return {words:words.length,numbers:numbers.length};
}
export function markAnswer(q,value){
 const text=normaliseAnswer(value);
 const fail=(reason,message)=>({correct:false,reason,message});
 if(!text)return fail('blank','Blank answers receive no mark.');
 const rule=q.type==='text'?q.rule:null;
 if(rule){
  if(!validRule(rule))return fail('invalid_item','This item needs a marking-rule review.');
  const units=answerUnits(text);
  if(rule.kind==='number'){
   const digits=/^\d+(?:[,.]\d+)*$/.test(text);
   const written=/^(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|and)(?:[ -](?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|and))*$/.test(text);
   if(!digits&&!written)return fail('number_format','Write the number only, in figures or words. Do not add a unit, currency sign, alternative or explanation.');
  }else{
   if(units.words>rule.maxWords)return fail('word_limit',`The limit is ${rule.maxWords} word${rule.maxWords===1?'':'s'}; you entered ${units.words}. No mark, even if the answer contains the right phrase.`);
   if(units.numbers>rule.maxNumbers)return fail('number_limit',rule.maxNumbers===0?'This answer must use words; a number is not permitted.':`The limit permits ${rule.maxNumbers} numeric entry. Do not add a second time or alternative.`);
  }
 }
 const correct=[q.answer,...(q.accepted||[])].some(a=>normaliseAnswer(a)===text);
 return correct?{correct:true,reason:'answer_key',message:'Matches an accepted answer and its entry rules.'}:fail('answer_key','Does not match an accepted answer. Spelling, singular/plural form and the requested detail must be correct; there is no partial credit.');
}
export function ruleLabel(rule){if(!rule)return '';if(rule.kind==='number')return 'A NUMBER · figures or words';if(rule.kind==='mixed')return `NO MORE THAN ${rule.maxWords===2?'TWO':rule.maxWords} WORDS AND/OR A NUMBER`;return rule.maxWords===1?'ONE WORD':`NO MORE THAN ${rule.maxWords===2?'TWO':rule.maxWords===3?'THREE':rule.maxWords} WORDS`;}
