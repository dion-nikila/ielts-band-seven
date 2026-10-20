export const VERSION=1;
export function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function addDays(value,n){const d=new Date(value+'T12:00:00');d.setDate(d.getDate()+n);return dateKey(d);}
export function daysBetween(a,b){return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);}
export function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
export function dayNumber(start,today=dateKey()){return Math.max(1,Math.min(7,daysBetween(start,today)+1));}
export function wordCount(s){return (s.trim().match(/\S+/gu)||[]).length;}
export function overall(bands){if(bands.length!==4||bands.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0||x>9||x*2%1))return null;return Math.round(bands.reduce((a,b)=>a+b,0)/4*2)/2;}
export function rawGuide(raw,skill){if(raw===null||raw===undefined)return 'Not recorded';if(raw>=39)return 'Near-perfect practice accuracy; check this test’s own band conversion';if(raw>=35)return 'At/above the published Band 8 benchmark';if(raw>=30)return 'At/above the published Band 7 benchmark';if(raw>=23)return 'At/above the published Band 6 benchmark';if(raw>=(skill==='Reading'?15:16))return 'At/above the published Band 5 benchmark';return 'Below the published Band 5 benchmark';}
export function secondsLeft(timer,now=Date.now()){if(!timer)return 0;return Math.max(0,Math.ceil(timer.running?(timer.end-now)/1000:timer.remaining));}
export function clock(seconds){const s=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
export function emptyState(){const start=dateKey();return {version:VERSION,settings:{start,exam:addDays(start,7),hours:5.5,minimum:null},tasks:{},drafts:{},writingHistory:[],speakingNotes:{},mockAttempts:[],drillAttempts:[],mistakes:[],videos:{},timer:null,selectedPrompt:'essay-1',selectedCue:0};}
const finiteRange=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const band=x=>x===null||finiteRange(x,0,9)&&x*2%1===0;
const safeText=(x,n=100000)=>typeof x==='string'&&x.length<=n;
const safeId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,150}$/.test(x);
const promptId=x=>typeof x==='string'&&/^(essay-([1-9]|1[0-4])|table-[1-3])$/.test(x);
export function validateState(s){
 if(!s||Array.isArray(s)||s.version!==VERSION||!s.settings||!validDate(s.settings.start)||!validDate(s.settings.exam)||s.settings.exam<s.settings.start||!finiteRange(s.settings.hours,1,8)||!band(s.settings.minimum))throw Error('This backup has invalid settings or an unsupported version.');
 for(const key of ['writingHistory','mockAttempts','drillAttempts','mistakes'])if(!Array.isArray(s[key])||s[key].length>3000)throw Error('This backup has invalid records.');
 for(const key of ['tasks','drafts','speakingNotes','videos'])if(!s[key]||typeof s[key]!=='object'||Array.isArray(s[key]))throw Error('This backup has invalid saved work.');
 for(const [id,value] of Object.entries(s.tasks))if(!/^day-[1-7]-[0-3]$/.test(id)||typeof value!=='boolean')throw Error('Invalid study task progress.');
 if(!promptId(s.selectedPrompt)||!Number.isInteger(s.selectedCue)||s.selectedCue<0||s.selectedCue>13)throw Error('Invalid practice selection.');
 for(const [id,d] of Object.entries(s.drafts))if(!promptId(id)||!d||!safeText(d.text)||!Array.isArray(d.checks)||d.checks.length>12||d.checks.some(x=>typeof x!=='boolean'))throw Error('Invalid writing draft.');
 for(const a of s.mockAttempts){if(a?.material!==undefined&&!['unknown','official-practice','official-test','other'].includes(a.material)||a?.examConditions!==undefined&&typeof a.examConditions!=='boolean')throw Error('Invalid test-evidence labels.');if(!a||!safeId(a.id)||!safeText(a.source,300)||!validDate(a.date)||!finiteRange(a.created,0,1e15)||!['fresh','repeat','untimed'].includes(a.mode)||!Array.isArray(a.bands)||a.bands.length!==4||!a.bands.every(band)||!['unknown','teacher','self','ai','official'].includes(a.provenance))throw Error('Invalid mock record.');for(const v of [a.listening,a.reading])if(v!==null&&(!Number.isInteger(v)||!finiteRange(v,0,40)))throw Error('Raw marks must be whole numbers from 0 to 40.');}
 for(const m of s.mistakes)if(!m||!safeId(m.id)||!safeText(m.problem,2000)||!safeText(m.fix,5000)||!validDate(m.due)||!Number.isInteger(m.level)||m.level<0||m.level>5||!safeText(m.skill,30)||!safeText(m.tag,100))throw Error('Invalid mistake record.');
 for(const a of s.drillAttempts)if(a?.mode!==undefined&&!['timed','untimed'].includes(a.mode)||a?.markingVersion!==undefined&&!safeText(a.markingVersion,100)||a?.contentVersion!==undefined&&!safeText(a.contentVersion,100)||a?.expired!==undefined&&typeof a.expired!=='boolean'||!a||!safeText(a.drillId,100)||!Number.isInteger(a.correct)||!Number.isInteger(a.total)||!finiteRange(a.correct,0,100)||!finiteRange(a.total,1,100)||a.correct>a.total||!Array.isArray(a.answers)||a.answers.length!==a.total||a.answers.some(x=>!safeText(x,5000))||!safeText(a.date,40))throw Error('Invalid practice result.');
 for(const a of s.writingHistory)if(!a||!safeId(a.id)||!promptId(a.promptId)||!safeText(a.text)||!safeText(a.date,40)||!Array.isArray(a.checks)||a.checks.length>12||a.checks.some(x=>typeof x!=='boolean'))throw Error('Invalid writing history.');
 for(const [id,n] of Object.entries(s.speakingNotes))if(!/^(\d|1[0-3])$/.test(id)||!safeText(n,10000))throw Error('Invalid speaking note.');
 for(const v of Object.values(s.videos))if(!v||typeof v.watched!=='boolean'||typeof v.practised!=='boolean')throw Error('Invalid video progress.');
 if(s.timer&&(!safeText(s.timer.kind,100)||!safeText(s.timer.label,150)||typeof s.timer.running!=='boolean'||!finiteRange(s.timer.remaining,0,86400)||!finiteRange(s.timer.end,0,1e15)))throw Error('Invalid timer.');
 return s;
}
export function nextReview(level,success,today=dateKey()){const next=success?Math.min(5,level+1):0;return {level:next,due:addDays(today,success?[1,1,2,3,7,14][next]:1)};}
export function freshMocks(state){return state.mockAttempts.filter(a=>a.mode==='fresh').sort((a,b)=>a.date.localeCompare(b.date)||a.created-b.created);}
export function recommendation(state){
 const due=state.mistakes.filter(m=>m.due<=dateKey());
 if(!state.mockAttempts.some(a=>a.mode==='fresh'))return {title:'Start with your baseline',text:'Take a fresh official mock and record the result. Your plan gets sharper when there is evidence.',route:'scores',action:'Record a baseline'};
 if(due.length)return {title:`Revisit ${due.length} mistake${due.length===1?'':'s'} today`,text:'Try recalling the correction before revealing it. Then check whether you can explain the rule.',route:'mistakes',action:'Start your review'};
 const fresh=freshMocks(state);const recent=fresh.at(-1);
 if(recent){const weak=[['Listening',recent.listening],['Reading',recent.reading]].filter(x=>x[1]!==null).sort((a,b)=>a[1]-b[1])[0];const bands=recent.bands.map((b,i)=>({b,skill:['Listening','Reading','Writing','Speaking'][i]})).filter(x=>x.b!==null).sort((a,b)=>a.b-b.b);if(bands.length&&bands[0].b<9){const skill=bands[0].skill;return {title:`Give ${skill.toLowerCase()} your next focused block`,text:`Your latest recorded ${skill} band is ${bands[0].b}. Use its feedback to choose one specific improvement.`,route:skill==='Writing'?'writing':skill==='Speaking'?'speaking':'drills',action:'Open practice'};}if(weak&&weak[1]<39)return {title:`Work on ${weak[0].toLowerCase()} accuracy`,text:`Your latest fresh score is ${weak[1]}/40. Review the error types, practise them, then use a new test to check transfer.`,route:weak[0]==='Reading'?'drills':'videos',action:weak[0]==='Reading'?'Practise reading':'Find listening lessons'};}
 return {title:'Keep building fresh evidence',text:'Practise your weakest skill, then take a different official test. A repeated test is useful practice but not a new readiness check.',route:'writing',action:'Open writing practice'};
}
