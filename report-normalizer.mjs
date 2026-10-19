import {createSubmission,validateAssessment} from './grading.mjs?v=20261019-local7';
import {criteriaFor,RUBRIC_VERSION} from './grader-contract.mjs?v=20261019-local7';

const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const validBand=value=>value===null||typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=9&&Number.isInteger(value*2);
const supplied=(value,fallback)=>value===undefined?fallback:value;
const uid=()=>globalThis.crypto?.randomUUID?.()||`assessment-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
const quotationCharacters=new Map([
 ['“','"'],['”','"'],['„','"'],['‟','"'],['＂','"'],
 ['‘',"'"],['’',"'"],['‚',"'"],['‛',"'"],['＇',"'"]
]);
function invalid(){const error=new Error('The AI returned an incomplete or unsupported report. Your submitted answer is available to retry.');error.code='invalid_assessment';return error;}

/** Normalize typography only. Every recovered quotation is still an actual,
 * contiguous substring of the answer; spelling, case and words are untouched. */
function mappedText(value){
 let normalized='',offset=0;const starts=[],ends=[];
 for(const character of value){
  const end=offset+character.length,part=/\s/u.test(character)?' ':quotationCharacters.get(character)||character;
  if(part===' '&&normalized.endsWith(' '))ends[ends.length-1]=end;
  else{normalized+=part;for(let i=0;i<part.length;i++){starts.push(offset);ends.push(end);}}
  offset=end;
 }
 return {normalized,starts,ends};
}
function sourceQuote(source,quote,mapped){
 if(source.includes(quote))return quote;
 const needle=mappedText(quote).normalized.trim();if(!needle)return null;
 const index=mapped.normalized.indexOf(needle);if(index<0)return null;
 return source.slice(mapped.starts[index],mapped.ends[index+needle.length-1]);
}

/** Adapt a provider's schema into the saved report contract. Repairing a quoted
 * line break or arithmetic is deterministic; inventing evidence or valid scores
 * is not. Backup validation remains strict and never invokes this adapter. */
export function normalizeAssessment(raw,value,{provider,model}={}){
 try{
  const submission=createSubmission(value);
  if(!object(raw)||!validBand(raw.estimatedBand))throw invalid();
  if(raw.submissionId!==undefined&&raw.submissionId!==submission.id||raw.scope!==undefined&&raw.scope!==submission.scope)throw invalid();
  const expected=criteriaFor(submission),names=new Map(expected);
  if(!Array.isArray(raw.criteria)||raw.criteria.length!==expected.length||new Set(raw.criteria.map(c=>c?.id)).size!==expected.length||raw.criteria.some(c=>!object(c)||!names.has(c.id)||!validBand(c.band)))throw invalid();
  const fullTask=['writing_task','speaking_audio'].includes(submission.scope);
  // An overall band for notes, a fragment or a transcript is unsupported,
  // rather than a harmless averaging error.
  if(!fullTask&&raw.estimatedBand!==null)throw invalid();
  const calculated=fullTask&&raw.criteria.every(c=>c.band!==null)?Math.round(raw.criteria.reduce((sum,c)=>sum+c.band,0)/4*2)/2:null;
  const report={...raw,version:supplied(raw.version,1),id:supplied(raw.id,uid()),submissionId:submission.id,date:supplied(raw.date,new Date().toISOString()),provider:provider??raw.provider,model:model??raw.model,rubricVersion:supplied(raw.rubricVersion,RUBRIC_VERSION),scope:submission.scope,provisional:supplied(raw.provisional,true),estimatedBand:calculated,criteria:raw.criteria.map(c=>({...c,evidence:Array.isArray(c.evidence)?c.evidence.map(item=>({...item})):c.evidence})),corrections:Array.isArray(raw.corrections)?raw.corrections.map(c=>({...c})):raw.corrections};
  // First validate every field, criterion and band without source matching.
  // This makes malformed evidence fatal instead of silently filtering it out.
  validateAssessment(report);
  if(report.criteria.some(c=>!names.has(c.id)))throw invalid();
  for(const criterion of report.criteria)criterion.label=names.get(criterion.id);
  let removed=0;
  if(submission.scope!=='speaking_audio'){
   const mapped=mappedText(submission.text);
   for(const criterion of report.criteria)criterion.evidence=criterion.evidence.flatMap(item=>{
    const quote=sourceQuote(submission.text,item.quote,mapped);if(quote===null){removed++;return [];}
    return [{...item,quote}];
   });
   report.corrections=report.corrections.flatMap(item=>{
    const original=sourceQuote(submission.text,item.original,mapped);if(original===null){removed++;return [];}
    return [{...item,original}];
   });
  }
  const limitations=[];
  if(submission.scope==='writing_task')limitations.push('Provisional AI feedback for one writing task; this is not a complete IELTS Writing section result.');
  else if(submission.scope==='speaking_audio')limitations.push('A provisional assessment of this short audio sample, not a complete IELTS Speaking result.');
  else if(submission.scope==='speaking_transcript')limitations.push('Only the transcript was assessed. Pronunciation, spoken fluency and an overall Speaking band were not graded.');
  else limitations.push('This limited practice receives feedback without an overall IELTS band.');
  if(removed)limitations.push(`${removed} quoted evidence or correction ${removed===1?'item was':'items were'} omitted because the wording could not be verified in the submitted answer.`);
  const words=submission.text.trim().match(/\S+/gu)?.length||0;
  if(submission.scope==='writing_task'&&words<40){
   report.estimatedBand=null;report.confidence='low';
   report.criteria=report.criteria.map(c=>({...c,band:null}));
   limitations.push('This response has fewer than 40 words, so there is insufficient evidence for reliable task or criterion band estimates. Use the feedback to develop a complete answer.');
  }
  report.limitations=[...new Set([...limitations,...report.limitations])].slice(0,12);
  return validateAssessment(report,submission);
 }catch{throw invalid();}
}
