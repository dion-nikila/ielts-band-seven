import {createSubmission,validateAssessment} from './grading.mjs?v=20261020-practice';
import {criteriaFor,outputSchema,gradingInstructions,RUBRIC_VERSION} from './grader-contract.mjs?v=20261020-practice';

export const PUTER_GRADING_MODEL='gpt-4.1';
export const PUTER_TRANSCRIPTION_MODEL='gpt-transcribe';
const SDK_URL='https://js.puter.com/v2/';
let loading;
const uid=()=>globalThis.crypto?.randomUUID?.()||`assessment-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
const cancelled=()=>{const error=new Error('Grading cancelled. Your answer is still saved.');error.name='AbortError';return error;};
function abortCheck(signal){if(signal?.aborted)throw cancelled();}
function failure(message,code='grading_unavailable'){const error=new Error(message);error.code=code;return error;}

/** Loading is deliberately called only from the user's Connect action. */
export function loadPuter({document=globalThis.document,window=globalThis}={}){
 if(window.puter?.ai&&window.puter?.auth)return Promise.resolve(window.puter);
 if(loading)return loading;
 if(!document?.createElement)return Promise.reject(failure('Open the app in a browser to connect the AI grader.'));
 loading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=SDK_URL;script.async=true;script.dataset.ieltsGrader='puter';script.referrerPolicy='no-referrer';
  const timeout=setTimeout(()=>finish(failure('The AI connection did not load. Check your connection, then click Connect grader again.')),20000);
  function finish(error){clearTimeout(timeout);script.onload=null;script.onerror=null;if(error){script.remove();loading=undefined;reject(error);}else if(window.puter?.ai&&window.puter?.auth)resolve(window.puter);else{script.remove();loading=undefined;reject(failure('The AI connection did not load. Click Connect grader again.'));}}
  script.onload=()=>finish();script.onerror=()=>finish(failure('The AI connection could not load. Check your connection or browser blocker.'));
  document.head.appendChild(script);
 });
 return loading;
}

function publicError(error,action){
 if(error?.name==='AbortError')return cancelled();
 const code=String(error?.code||error?.error?.code||error?.error||'').toLowerCase();
 if(code.includes('popup_blocked'))return failure('The sign-in popup was blocked. Click Connect grader again, and allow the Puter popup.','popup_blocked');
 if(code.includes('auth_window_closed')||code.includes('cancel'))return failure('Sign-in was cancelled. Click Connect grader when you are ready.','sign_in_cancelled');
 if(code.includes('insufficient')||code.includes('quota')||code.includes('usage_limit')||code.includes('fund'))return failure('Your Puter allowance is unavailable or exhausted. Check your Puter account; the app has not purchased an upgrade.','allowance_unavailable');
 if(code.includes('auth')||code.includes('login')||code.includes('sign_in'))return failure('Reconnect the AI grader with your Puter account, then try again.','sign_in_required');
 if(code.includes('rate')||code.includes('busy'))return failure('The AI provider is busy. Wait a moment, then retry your saved answer.','provider_busy');
 if(error?.code==='invalid_assessment'||error?.code==='request_timeout'||error?.code==='transcript_invalid')return error;
 return failure(`${action} did not finish. Your answer is still saved. Check your Puter allowance and connection, then try again.`);
}

export async function connectPuter({puter}={}){
 // When the SDK is already present, signIn runs before any await so popup
 // creation remains directly attached to the second/next user click.
 const available=puter||globalThis.puter;
 try{
  const sdk=available||await loadPuter();
  if(!sdk.auth?.signIn||!sdk.ai?.chat)throw failure('The AI connection is unavailable. Reload the page and try again.');
  await sdk.auth.signIn({attempt_temp_user_creation:false});
  return sdk;
 }catch(error){throw publicError(error,'Sign-in');}
}

function sdkFor(override){const sdk=override||globalThis.puter;if(!sdk?.ai)throw failure('Click Connect grader and sign in to Puter before submitting.','sign_in_required');return sdk;}

async function boundedCall(work,{signal,timeoutMs=75000}={}){
 abortCheck(signal);const controller=new AbortController();let timeout,onAbort;
 const stopped=new Promise((resolve,reject)=>{
  onAbort=()=>{controller.abort();reject(cancelled());};signal?.addEventListener('abort',onAbort,{once:true});
  timeout=setTimeout(()=>{controller.abort();reject(failure('The AI request took too long. Your answer is saved. Retry when the connection is available.','request_timeout'));},timeoutMs);
 });
 try{return await Promise.race([Promise.resolve().then(()=>work(controller.signal)),stopped]);}
 finally{clearTimeout(timeout);signal?.removeEventListener('abort',onAbort);}
}

function normalizeReport(raw,submission){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw failure('The AI returned an incomplete report. Retry the saved answer.','invalid_assessment');
 // Unsupported scores and invented quotations are rejected by the shared
 // validator; they are never quietly turned into a successful assessment.
 const report={...raw,version:1,id:uid(),submissionId:submission.id,date:new Date().toISOString(),provider:'Puter / OpenAI',model:PUTER_GRADING_MODEL,rubricVersion:RUBRIC_VERSION,scope:submission.scope,provisional:true};
 const criterionNames=new Map(criteriaFor(submission));
 if(Array.isArray(report.criteria))report.criteria=report.criteria.map(c=>({...c,label:criterionNames.get(c?.id)||c?.label}));
 const limitation=submission.scope==='writing_task'?'Provisional AI feedback for this writing task; this is not a complete IELTS Writing section result.':submission.scope==='speaking_transcript'?'Only the transcript was assessed. Pronunciation and spoken fluency were not graded; this is not a complete Speaking result.':'This limited practice receives feedback without an overall IELTS band.';
 if(Array.isArray(report.limitations))report.limitations=[...new Set([limitation,...report.limitations])].slice(0,12);
 try{return validateAssessment(report,submission);}catch{throw failure('The AI returned unsupported scores or evidence that did not match your answer. Retry the saved submission.','invalid_assessment');}
}

export async function gradeWithPuter(value,{signal,onStage,puter,timeoutMs=75000}={}){
 const submission=createSubmission(value);
 if(submission.scope==='speaking_audio')throw failure('Transcribe the recording first, then submit the transcript for language feedback.','transcript_required');
 abortCheck(signal);const sdk=sdkFor(puter);onStage?.('Assessing your saved answer against the IELTS criteria…');
 try{
  const response=await boundedCall(innerSignal=>sdk.ai.chat([
   {role:'system',content:gradingInstructions(submission)},
   {role:'user',content:JSON.stringify({scope:submission.scope,prompt:submission.prompt,text:submission.text,taskType:submission.taskType,target:9})}
  ],{model:PUTER_GRADING_MODEL,provider:'openai',normalize:true,stream:false,temperature:0,max_tokens:4500,signal:innerSignal,outputFormat:{type:'json_schema',name:'ielts_practice_assessment',strict:true,schema:outputSchema(submission)}}),{signal,timeoutMs});
  abortCheck(signal);
  if(response?.finish_reason!=='stop'||response?.message?.refusal||response?.message?.tool_calls?.length||typeof response?.message?.content!=='string'||response.message.content.length>120000)throw failure('The AI returned an incomplete report. Retry the saved answer.','invalid_assessment');
  let raw;try{raw=JSON.parse(response.message.content);}catch{throw failure('The AI returned an unreadable report. Retry the saved answer.','invalid_assessment');}
  onStage?.('Checking the feedback and quoted evidence…');return normalizeReport(raw,submission);
 }catch(error){throw publicError(error,'Grading');}
}

/** Transcription is a separate, visible step; no speech band is fabricated. */
export async function transcribeWithPuter(blob,{signal,onStage,puter,timeoutMs=75000,duration}={}){
 abortCheck(signal);
 if(!(blob instanceof Blob)||!blob.size||blob.size>8000000||blob.type&&!/^(audio\/|video\/webm)/.test(blob.type))throw failure('Choose a supported recording smaller than 8 MB.','transcript_invalid');
 if(duration!==undefined&&(!Number.isFinite(duration)||duration<=0||duration>180))throw failure('Use a speaking sample of three minutes or less.','transcript_invalid');
 const sdk=sdkFor(puter);if(!sdk.ai.speech2txt)throw failure('Audio transcription is unavailable. Paste your actual spoken answer instead.');
 onStage?.('Transcribing the recording for language feedback…');
 try{
  // speech2txt does not document an AbortSignal option. Cancellation prevents
  // use of its result locally; the provider may still count a submitted request.
  const response=await boundedCall(()=>sdk.ai.speech2txt(blob,{provider:'openai',model:PUTER_TRANSCRIPTION_MODEL,language:'en',response_format:'text'}),{signal,timeoutMs});
  abortCheck(signal);const transcript=typeof response==='string'?response:response?.text;
  if(typeof transcript!=='string'||!transcript.trim()||transcript.length>20000)throw failure('No usable transcript was returned. Listen to your recording and type the answer, or record it again.','transcript_invalid');
  return transcript.trim();
 }catch(error){throw publicError(error,'Transcription');}
}
