import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  answerCorrect, markDrill, firstAttemptSummary, writingReview,
  ensureLearning, lessonRecord, finishLesson, safeLearning
} from '../coach.mjs';
import {lessons} from '../lessons.mjs';
import {prompts, cues} from '../content.mjs';

const readJSON = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8').then(JSON.parse);
const [reading, extraReading, listening, videos] = await Promise.all([
  readJSON('drills.json'), readJSON('reading-extra.json'),
  readJSON('listening.json'), readJSON('videos.json')
]);
const drills = [...reading, ...extraReading, ...listening];
const validLearning = () => ({
  current: 'reading-tfng',
  lessons: {
    'reading-tfng': {step: 2, selected: 2, submitted: true, correct: true, completedAt: null},
    'listening-completion': {step: 3, selected: 1, submitted: true, correct: true, completedAt: '2026-10-15T08:00:00.000Z'}
  },
  speaking: [{date: '2026-10-15T08:10:00.000Z', cue: 3, note: 'Explain the result before adding a reflection.'}]
});

test('gap marking tolerates case, harmless whitespace, Unicode forms and final punctuation', () => {
  const surname = listening.find(d => d.id === 'listening-booking').questions.find(q => q.id === 'booking-5');
  for (const answer of ['Morgan', '  MORGAN  ', 'morgan.', 'Ｍｏｒｇａｎ']) {
    assert.equal(answerCorrect(surname, answer), true, answer);
  }
  const phrase = extraReading.find(d => d.id === 'reading-energy-storage').questions.find(q => q.id === 'energy-6');
  assert.equal(answerCorrect(phrase, '  PEAK    demand! '), true);
});

test('gap marking accepts listed time alternatives but rejects a different fact or extra words', () => {
  const booking = listening.find(d => d.id === 'listening-booking');
  const time = booking.questions.find(q => q.id === 'booking-3');
  for (const answer of ['9:45', '9.45', '09:45', '09.45']) assert.equal(answerCorrect(time, answer), true, answer);
  for (const answer of ['9:50', '10', '9:45 or 10', '', null, undefined]) {
    assert.equal(answerCorrect(time, answer), false, String(answer));
  }
  const surname = booking.questions.find(q => q.id === 'booking-5');
  for (const answer of ['Morgam', 'the Morgan', 'Morgan and Lee']) assert.equal(answerCorrect(surname, answer), false, answer);
});

test('marking groups only errors by focus, with the largest recurring error first', () => {
  const drill = {questions: [
    {id: 'a', answer: 'Thursday', tag: 'corrected information'},
    {id: 'b', answer: 'Morgan', tag: 'spelling a name'},
    {id: 'c', answer: 'visitor centre', tag: 'corrected information'},
    {id: 'd', answer: '38', tag: 'distinguishing prices'}
  ]};
  const result = markDrill(drill, ['Tuesday', 'Morgam', 'boathouse', '38']);
  assert.equal(result.correct, 1);
  assert.equal(result.total, 4);
  assert.deepEqual(result.focus, [['corrected information', 2], ['spelling a name', 1]]);
  assert.deepEqual(result.results.map(r => [r.question, r.correct]), [['a', false], ['b', false], ['c', false], ['d', true]]);
  assert.deepEqual(markDrill(drill, ['Thursday', 'Morgan', 'visitor centre', '38']).focus, []);
});

test('first-attempt progress is not inflated by repeats and excludes unrelated skills or IDs', () => {
  const available = [
    {id: 'reading-a', skill: 'Reading'},
    {id: 'reading-b', skill: 'Reading'},
    {id: 'listening-a', skill: 'Listening'}
  ];
  const attempts = [
    {drillId: 'reading-a', correct: 3, total: 8},
    {drillId: 'reading-a', correct: 8, total: 8},
    {drillId: 'listening-a', correct: 8, total: 8},
    {drillId: 'deleted-drill', correct: 40, total: 40},
    {drillId: 'reading-b', correct: 4, total: 6},
    {drillId: 'reading-b', correct: 6, total: 6}
  ];
  assert.deepEqual(firstAttemptSummary(attempts, available, 'Reading'), {sets: 2, correct: 7, total: 14, percent: 50});
  assert.deepEqual(firstAttemptSummary([], available, 'Reading'), {sets: 0, correct: 0, total: 0, percent: null});
});

test('a lesson cannot complete before its check is submitted', () => {
  const lesson = lessons.find(l => l.id === 'reading-headings');
  const state = {learning: {current: lesson.id, lessons: {}, speaking: []}};
  const record = lessonRecord(state, lesson.id);
  record.selected = lesson.check.options.indexOf(lesson.check.answer);
  assert.equal(finishLesson(state, lessons, lesson.practice.type, lesson.practice.id), false);
  assert.equal(record.completedAt, null);
  record.submitted = true;
  assert.equal(finishLesson(state, lessons, lesson.practice.type, lesson.practice.id), true);
  assert.equal(record.step, 3);
  assert.ok(Number.isFinite(Date.parse(record.completedAt)));
});

