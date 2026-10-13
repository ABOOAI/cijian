/** Explainable review rules. This is a scheduling heuristic, not a fitted forgetting model. */
export const MINUTE = 60_000;
export const DAY = 24 * 60 * MINUTE;

const GOOD_INTERVALS = [1, 3, 7, 14, 30, 60];
const RATINGS = new Set(['again', 'hard', 'good']);
const FIELDS = ['lastReviewed', 'dueAt', 'intervalDays', 'streak', 'reviews', 'wrongCount', 'mistake'];

export function defaultRecord() {
  return {
    lastReviewed: null,
    dueAt: null,
    intervalDays: 0,
    streak: 0,
    reviews: 0,
    wrongCount: 0,
    mistake: false,
  };
}

function isTime(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isCounter(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Shared with storage so invalid persisted fields cannot enter the scheduler. */
export function isValidRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  if (!FIELDS.every((field) => Object.hasOwn(record, field))) return false;
  if (!(record.lastReviewed === null || isTime(record.lastReviewed))) return false;
  if (!(record.dueAt === null || isTime(record.dueAt))) return false;
  if (typeof record.intervalDays !== 'number' || !Number.isFinite(record.intervalDays)
    || record.intervalDays < 0 || record.intervalDays > 60) return false;
  if (!isCounter(record.streak) || record.streak > GOOD_INTERVALS.length) return false;
  if (!isCounter(record.reviews) || !isCounter(record.wrongCount)) return false;
  if (record.wrongCount > record.reviews || record.streak > record.reviews) return false;
  if (typeof record.mistake !== 'boolean') return false;
  if (record.reviews === 0) {
    return record.lastReviewed === null && record.dueAt === null
      && record.intervalDays === 0 && record.streak === 0
      && record.wrongCount === 0 && record.mistake === false;
  }
  return isTime(record.lastReviewed) && isTime(record.dueAt)
    && record.dueAt >= record.lastReviewed && record.intervalDays > 0;
}

function assertNow(now) {
  if (!isTime(now)) throw new TypeError('now 必须是非负的毫秒时间戳。');
}

/** Returns one new record; neither the input record nor any other word is modified. */
export function scheduleReview(previous, rating, now) {
  assertNow(now);
  if (!RATINGS.has(rating)) throw new TypeError('评分必须是 again、hard 或 good。');
  const prior = previous == null ? defaultRecord() : previous;
  if (!isValidRecord(prior)) throw new TypeError('单词进度记录无效。');
  // Optional early practice must not inflate a streak or remove a mistake.
  // A wrong answer is still useful evidence even before the scheduled review.
  if (prior.reviews > 0 && prior.dueAt > now && rating !== 'again') return { ...prior };
  if (prior.reviews === Number.MAX_SAFE_INTEGER || prior.wrongCount === Number.MAX_SAFE_INTEGER) {
    throw new RangeError('复习次数超出可保存范围。');
  }

  let intervalDays;
  let streak = 0;
  let wrongCount = prior.wrongCount;
  let mistake = prior.mistake;
  const nextGoodInterval = GOOD_INTERVALS[Math.min(prior.streak, GOOD_INTERVALS.length - 1)];

  if (rating === 'again') {
    intervalDays = (10 * MINUTE) / DAY;
    wrongCount += 1;
    mistake = true;
  } else if (rating === 'hard') {
    // At least four hours, at most three days and always shorter than good
    // from the same record. Breaking a good streak returns its ladder to zero.
    intervalDays = Math.min(3, nextGoodInterval / 2, Math.max(1 / 6, prior.intervalDays / 2));
  } else {
    intervalDays = nextGoodInterval;
    streak = Math.min(prior.streak + 1, GOOD_INTERVALS.length);
    if (streak >= 2) mistake = false;
  }

  return {
    lastReviewed: now,
    dueAt: now + intervalDays * DAY,
    intervalDays,
    streak,
    reviews: prior.reviews + 1,
    wrongCount,
    mistake,
  };
}

function recordFor(records, id) {
  if (!records || !Object.hasOwn(records, id)) return null;
  const record = records[id];
  return isValidRecord(record) ? record : null;
}

/** Only already-studied words are due. New words belong in the learning list. */
export function getDueWords(words, records, now) {
  assertNow(now);
  return words
    .map((word, index) => ({ word, index, record: recordFor(records, word.id) }))
    .filter(({ record }) => record && record.reviews > 0 && record.dueAt <= now)
    .sort((a, b) => a.record.dueAt - b.record.dueAt || a.index - b.index)
    .map(({ word }) => word);
}

export function getMistakeWords(words, records) {
  return words
    .map((word, index) => ({ word, index, record: recordFor(records, word.id) }))
    .filter(({ record }) => record?.mistake)
    .sort((a, b) => b.record.wrongCount - a.record.wrongCount
      || a.record.dueAt - b.record.dueAt || a.index - b.index)
    .map(({ word }) => word);
}

export function getStats(words, records, now) {
  assertNow(now);
  let learned = 0;
  let stable = 0;
  let reviews = 0;
  for (const word of words) {
    const record = recordFor(records, word.id);
    if (!record || record.reviews === 0) continue;
    learned += 1;
    reviews += record.reviews;
    if (record.streak >= 2 && !record.mistake) stable += 1;
  }
  return {
    total: words.length,
    learned,
    due: getDueWords(words, records, now).length,
    mistakes: getMistakeWords(words, records).length,
    new: words.length - learned,
    stable,
    reviews,
  };
}

/** Normalize typography and whitespace without removing meaningful punctuation. */
export function normalizeAnswer(input, {caseSensitive=false}={}) {
  if (typeof input !== 'string') return '';
  const normalized=input.normalize('NFC')
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212\ufe63\uff0d]/g, '-')
    .trim()
    .replace(/\s+/gu, ' ');
  return caseSensitive?normalized:normalized.toLocaleLowerCase('en');
}

export function isCorrectAnswer(word, input) {
  const options={caseSensitive:!!word?.caseSensitive};
  const answer = normalizeAnswer(input,options);
  if (!answer || !word || typeof word !== 'object') return false;
  const expected = [word.english ?? word.word, ...(Array.isArray(word.answers) ? word.answers : [])];
  return expected.some((candidate) => typeof candidate === 'string'
    && normalizeAnswer(candidate,options) !== '' && normalizeAnswer(candidate,options) === answer);
}
