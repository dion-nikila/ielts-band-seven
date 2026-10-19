import test from 'node:test';
import assert from 'node:assert/strict';
import {openGeminiPortal,GEMINI_GRADER_URL} from '../gemini-portal.mjs';
import {createSubmission} from '../grading.mjs';
const CHANNEL='ielts-gemini-v1';
const ORIGIN=new URL(GEMINI_GRADER_URL).origin;
function submission(extra={}){return createSubmission({id:'portal-submission',createdAt:'2026-10-19T08:00:00.000Z',scope:'writing_task',promptId:'essay-1',prompt:'Should cities provide free public transport?',taskType:2,text:'Cities should provide free public transport. This reduces traffic.',...extra});}
function report(s=submission()){
 return {version:1,id:'portal-report',submissionId:s.id,date:'2026-10-19T08:01:00.000Z',provider:'Google Gemini',model:'gemini-2.5-flash',rubricVersion:'IELTS-public-2023',scope:s.scope,provisional:true,estimatedBand:7,confidence:'low',summary:'A clear position with limited development.',criteria:['task_response','coherence_cohesion','lexical_resource','grammatical_range_accuracy'].map(id=>({id,label:id,band:7,why:'An explicit position is present.',evidence:[{quote:s.text,timestampSeconds:null}]})),strengths:['A clear position.'],priorities:[{criterion:'task_response',action:'Explain one consequence.',practice:'Add a concrete example.',successCheck:'The example supports the claim.'}],corrections:[{original:s.text,replacement:s.text+' For example, fewer commuters may drive.',why:'Develop the reason.'}],improvedExcerpt:'A brief comparison example.',limitations:['Practice feedback, not an official result.']};
}
function fixture({blocked=false}={}){
 const listeners=new Set(),posts=[],opened=[];
 const child={closed:false,postMessage:(data,origin)=>posts.push({data,origin})};
 const win={open:(...args)=>{opened.push(args);return blocked?null:child;},addEventListener:(type,handler)=>{assert.equal(type,'message');listeners.add(handler);},removeEventListener:(type,handler)=>listeners.delete(handler)};
 const session=()=>new URLSearchParams(new URL(opened[0][0]).hash.slice(1)).get('session');
 function emit(data,override={}){const event={origin:ORIGIN,source:child,data:{channel:CHANNEL,session:session(),...data},...override};for(const listener of [...listeners])listener(event);}
 return {win,child,posts,opened,listeners,session,emit};
}
const tick=()=>new Promise(resolve=>queueMicrotask(resolve));

test('portal opens at a fixed HTTPS origin with a per-window session and no credentials',t=>{
 const f=fixture(),p=openGeminiPortal({window:f.win});t.after(()=>p.cancel());
 const [url,name,features]=f.opened[0];
 assert.equal(new URL(url).origin,ORIGIN);assert.equal(new URL(url).search,'');assert.ok(f.session().length>=30);
 assert.equal(name,'ielts-private-gemini-grader-'+f.session());assert.match(features,/popup/);
 assert.doesNotMatch(url,/apiKey|api_key|accessCode|AIza|sk-proj/);
});

test('wrong origin, source, channel and session cannot connect or deliver a report',async t=>{
 const f=fixture(),connections=[],p=openGeminiPortal({window:f.win,onConnection:value=>connections.push(value)});t.after(()=>p.cancel());
 let ready=false,result=false;p.ready.then(()=>{ready=true;});
 const s=submission(),pending=p.grade(s);pending.then(()=>{result=true;},()=>{});
 const wrong=[{origin:'https://attacker.example'},{source:{}},{data:{channel:'wrong',session:f.session(),type:'ready',configured:true}},{data:{channel:CHANNEL,session:'wrong',type:'ready',configured:true}}];
 for(const override of wrong)f.emit({type:'ready',configured:true},override);
 await tick();assert.equal(ready,false);assert.equal(connections.length,0);assert.equal(f.posts.some(x=>x.data.type==='grade'),false);
 f.emit({type:'ready',configured:true,model:'gemini-2.5-flash'});assert.deepEqual(await p.ready,{configured:true,model:'gemini-2.5-flash'});
 for(const override of wrong.map(item=>item.data?{data:{...item.data,type:'result',assessment:report(s)}}:item))f.emit({type:'result',assessment:report(s)},override);
 await tick();assert.equal(result,false);
 f.emit({type:'result',assessment:report(s)});assert.equal((await pending).submissionId,s.id);assert.equal(f.listeners.size,0);
});

