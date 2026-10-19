// The only network work in this worker is fetching public runtime/model files.
// Answers stay inside this worker and are never sent to a remote inference API.
const RUNTIME = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm';
let engine = null, model = null, busy = false;
const send = (id, type, detail = {}) => self.postMessage({ id, type, ...detail });

export async function initializeLocalEngine({device=globalThis.navigator,loadRuntime=()=>import(RUNTIME),onStage=()=>{},onProgress=()=>{}}={}) {
  const adapter = await device?.gpu?.requestAdapter();
  if (!adapter) throw Object.assign(new Error('This browser could not access WebGPU. Try a recent desktop Chrome or Edge browser, or use the quick checks here.'),{code:'unsupported_device'});
  const selected = adapter.features.has('shader-f16') ? 'Qwen3-1.7B-q4f16_1-MLC' : 'Qwen3-1.7B-q4f32_1-MLC';
  onStage('Downloading or opening the cached local model (about 1 GB).');
  const { CreateMLCEngine, prebuiltAppConfig } = await loadRuntime();
  const loaded = await CreateMLCEngine(selected, {
    logLevel: 'ERROR',
    appConfig: {...prebuiltAppConfig,cacheBackend:'indexeddb'},
    initProgressCallback: onProgress,
  });
  return {engine:loaded,model:selected};
}
async function load(id) {
  const result=await initializeLocalEngine({onStage:message=>send(id,'stage',{message}),onProgress:report=>send(id,'progress',{progress:report.progress,text:report.text,timeElapsed:report.timeElapsed})});
  engine=result.engine;model=result.model;send(id,'loaded',{model});
}
async function grade(id, prompt) {
  if (!engine) { send(id, 'error', { code: 'model_not_loaded', message: 'Load the on-device coach before requesting feedback.' }); return; }
  if (!prompt || !Array.isArray(prompt.messages) || !prompt.schema || !prompt.submission || prompt.submission.scope === 'speaking_audio' || prompt.submission.prompt.length + prompt.submission.text.length > 5000) { send(id, 'error', { code: 'context_too_long', message: 'Use a text practice response with up to 5,000 task and answer characters combined. No answer text was cut.' }); return; }
  send(id, 'stage', { message: 'Reading your answer locally and preparing practical feedback.' });
  await engine.resetChat();
  const response = await engine.chat.completions.create({
    messages: prompt.messages,
    max_tokens: 2200,
    temperature: 0.2,
    response_format: { type: 'json_object', schema: JSON.stringify(prompt.schema) },
    extra_body: { enable_thinking: false },
    stream: true,
  });
  let text='',finishReason=null,lastStage='';
  for await(const chunk of response){const choice=chunk?.choices?.[0];if(typeof choice?.delta?.content==='string')text+=choice.delta.content;if(choice?.finish_reason)finishReason=choice.finish_reason;
    const stage=text.includes('"improvedExcerpt"')?'Finishing and validating your feedback.':text.includes('"corrections"')?'Checking suggested changes to your wording.':text.includes('"priorities"')?'Preparing your next practice exercise.':text.includes('"criteria"')?'Checking the task and your language.':'';
    if(stage&&stage!==lastStage){lastStage=stage;send(id,'stage',{message:stage});}
  }
  if (finishReason !== 'stop' || !text.trim()) { send(id, 'error', { code: 'invalid_local_report', message: 'The local model could not finish a complete report. Your answer is available; try a shorter response.' }); return; }
  send(id, 'result', { text, model });
}
if(typeof self!=='undefined'&&typeof self.postMessage==='function'&&typeof document==='undefined') self.addEventListener('message', async event => {
  const message = event.data;
  if (!message || typeof message.id !== 'string' || !['load', 'grade'].includes(message.type)) return;
  if (busy) { send(message.id, 'error', { code: 'busy', message: 'The local coach is already working. Wait for it to finish or cancel it.' }); return; }
  busy = true;
  try { if (message.type === 'load') await load(message.id); else await grade(message.id, message.prompt); }
  catch (error) {
    if(message.type==='load') console.error('Local model startup:',String(error?.message||error));
    if(error?.code==='unsupported_device'){send(message.id,'error',{code:'unsupported_device',message:error.message});return;}
    const context = /context|window|prompt.*(long|length|exceed)/i.test(String(error?.message || ''));
    send(message.id, 'error', { code: context ? 'context_too_long' : message.type === 'load' ? 'download_failed' : 'generation_failed', message: context ? 'This response exceeds the local model’s context limit. Use a shorter task and answer; nothing was silently shortened.' : message.type === 'load' ? 'The local model could not finish downloading or opening. Retry to resume cached files, check your connection and free memory, or use the quick checks meanwhile.' : 'The local model could not produce verified feedback. Your answer is available; try again or use the revision tools.' });
  } finally { busy = false; }
});
