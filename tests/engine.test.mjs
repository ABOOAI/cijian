import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY, MINUTE, defaultRecord, scheduleReview, isValidRecord,
  getDueWords, getMistakeWords, getStats, normalizeAnswer, isCorrectAnswer,
} from '../src/engine.js';
import { STORAGE_KEY, loadProgress, saveProgress } from '../src/storage.js';

const NOW = Date.UTC(2026, 9, 3, 8);
const words = [{ id: 'hello', english: 'hello' }, { id: 'tidy', english: 'tidy' }, { id: 'desk', english: 'desk' }];

function memoryStorage(initial = null) {
  const data = new Map(initial === null ? [] : [[STORAGE_KEY, initial]]);
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

test('again schedules a same-day ten-minute retry and resets a successful ladder', () => {
  const first = scheduleReview(undefined, 'good', NOW);
  const second = scheduleReview(first, 'good', NOW + DAY);
  const wrong = scheduleReview(second, 'again', NOW + DAY + MINUTE);
  assert.equal(wrong.dueAt, NOW + DAY + 11 * MINUTE);
  assert.equal(wrong.intervalDays, 10 * MINUTE / DAY);
  assert.equal(wrong.streak, 0);
  assert.equal(wrong.wrongCount, 1);
  assert.equal(wrong.mistake, true);
  assert.equal(wrong.reviews, 3);
  const nextWrong = scheduleReview(wrong, 'again', wrong.dueAt);
  assert.equal(nextWrong.wrongCount, 2);
  assert.equal(nextWrong.dueAt - nextWrong.lastReviewed, 10 * MINUTE);
  assert.equal(new Date(NOW).getUTCDate(), new Date(scheduleReview(undefined, 'again', NOW).dueAt).getUTCDate());
});

test('good follows 1, 3, 7, 14, 30, 60 days and stays capped at 60 days', () => {
  let record;
  for (const interval of [1, 3, 7, 14, 30, 60, 60, 60]) {
    record = scheduleReview(record, 'good', record?.dueAt ?? NOW);
    assert.equal(record.intervalDays, interval);
    assert.equal(record.dueAt - record.lastReviewed, interval * DAY);
    assert.equal(isValidRecord(record), true);
  }
  assert.equal(record.streak, 6);
  assert.equal(record.reviews, 8);
});

test('hard starts at four hours, is bounded, and is shorter than good from the same state', () => {
  assert.equal(scheduleReview(undefined, 'hard', NOW).dueAt, NOW + 4 * 60 * MINUTE);
  let record;
  for (let index = 0; index < 8; index += 1) {
    const now = record?.dueAt ?? NOW;
    const hard = scheduleReview(record, 'hard', now);
    const good = scheduleReview(record, 'good', now);
    assert.ok(hard.intervalDays < good.intervalDays);
    assert.ok(hard.intervalDays <= 3);
    assert.ok(hard.intervalDays >= 1 / 6);
    assert.equal(hard.streak, 0);
    record = good;
  }
  const longInterval = record;
  const hard = scheduleReview(longInterval, 'hard', longInterval.dueAt);
  assert.equal(hard.intervalDays, 3);
  assert.equal(scheduleReview(hard, 'good', hard.dueAt).intervalDays, 1);
  assert.ok(scheduleReview(hard, 'hard', hard.dueAt).intervalDays < scheduleReview(hard, 'good', hard.dueAt).intervalDays);
});

test('a mistake leaves the review list only after two consecutive good ratings', () => {
  const wrong = scheduleReview(undefined, 'again', NOW);
  const firstGood = scheduleReview(wrong, 'good', wrong.dueAt);
  assert.equal(firstGood.mistake, true);
  const hard = scheduleReview(firstGood, 'hard', firstGood.dueAt);
  assert.equal(hard.mistake, true);
  const restart = scheduleReview(hard, 'good', hard.dueAt);
  assert.equal(restart.mistake, true);
  const resolved = scheduleReview(restart, 'good', restart.dueAt);
  assert.equal(resolved.mistake, false);
  assert.equal(resolved.wrongCount, 1);
  assert.equal(getMistakeWords(words, { hello: firstGood })[0].id, 'hello');
  assert.deepEqual(getMistakeWords(words, { hello: resolved }), []);
});

test('due includes the equality boundary, excludes new words, and sorts by due time', () => {
  const later = scheduleReview(undefined, 'good', NOW);
  const earlier = scheduleReview(undefined, 'again', NOW);
  const records = { hello: later, tidy: earlier, desk: defaultRecord() };
  assert.deepEqual(getDueWords(words, records, earlier.dueAt - 1), []);
  assert.deepEqual(getDueWords(words, records, earlier.dueAt).map((word) => word.id), ['tidy']);
  assert.deepEqual(getDueWords(words, records, later.dueAt).map((word) => word.id), ['tidy', 'hello']);
  assert.deepEqual(getDueWords(words, {}, NOW + 90 * DAY), []);
});

test('one-word updates are immutable and stats ignore unknown dictionary ids', () => {
  const other = Object.freeze(scheduleReview(undefined, 'good', NOW));
  const previous = Object.freeze(scheduleReview(undefined, 'again', NOW));
  const records = Object.freeze({ hello: previous, tidy: other });
  const updated = { ...records, hello: scheduleReview(records.hello, 'good', previous.dueAt) };
  assert.equal(updated.tidy, other);
  assert.equal(records.hello.streak, 0);
  assert.equal(updated.hello.streak, 1);
  assert.deepEqual(getStats(words, { ...updated, unknown: scheduleReview(undefined, 'good', NOW) }, NOW), {
    total: 3, learned: 2, due: 0, mistakes: 1, new: 1, stable: 0, reviews: 3,
  });
  assert.notEqual(defaultRecord(), defaultRecord());
});

test('early good or hard practice cannot advance progress or clear mistakes', () => {
  const wrong = Object.freeze(scheduleReview(undefined, 'again', NOW));
  for (const rating of ['good', 'hard']) {
    const early = scheduleReview(wrong, rating, wrong.dueAt - 1);
    assert.deepEqual(early, wrong);
    assert.notEqual(early, wrong);
    assert.equal(early.mistake, true);
    assert.equal(early.reviews, 1);
    assert.equal(early.streak, 0);
  }
  const firstGood = scheduleReview(wrong, 'good', wrong.dueAt);
  assert.equal(firstGood.reviews, 2);
  assert.equal(firstGood.streak, 1);
  assert.equal(firstGood.mistake, true);
  assert.deepEqual(scheduleReview(firstGood, 'good', firstGood.dueAt - 1), firstGood);
  const nextDueGood = scheduleReview(firstGood, 'good', firstGood.dueAt);
  assert.equal(nextDueGood.reviews, 3);
  assert.equal(nextDueGood.streak, 2);
  assert.equal(nextDueGood.mistake, false);
  const earlyWrong = scheduleReview(firstGood, 'again', firstGood.lastReviewed + MINUTE);
  assert.equal(earlyWrong.wrongCount, 2);
  assert.equal(earlyWrong.streak, 0);
  assert.equal(earlyWrong.reviews, firstGood.reviews + 1);
  assert.equal(earlyWrong.dueAt, firstGood.lastReviewed + 11 * MINUTE);
});

test('answer normalization accepts typography, casing and whitespace without erasing errors', () => {
  assert.equal(normalizeAnswer('  Good\t  MORNING  '), 'good morning');
  assert.equal(isCorrectAnswer({ english: "I'm" }, ' I’m '), true);
  assert.equal(isCorrectAnswer({ english: 'well-known' }, 'well‑known'), true);
  assert.equal(isCorrectAnswer({ english: 'color', answers: ['colour'] }, 'Colour'), true);
  assert.equal(isCorrectAnswer({ english: 'good morning' }, 'GOOD\nMORNING'), true);
  assert.equal(isCorrectAnswer({ english: 'hello' }, 'helo'), false);
  assert.equal(isCorrectAnswer({ english: 'hello' }, 'hello!'), false);
  assert.equal(isCorrectAnswer({ english: 'well-known' }, 'well known'), false);
  assert.equal(isCorrectAnswer({ english: 'goodbye' }, 'good bye'), false);
  assert.equal(isCorrectAnswer({ english: "I'm" }, 'Im'), false);
  assert.equal(isCorrectAnswer({ english: 'hello' }, ''), false);
  assert.equal(isCorrectAnswer({ english: 'hello' }, null), false);
});

test('valid progress round-trips across reloads and permits unknown word ids', () => {
  const storage = memoryStorage();
  const records = { hello: scheduleReview(undefined, 'again', NOW), futureId: scheduleReview(undefined, 'good', NOW) };
  assert.deepEqual(loadProgress(storage), { records: {}, notice: '' });
  assert.deepEqual(saveProgress(storage, records), { ok: true, error: '' });
  assert.deepEqual(loadProgress(storage), { records, notice: '' });
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).version, 1);
});

