import {safePracticeDrafts} from './practice.mjs?v=20261020-validation';
import {emptyState,validateState} from './core.mjs?v=20261020-validation';
import {safeLearning} from './coach.mjs?v=20261020-validation';
import {safeAssessments} from './grading.mjs?v=20261020-validation';

const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const safeAnswer=(key,value)=>/^p[123]-\d{1,3}$/.test(key)&&object(value)&&['speaking_points','speaking_transcript'].includes(value.mode)&&typeof value.text==='string'&&value.text.length<=20000;

/** Read and repair optional records without touching storage. Callers must keep
 * rawRecovery in a separate durable recovery entry before persisting a repaired
 * state. A blocked result must never overwrite the original saved entry. */
export function recoverSavedState(raw){
 if(raw===null||raw===undefined)return {state:emptyState(),warnings:[],needsRecoveryBackup:false,blocked:false,rawRecovery:null};
 let source=raw;
 const blocked=()=>({state:emptyState(),warnings:['Saved work could not be opened safely. The original saved copy must be kept for recovery before anything replaces it.'],needsRecoveryBackup:false,blocked:true,rawRecovery:source});
 let state;
 try{
  // Supporting a parsed JSON object also lets import/recovery callers use the
  // same routine. Serializing first prevents mutation of their original value.
  if(typeof raw!=='string')source=JSON.stringify(raw);
  if(typeof source!=='string')return blocked();
  state=JSON.parse(source);
  if(!object(state))return blocked();
  const {assessments,learning,speakingAnswers,...core}=state;
  validateState(core);
 }catch{return blocked();}
 const warnings=[];if(!safePracticeDrafts(state.practiceDrafts)){delete state.practiceDrafts;warnings.push('Unfinished practice could not be restored. Your submitted results and other saved work were retained.');}
 if(state.assessments!==undefined){
  const original=state.assessments;
  if(!Array.isArray(original)){
   state.assessments=[];
   warnings.push('Some saved feedback could not be restored. Your drafts and test results were retained.');
  }else{
   const valid=original.filter(record=>safeAssessments([record]));
   state.assessments=valid.slice(-200);
   if(valid.length!==original.length||valid.length>200)warnings.push('Some saved feedback could not be restored. Valid reports, drafts and test results were retained; the original copy is available for recovery.');
  }
 }
 if(!safeLearning(state.learning)){
  delete state.learning;
  warnings.push('Guided lesson progress could not be restored. Your other saved work was retained.');
 }
 if(state.speakingAnswers!==undefined){
  const original=state.speakingAnswers;
  if(!object(original)){
   state.speakingAnswers={};
   warnings.push('Some speaking drafts could not be restored. Your other saved work was retained.');
  }else{
   let removed=false;
   const entries=Object.entries(original).flatMap(([key,value])=>{
    if(!safeAnswer(key,value)){removed=true;return [];}
    if(Object.keys(value).some(field=>!['mode','text'].includes(field)))removed=true;
    return [[key,{mode:value.mode,text:value.text}]];
   });
   state.speakingAnswers=Object.fromEntries(entries);
   if(removed)warnings.push('Some speaking drafts or unsupported draft fields could not be restored. Valid speaking drafts and your other work were retained.');
  }
 }
 return {state,warnings,needsRecoveryBackup:warnings.length>0,blocked:false,rawRecovery:warnings.length?source:null};
}
