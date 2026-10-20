import {markDrill} from './coach.mjs?v=20261020-validation';
import {selectedAnswers} from './practice.mjs?v=20261020-validation';
import {MARKING_VERSION} from './marking.mjs?v=20261020-validation';
export function createPracticeRecord(drill,draft,attempts,timer,now=Date.now(),deadlineReached=false){
 const answers=selectedAnswers(drill,draft.answers),marked=markDrill(drill,answers);
 const matching=timer?.kind==='drill-'+drill.id&&timer.running&&draft.mode==='timed';
 const timed=matching&&(now<timer.end||deadlineReached&&now>=timer.end);
 const first=!attempts.some(a=>a.drillId===drill.id);
 const record={drillId:drill.id,date:new Date(now).toISOString(),correct:marked.correct,total:drill.questions.length,answers,first,mode:timed?'timed':'untimed',plays:drill.audio?draft.plays:0,elapsed:Math.max(0,Math.round((now-draft.startedAt)/1000)),markingVersion:MARKING_VERSION,contentVersion:drill.contentVersion,expired:!!deadlineReached};
 return {record,report:{...marked,answers,first,mode:record.mode,plays:record.plays,expired:record.expired,markingVersion:MARKING_VERSION}};
}
export function expiredPractice(drills,state,now=Date.now()){
 const timer=state.timer;if(!timer?.running||timer.end>now)return null;
 const drill=drills.find(d=>d.format==='full'&&timer.kind==='drill-'+d.id),draft=drill&&state.practiceDrafts?.[drill.id];
 return drill&&draft?{drill,draft}:null;
}
