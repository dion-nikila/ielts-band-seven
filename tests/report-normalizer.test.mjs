import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAssessment} from '../report-normalizer.mjs';
import {createSubmission,validateAssessment,safeAssessments,snapshotSubmission,encodeMonoWav,MAX_AUDIO_BYTES,MAX_AUDIO_SECONDS} from '../grading.mjs';
import {criteriaFor} from '../grader-contract.mjs';

const enoughText=Array.from({length:60},(_,i)=>i%2?'commuters':'cities').join(' ');
const submission=(scope='writing_task',changes={})=>createSubmission({id:'normalizer-submission',createdAt:'2026-10-19T08:00:00.000Z',scope,promptId:'essay-1',prompt:'Should cities provide free public transport?',text:enoughText,taskType:2,...changes});
const options={provider:'Google Gemini',model:'gemini-test'};
function rawReport(s){
 const noBands=['writing_fragment','speaking_points'].includes(s.scope),criteria=criteriaFor(s).map(([id,label])=>({id,label,band:noBands||s.scope==='speaking_transcript'&&['fluency_coherence','pronunciation'].includes(id)?null:7,why:'The main claim is relevant, but the support needs detail.',evidence:[{quote:s.text.slice(0,6)||'audible words',timestampSeconds:null}]}));
 return {estimatedBand:s.scope==='writing_task'||s.scope==='speaking_audio'?7:null,confidence:'medium',summary:'Develop a relevant claim with a concrete explanation.',criteria,strengths:['The topic is relevant.'],priorities:[{criterion:criteria[0].id,action:'Develop one claim.',practice:'Add a reason and an example.',successCheck:'Both sentences support the same claim.'}],corrections:[],improvedExcerpt:'One possible example for comparison.',limitations:['This is provisional practice feedback.']};
}

test('raw schema becomes a valid report and valid criterion scores determine its average',()=>{
 const s=submission(),raw=rawReport(s);raw.criteria[0].band=8;raw.criteria[1].band=8;raw.estimatedBand=9;
 const before=structuredClone(raw),report=normalizeAssessment(raw,s,options);
 assert.equal(report.estimatedBand,7.5);assert.equal(report.provider,'Google Gemini');assert.equal(report.submissionId,s.id);
 assert.deepEqual(validateAssessment(report,s),report);assert.deepEqual(raw,before);
});

test('whitespace and Unicode quotation repairs return the actual contiguous source substring',()=>{
 const phrase='😀 It’s  useful.\n\nCities “can” improve public transport.';
 const s=submission('writing_task',{text:phrase+' '+enoughText}),raw=rawReport(s);
 raw.criteria[0].evidence=[{quote:'It\'s useful. Cities "can" improve public transport.',timestampSeconds:null}];
 raw.corrections=[{original:'Cities "can" improve public transport.',replacement:'Cities can improve public transport.',why:'Use direct language here.'}];
 const report=normalizeAssessment(raw,s,options);
 assert.equal(report.criteria[0].evidence[0].quote,'It’s  useful.\n\nCities “can” improve public transport.');
 assert.equal(report.corrections[0].original,'Cities “can” improve public transport.');
 assert.ok(s.text.includes(report.criteria[0].evidence[0].quote));
 assert.equal(report.limitations.some(x=>x.includes('omitted')),false);
});

test('invented, paraphrased or differently cased quotes are omitted with a visible limitation',()=>{
 const s=submission(),raw=rawReport(s);
 raw.criteria[0].evidence=[{quote:'Cities have many commuters.',timestampSeconds:null},{quote:'CITIES',timestampSeconds:null}];
 raw.corrections=[{original:'commuting workers',replacement:'commuters',why:'A shorter phrase.'}];
 const report=normalizeAssessment(raw,s,options);
 assert.deepEqual(report.criteria[0].evidence,[]);assert.deepEqual(report.corrections,[]);
 assert.match(report.limitations.join(' '),/3 quoted evidence or correction items were omitted/);
 assert.equal(report.estimatedBand,7);
});

