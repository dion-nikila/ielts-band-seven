import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createSubmission,snapshotSubmission,validateAssessment,safeAssessments,
 ensureAssessments,saveAssessment,normalizeGraderEndpoint,requestGrade,
 checkGraderHealth,encodeMonoWav,recordingToWav
} from '../grading.mjs';
import {renderAssessment,renderConnection,renderAssessmentHistory} from '../grading-ui.mjs';

const submission = (scope = 'writing_task',overrides = {}) => createSubmission({id:'submission-test',createdAt:'2026-10-19T08:00:00.000Z',scope,promptId:'essay-1',prompt:'Should cities provide free public transport?',taskType:2,text:'Cities should provide free public transport. This reduces traffic.',...overrides});
const ids = s => s.scope.startsWith('writing_') ? [s.taskType === 1 ? 'task_achievement':'task_response','coherence_cohesion','lexical_resource','grammatical_range_accuracy'] : s.scope === 'speaking_points' ? ['relevance_development','organisation','language_options'] : ['fluency_coherence','lexical_resource','grammatical_range_accuracy','pronunciation'];
function assessment(s = submission()) {
 const estimated = ['writing_task','speaking_audio'].includes(s.scope), allNull = ['writing_fragment','speaking_points'].includes(s.scope);
 return {version:1,id:'assessment-test',submissionId:s.id,date:'2026-10-19T08:01:00.000Z',provider:'Puter / OpenAI',model:'test-model',rubricVersion:'IELTS-public-2023',scope:s.scope,provisional:true,estimatedBand:estimated?7:null,confidence:'low',summary:'The position is clear; develop the explanation.',criteria:ids(s).map(id=>({id,label:id,band:allNull||s.scope==='speaking_transcript'&&['fluency_coherence','pronunciation'].includes(id)?null:7,why:'An explicit position is present.',evidence:[{quote:s.text||'Cities should provide free public transport.',timestampSeconds:null}]})),strengths:['A clear position.'],priorities:[{criterion:ids(s)[0],action:'Explain one consequence.',practice:'Add a concrete example.',successCheck:'The example directly supports the claim.'}],corrections:s.text?[{original:s.text,replacement:s.text+' For example, fewer commuters may drive.',why:'Develop the reason.'}]:[],improvedExcerpt:'A short example for comparison.',limitations:['This is practice feedback.']};
}
const json = (value,status=200) => ({ok:status>=200&&status<300,status,headers:new Headers({'content-type':'application/json'}),json:async()=>value});

test('submissions are immutable snapshots that never retain unknown credential fields',()=>{
 const input = {id:'safe-id',scope:'writing_task',promptId:'essay-1',prompt:'A task',text:'An answer',taskType:2,accessCode:'never-save',apiKey:'never-save'};
 const s = createSubmission(input); input.text = 'Changed';
 assert.equal(s.text,'An answer'); assert.equal(Object.isFrozen(s),true);
 assert.equal('accessCode' in s,false); assert.equal('apiKey' in s,false); assert.equal(s.target,9);
 assert.throws(()=>createSubmission({...input,text:'  '}),/Add your answer/);
});

test('mode rules reject invented overall, fluency and pronunciation bands',()=>{
 for (const scope of ['writing_fragment','speaking_points','speaking_transcript']) {
  const s = submission(scope), report = assessment(s);
  assert.deepEqual(validateAssessment(report,s),report);
  report.estimatedBand = 7; assert.throws(()=>validateAssessment(report,s),/unsupported/);
 }
 const s = submission('speaking_transcript');
 for (const criterion of ['fluency_coherence','pronunciation']) {
  const report = assessment(s); report.criteria.find(c=>c.id===criterion).band=8;
  assert.throws(()=>validateAssessment(report,s),/invalid/);
 }
});

