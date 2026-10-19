import {LOCAL_ASR_MODEL,LOCAL_ASR_REVISION,LOCAL_ASR_RUNTIME,LOCAL_ASR_WASM_PATH} from './local-transcriber.mjs?v=20261019-local5';

const notify=(callback,value)=>{try{callback?.(value);}catch{}};
const error=(message,code)=>Object.assign(new Error(message),{code});
const loadRuntime=()=>import(LOCAL_ASR_RUNTIME);

/** Exported for deterministic tests; the live worker accepts PCM samples only,
 * never a remote audio URL, model identifier or user-controlled import path. */
export async function runLocalTranscription({samples,sampleRate,duration},{onStage,onProgress,loadTransformers=loadRuntime}={}){
 if(!(samples instanceof Float32Array)||sampleRate!==16000||!Number.isFinite(duration)||duration<0.1||duration>120||samples.length!==Math.round(duration*sampleRate)||samples.length>1920000||samples.some(value=>!Number.isFinite(value)||value< -1||value>1))throw error('The prepared recording is invalid. Record up to two minutes and try again.','invalid_audio');
 if(!samples.some(value=>value!==0))throw error('This recording contains only silence. Check the microphone and record your answer again.','silent_audio');
 let transcriber;
 try{
  notify(onStage,'Loading the speech model on this device. First use downloads about 70 MB.');
  const {env,pipeline,WhisperTextStreamer}=await loadTransformers();
  env.allowLocalModels=false;env.allowRemoteModels=true;env.useBrowserCache=true;
  env.remoteHost='https://huggingface.co/';env.remotePathTemplate='{model}/resolve/{revision}/';
  env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;env.backends.onnx.wasm.wasmPaths=LOCAL_ASR_WASM_PATH;
  transcriber=await pipeline('automatic-speech-recognition',LOCAL_ASR_MODEL,{device:'wasm',dtype:'q8',revision:LOCAL_ASR_REVISION,progress_callback:event=>{
   if(event?.status==='progress')notify(onProgress,{phase:'download',file:typeof event.file==='string'?event.file:'speech model',progress:Number.isFinite(event.progress)?event.progress:null,...(Number.isFinite(event.loaded)?{loaded:event.loaded}:{}),...(Number.isFinite(event.total)?{total:event.total}:{})});
  }});
  const chunks=Math.max(1,Math.ceil((duration-30)/20)+1);let completed=0;
  notify(onStage,`Transcribing chunk 1 of ${chunks} on this device. You can cancel at any time.`);
  notify(onProgress,{phase:'transcribe',progress:0,chunk:0,chunks});
  const streamer=new WhisperTextStreamer(transcriber.tokenizer,{skip_prompt:true,callback_function:()=>{},on_finalize:()=>{
   completed=Math.min(chunks,completed+1);
   notify(onProgress,{phase:'transcribe',progress:Math.round(completed/chunks*100),chunk:completed,chunks});
   if(completed<chunks)notify(onStage,`Transcribing chunk ${completed+1} of ${chunks} on this device.`);
  }});
  const output=await transcriber(samples,{chunk_length_s:30,stride_length_s:5,return_timestamps:false,num_beams:1,do_sample:false,streamer});
  const text=output?.text;
  if(typeof text!=='string'||!text.trim()||text.length>20000)throw error('No usable transcript was recognised. Listen back and type the answer, or record it again.','transcript_empty');
  notify(onProgress,{phase:'transcribe',progress:100,chunk:chunks,chunks});
  notify(onStage,'Transcript ready. Check every word against your recording before requesting feedback.');
  return {text:text.trim(),model:LOCAL_ASR_MODEL,duration};
 }finally{try{await transcriber?.dispose?.();}catch{/* The parent also terminates this disposable worker. */}}
}

// Importing this file in tests does not register a browser listener or download
// the runtime. No network/model work occurs until an explicit transcribe message.
if(typeof self!=='undefined'&&typeof self.postMessage==='function'&&typeof document==='undefined'){
 let busy=false;
 self.addEventListener('message',async event=>{
  const data=event.data;if(!data||data.type!=='transcribe'||typeof data.id!=='string'||data.id.length>150)return;
  const send=value=>self.postMessage({id:data.id,...value});
  if(busy){send({type:'error',code:'transcription_busy',message:'Local transcription is already running.'});return;}
  busy=true;
  try{
   if(!(data.samples instanceof ArrayBuffer))throw error('The prepared recording is invalid.','invalid_audio');
   const result=await runLocalTranscription({samples:new Float32Array(data.samples),sampleRate:data.sampleRate,duration:data.duration},{onStage:message=>send({type:'stage',message}),onProgress:progress=>send({type:'progress',...progress})});
   send({type:'result',...result});
  }catch(cause){
   const known=['invalid_audio','silent_audio','transcript_empty'].includes(cause?.code);
   send({type:'error',code:known?cause.code:'local_transcription_unavailable',message:known?cause.message:'Local transcription did not finish. Check your connection for the first model download, or try a shorter recording.'});
  }finally{busy=false;}
 });
}
