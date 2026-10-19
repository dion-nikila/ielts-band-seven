// Browser-side contracts for practice grading and an optional private service.
// Access codes deliberately never enter saved submissions or assessment history.
export const GRADING_SCOPES = Object.freeze(['writing_task','writing_fragment','speaking_audio','speaking_transcript','speaking_points']);
export const MAX_AUDIO_SECONDS = 120;
export const MAX_AUDIO_BYTES = 4000000;
const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value, max, empty = false) => typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0);
const id = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(value);
const date = value => typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
const band = value => value === null || typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 9 && Number.isInteger(value * 2);
const finite = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const clone = value => JSON.parse(JSON.stringify(value));
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function fail(message = 'The grader returned an invalid report. Your answer has not been lost.') { throw new Error(message); }
function criteriaIds(scope, taskType) {
 if (scope.startsWith('writing_')) return [taskType === 1 ? 'task_achievement' : 'task_response','coherence_cohesion','lexical_resource','grammatical_range_accuracy'];
 if (scope === 'speaking_points') return ['relevance_development','organisation','language_options'];
 return ['fluency_coherence','lexical_resource','grammatical_range_accuracy','pronunciation'];
}
function unsupportedBand(scope, criterion) {
 return scope === 'writing_fragment' || scope === 'speaking_points' || scope === 'speaking_transcript' && ['fluency_coherence','pronunciation'].includes(criterion);
}
function validateSubmission(value, {stored = false} = {}) {
 if (!isObject(value) || !id(value.id) || !GRADING_SCOPES.includes(value.scope) || !id(value.promptId) || !text(value.prompt,16000) || !text(value.text,24000,true) || value.target !== 9 || !date(value.createdAt)) fail('This answer cannot be submitted. Check the task and try again.');
 if (value.scope.startsWith('writing_') && ![1,2].includes(value.taskType)) fail('Choose Writing Task 1 or Task 2.');
 if (!value.scope.startsWith('writing_') && value.taskType !== null) fail('The speaking task is invalid.');
 if (value.scope !== 'speaking_audio' && !value.text.trim()) fail('Add your answer before submitting.');
 if (value.scope === 'speaking_audio') {
  const audio = value.audio;
  if (!isObject(audio) || audio.format !== 'wav' || !finite(audio.duration,0.1,MAX_AUDIO_SECONDS)) fail('Record between a moment and 120 seconds of speech.');
  if (!stored || audio.data !== undefined) {
   if (!text(audio.data,Math.ceil(MAX_AUDIO_BYTES / 3) * 4) || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio.data) || audio.data.length % 4 !== 0) fail('The recording is too large or has an unsupported format.');
  }
 } else if (value.audio !== undefined) fail('Audio belongs to a speaking recording.');
 return value;
}