test('a full task estimate must match the four criteria and cannot fill an unassessed criterion',()=>{
 const s=submission(),report=assessment(s);
 report.criteria[0].band=8; report.estimatedBand=8;
 assert.throws(()=>validateAssessment(report,s),/inconsistent/);
 report.estimatedBand=7.5; report.criteria[1].band=8;
 assert.equal(validateAssessment(report,s).estimatedBand,7.5);
 report.criteria[2].band=null;
 assert.throws(()=>validateAssessment(report,s),/inconsistent/);
 report.estimatedBand=null; assert.equal(validateAssessment(report,s).estimatedBand,null);
});

test('response evidence and corrections must come from the exact submitted answer',()=>{
 const s=submission(),report=assessment(s);
 report.criteria[0].evidence[0].quote='A sentence the learner did not write.';
 assert.throws(()=>validateAssessment(report,s),/not in this answer/);
 const corrected=assessment(s); corrected.corrections[0].original='Invented error';
 assert.throws(()=>validateAssessment(corrected,s),/not grounded/);
 const foreign=assessment(s); foreign.submissionId='someone-else';
 assert.throws(()=>validateAssessment(foreign,s),/different answer/);
});

test('unexpected provider fields do not enter the saved assessment contract',()=>{
 const s=submission(),report=assessment(s);
 report.providerMetadata={privateField:'not-for-backups'};
 report.criteria[0].debug='not-for-backups';
 const clean=validateAssessment(report,s);
 assert.equal('providerMetadata' in clean,false);
 assert.equal('debug' in clean.criteria[0],false);
 const state={};saveAssessment(state,s,report);
 assert.doesNotMatch(JSON.stringify(state),/not-for-backups/);
});

test('report shape rejects missing, duplicate, mismatched and unsupported scores',()=>{
 const s=submission();
 for (const mutate of [r=>delete r.summary,r=>r.criteria.pop(),r=>r.criteria[1].id=r.criteria[0].id,r=>r.criteria[0].band=9.5,r=>r.criteria[0].band='8',r=>r.provisional=false,r=>r.provider='Unverified',r=>r.scope='speaking_points']) {
  const report=assessment(s);mutate(report);assert.throws(()=>validateAssessment(report,s));
 }
});

test('assessment history keeps the submitted text, removes audio data and validates legacy backups',()=>{
 assert.equal(safeAssessments(undefined),true); const state={}; assert.deepEqual(ensureAssessments(state),[]);
 const s=submission(),report=assessment(s); saveAssessment(state,s,report);
 assert.equal(safeAssessments(state.assessments),true); assert.equal(state.assessments[0].submission.text,s.text);
 assert.equal(safeAssessments([{submission:s,assessment:{...report,estimatedBand:9}}]),false);
 assert.equal(safeAssessments(Array(201).fill(state.assessments[0])),false);
 const audio=submission('speaking_audio',{text:'',audio:{data:'UklGRg==',format:'wav',duration:1}});
 assert.deepEqual(snapshotSubmission(audio).audio,{format:'wav',duration:1});
 const audioReport={...assessment(audio),id:'audio-report'};saveAssessment(state,audio,audioReport);
 assert.equal(safeAssessments(state.assessments),true);
 assert.equal(state.assessments[1].submission.audio.data,undefined);
});

test('configured endpoint requires HTTPS, excludes credential-bearing URLs and never leaks via redirects',async()=>{
 const production={hostname:'dion-nikila.github.io'},local={hostname:'localhost'};
 assert.equal(normalizeGraderEndpoint('https://example.vercel.app/',{location:production}),'https://example.vercel.app/api/grade');
 for(const value of ['http://example.com','https://a:b@example.com','https://example.com?code=secret','https://example.com/#secret','javascript:alert(1)','https://example.com/other','http://localhost:3000','https://127.0.0.1']) assert.throws(()=>normalizeGraderEndpoint(value,{location:production}),undefined,value);
 assert.equal(normalizeGraderEndpoint('http://localhost:3000',{location:local}),'http://localhost:3000/api/grade');
 const s=submission();let called;
 const result=await requestGrade('https://example.vercel.app','code-in-memory',s,{location:production,fetch:async(url,options)=>{called={url,options};return json({assessment:assessment(s)});}});
 assert.equal(result.submissionId,s.id);assert.equal(called.options.redirect,'error');assert.equal(called.options.credentials,'omit');
 assert.equal(called.options.headers.Authorization,'Bearer code-in-memory');
 assert.deepEqual(JSON.parse(called.options.body),{submission:s});assert.doesNotMatch(called.options.body,/code-in-memory/);
});

