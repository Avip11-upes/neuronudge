import test from 'node:test';
import assert from 'node:assert/strict';
import { mockApi, DYSLEXIA_QUESTIONS, AUTISM_QUESTIONS } from './mockApi';
import { CORE_DISCLAIMER } from './constants';

test('mockApi: health check returns ok and llm status', async () => {
  const health = await mockApi.getHealth();
  assert.equal(health.status, 'ok');
  assert.equal(health.llm.provider, 'ollama');
  assert.equal(health.llm.ready, true);
});

test('mockApi: createSession creates and registers a session', async () => {
  const res = await mockApi.createSession({
    nickname: 'Maya',
    age: 9,
    language: 'en',
    taker: 'child',
    consent: true,
  });

  assert.ok(res.session_id.startsWith('sess_'));
  assert.ok(res.created_at);

  const detail = await mockApi.getSession(res.session_id);
  assert.equal(detail.nickname, 'Maya');
  assert.equal(detail.age, 9);
  assert.equal(detail.stages.adhd, 'pending');
});

test('mockApi: question banks have valid options and categories', async () => {
  const dyslexiaRes = await mockApi.getQuestions('dyslexia', 8);
  assert.ok(dyslexiaRes.questions.length >= 5);
  for (const q of dyslexiaRes.questions) {
    assert.ok(q.id);
    assert.ok(q.prompt);
    assert.ok(q.options.length >= 2);
  }

  const autismRes = await mockApi.getQuestions('autism', 8);
  assert.ok(autismRes.questions.length >= 4);
  for (const q of autismRes.questions) {
    assert.ok(q.id);
    assert.ok(q.prompt);
    assert.ok(q.options.length >= 2);
  }
});

test('mockApi: stage lifecycle updates stage from pending to running to done', async () => {
  const sess = await mockApi.createSession({
    nickname: 'Alex',
    age: 12,
    language: 'en',
    taker: 'child',
    consent: true,
  });

  await mockApi.startStage(sess.session_id, 'adhd');
  let detail = await mockApi.getSession(sess.session_id);
  assert.equal(detail.stages.adhd, 'running');

  await mockApi.finishStage(sess.session_id, 'adhd');
  detail = await mockApi.getSession(sess.session_id);
  assert.equal(detail.stages.adhd, 'done');
});

test('mockApi: report generation contains all required contract fields and disclaimer', async () => {
  const sess = await mockApi.createSession({
    nickname: 'Leo',
    age: 7,
    language: 'en',
    taker: 'child',
    consent: true,
  });

  const report = await mockApi.generateReport(sess.session_id);
  assert.ok(report.summary.length > 20);
  assert.equal(report.indicators.length, 3);
  assert.ok(['adhd', 'dyslexia', 'autism', 'none'].includes(report.most_likely));
  assert.ok(['adhd', 'dyslexia', 'autism'].includes(report.least_likely));
  assert.ok(report.recommendations.length >= 3);
  assert.ok(report.confidence_note.length > 10);
  assert.equal(report.disclaimer, CORE_DISCLAIMER);
  assert.equal(report.generated_by, 'gemma-4');
});