/** Immutable snapshot: subsequent typing must never silently change a graded answer. */
export function createSubmission(input) {
 const submission = {
  id: input.id || globalThis.crypto?.randomUUID?.() || `submission-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,
  createdAt: input.createdAt || new Date().toISOString(),
  scope: input.scope,
  promptId: input.promptId,
  prompt: input.prompt,
  text: input.text ?? '',
  taskType: input.scope?.startsWith('writing_') ? Number(input.taskType) : null,
  target: 9,
  ...(input.audio ? {audio:{data:input.audio.data,format:input.audio.format,duration:input.audio.duration}} : {})
 };
 validateSubmission(submission);
 return freeze(submission);
}

/** A saved recording keeps its timing metadata, never megabytes of audio or a secret. */
export function snapshotSubmission(submission) {
 validateSubmission(submission);
 const saved = {id:submission.id,createdAt:submission.createdAt,scope:submission.scope,promptId:submission.promptId,prompt:submission.prompt,text:submission.text,taskType:submission.taskType,target:9,...(submission.audio?{audio:{format:submission.audio.format,duration:submission.audio.duration}}:{})};
 if (saved.audio) delete saved.audio.data;
 return saved;
}

export function validateAssessment(report, submission) {
 if (!isObject(report) || report.version !== 1 || !id(report.id) || !id(report.submissionId) || !date(report.date) || !['OpenAI','Puter / OpenAI','Google Gemini','On-device AI'].includes(report.provider) || !text(report.model,100) || report.rubricVersion !== 'IELTS-public-2023' || !GRADING_SCOPES.includes(report.scope) || report.provisional !== true || !['low','medium'].includes(report.confidence) || !band(report.estimatedBand) || !text(report.summary,6000)) fail();
 if (report.provider === 'On-device AI' && (report.estimatedBand !== null || report.confidence !== 'low')) fail('On-device coaching cannot establish an IELTS band.');
 if (submission) {
  validateSubmission(submission,{stored:true});
  if (report.submissionId !== submission.id || report.scope !== submission.scope) fail('This feedback belongs to a different answer. Please submit again.');
 }
 const writingTaskType = submission?.taskType ?? (report.criteria?.some(c => c.id === 'task_achievement') ? 1 : 2);
 const expected = criteriaIds(report.scope,writingTaskType);
 if (!Array.isArray(report.criteria) || report.criteria.length !== expected.length || new Set(report.criteria.map(c=>c?.id)).size !== expected.length) fail();
 for (const criterion of report.criteria) {
  if (!isObject(criterion) || !expected.includes(criterion.id) || !text(criterion.label,150) || !band(criterion.band) || (report.provider === 'On-device AI' || unsupportedBand(report.scope,criterion.id)) && criterion.band !== null || !text(criterion.why,6000) || !Array.isArray(criterion.evidence) || criterion.evidence.length > 12) fail();
  for (const evidence of criterion.evidence) {
   if (!isObject(evidence) || !text(evidence.quote,2000) || !(evidence.timestampSeconds === null || report.scope === 'speaking_audio' && finite(evidence.timestampSeconds,0,submission?.audio?.duration ?? MAX_AUDIO_SECONDS))) fail();
   // Text evidence must be traceable to the submitted answer, not invented by the model.
   if (submission && report.scope !== 'speaking_audio' && !submission.text.includes(evidence.quote)) fail('The grader cited text that is not in this answer. Please retry.');
  }
 }
 const overallAllowed = ['writing_task','speaking_audio'].includes(report.scope) && report.criteria.every(c=>c.band !== null);
 const expectedBand = overallAllowed ? Math.round(report.criteria.reduce((total,c)=>total+c.band,0) / 4 * 2) / 2 : null;
 if (report.estimatedBand !== expectedBand) fail('The grading result contains inconsistent or unsupported scores. Please retry.');
 if (!Array.isArray(report.strengths) || report.strengths.length > 10 || report.strengths.some(v=>!text(v,3000)) || !Array.isArray(report.limitations) || report.limitations.length > 12 || report.limitations.some(v=>!text(v,3000))) fail();
 if (!Array.isArray(report.priorities) || report.priorities.length > 8) fail();
 for (const priority of report.priorities) if (!isObject(priority) || !text(priority.criterion,150) || !text(priority.action,3000) || !text(priority.practice,3000) || !text(priority.successCheck,3000)) fail();
 if (!Array.isArray(report.corrections) || report.corrections.length > 15 || !text(report.improvedExcerpt,10000,true)) fail();
 for (const correction of report.corrections) {
  if (!isObject(correction) || !text(correction.original,3000) || !text(correction.replacement,4000) || !text(correction.why,3000)) fail();
  if (submission && report.scope !== 'speaking_audio' && !submission.text.includes(correction.original)) fail('A suggested correction is not grounded in this answer. Please retry.');
 }
 // Keep only the documented result. Provider metadata and unexpected fields are
 // never copied into the user's backup or rendered as feedback.
 return clone({version:report.version,id:report.id,submissionId:report.submissionId,date:report.date,provider:report.provider,model:report.model,rubricVersion:report.rubricVersion,scope:report.scope,provisional:report.provisional,estimatedBand:report.estimatedBand,confidence:report.confidence,summary:report.summary,criteria:report.criteria.map(c=>({id:c.id,label:c.label,band:c.band,why:c.why,evidence:c.evidence.map(item=>({quote:item.quote,timestampSeconds:item.timestampSeconds}))})),strengths:report.strengths,priorities:report.priorities.map(p=>({criterion:p.criterion,action:p.action,practice:p.practice,successCheck:p.successCheck})),corrections:report.corrections.map(c=>({original:c.original,replacement:c.replacement,why:c.why})),improvedExcerpt:report.improvedExcerpt,limitations:report.limitations});
}

export function safeAssessments(value) {
 if (value === undefined) return true;
 if (!Array.isArray(value) || value.length > 200) return false;
 try {
  for (const record of value) {
   if (!isObject(record) || !isObject(record.submission) || !isObject(record.assessment)) return false;
   validateSubmission(record.submission,{stored:true});
   if (record.submission.audio?.data !== undefined) return false;
   validateAssessment(record.assessment,record.submission);
  }
  return true;
 } catch { return false; }
}
export function ensureAssessments(state) {
 if (state.assessments === undefined) state.assessments = [];
 if (!safeAssessments(state.assessments)) fail('Saved grading reports are invalid. Import a valid backup to restore them.');
 return state.assessments;
}
export function saveAssessment(state, submission, report) {
 const record = {submission:snapshotSubmission(submission),assessment:validateAssessment(report,submission)};
 const history = ensureAssessments(state);
 const previous = history.findIndex(r=>r.assessment.id === record.assessment.id);
 if (previous >= 0) history.splice(previous,1);
 history.push(record);
 if (history.length > 200) history.splice(0,history.length - 200);
 return record;
}

/** Only a user-configured HTTPS service receives the in-memory access code. */
export function normalizeGraderEndpoint(value, {location = globalThis.location} = {}) {
 if (!text(value,2000)) fail('Enter your grading service URL.');
 let url;
 try { url = new URL(value.trim()); } catch { fail('Enter a full HTTPS grading service URL.'); }
 const local = host => ['localhost','127.0.0.1','[::1]'].includes(host);
 const localDevelopment = location && local(location.hostname) && local(url.hostname);
 if (url.username || url.password || url.search || url.hash || url.protocol !== 'https:' && !(url.protocol === 'http:' && localDevelopment) || local(url.hostname) && !localDevelopment) fail('Use an HTTPS grading service URL without a password, query or fragment.');
 if (!['','/','/api/grade','/api/grade/'].includes(url.pathname)) fail('Use the grading service homepage or its /api/grade URL.');
 url.pathname = '/api/grade';
 return url.href;
}
async function jsonResponse(response) {
 if (!response.headers?.get('content-type')?.includes('application/json')) fail('The grading service did not return a valid response. Check its URL.');
 let value;
 try { value = await response.json(); } catch { fail('The grading service returned an unreadable response. Please retry.'); }
 if (!response.ok) {
  const fallback = {401:'The access code was not accepted. Reconnect with the correct code.',403:'This app is not allowed to use that grading service.',413:'That recording is too large. Record up to 120 seconds.',429:'The grader is busy or its usage limit has been reached. Please try later.',503:'The grading service is not configured yet. Finish connecting it first.',504:'Grading took too long. Your answer is saved; please retry.'};
  const message = value?.error?.message;
  throw new Error(text(message,500) ? message : fallback[response.status] || 'The grading service could not complete this attempt. Please retry.');
 }
 return value;
}
export async function checkGraderHealth(endpoint, {signal,fetch:fetcher = globalThis.fetch,location} = {}) {
 const url = new URL(normalizeGraderEndpoint(endpoint,{location:location ?? globalThis.location}));
 url.pathname = '/api/health';
 const result = await jsonResponse(await fetcher(url.href,{method:'GET',credentials:'omit',redirect:'error',cache:'no-store',signal}));
 if (!isObject(result) || typeof result.configured !== 'boolean' || typeof result.providerConfigured !== 'boolean' || typeof result.accessConfigured !== 'boolean' || !Array.isArray(result.modes) || result.modes.some(mode=>!GRADING_SCOPES.includes(mode)) || !finite(result.maxAudioSeconds,1,MAX_AUDIO_SECONDS) || !finite(result.maxAudioBytes,1000,MAX_AUDIO_BYTES)) fail('That service does not expose a compatible grader.');
 return {configured:result.configured,providerConfigured:result.providerConfigured,accessConfigured:result.accessConfigured,modes:[...result.modes],maxAudioSeconds:result.maxAudioSeconds,maxAudioBytes:result.maxAudioBytes};
}
export async function requestGrade(endpoint, accessCode, submission, {signal,fetch:fetcher = globalThis.fetch,location} = {}) {
 const url = normalizeGraderEndpoint(endpoint,{location:location ?? globalThis.location});
 if (!text(accessCode,500) || /[\r\n]/.test(accessCode)) fail('Connect the grader with your access code first.');
 validateSubmission(submission);
 const value = await jsonResponse(await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${accessCode}`},body:JSON.stringify({submission}),credentials:'omit',redirect:'error',cache:'no-store',signal}));
 return validateAssessment(value?.assessment,submission);
}

