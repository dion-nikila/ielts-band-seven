import test from 'node:test';
import assert from 'node:assert/strict';
import { bandNineTarget, bandNineCriteria, bandNineSkills, bandNineSessions, bandNineAssessmentLimits, bandNineSources } from '../band-nine.mjs';

test('the target covers each IELTS skill without converting short exercises into bands', () => {
  assert.deepEqual(Object.values(bandNineTarget.skillTargets), [9, 9, 9, 9]);
  assert.equal(bandNineSkills.length, 4);
  for (const skill of bandNineSkills) {
    assert.equal(skill.target, 9);
    assert.ok(skill.checklist.length >= 4);
    if (['reading', 'listening'].includes(skill.id)) {
      assert.match(skill.benchmark, /39–40\/40/);
      assert.match(skill.benchmark, /vary|differ/);
    }
  }
});

test('rubrics preserve four writing and speaking criteria and do not infer pronunciation from text', () => {
  assert.equal(bandNineCriteria.writingTask1.length, 4);
  assert.equal(bandNineCriteria.writingTask2.length, 4);
  assert.equal(bandNineCriteria.speaking.length, 4);
  assert.match(bandNineAssessmentLimits.find(x => x.id === 'talking-points').text, /cannot establish a full Speaking band/);
  assert.match(bandNineAssessmentLimits.find(x => x.id === 'transcript').text, /need actual audio/);
});

test('coaching sessions point to app tools and all referenced sources exist', () => {
  const ids = new Set(bandNineSources.map(x => x.id));
  for (const entry of [bandNineTarget, ...bandNineSkills, ...bandNineSessions]) {
    for (const id of entry.sourceIds) assert.ok(ids.has(id), `Missing source ${id}`);
  }
  for (const session of bandNineSessions) {
    assert.match(session.href, /^#(writing|speaking|drills)$/);
    assert.ok(session.steps.length >= 3);
    assert.ok(session.review.length >= 3);
    assert.ok(session.successEvidence);
  }
  for (const source of bandNineSources) assert.equal(new URL(source.url).protocol, 'https:');
});