test('the exact immutable submission is sent once and only to the expected origin',async t=>{
 const f=fixture(),p=openGeminiPortal({window:f.win});t.after(()=>p.cancel());
 const s=submission({apiKey:'never-forward-this-key',accessCode:'never-forward-this-code'}),pending=p.grade(s);
 f.emit({type:'ready',configured:true});f.emit({type:'ready',configured:true});
 const grades=f.posts.filter(x=>x.data.type==='grade');assert.equal(grades.length,1);
 assert.deepEqual(grades[0].data,{channel:CHANNEL,session:f.session(),type:'grade',submission:s});
 assert.ok(f.posts.every(x=>x.origin===ORIGIN));assert.doesNotMatch(JSON.stringify(f.posts),/never-forward|apiKey|accessCode/);
 const r=report(s);r.apiKey='provider-secret-never-keep';f.emit({type:'result',assessment:r});
 const result=await pending;assert.equal(result.provider,'Google Gemini');assert.equal('apiKey' in result,false);
});

test('unconfigured portal waits for setup while preserving the pending answer',async t=>{
 const f=fixture(),stages=[],p=openGeminiPortal({window:f.win,onStage:value=>stages.push(value)});t.after(()=>p.cancel());
 const s=submission(),pending=p.grade(s);f.emit({type:'ready',configured:false});
 assert.match(stages.at(-1),/setup/);
 f.emit({type:'ready',configured:true});f.emit({type:'result',assessment:report(s)});
 assert.equal((await pending).submissionId,s.id);
});

test('foreign submission IDs, invented evidence and inconsistent bands are rejected',async()=>{
 for(const mutate of [r=>r.submissionId='another-answer',r=>r.criteria[0].evidence[0].quote='Invented quote.',r=>r.estimatedBand=9]){
  const f=fixture(),p=openGeminiPortal({window:f.win}),s=submission(),pending=p.grade(s),r=report(s);mutate(r);
  f.emit({type:'ready',configured:true});f.emit({type:'result',assessment:r});
  await assert.rejects(pending,e=>e.code==='invalid_report');assert.equal(f.listeners.size,0);
 }
});

test('provider quota failures preserve a useful category and retry delay',async()=>{
 const f=fixture(),p=openGeminiPortal({window:f.win}),pending=p.grade(submission());
 f.emit({type:'error',error:{code:'quota',message:'Quota is unavailable.',retryAfter:35}});
 await assert.rejects(pending,e=>e.code==='quota'&&e.retryAfter===35&&e.message==='Quota is unavailable.');assert.equal(f.listeners.size,0);
});

test('blocked popup fails before installing listeners or sending an answer',()=>{
 const f=fixture({blocked:true});assert.throws(()=>openGeminiPortal({window:f.win}),e=>e.code==='popup_blocked');
 assert.equal(f.listeners.size,0);assert.equal(f.posts.length,0);
});

test('closing the private window rejects the pending request and removes listeners',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});
 const f=fixture(),p=openGeminiPortal({window:f.win}),pending=p.grade(submission());
 f.child.closed=true;t.mock.timers.tick(1800);
 await assert.rejects(pending,e=>e.code==='window_closed');assert.equal(f.listeners.size,0);
});

test('setup timeout leaves no pending listener and can be retried with a fresh session',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});
 const f=fixture(),p=openGeminiPortal({window:f.win,timeoutMs:5000}),pending=p.grade(submission());
 t.mock.timers.tick(5000);await assert.rejects(pending,e=>e.code==='timeout');assert.equal(f.listeners.size,0);
 const next=fixture(),retry=openGeminiPortal({window:next.win});assert.notEqual(next.session(),f.session());retry.cancel();
});