test('malformed JSON is retained and cannot be silently overwritten', () => {
  const original = '{broken';
  const storage = memoryStorage(original);
  const loaded = loadProgress(storage);
  assert.deepEqual(loaded.records, {});
  assert.match(loaded.notice, /原始记录已保留/);
  assert.equal(storage.getItem(STORAGE_KEY), original);
  assert.equal(saveProgress(storage, { hello: scheduleReview(undefined, 'good', NOW) }).ok, false);
  assert.equal(storage.getItem(STORAGE_KEY), original);
  storage.removeItem(STORAGE_KEY); // The UI must ask for confirmation before this operation.
  assert.equal(saveProgress(storage, { hello: scheduleReview(undefined, 'good', NOW) }).ok, true);
});

test('invalid fields are excluded while recoverable records and raw data are retained', () => {
  const good = scheduleReview(undefined, 'good', NOW);
  const corrupt = { ...good, wrongCount: '2' };
  const original = JSON.stringify({ version: 1, records: { hello: good, tidy: corrupt } });
  const storage = memoryStorage(original);
  assert.deepEqual(loadProgress(storage).records, { hello: good });
  assert.match(loadProgress(storage).notice, /损坏/);
  assert.equal(saveProgress(storage, { hello: good }).ok, false);
  assert.equal(storage.getItem(STORAGE_KEY), original);
  for (const invalid of [null, [], {}, { ...good, streak: -1 }, { ...good, dueAt: null },
    { ...good, intervalDays: Infinity }, { ...good, mistake: 'false' }, { ...good, wrongCount: 9 }]) {
    assert.equal(isValidRecord(invalid), false);
  }
  assert.equal(saveProgress(memoryStorage(), { hello: corrupt }).ok, false);
});