/** PCM WAV is supported consistently by the server's audio-capable model. */
export function encodeMonoWav(samples, sampleRate = 16000) {
 if (!(samples instanceof Float32Array) || !Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 48000 || !samples.length || samples.length / sampleRate > MAX_AUDIO_SECONDS || samples.length * 2 + 44 > MAX_AUDIO_BYTES) fail('Use a recording of up to 120 seconds.');
 const bytes = new Uint8Array(44 + samples.length * 2), view = new DataView(bytes.buffer);
 const ascii = (offset,value) => [...value].forEach((letter,index)=>view.setUint8(offset+index,letter.charCodeAt(0)));
 ascii(0,'RIFF'); view.setUint32(4,bytes.length-8,true); ascii(8,'WAVE'); ascii(12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true); view.setUint32(24,sampleRate,true); view.setUint32(28,sampleRate*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true); ascii(36,'data'); view.setUint32(40,samples.length*2,true);
 for (let i=0;i<samples.length;i++) { const s = Math.max(-1,Math.min(1,Number.isFinite(samples[i])?samples[i]:0)); view.setInt16(44+i*2,s<0?s*32768:s*32767,true); }
 return bytes;
}
export async function recordingToWav(blob, {AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext} = {}) {
 if (!blob || !finite(blob.size,1,20000000) || !AudioContext) fail('This browser cannot prepare that recording. Try a recent Chrome, Edge or Safari browser.');
 const context = new AudioContext();
 try {
  const buffer = await context.decodeAudioData(await blob.arrayBuffer());
  if (!finite(buffer.duration,0.1,MAX_AUDIO_SECONDS+0.25) || !buffer.numberOfChannels) fail('Record up to 120 seconds, then submit again.');
  const duration = Math.min(MAX_AUDIO_SECONDS,buffer.duration), length = Math.floor(duration*16000), mono = new Float32Array(length);
  // Mix channels and linearly resample. No recording is uploaded during conversion.
  for (let channel=0;channel<buffer.numberOfChannels;channel++) {
   const samples = buffer.getChannelData(channel), ratio = buffer.sampleRate/16000;
   for (let i=0;i<length;i++) { const offset=i*ratio,low=Math.floor(offset),fraction=offset-low; mono[i]+=(samples[low]*(1-fraction)+(samples[Math.min(low+1,samples.length-1)]||0)*fraction)/buffer.numberOfChannels; }
  }
  const bytes = encodeMonoWav(mono);
  let binary = ''; for (let i=0;i<bytes.length;i+=32768) binary += String.fromCharCode(...bytes.subarray(i,i+32768));
  return {data:btoa(binary),format:'wav',duration:length/16000,bytes:bytes.length,mimeType:'audio/wav'};
 } finally { await context.close?.(); }
}
