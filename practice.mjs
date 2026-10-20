import {markDrill} from './coach.mjs?v=20261020-practice';
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function safePracticeDrafts(value){
 if(value===undefined)return true;
 if(!object(value)||Object.keys(value).length>100)return false;
 return Object.entries(value).every(([id,d])=>/^[a-z0-9-]{1,100}$/.test(id)&&object(d)&&object(d.answers)&&Object.keys(d.answers).length<=100&&Object.entries(d.answers).every(([key,v])=>/^[a-zA-Z0-9_-]{1,150}$/.test(key)&&typeof v==='string'&&v.length<=120)&&Number.isInteger(d.part)&&d.part>=0&&d.part<=9&&Number.isFinite(d.startedAt)&&d.startedAt>0&&Number.isInteger(d.plays)&&d.plays>=0&&d.plays<=100000&&['timed','untimed'].includes(d.mode));
}
export function selectedAnswers(drill,values){return drill.questions.map(q=>q.type==='text'?String(values[q.id]??'').trim():typeof values[q.id]==='string'&&/^\d+$/.test(values[q.id])&&q.options[Number(values[q.id])]!==undefined?q.options[Number(values[q.id])]:'');}
export function partCount(drill,part,values){const questions=drill.questions.filter(q=>!drill.parts||q.part===part);return {total:questions.length,answered:questions.filter(q=>String(values[q.id]??'').trim()!=='').length};}
export function libraryStats(drills,attempts,drafts={}){return {sets:drills.length,questions:drills.reduce((n,d)=>n+d.questions.length,0),full:drills.filter(d=>d.format==='full').length,fresh:drills.filter(d=>!attempts.some(a=>a.drillId===d.id)&&!drafts[d.id]).length};}
export function resultFromAttempt(drill,attempt){return {...markDrill(drill,attempt.answers),answers:attempt.answers,first:attempt.first??false,mode:attempt.mode||'untimed',plays:attempt.plays||0};}
