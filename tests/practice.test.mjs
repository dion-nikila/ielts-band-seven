import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {markDrill} from '../coach.mjs';
import {safePracticeDrafts,selectedAnswers,partCount,libraryStats,resultFromAttempt} from '../practice.mjs';
import {recoverSavedState} from '../persistence.mjs';
import {emptyState} from '../core.mjs';
import {renderDrill} from '../drill-view.mjs';
const bank=JSON.parse(await readFile(new URL('../practice-bank.json',import.meta.url)));
test('expanded bank contains 204 new distinct questions across 16 sets',()=>{
 assert.equal(bank.length,16);assert.equal(new Set(bank.map(d=>d.id)).size,16);
 const ids=bank.flatMap(d=>d.questions.map(q=>q.id));assert.equal(ids.length,204);assert.equal(new Set(ids).size,204);
});
test('Reading simulations match 3 passages, 40 items and substantial Academic reading length',()=>{
 const full=bank.filter(d=>d.format==='full');assert.equal(full.length,2);
 for(const d of full){assert.equal(d.minutes,60);assert.equal(d.questions.length,40);assert.equal(d.parts.length,3);const words=d.parts.reduce((n,p)=>n+p.passage.split(/\s+/).length,0);assert.ok(words>=2000&&words<=2750,`${d.id}: ${words} words`);assert.deepEqual(d.parts.map((_,i)=>d.questions.filter(q=>q.part===i).length),[13,13,14]);assert.ok(d.questions.every(q=>q.part>=0&&q.part<3));}
});
test('every answer key marks perfectly while empty answers never receive marks',()=>{
 for(const d of bank){assert.equal(markDrill(d,d.questions.map(q=>q.answer)).correct,d.questions.length);assert.equal(markDrill(d,[]).correct,0);for(const q of d.questions){assert.ok(q.explanation.length>=40,`${q.id}: useful explanation required`);if(q.type!=='text')assert.equal(q.options.filter(o=>o===q.answer).length,1);}}
});
test('completion answers are recoverable from the text or an explicit numeric rendering',()=>{
 const numeric={'12':'twelve','20':'twenty','21':'twenty-one','400':'four hundred','19':'nineteen','6':'six','46':'forty-six','3':'three','5':'five','2':'two','45':'forty-five','8':'eight','34':'thirty-four','7':'seven','40':'forty','10':'ten','11':'eleven','84':'eighty-four','9:40':'nine forty','7:15':'seven fifteen'};
 for(const d of bank)for(const q of d.questions.filter(q=>q.type==='text')){
  const text=(d.parts?.[q.part]?.passage||d.passage).toLowerCase().replace(/-/g,' ');
  const a=q.answer.toLowerCase();assert.ok(text.includes(a)||text.includes((numeric[a]||'__no_number__').replace(/-/g,' ')),`${q.id}: ${a} missing`);
 }
});
test('all six new listening recordings exist, have MP4 audio containers, and matching scripts',async()=>{
 for(const d of bank.filter(d=>d.skill==='Listening')){const file=new URL('../'+d.audio,import.meta.url);assert.ok((await stat(file)).size>100000);const bytes=await readFile(file);assert.equal(bytes.toString('ascii',4,8),'ftyp');const script=await readFile(new URL('../'+d.audio.replace('.m4a','.txt'),import.meta.url),'utf8');assert.equal(script,d.passage);}
});
test('practice selections preserve all passages, blanks and invalid options cannot become option zero',()=>{
 const d=bank[0],values={[d.questions[0].id]:'2',[d.questions[4].id]:' permission ',[d.questions[14].id]:'0'};
 const selected=selectedAnswers(d,values);assert.equal(selected[0],d.questions[0].options[2]);assert.equal(selected[4],'permission');assert.equal(selected[1],'');assert.equal(selected[14],d.questions[14].options[0]);assert.equal(selectedAnswers(d,{[d.questions[0].id]:''})[0],'');assert.equal(selectedAnswers(d,{[d.questions[0].id]:'99'})[0],'');assert.deepEqual(partCount(d,0,values),{total:13,answered:2});assert.deepEqual(partCount(d,1,values),{total:13,answered:1});
});
const draft=()=>({'reading-mock-01':{answers:{'reading-mock-01-q1':'2'},part:1,startedAt:Date.now(),plays:0,mode:'timed'}});
test('valid drafts survive backup recovery and bad optional drafts do not erase submitted results',()=>{
 const state=emptyState();state.practiceDrafts=draft();assert.equal(safePracticeDrafts(state.practiceDrafts),true);assert.deepEqual(recoverSavedState(JSON.stringify(state)).state.practiceDrafts,state.practiceDrafts);
 state.drillAttempts=[{id:'a',drillId:'reading-mock-01',date:new Date().toISOString(),correct:1,total:1,answers:['x'],first:true}];state.practiceDrafts['reading-mock-01'].answers={'bad/key':{}};
 const recovered=recoverSavedState(JSON.stringify(state));assert.equal(recovered.blocked,false);assert.equal(recovered.needsRecoveryBackup,true);assert.equal(recovered.state.practiceDrafts,undefined);assert.equal(recovered.state.drillAttempts.length,1);assert.ok(recovered.rawRecovery);
 for(const bad of [null,[],{'../x':draft()['reading-mock-01']},{x:{...draft()['reading-mock-01'],mode:'official'}}])assert.equal(safePracticeDrafts(bad),false);
});
test('library distinguishes unopened, in-progress and submitted sets; old reviews retain answers',()=>{
 const attempts=[{drillId:bank[1].id,answers:bank[1].questions.map(q=>q.answer),correct:40,total:40,first:true,mode:'timed'}];const stats=libraryStats(bank,attempts,draft());assert.equal(stats.fresh,14);assert.equal(stats.questions,204);assert.equal(stats.full,2);const review=resultFromAttempt(bank[1],attempts[0]);assert.equal(review.correct,40);assert.equal(review.first,true);assert.equal(review.mode,'timed');
});
test('test view shows the current passage, global question numbering and no required answer gate',()=>{
 const html=renderDrill({active:bank[0],drills:bank,state:emptyState(),answers:{},result:null,part:1,head:()=>'',button:(a,t)=>`<button data-action="${a}">${t}</button>`,esc:s=>String(s??''),timerControls:()=>''});
 assert.match(html,/Questions 14–26/);assert.match(html,/What a repair library lends/);assert.doesNotMatch(html,/A different kind of seed bank/);assert.doesNotMatch(html,/<input[^>]*\brequired\b/);assert.match(html,/Submit whole test/);
});
