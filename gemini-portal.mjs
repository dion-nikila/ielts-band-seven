import {validateAssessment} from './grading.mjs?v=20261019-final';
export const GEMINI_GRADER_URL='https://ielts-gemini-grader-dion.hf5r5r9j8h.chatgpt.site/';
const CHANNEL='ielts-gemini-v1';
function error(message,code='connection_error',retryAfter=null){return Object.assign(new Error(message),{code,retryAfter});}
/** Open synchronously from Submit, before any recording conversion or network await. */
export function openGeminiPortal({window:win=globalThis.window,url=GEMINI_GRADER_URL,signal,onStage,onConnection,timeoutMs=600000,providerTimeoutMs=150000}={}){
 const origin=new URL(url).origin,session=globalThis.crypto.randomUUID(),target=new URL(url);target.hash='session='+session;
 const child=win.open(target.href,'ielts-private-gemini-grader-'+session,'popup,width=850,height=850');
 if(!child)throw error('Allow the private grading window, then click Submit again. Your answer remains in the app.','popup_blocked');
 let submission=null,posted=false,greeted=false,providerStarted=false,settled=false,readyResolve,resultResolve,resultReject,timer,poll;
 const ready=new Promise(resolve=>{readyResolve=resolve;});
 const result=new Promise((resolve,reject)=>{resultResolve=resolve;resultReject=reject;});
 // A connect-only session may not consume result; avoid an unhandled rejection.
 result.catch(()=>{});
 function cleanup(){win.removeEventListener('message',receive);signal?.removeEventListener('abort',cancel);clearTimeout(timer);clearInterval(poll);}
 function fail(e){if(settled)return;settled=true;cleanup();readyResolve({configured:false,error:e});resultReject(e);}
 function send(){if(submission&&!posted){posted=true;child.postMessage({channel:CHANNEL,session,type:'grade',submission},origin);}}
 function receive(event){const data=event.data;if(event.origin!==origin||event.source!==child||!data||data.channel!==CHANNEL||data.session!==session)return;
  if(data.type==='ready'){greeted=true;onConnection?.({configured:data.configured===true,model:data.model});if(data.configured){readyResolve({configured:true,model:data.model});}else onStage?.('Finish the one-time Gemini setup in the private grading window.');send();}
  if(data.type==='stage'){if(data.stage!=='setup_required'&&!providerStarted){providerStarted=true;clearTimeout(timer);timer=setTimeout(()=>fail(error('Gemini took too long. Retry the saved submission.','timeout')),providerTimeoutMs);}onStage?.(String(data.message||'Gemini is assessing your submitted answer…').slice(0,500));}
  if(data.type==='error'){const e=error(String(data.error?.message||'The grading service did not finish.').slice(0,1000),String(data.error?.code||'provider_error').slice(0,100),Number.isFinite(data.error?.retryAfter)?data.error.retryAfter:null);fail(e);}
  if(data.type==='result'&&submission){try{const report=validateAssessment(data.assessment,submission);settled=true;cleanup();resultResolve(report);}catch{fail(error('The returned feedback could not be validated. Retry the same saved submission.','invalid_report'));}}
 }
 function cancel(){fail(error('Request cancelled. A request already sent to Google may still use quota.','cancelled'));}
 win.addEventListener('message',receive);signal?.addEventListener('abort',cancel,{once:true});
 timer=setTimeout(()=>fail(error('The private grading window took too long. Finish sign-in or key setup, then retry your saved answer.','timeout')),timeoutMs);
 poll=setInterval(()=>{if(child.closed)fail(error('The grading window closed or was separated during sign-in. Return to the app and click Submit again.','window_closed'));else if(!greeted)child.postMessage({channel:CHANNEL,session,type:'hello'},origin);},1800);
 if(signal?.aborted)cancel();
 return {ready,child,grade(value){if(settled)return Promise.reject(error('Open the private grader again, then retry.'));submission=value;child.postMessage({channel:CHANNEL,session,type:'hello'},origin);return result;},cancel,dispose(){settled=true;cleanup();}};
}
