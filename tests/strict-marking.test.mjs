import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {answerUnits,markAnswer,validRule,MARKING_VERSION} from '../marking.mjs';
import {createPracticeRecord,expiredPractice} from '../practice-score.mjs';
import {resultFromAttempt} from '../practice.mjs';
import {emptyState,validateState} from '../core.mjs';
import {readinessEvidence} from '../validation.mjs';
const bank=(await Promise.all(['drills.json','reading-extra.json','listening.json','practice-bank.json'].map(f=>readFile(new URL('../'+f,import.meta.url),'utf8').then(JSON.parse)))).flat();
const find=id=>bank.flatMap(d=>d.questions).find(q=>q.id===id);
test('all 286 items have supported task shapes, clear keys and explanation data',()=>{
 assert.equal(bank.reduce((n,d)=>n+d.questions.length,0),286);
 for(const d of bank){assert.ok(d.contentVersion);assert.ok(d.alignment);for(const q of d.questions){
  assert.ok(q.question&&q.explanation&&q.tag);
  if(q.type==='text'){assert.equal(validRule(q.rule),true,q.id);for(const key of [q.answer,...q.accepted||[]])assert.equal(markAnswer(q,key).correct,true,q.id+' accepted '+key);}
  else if(q.type==='mcq'){assert.equal(q.options.length,d.skill==='Listening'?3:4,q.id);assert.equal(q.options.filter(x=>x===q.answer).length,1);}
  else {assert.equal(q.type,'tfng');assert.deepEqual(q.options,['True','False','Not Given']);assert.ok(q.options.includes(q.answer));}
 }}
});
test('entry limits apply before matching, including an over-limit key accidentally added later',()=>{
 const q={...find('energy-6'),accepted:['peak demand in the museum']};
 assert.equal(markAnswer(q,'peak demand in the museum').reason,'word_limit');
 assert.equal(markAnswer(q,'peak demands').correct,false);
 assert.equal(markAnswer(q,'peek demand').correct,false);
 assert.equal(markAnswer(q,'  PEAK   DEMAND! ').correct,true);
 assert.equal(markAnswer({...q,accepted:['peak demand 2']},'peak demand 2').reason,'number_limit');
 assert.equal(markAnswer(find('listening-pottery-q6'),'46 pounds').reason,'number_format');
 assert.equal(markAnswer(find('listening-pottery-q6'),'£46').reason,'number_format');
 assert.equal(markAnswer(find('listening-pottery-q6'),'forty-six').correct,true);
 assert.equal(markAnswer(find('booking-3'),'nine forty five').reason,'word_limit');
 assert.equal(markAnswer(find('booking-3'),'9:45 or 10').reason,'number_limit');
});
test('hyphens, clock notation and number entries are counted by the declared rule',()=>{
 assert.deepEqual(answerUnits('part-time work'),{words:2,numbers:0});
 assert.deepEqual(answerUnits('9:45 am'),{words:1,numbers:1});
 assert.deepEqual(answerUnits('1,200'),{words:0,numbers:1});
 for(const a of ['9:45','09.45','nine forty-five'])assert.equal(markAnswer(find('booking-3'),a).correct,true,a);
 for(const a of ['',null,'Morgam','Morgans','the Morgan'])assert.equal(markAnswer(find('booking-5'),a).correct,false,String(a));
});
test('corrected Listening gap requests the exact spoken word with grammatical completion',()=>{
 const q=find('listening-projectmeeting-q1'),d=bank.find(d=>d.id==='listening-projectmeeting');
 assert.ok(d.passage.includes('two weeks afterwards'));
 assert.equal(q.answer,'afterwards');assert.equal(markAnswer(q,'afterwards').correct,true);assert.equal(markAnswer(q,'after').correct,false);
});
test('expired full test records blanks as zero and snapshots its marking/content versions',()=>{
 const d=bank.find(d=>d.id==='reading-mock-01'),now=Date.now(),draft={answers:{[d.questions[0].id]:String(d.questions[0].options.indexOf(d.questions[0].answer))},startedAt:now-3600000,mode:'timed',plays:0},timer={kind:'drill-'+d.id,running:true,end:now-1};
 const {record,report}=createPracticeRecord(d,draft,[],timer,now,true);
 assert.equal(record.correct,1);assert.equal(record.total,40);assert.equal(record.mode,'timed');assert.equal(record.expired,true);assert.equal(record.markingVersion,MARKING_VERSION);assert.equal(record.contentVersion,d.contentVersion);assert.equal(report.results.filter(x=>x.reason==='blank').length,39);
 assert.equal(createPracticeRecord(d,{...draft,mode:'untimed'},[],timer,now,true).record.mode,'untimed');
 assert.equal(createPracticeRecord(d,draft,[],timer,now,false).record.mode,'untimed');
 assert.equal(createPracticeRecord(d,draft,[record],timer,now,true).record.first,false);
});
test('earlier scores cannot be silently recalculated from revised questions',()=>{
 const d=bank[0],old={correct:7,total:8,answers:Array(8).fill('outdated'),first:true,mode:'untimed'};
 const review=resultFromAttempt(d,old);assert.equal(review.legacy,true);assert.equal(review.correct,7);assert.equal(review.results,undefined);
});
const mock=(source,overrides={})=>({id:source,source,date:'2026-10-20',mode:'fresh',listening:35,reading:35,bands:[8,8,7,7],provenance:'teacher',material:'official-practice',examConditions:true,created:1,...overrides});
test('readiness needs distinct recent official evidence and never fills missing skills',()=>{
 let x=readinessEvidence([mock('Test 1')],'2026-10-20');assert.equal(x.overall.ready,false);assert.equal(x.overall.low,null);
 x=readinessEvidence([mock('Test 1'),mock('Test-1',{bands:[9,9,9,9],created:2}),mock('Test 2',{bands:[7.5,8,6.5,7]})],'2026-10-20');
 assert.equal(x.overall.count,2);assert.equal(x.overall.low,7.5);assert.equal(x.overall.high,9);assert.equal(x.skills[2].low,6.5);
 x=readinessEvidence([mock('A',{bands:[8,8,null,null],provenance:'unknown'}),mock('B',{bands:[8.5,8.5,null,null],provenance:'unknown'})],'2026-10-20');assert.equal(x.skills[0].ready,true);assert.equal(x.skills[2].ready,false);assert.equal(x.overall.ready,false);
});
test('self/AI estimates, repeats, untimed, old, future, unknown and authored sources cannot inflate readiness',()=>{
 const bad=[mock('AI',{provenance:'ai'}),mock('Self',{provenance:'self'}),mock('Repeat',{mode:'repeat'}),mock('Untimed',{mode:'untimed'}),mock('No timing',{examConditions:false}),mock('Old',{date:'2026-08-01'}),mock('Future',{date:'2026-10-21'}),mock('Unknown',{material:'unknown'}),mock('Authored',{material:'other'}),mock('Legacy',{material:undefined,examConditions:undefined})];
 const x=readinessEvidence(bad,'2026-10-20');assert.equal(x.overall.count,0);assert.equal(x.skills[2].count,0);assert.equal(x.skills[0].count,2); // L/R bands from the two reported official-source records remain distinct from their W/S estimates.
});
test('backup validation accepts old records and rejects invalid new evidence labels',()=>{
 const s=emptyState();s.mockAttempts=[mock('a')];assert.equal(validateState(s),s);
 for(const change of [{material:'verified-by-IELTS'},{examConditions:'yes'}])assert.throws(()=>validateState({...s,mockAttempts:[mock('a',change)]}));
 const old=mock('a');delete old.material;delete old.examConditions;assert.equal(validateState({...s,mockAttempts:[old]}).mockAttempts.length,1);
});

test('expiry selects the saved full test even when it is not the currently viewed page',()=>{
 const d=bank.find(d=>d.format==='full'),now=Date.now(),draft={answers:{},startedAt:now-3600000,mode:'timed',plays:0};
 const state={timer:{kind:'drill-'+d.id,running:true,end:now},practiceDrafts:{[d.id]:draft}};
 assert.equal(expiredPractice(bank,state,now-1),null);assert.equal(expiredPractice(bank,state,now).drill.id,d.id);
 state.timer.running=false;assert.equal(expiredPractice(bank,state,now+1),null);
 state.timer.running=true;delete state.practiceDrafts[d.id];assert.equal(expiredPractice(bank,state,now+1),null);
});
test('a valid shorter literal variant is not punished for an optional modifier',()=>{
 assert.equal(markAnswer(find('library-2'),'seats').correct,true);assert.equal(markAnswer(find('library-2'),'quiet seats').correct,true);
 assert.equal(markAnswer(find('reading-mock-01-q24'),'training').correct,true);
 assert.equal(markAnswer(find('reading-mock-01-q6'),'germination').correct,true);assert.equal(markAnswer(find('reading-mock-01-q6'),'germination tests').correct,false);
});
