import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverSavedState} from '../persistence.mjs';
import {emptyState,validateState} from '../core.mjs';
import {createSubmission,safeAssessments,snapshotSubmission} from '../grading.mjs';
import {safeLearning} from '../coach.mjs';

function savedCore(){
 const state=emptyState();
 state.drafts['essay-1']={text:'My existing answer should survive a damaged feedback report.',checks:[false,true]};
 state.writingHistory=[{id:'saved-draft',promptId:'essay-1',text:'An earlier answer.',checks:[false],date:'2026-10-19T08:00:00.000Z'}];
 state.mockAttempts=[{id:'mock-1',source:'Official practice test',date:'2026-10-19',mode:'fresh',listening:38,reading:39,bands:[8.5,9,null,null],provenance:'unknown',created:1792396800000}];
 return state;
}
function record(id='report-1'){
 const submission=createSubmission({id:'submission-'+id,scope:'writing_task',promptId:'essay-1',prompt:'Discuss public transport.',text:'Public transport helps commuters.',taskType:2});
 const ids=['task_response','coherence_cohesion','lexical_resource','grammatical_range_accuracy'];
 return {submission:snapshotSubmission(submission),assessment:{version:1,id,submissionId:submission.id,date:'2026-10-19T08:01:00.000Z',provider:'Puter / OpenAI',model:'legacy-model',rubricVersion:'IELTS-public-2023',scope:'writing_task',provisional:true,estimatedBand:7,confidence:'low',summary:'Develop the example.',criteria:ids.map(id=>({id,label:id,band:7,why:'The main claim is relevant.',evidence:[{quote:'Public transport',timestampSeconds:null}]})),strengths:['A relevant claim.'],priorities:[],corrections:[],improvedExcerpt:'',limitations:['Provisional feedback.']}};
}

test('new storage and valid legacy v1 state need no recovery or migration',()=>{
 const fresh=recoverSavedState(null);assert.equal(fresh.blocked,false);assert.equal(fresh.needsRecoveryBackup,false);assert.deepEqual(fresh.warnings,[]);
 const state=savedCore(),result=recoverSavedState(JSON.stringify(state));
 assert.deepEqual(result.state,state);assert.equal(result.blocked,false);assert.equal(result.needsRecoveryBackup,false);assert.equal(result.rawRecovery,null);
 assert.equal('assessments' in result.state,false);assert.equal('learning' in result.state,false);
});

test('one corrupt assessment is quarantined while valid feedback, drafts and mocks survive',()=>{
 const state=savedCore(),valid=record(),invalid=record('broken');invalid.assessment.criteria[0].evidence[0].quote='Invented quote';
 state.assessments=[valid,invalid];const raw=JSON.stringify(state),result=recoverSavedState(raw);
 assert.deepEqual(result.state.assessments,[valid]);assert.deepEqual(result.state.drafts,state.drafts);assert.deepEqual(result.state.mockAttempts,state.mockAttempts);assert.deepEqual(result.state.writingHistory,state.writingHistory);
 assert.equal(result.needsRecoveryBackup,true);assert.equal(result.blocked,false);assert.equal(result.rawRecovery,raw);assert.ok(result.warnings.length);
 assert.equal(safeAssessments(result.state.assessments),true);assert.doesNotThrow(()=>validateState(result.state));
});

test('unparseable JSON and invalid core data are blocked with the exact original retained',()=>{
 for(const raw of ['{broken','',JSON.stringify({...savedCore(),settings:{}}),'null','[]']){
  const result=recoverSavedState(raw);assert.equal(result.blocked,true);assert.equal(result.rawRecovery,raw);assert.deepEqual(result.state.drafts,{});assert.ok(result.warnings.length);
 }
});