test('connection checks reject incompatible services and API failures remain actionable',async()=>{
 const endpoint='https://example.vercel.app';
 const health={configured:true,providerConfigured:true,accessConfigured:true,modes:['writing_task'],maxAudioSeconds:60,maxAudioBytes:2000000};
 assert.deepEqual(await checkGraderHealth(endpoint,{fetch:async()=>json(health)}),health);
 await assert.rejects(checkGraderHealth(endpoint,{fetch:async()=>json({...health,modes:['invented']})}),/compatible/);
 const s=submission();await assert.rejects(requestGrade(endpoint,'code',s,{fetch:async()=>json({error:{code:'unauthorized',message:'The private code was not accepted.'}},401)}),/not accepted/);
 await assert.rejects(requestGrade(endpoint,'code',s,{fetch:async()=>({...json({}),headers:new Headers({'content-type':'text/html'})})}),/valid response/);
});

test('two minutes of 16 kHz mono PCM stays under 4MB audio and 6MB request limits',()=>{
 const bytes=encodeMonoWav(new Float32Array(16000*120)),view=new DataView(bytes.buffer);
 assert.equal(bytes.length,3840044);assert.ok(bytes.length<4000000);assert.equal(view.getUint32(24,true),16000);assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint16(34,true),16);
 const body=JSON.stringify({submission:{audio:{data:Buffer.from(bytes).toString('base64')}}});assert.ok(Buffer.byteLength(body)<6000000);
 assert.throws(()=>encodeMonoWav(new Float32Array(16000*121)),/up to 120/);
 // Duration alone is not the limit: 120 seconds at 48 kHz would exceed 4 MB.
 assert.throws(()=>encodeMonoWav(new Float32Array(48000*120),48000),/up to 120/);
});

test('recording conversion mixes stereo, downsamples and closes its temporary audio context',async()=>{
 let closed=false;
 class FakeContext {async decodeAudioData(){return {duration:1,numberOfChannels:2,sampleRate:48000,getChannelData:()=>new Float32Array(48000).fill(0.5)};}async close(){closed=true;}}
 const result=await recordingToWav(new Blob(['recording']),{AudioContext:FakeContext});
 assert.equal(closed,true);assert.equal(result.duration,1);assert.equal(result.bytes,32044);assert.equal(result.format,'wav');
 const data=Buffer.from(result.data,'base64'),view=new DataView(data.buffer,data.byteOffset,data.byteLength);assert.equal(view.getInt16(44,true),16383);
});

test('all learner, provider and report text is escaped when rendering feedback or connection state',()=>{
 const s=submission('writing_task',{text:'<img src=x onerror=alert(1)>'}),report=assessment(s);
 report.summary='<script>alert(1)</script>';report.model='<svg onload=alert(1)>';
 const html=renderAssessment(report,{submission:s});assert.doesNotMatch(html,/<script>|<img src=x|<svg onload/);assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);
 assert.doesNotMatch(renderConnection({connected:true,username:'<script>x</script>',error:'<img>'}),/<script>|<img>/);
 assert.match(renderConnection(),/data-action="connect-grader"/);assert.match(renderConnection(),/No accounts or keys/);
 assert.match(renderAssessmentHistory([{submission:s,assessment:report}]),/view-assessment/);
});