test('a submitted lesson check does not let unrelated practice complete the active lesson', () => {
  const lesson = lessons.find(l => l.id === 'writing-task2-plan');
  const state = {learning: {current: lesson.id, lessons: {}, speaking: []}};
  const record = lessonRecord(state, lesson.id);
  record.submitted = true;
  assert.equal(finishLesson(state, lessons, 'writing', 'essay-3'), false);
  assert.equal(finishLesson(state, lessons, 'drill', lesson.practice.id), false);
  assert.equal(record.completedAt, null);
  assert.equal(finishLesson(state, lessons, 'writing', 'essay-1'), true);
  assert.equal(finishLesson({learning: {current: 'unknown', lessons: {}, speaking: []}}, lessons, 'writing', 'essay-1'), false);
});

test('matching submitted practice completes its original lesson after the current lesson changes', () => {
  const original = lessons.find(l => l.id === 'reading-headings');
  const other = lessons.find(l => l.id === 'writing-task2-plan');
  const state = {learning: {current: original.id, practice: original.id, lessons: {}, speaking: []}};
  const originalRecord = lessonRecord(state, original.id);
  originalRecord.submitted = true;
  state.learning.current = other.id;
  const otherRecord = lessonRecord(state, other.id);
  otherRecord.submitted = true;
  assert.equal(finishLesson(state, lessons, original.practice.type, original.practice.id), true);
  assert.equal(originalRecord.step, 3);
  assert.ok(Number.isFinite(Date.parse(originalRecord.completedAt)));
  assert.equal(otherRecord.completedAt, null);
  assert.equal(state.learning.current, other.id);
});

test('writing review quotes actual submitted language errors rather than inventing evidence', () => {
  const text = 'There are many advices online. Some informations are useful. Governments should invests more. Although costs rise, but access matters. The number of students are increasing.';
  const review = writingReview(text, 2);
  const quoted = review.findings.filter(f => f.quote).map(f => f.quote);
  for (const phrase of ['many advices', 'informations', 'should invests', 'Although costs rise, but', 'The number of students are']) {
    assert.ok(quoted.includes(phrase), `Missing targeted feedback for ${phrase}`);
  }
  for (const quote of quoted) assert.ok(text.includes(quote), `Feedback quote was not supplied: ${quote}`);
  assert.equal(review.minimum, 250);
  assert.ok(review.findings.some(f => /at least/.test(f.title)));
});

test('corrected writing does not retain the same grammar flags and review emits no band or score', () => {
  const text = 'There are many pieces of advice online. Some information is useful. Governments should invest more. Although costs rise, access matters. The number of students is increasing.';
  for (const type of [1, 2]) {
    const review = writingReview(text, type);
    assert.equal(review.minimum, type === 1 ? 150 : 250);
    assert.deepEqual(review.findings.filter(f => f.quote), []);
    assert.ok(review.questions.length > 0);
    const keys = [];
    const collect = value => {
      if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) { keys.push(key); collect(child); }
    };
    collect(review);
    assert.equal(keys.some(key => /band|score|grade/i.test(key)), false);
    assert.doesNotMatch(JSON.stringify(review), /\bband\s*[:=]?\s*\d/i);
  }
});

test('learning import keeps old backups valid and accepts a complete new learning record', () => {
  assert.equal(safeLearning(undefined), true);
  const state = {};
  ensureLearning(state);
  assert.equal(safeLearning(state.learning), true);
  assert.equal(safeLearning(JSON.parse(JSON.stringify(validLearning()))), true);
});

test('practice context accepts a valid lesson ID or legacy omission and rejects unsafe nested values', () => {
  const legacy = validLearning();
  assert.equal(Object.hasOwn(legacy, 'practice'), false);
  assert.equal(safeLearning(legacy), true);
  for (const practice of [null, 'reading-headings']) {
    assert.equal(safeLearning({...validLearning(), practice}), true);
  }
  for (const practice of [{id: 'reading-headings'}, ['reading-headings'], true, 3, '', '../reading-headings', '<script>', 'x'.repeat(101)]) {
    assert.equal(safeLearning({...validLearning(), practice}), false, JSON.stringify(practice));
  }
});