test('malformed optional learning data is dropped without resetting core state',()=>{
 const state=savedCore();state.learning={lessons:{},current:null,speaking:'invalid'};
 const result=recoverSavedState(JSON.stringify(state));
 assert.equal('learning' in result.state,false);assert.equal(safeLearning(result.state.learning),true);assert.equal(result.blocked,false);assert.equal(result.needsRecoveryBackup,true);assert.deepEqual(result.state.drafts,state.drafts);
 const valid={lessons:{'reading-evidence':{step:1,selected:0,submitted:true,correct:false,completedAt:null}},current:'reading-evidence',speaking:[],practice:null};
 state.learning=valid;assert.deepEqual(recoverSavedState(state).state.learning,valid);
});

test('speaking drafts retain valid modes and keys while discarding unsafe or oversized values',()=>{
 const state=savedCore();state.speakingAnswers={
  'p1-0':{mode:'speaking_points',text:'A safe idea.'},
  'p2-1':{mode:'speaking_transcript',text:'What I actually said.'},
  'p3-2':{mode:'speaking_points',text:'Another idea.',apiKey:'must-not-be-copied'},
  'p1-3':{mode:'speaking_audio',text:'Unsupported mode.'},
  'p1-4':{mode:'speaking_points',text:'x'.repeat(20001)},
  'p2-5':{mode:'speaking_points',text:17},
  'p9-6':{mode:'speaking_points',text:'Unsupported part.'},
  'p1-9999':{mode:'speaking_points',text:'Unsupported key.'}
 };
 Object.defineProperty(state.speakingAnswers,'__proto__',{value:{mode:'speaking_points',text:'Unsafe key.'},enumerable:true});
 const result=recoverSavedState(state);
 assert.deepEqual(Object.keys(result.state.speakingAnswers),['p1-0','p2-1','p3-2']);assert.deepEqual(result.state.speakingAnswers['p3-2'],{mode:'speaking_points',text:'Another idea.'});
 assert.equal(Object.hasOwn(result.state.speakingAnswers,'__proto__'),false);assert.equal(result.needsRecoveryBackup,true);assert.equal(result.blocked,false);assert.deepEqual(result.state.mockAttempts,state.mockAttempts);
});

test('recovery never mutates an original parsed object or its nested records',()=>{
 const state=savedCore();state.assessments=[record(),{}];state.speakingAnswers={'p1-0':{mode:'speaking_points',text:'Saved idea.'}};
 const before=structuredClone(state),result=recoverSavedState(state);
 assert.deepEqual(state,before);result.state.drafts['essay-1'].text='Changed recovered copy';result.state.assessments[0].assessment.summary='Changed';result.state.speakingAnswers['p1-0'].text='Changed';
 assert.deepEqual(state,before);
});

test('malformed optional containers are isolated and valid speaking drafts remain untouched',()=>{
 const state=savedCore();state.assessments={not:'an array'};state.learning=null;state.speakingAnswers=[];
 const result=recoverSavedState(state);assert.deepEqual(result.state.assessments,[]);assert.deepEqual(result.state.speakingAnswers,{});assert.equal('learning' in result.state,false);assert.equal(result.warnings.length,3);assert.equal(result.blocked,false);
 const valid=savedCore();valid.speakingAnswers={'p1-0':{mode:'speaking_points',text:''},'p3-12':{mode:'speaking_transcript',text:'x'.repeat(20000)}};
 const recovered=recoverSavedState(valid);assert.deepEqual(recovered.state,valid);assert.equal(recovered.needsRecoveryBackup,false);
});

test('oversized assessment history keeps the latest 200 valid reports and requires a recovery copy',()=>{
 const state=savedCore();state.assessments=Array.from({length:202},(_,i)=>record('report-'+i));
 const result=recoverSavedState(state);assert.equal(result.state.assessments.length,200);assert.equal(result.state.assessments[0].assessment.id,'report-2');assert.equal(result.state.assessments.at(-1).assessment.id,'report-201');assert.equal(result.needsRecoveryBackup,true);assert.equal(result.blocked,false);
});