test('AbortSignal cancellation cleans up and ignores late provider success',async()=>{
 const f=fixture(),controller=new AbortController(),p=openGeminiPortal({window:f.win,signal:controller.signal}),s=submission(),pending=p.grade(s);
 f.emit({type:'ready',configured:true});controller.abort();
 await assert.rejects(pending,e=>e.code==='cancelled');assert.equal(f.listeners.size,0);
 f.emit({type:'result',assessment:report(s)});await assert.rejects(p.grade(s),/Open the private grader again/);
});

test('an already-aborted request cannot send a submitted answer',async()=>{
 const f=fixture(),controller=new AbortController();controller.abort();
 const p=openGeminiPortal({window:f.win,signal:controller.signal});
 await assert.rejects(p.grade(submission()));assert.equal(f.posts.length,0);assert.equal(f.listeners.size,0);
});

test('hello polling stops after the portal responds, while window-close detection remains active',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});
 const f=fixture(),p=openGeminiPortal({window:f.win});t.after(()=>p.cancel());
 t.mock.timers.tick(1800);assert.equal(f.posts.filter(x=>x.data.type==='hello').length,1);
 f.emit({type:'ready',configured:false});t.mock.timers.tick(5400);
 assert.equal(f.posts.filter(x=>x.data.type==='hello').length,1);
 const pending=p.grade(submission());f.child.closed=true;t.mock.timers.tick(1800);
 await assert.rejects(pending,e=>e.code==='window_closed');
});

test('disposing a connection-only session removes polling and prevents later submissions',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});
 const f=fixture(),p=openGeminiPortal({window:f.win});
 f.emit({type:'ready',configured:true,model:'gemini-2.5-flash'});assert.equal((await p.ready).configured,true);
 p.dispose();assert.equal(f.listeners.size,0);const count=f.posts.length;t.mock.timers.tick(600000);
 assert.equal(f.posts.length,count);await assert.rejects(p.grade(submission()),/Open the private grader again/);
});

test('a provider deadline replaces the long one-time setup wait once grading starts',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});
 const f=fixture(),p=openGeminiPortal({window:f.win,timeoutMs:600000,providerTimeoutMs:1500}),pending=p.grade(submission());
 let finished=false;pending.catch(()=>{finished=true;});
 f.emit({type:'ready',configured:true});f.emit({type:'stage',message:'Gemini is assessing the answer.'});
 t.mock.timers.tick(1499);await tick();assert.equal(finished,false);
 t.mock.timers.tick(1);await assert.rejects(pending,e=>e.code==='timeout'&&/Gemini took too long/.test(e.message));assert.equal(f.listeners.size,0);
});


test('key setup keeps the longer setup deadline until actual grading begins',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});
 const f=fixture(),p=openGeminiPortal({window:f.win,timeoutMs:600000,providerTimeoutMs:1500}),s=submission(),pending=p.grade(s);
 let finished=false;pending.catch(()=>{finished=true;});
 f.emit({type:'ready',configured:false});f.emit({type:'stage',stage:'setup_required',message:'Finish key setup.'});
 t.mock.timers.tick(3000);await tick();assert.equal(finished,false);
 f.emit({type:'ready',configured:true});f.emit({type:'stage',stage:'grading',message:'Assessing the answer.'});
 t.mock.timers.tick(1499);await tick();assert.equal(finished,false);
 f.emit({type:'result',assessment:report(s)});assert.equal((await pending).submissionId,s.id);
});


test('every session uses a fresh window so a fragment-only navigation cannot retain an old nonce',()=>{
 const f=fixture(),first=openGeminiPortal({window:f.win}),second=openGeminiPortal({window:f.win});
 assert.notEqual(f.opened[0][1],f.opened[1][1]);first.cancel();second.cancel();
});
