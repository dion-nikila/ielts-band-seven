import test from 'node:test';
import assert from 'node:assert/strict';
import {createSubmission,validateAssessment} from '../grading.mjs';
import {criteriaFor,outputSchema,gradingInstructions} from '../grader-contract.mjs';
import {connectPuter,gradeWithPuter,transcribeWithPuter,PUTER_GRADING_MODEL} from '../puter-grader.mjs';

const submission=(scope='writing_task')=>createSubmission({id:'test-submission',scope,promptId:'essay-1',prompt:'Some people favour remote working. Discuss both views and give your opinion.',text:'Remote working can reduce commuting time. However, teams still need useful collaboration.',taskType:scope.startsWith('writing')?2:null});
function rawReport(s,bands){
 const ids=criteriaFor(s),values=bands||ids.map(([id])=>s.scope==='writing_fragment'||s.scope==='speaking_points'||s.scope==='speaking_transcript'&&['fluency_coherence','pronunciation'].includes(id)?null:7);
 const canScore=['writing_task','speaking_audio'].includes(s.scope)&&values.every(x=>x!==null);
 return {estimatedBand:canScore?Math.round(values.reduce((a,b)=>a+b,0)/4*2)/2:null,confidence:'medium',summary:'The position is relevant but needs a more developed example.',criteria:ids.map(([id,label],i)=>({id,label,band:values[i],why:'This sample shows a relevant idea with limited supporting detail.',evidence:[{quote:'Remote working',timestampSeconds:null}]})),strengths:['The main topic is clear.'],priorities:[{criterion:ids[0][0],action:'Explain one mechanism.',practice:'Add a reason and a concrete example.',successCheck:'The example supports the main claim.'}],corrections:[],improvedExcerpt:'Remote working saves time otherwise spent commuting.',limitations:['This is a practice estimate.']};
}
const sdkWith=raw=>({ai:{chat:async()=>({finish_reason:'stop',message:{content:JSON.stringify(raw)}})}});

test('Puter grading uses pinned model, structured output and untrusted data separation',async()=>{
 const s=submission();let messages,options;
 const sdk={ai:{chat:async(m,o)=>{messages=m;options=o;return {finish_reason:'stop',message:{content:JSON.stringify(rawReport(s,[7,7.5,8,8]))}};}}};
 const result=await gradeWithPuter(s,{puter:sdk});
 assert.equal(options.model,PUTER_GRADING_MODEL);assert.equal(options.provider,'openai');assert.equal(options.normalize,true);assert.equal(options.stream,false);assert.equal(options.max_tokens,4500);assert.equal(options.outputFormat.strict,true);
 assert.equal(messages[0].role,'system');assert.match(messages[0].content,/untrusted assessment DATA/);assert.equal(JSON.parse(messages[1].content).text,s.text);
 assert.equal(result.provider,'Puter / OpenAI');assert.equal(result.submissionId,s.id);assert.equal(result.estimatedBand,7.5);assert.deepEqual(validateAssessment(result,s),result);
});

test('full task estimate arithmetic is independently checked',async()=>{
 const s=submission(),raw=rawReport(s);raw.estimatedBand=9;
 await assert.rejects(gradeWithPuter(s,{puter:sdkWith(raw)}),/unsupported scores/);
});

test('all fragment and talking point bands must stay null',async()=>{
 for(const scope of ['writing_fragment','speaking_points']){
  const s=submission(scope),raw=rawReport(s),result=await gradeWithPuter(s,{puter:sdkWith(raw)});
  assert.equal(result.estimatedBand,null);assert.ok(result.criteria.every(x=>x.band===null));
  raw.criteria[0].band=7;
  await assert.rejects(gradeWithPuter(s,{puter:sdkWith(raw)}),/unsupported scores/);
 }
});

test('transcripts cannot receive pronunciation, delivery or an overall Speaking band',async()=>{
 const s=submission('speaking_transcript'),raw=rawReport(s),result=await gradeWithPuter(s,{puter:sdkWith(raw)});
 assert.equal(result.estimatedBand,null);assert.equal(result.criteria.find(x=>x.id==='pronunciation').band,null);assert.equal(result.criteria.find(x=>x.id==='fluency_coherence').band,null);
 raw.criteria.find(x=>x.id==='pronunciation').band=8;
 await assert.rejects(gradeWithPuter(s,{puter:sdkWith(raw)}),/unsupported scores/);
});