test('malformed fields, unknown criteria and illegal scores remain fatal rather than being repaired',()=>{
 const s=submission();
 for(const mutate of [
  r=>r.criteria[0].band=9.5,r=>r.criteria[0].band=7.25,r=>r.criteria[0].band='7',
  r=>r.estimatedBand=10,r=>r.criteria[0].id='invented',r=>r.criteria[1].id=r.criteria[0].id,
  r=>delete r.criteria[0].label,r=>delete r.summary,r=>r.criteria[0].evidence=[{quote:17,timestampSeconds:null}],
  r=>r.corrections=[{original:'invented',replacement:'better'}],r=>r.criteria[0].evidence[0].timestampSeconds=5,
  r=>r.limitations=null,r=>r.provisional=false,r=>r.version=2,r=>r.id=null,r=>r.date=null,r=>r.provisional=null,
  r=>r.submissionId='different-answer',r=>r.scope='speaking_transcript'
 ]){const raw=rawReport(s);mutate(raw);assert.throws(()=>normalizeAssessment(raw,s,options),{code:'invalid_assessment'});}
});

test('scope rules never manufacture pronunciation, delivery or notes bands',()=>{
 for(const scope of ['writing_fragment','speaking_points','speaking_transcript']){
  const s=submission(scope),raw=rawReport(s),report=normalizeAssessment(raw,s,options);
  assert.equal(report.estimatedBand,null);
  raw.estimatedBand=8;assert.throws(()=>normalizeAssessment(raw,s,options),{code:'invalid_assessment'});
 }
 const s=submission('speaking_transcript'),raw=rawReport(s);raw.criteria.find(c=>c.id==='pronunciation').band=7;
 assert.throws(()=>normalizeAssessment(raw,s,options),{code:'invalid_assessment'});
});

test('tiny writing receives feedback without band estimates, while 40 words is not blindly penalised',()=>{
 const tiny=submission('writing_task',{text:Array(39).fill('word').join(' ')}),raw=rawReport(tiny),report=normalizeAssessment(raw,tiny,options);
 assert.equal(report.estimatedBand,null);assert.equal(report.confidence,'low');assert.ok(report.criteria.every(c=>c.band===null));
 assert.match(report.limitations.join(' '),/fewer than 40 words/);
 const longer=submission('writing_task',{text:Array(40).fill('word').join(' ')});
 assert.equal(normalizeAssessment(rawReport(longer),longer,options).estimatedBand,7);
 raw.criteria[0].band=11;assert.throws(()=>normalizeAssessment(raw,tiny,options));
});

test('audio evidence keeps timestamps but must stay within the supplied duration',()=>{
 const s=submission('speaking_audio',{text:'',audio:{data:'UklGRg==',format:'wav',duration:15}}),raw=rawReport(s);
 raw.criteria[0].evidence=[{quote:'audible words',timestampSeconds:12}];
 assert.equal(normalizeAssessment(raw,s,options).criteria[0].evidence[0].timestampSeconds,12);
 raw.criteria[0].evidence[0].timestampSeconds=16;assert.throws(()=>normalizeAssessment(raw,s,options));
});

test('full metadata and all legacy provider records remain importable, with strict backup grounding',()=>{
 const s=submission();
 for(const provider of ['Google Gemini','Puter / OpenAI','OpenAI']){
  const report=normalizeAssessment(rawReport(s),s,{...options,provider});
  assert.deepEqual(normalizeAssessment(report,s),report);
  assert.equal(safeAssessments([{submission:snapshotSubmission(s),assessment:report}]),true);
  report.criteria[0].evidence[0].quote='An invented sentence.';
  assert.equal(safeAssessments([{submission:snapshotSubmission(s),assessment:report}]),false);
 }
 assert.throws(()=>normalizeAssessment(rawReport(s),s,{...options,provider:'Unverified'}));
});

test('a full Part 2 recording fits the 120-second / 4 MB PCM bound without truncation',()=>{
 assert.equal(MAX_AUDIO_SECONDS,120);assert.equal(MAX_AUDIO_BYTES,4000000);
 const bytes=encodeMonoWav(new Float32Array(16000*120));
 assert.equal(bytes.length,3840044);assert.ok(bytes.length<MAX_AUDIO_BYTES);
 assert.throws(()=>encodeMonoWav(new Float32Array(16000*121)),/120 seconds/);
 assert.equal(createSubmission({scope:'speaking_audio',promptId:'p2-0',prompt:'Describe a trip.',text:'',audio:{data:'UklGRg==',format:'wav',duration:120}}).audio.duration,120);
});
