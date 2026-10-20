// The model and runtime are fetched only after transcribeLocal is explicitly
// called. The recording is decoded locally and is never sent to a remote API.
export const LOCAL_ASR_MODEL='Xenova/whisper-tiny.en';
export const LOCAL_ASR_REVISION='79fb389fc764e7c395bd330e9531d9d32ada7049';
export const LOCAL_ASR_RUNTIME='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
export const LOCAL_ASR_WASM_PATH='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
export const LOCAL_ASR_INFO=Object.freeze({model:LOCAL_ASR_MODEL,revision:LOCAL_ASR_REVISION,runtimeVersion:'3.8.1',weightsBytes:40852295,firstDownloadApproxMB:70});
const RATE=16000,MAX_SECONDS=120,MAX_BYTES=4000000;
let activeJob=null;
function failure(message,code='local_transcription_unavailable'){return Object.assign(new Error(message),{code});}
function cancelled(){return Object.assign(new Error('Local transcription cancelled. Your recording remains available.'),{name:'AbortError',code:'cancelled'});}
const notify=(callback,value)=>{try{callback?.(value);}catch{/* A UI callback must not leave a worker running. */}};

/** Decode only the app's PCM16, mono, 16 kHz WAV output. Header lengths,
 * chunk boundaries, byte rate and duration must agree before a worker starts. */
export function decodeLocalWav(audio){
 const invalid=()=>failure('Prepare a valid mono 16 kHz WAV recording of up to two minutes, then try again.','invalid_audio');
 if(!audio||typeof audio!=='object'||audio.format!=='wav'||!Number.isFinite(audio.duration)||audio.duration<0.1||audio.duration>MAX_SECONDS||typeof audio.data!=='string'||audio.data.length>Math.ceil(MAX_BYTES/3)*4||audio.data.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(audio.data))throw invalid();
 let binary;try{binary=globalThis.atob(audio.data);}catch{throw invalid();}
 if(binary.length<44||binary.length>MAX_BYTES)throw invalid();
 const bytes=Uint8Array.from(binary,character=>character.charCodeAt(0)),view=new DataView(bytes.buffer);
 const tag=offset=>String.fromCharCode(...bytes.subarray(offset,offset+4));
 if(tag(0)!=='RIFF'||tag(8)!=='WAVE'||view.getUint32(4,true)+8!==bytes.length)throw invalid();
 let offset=12,format=null,data=null;
 while(offset<bytes.length){
  if(offset+8>bytes.length)throw invalid();
  const name=tag(offset),size=view.getUint32(offset+4,true),start=offset+8,end=start+size;
  if(end>bytes.length)throw invalid();
  if(name==='fmt '){
   if(format||size<16)throw invalid();
   format={type:view.getUint16(start,true),channels:view.getUint16(start+2,true),rate:view.getUint32(start+4,true),byteRate:view.getUint32(start+8,true),align:view.getUint16(start+12,true),bits:view.getUint16(start+14,true)};
  }else if(name==='data'){
   if(data||size===0||size%2)throw invalid();
   data={start,size};
  }
  offset=end+(size%2);if(offset>bytes.length)throw invalid();
 }
 if(!format||!data||format.type!==1||format.channels!==1||format.rate!==RATE||format.byteRate!==RATE*2||format.align!==2||format.bits!==16)throw invalid();
 const duration=data.size/2/RATE;
 if(duration<0.1||duration>MAX_SECONDS||Math.abs(duration-audio.duration)>1/RATE+1e-9)throw invalid();
 const samples=new Float32Array(data.size/2);
 for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(data.start+i*2,true)/32768;
 return {samples,sampleRate:RATE,duration};
}

/** Recognise speech in a disposable worker. One job at a time limits CPU and
 * memory use. Terminating the worker cancels both model download and inference. */
export async function transcribeLocal(wavAudio,{onStage,onProgress,signal,Worker:WorkerClass=globalThis.Worker,timeoutMs=600000}={}){
 if(signal?.aborted)throw cancelled();
 if(activeJob)throw failure('Local transcription is already running. Finish or cancel it before starting another.','transcription_busy');
 const decoded=decodeLocalWav(wavAudio);
 if(typeof WorkerClass!=='function')throw failure('This browser cannot run local speech recognition. Type a checked transcript instead.','worker_unavailable');
 const id=globalThis.crypto?.randomUUID?.()||`local-asr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 let worker;try{worker=new WorkerClass(new URL('./local-transcriber-worker.mjs?v=20261020-validation',import.meta.url),{type:'module',name:'ielts-local-transcription'});}catch{throw failure('The local speech worker could not start. Try a current browser or type your transcript.','worker_unavailable');}
 return new Promise((resolve,reject)=>{
  let settled=false,timer;activeJob={id};
  function cleanup(){clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;try{worker.terminate();}catch{}if(activeJob?.id===id)activeJob=null;}
  function finish(error,value){if(settled)return;settled=true;cleanup();error?reject(error):resolve(value);}
  function abort(){finish(cancelled());}
  worker.onmessage=event=>{
   const data=event.data;if(!data||data.id!==id)return;
   if(data.type==='stage'&&typeof data.message==='string')notify(onStage,data.message.slice(0,300));
   else if(data.type==='progress'&&['download','transcribe'].includes(data.phase))notify(onProgress,{phase:data.phase,progress:Number.isFinite(data.progress)?Math.max(0,Math.min(100,data.progress)):null,...(typeof data.file==='string'?{file:data.file.slice(0,200)}:{}),...(Number.isFinite(data.loaded)?{loaded:data.loaded}:{}),...(Number.isFinite(data.total)?{total:data.total}:{}),...(Number.isInteger(data.chunk)?{chunk:data.chunk}:{}),...(Number.isInteger(data.chunks)?{chunks:data.chunks}:{})});
   else if(data.type==='result'){
    if(data.model!==LOCAL_ASR_MODEL||typeof data.text!=='string'||!data.text.trim()||data.text.length>20000){finish(failure('No usable transcript was returned. Listen back and type the answer, or try recording again.','transcript_empty'));return;}
    finish(null,{text:data.text.trim(),model:LOCAL_ASR_MODEL,duration:decoded.duration});
   }else if(data.type==='error')finish(failure(typeof data.message==='string'?data.message.slice(0,500):'Local transcription did not finish. Try a shorter recording.',typeof data.code==='string'?data.code.slice(0,100):'local_transcription_unavailable'));
  };
  worker.onerror=event=>{event.preventDefault?.();finish(failure('The local speech model could not run. Check the first-download connection or try a shorter recording.'));};
  worker.onmessageerror=()=>finish(failure('The local speech worker returned an unreadable response. Try again.'));
  signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted){abort();return;}
  timer=setTimeout(()=>finish(failure('Local transcription took too long. Your recording is still available; try a shorter sample.','transcription_timeout')),Number.isFinite(timeoutMs)&&timeoutMs>0?timeoutMs:600000);
  notify(onStage,'Starting local transcription. The first use downloads about 70 MB; your recording stays on this device.');
  try{worker.postMessage({type:'transcribe',id,samples:decoded.samples.buffer,sampleRate:decoded.sampleRate,duration:decoded.duration},[decoded.samples.buffer]);}catch{finish(failure('The recording could not be sent to the local speech worker. Try again.'));}
 });
}