test('invented evidence and corrections fail validation',async()=>{
 const s=submission(),raw=rawReport(s);raw.criteria[0].evidence[0].quote='This phrase does not exist.';
 await assert.rejects(gradeWithPuter(s,{puter:sdkWith(raw)}),/evidence/);
 const corrected=rawReport(s);corrected.corrections=[{original:'invented error',replacement:'better wording',why:'This must not be accepted.'}];
 await assert.rejects(gradeWithPuter(s,{puter:sdkWith(corrected)}),/evidence/);
});

test('text evidence timestamps are null and out-of-range bands are rejected',async()=>{
 const s=submission(),raw=rawReport(s);raw.criteria[0].evidence[0].timestampSeconds=1;
 await assert.rejects(gradeWithPuter(s,{puter:sdkWith(raw)}),/unsupported scores/);
 const out=rawReport(s);out.criteria[0].band=10;
 await assert.rejects(gradeWithPuter(s,{puter:sdkWith(out)}),/unsupported scores/);
});

test('malformed, refused and truncated responses never become an assessment',async()=>{
 const s=submission();
 for(const response of [{finish_reason:'length',message:{content:'{}'}},{finish_reason:'stop',message:{content:'not json'}},{finish_reason:'stop',message:{content:'{}',refusal:'No'}},{finish_reason:'stop',message:{content:'{}',tool_calls:[{}]}}]){
  await assert.rejects(gradeWithPuter(s,{puter:{ai:{chat:async()=>response}}}),/report/);
 }
});

test('provider errors are sanitized and do not echo a submitted answer or secret',async()=>{
 const s=submission(),secret='sk-secret-do-not-show';
 await assert.rejects(gradeWithPuter(s,{puter:{ai:{chat:async()=>{throw new Error(secret+s.text);}}}}),error=>!error.message.includes(secret)&&!error.message.includes(s.text));
 await assert.rejects(gradeWithPuter(s,{puter:{ai:{chat:async()=>{throw {code:'insufficient_funds'};}}}}),/allowance/);
});

test('cancellation prevents late results from being accepted',async()=>{
 const s=submission(),controller=new AbortController();let resolve;
 const pending=gradeWithPuter(s,{signal:controller.signal,puter:{ai:{chat:()=>new Promise(r=>resolve=r)}}});
 await new Promise(r=>setTimeout(r,0));controller.abort();
 await assert.rejects(pending,{name:'AbortError'});resolve({finish_reason:'stop',message:{content:JSON.stringify(rawReport(s))}});
});

test('provider timeout gives a retryable saved-answer message',async()=>{
 await assert.rejects(gradeWithPuter(submission(),{timeoutMs:5,puter:{ai:{chat:()=>new Promise(()=>{})}}}),/took too long/);
});

test('transcription returns text and pins the supported transcription API',async()=>{
 let received,options;const blob=new Blob(['audio'],{type:'audio/webm'});
 const result=await transcribeWithPuter(blob,{duration:30,puter:{ai:{speech2txt:async(b,o)=>{received=b;options=o;return {text:'  This is what I said.  '};}}}});
 assert.equal(result,'This is what I said.');assert.equal(received,blob);assert.deepEqual(options,{provider:'openai',model:'gpt-transcribe',language:'en',response_format:'text'});
});

test('invalid or overlong recordings and empty transcripts cannot be graded',async()=>{
 const sdk={ai:{speech2txt:async()=>''}},blob=new Blob(['audio'],{type:'audio/wav'});
 await assert.rejects(transcribeWithPuter(blob,{puter:sdk,duration:181}),/three minutes/);
 await assert.rejects(transcribeWithPuter(blob,{puter:sdk}),/usable transcript/);
 await assert.rejects(transcribeWithPuter(new Blob(['not audio'],{type:'text/plain'}),{puter:sdk}),/supported recording/);
});

test('connection requests explicit existing-account sign in and never temporary signup',async()=>{
 let options;const sdk={auth:{signIn:async o=>{options=o;}},ai:{chat(){}}};
 assert.equal(await connectPuter({puter:sdk}),sdk);assert.deepEqual(options,{attempt_temp_user_creation:false});
 await assert.rejects(connectPuter({puter:{auth:{signIn:async()=>{throw {error:'popup_blocked'};}},ai:{chat(){}}}}),/Click Connect grader again/);
});

test('rubric and schema distinguish task type and partial evidence',()=>{
 const s=submission('speaking_points'),schema=outputSchema(s);
 assert.deepEqual(schema.properties.confidence.enum,['low','medium']);assert.deepEqual(schema.properties.criteria.items.properties.id.enum,['relevance_development','organisation','language_options']);
 assert.equal(schema.additionalProperties,false);assert.match(gradingInstructions(s),/planning notes or talking points/);
 const task1=createSubmission({...submission(),taskType:1});assert.equal(criteriaFor(task1)[0][0],'task_achievement');
});
