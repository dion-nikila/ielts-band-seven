import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRevisionComparison,createAssessmentStudio} from '../assessment-studio.mjs';
import {renderAssessment,renderConnection,escapeGradingText} from '../grading-ui.mjs';
const esc=escapeGradingText;
function record(text='A useful example.',extra={}){
 return {submission:{scope:'speaking_points',promptId:'question-1',prompt:'Describe an example.',text},assessment:{id:'feedback-1',scope:'speaking_points',date:'2026-10-19',provider:'Google Gemini',model:'test-model',confidence:'low',estimatedBand:null,summary:'Develop the example.',criteria:[{id:'relevance_development',label:'Relevance and development',band:null,why:'Explain how the example supports the point.',evidence:[{quote:text,timestampSeconds:null}]}],strengths:['Relevant example.'],priorities:[{action:'Explain one consequence.',practice:'Add a result.',successCheck:'A clear link to your claim.'}],corrections:[],improvedExcerpt:'',limitations:['Practice feedback.'],...extra}};
}
test('feedback-only revisions compare evidence and next actions rather than empty score rows',()=>{
 const before=record('An example.'),after=record('An example with a consequence.');
 after.assessment.priorities[0].action='Make the consequence precise.';
 const html=renderRevisionComparison([before,after],esc);
 assert.match(html,/PREVIOUS ANSWER/);assert.match(html,/LATEST ANSWER/);
 assert.match(html,/An example with a consequence/);assert.match(html,/Explain one consequence/);assert.match(html,/Make the consequence precise/);
 assert.match(html,/Explain how the example supports the point/);assert.doesNotMatch(html,/Not scored/);
});
test('resubmitting identical text warns that report variation is not evidence of progress',()=>{
 const html=renderRevisionComparison([record('My answer.  '),record('My   answer.')],esc);
 assert.match(html,/answer text is unchanged/);assert.match(html,/not evidence of progress/);
});
test('comparison excerpts and report actions escape submitted markup',()=>{
 const malicious='<img src=x onerror=alert(1)>';
 const html=renderRevisionComparison([record('Before'),record(malicious)],esc);
 assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);
 const report=record('Hello',{priorities:[{action:malicious,practice:malicious,successCheck:malicious}]});
 assert.doesNotMatch(renderAssessment(report),/<img/);
});
test('feedback leads with actionable priorities and uses scope-specific no-score explanations',()=>{
 const r=record();
 const html=renderAssessment(r);
 assert.ok(html.indexOf('Your next change')<html.indexOf('Evidence by criterion'));
 assert.match(html,/Talking points are preparation/);assert.doesNotMatch(html,/A transcript can show/);
 assert.match(renderAssessment(record('A paragraph.',{scope:'writing_fragment'})),/A paragraph does not cover a full Writing task/);
});
test('connection has a private setup action and no key-entry field or intermediary account',()=>{
 const html=renderConnection();
 assert.match(html,/data-action="connect-grader"/);assert.match(html,/Open private grader/);
 assert.match(html,/free-tier quotas/);assert.doesNotMatch(html,/Puter|type="password"|grader-url/);
});
test('studio errors preserve available work without falsely claiming persistence',()=>{
 const studio=createAssessmentStudio({getState:()=>({assessments:[]}),esc,head:()=>'',button:(action,label)=>`<button data-action="${action}">${label}</button>`,link:(url,label)=>`<a href="${url}">${label}</a>`,connected:()=>false,job:()=>null,error:()=>({code:'quota',message:'Wait before retrying.',retryAfter:30}),storageAvailable:()=>false});
 const html=studio.hub();
 assert.match(html,/free quota is temporarily unavailable/);assert.match(html,/about 30 seconds/);assert.match(html,/answer remains available/);assert.match(html,/Download it before closing/);
 assert.doesNotMatch(html,/answer is still saved/);
 assert.match(html,/data-action="copy-grading-request"/);assert.match(html,/data-action="import-grade"/);
});