test('learning import rejects malformed nested lesson progress', () => {
  const invalid = [
    learning => { learning.lessons = []; },
    learning => { learning.lessons['reading-tfng'] = null; },
    learning => { learning.lessons['reading-tfng'].step = 1.5; },
    learning => { learning.lessons['reading-tfng'].step = 4; },
    learning => { learning.lessons['reading-tfng'].selected = ['2']; },
    learning => { learning.lessons['reading-tfng'].selected = 20; },
    learning => { learning.lessons['reading-tfng'].submitted = 'yes'; },
    learning => { learning.lessons['reading-tfng'].correct = 1; },
    learning => { learning.lessons['reading-tfng'].completedAt = 'not a timestamp'; },
    learning => { learning.lessons['not/a/lesson'] = learning.lessons['reading-tfng']; },
    learning => { learning.current = {id: 'reading-tfng'}; }
  ];
  for (const mutate of invalid) {
    const learning = validLearning(); mutate(learning);
    assert.equal(safeLearning(learning), false, mutate.toString());
  }
  for (const bad of [null, false, [], {}, {lessons: {}, current: null, speaking: {}}]) assert.equal(safeLearning(bad), false);
});

test('learning import rejects nested speaking data that cannot be safely rendered', () => {
  const invalid = [
    learning => { learning.speaking[0].note = {html: '<b>not text</b>'}; },
    learning => { learning.speaking[0].note = 'x'.repeat(10001); },
    learning => { learning.speaking[0].cue = 14; },
    learning => { learning.speaking[0].cue = 0.5; },
    learning => { learning.speaking[0].date = {}; },
    learning => { learning.speaking = Array(3001).fill(learning.speaking[0]); }
  ];
  for (const mutate of invalid) {
    const learning = validLearning(); mutate(learning);
    assert.equal(safeLearning(learning), false, mutate.toString());
  }
});

test('all guided lessons link to real practice and real library videos', () => {
  const drillIds = new Set(drills.map(d => d.id));
  const promptIds = new Set(prompts.map(p => p.id));
  const videoById = new Map(videos.map(v => [v.id, v]));
  const seen = new Set();
  for (const lesson of lessons) {
    assert.equal(seen.has(lesson.id), false, `Duplicate lesson ID: ${lesson.id}`); seen.add(lesson.id);
    assert.ok(lesson.steps.length >= 3, `${lesson.id} needs actual instruction`);
    assert.equal(lesson.check.options.filter(option => option === lesson.check.answer).length, 1, `${lesson.id} needs one unambiguous check answer`);
    assert.ok(lesson.check.explanation, `${lesson.id} needs check feedback`);
    if (lesson.practice.type === 'drill') {
      assert.ok(drillIds.has(lesson.practice.id), `${lesson.id}: missing drill ${lesson.practice.id}`);
      assert.equal(drills.find(d => d.id === lesson.practice.id).skill, lesson.skill);
    } else if (lesson.practice.type === 'writing') {
      assert.ok(promptIds.has(lesson.practice.id), `${lesson.id}: missing writing prompt ${lesson.practice.id}`);
    } else if (lesson.practice.type === 'speaking') {
      const cue = Number(lesson.practice.id);
      assert.ok(Number.isInteger(cue) && cue >= 0 && cue < cues.length, `${lesson.id}: missing speaking cue ${lesson.practice.id}`);
    } else assert.fail(`${lesson.id}: unsupported practice type ${lesson.practice.type}`);
    const video = videoById.get(lesson.videoId);
    assert.ok(video, `${lesson.id}: missing video ${lesson.videoId}`);
    assert.equal(new URL(video.url).searchParams.get('v'), lesson.videoId);
    assert.ok(new URL(lesson.sourceUrl).protocol === 'https:', `${lesson.id}: invalid source link`);
  }
});

test('all practice answers have valid marking data and actionable explanations', () => {
  const ids = new Set();
  const questionIds = new Set();
  for (const drill of drills) {
    assert.equal(ids.has(drill.id), false, `Duplicate drill ID: ${drill.id}`); ids.add(drill.id);
    assert.ok(drill.passage && drill.questions.length >= 6, `${drill.id}: incomplete practice`);
    for (const q of drill.questions) {
      assert.equal(questionIds.has(q.id), false, `Duplicate question ID: ${q.id}`); questionIds.add(q.id);
      assert.ok(['tfng', 'mcq', 'text'].includes(q.type), `${q.id}: unknown question type`);
      assert.ok(q.answer && q.explanation && q.tag, `${q.id}: missing answer feedback`);
      if (q.type === 'text') {
        assert.deepEqual(q.options, []);
        if (q.accepted !== undefined) assert.ok(Array.isArray(q.accepted) && q.accepted.every(a => typeof a === 'string'));
      } else {
        assert.equal(new Set(q.options).size, q.options.length, `${q.id}: duplicate options`);
        assert.equal(q.options.filter(option => option === q.answer).length, 1, `${q.id}: answer absent or duplicated`);
      }
    }
  }
});