test('unsupported storage payloads remain untouched', () => {
  for (const value of [null, [], { version: 2, records: {} }, { version: 1, records: [] }]) {
    const original = JSON.stringify(value);
    const storage = memoryStorage(original);
    assert.deepEqual(loadProgress(storage).records, {});
    assert.match(loadProgress(storage).notice, /损坏/);
    assert.equal(saveProgress(storage, {}).ok, false);
    assert.equal(storage.getItem(STORAGE_KEY), original);
  }
});

test('storage denial and quota failures return clear messages instead of throwing', () => {
  const denied = { getItem() { throw new Error('disabled'); } };
  assert.match(loadProgress(denied).notice, /无法读取/);
  assert.equal(saveProgress(denied, {}).ok, false);
  const quota = {
    getItem() { return null; },
    setItem() { const error = new Error('full'); error.name = 'QuotaExceededError'; throw error; },
  };
  assert.match(saveProgress(quota, {}).error, /存储空间不足/);
});

test('invalid ratings and times fail clearly without modifying a record', () => {
  const record = defaultRecord();
  assert.throws(() => scheduleReview(record, 'unknown', NOW), TypeError);
  assert.throws(() => scheduleReview(record, 'good', NaN), TypeError);
  assert.throws(() => getDueWords(words, {}, -1), TypeError);
  assert.deepEqual(record, defaultRecord());
});
