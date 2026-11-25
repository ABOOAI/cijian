import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { DAILY_META_KEY, LEARNING_EVENT_PREFIX, DAILY_MODES, localDay, createLearningLedger, buildDailyReport } from '../src/daily-insights.js';

function memoryStorage(initial = []) {
  const data = new Map(initial);
  return { get length() { return data.size; }, key: index => [...data.keys()][index] ?? null,
    getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), data };
}
const noon = new Date(2026, 9, 21, 12).getTime();
const answer = (id, fields = {}) => ({ id, at: noon, mode: 'spelling', itemId: 'w1', label: 'example',
  kind: 'answer', first: true, assisted: false, correct: true, ...fields });
function setup(start = noon) {
  const storage = memoryStorage(), ledger = createLearningLedger({ storage, now: () => start });
  return { storage, ledger, report: options => buildDailyReport(ledger.snapshot(), { at: noon, ...options }) };
}
test('no new learning is zero recorded submissions with unknown accuracy and explicit partial coverage', () => {
  const { report, ledger } = setup();
  const result = report({ timeMs: 0, dueCount: 7 });
  assert.equal(result.total, 0); assert.equal(result.accuracy, null); assert.equal(result.partial, true);
  assert.equal(result.available, true); assert.equal(result.timeMs, 0); assert.equal(result.dueCount, 7);
  assert.equal(result.modes.length, DAILY_MODES.length); assert.equal(ledger.snapshot().startedAt, noon);
  assert(result.modes.every(mode => mode.total === 0 && mode.accuracy === null));
});
test('one mode is independent from the others; only first unassisted answers enter accuracy', () => {
  const { ledger, report } = setup(noon - 86400000);
  ledger.record(answer('right'));
  ledger.record(answer('wrong', { correct: false }));
  ledger.record(answer('hint', { assisted: true }));
  ledger.record(answer('retry', { first: false }));
  ledger.record(answer('self', { mode: 'memory', kind: 'self' }));
  const result = report();
  assert.equal(result.total, 5); assert.equal(result.firstAttempts, 3);
  assert.equal(result.independentAttempts, 2); assert.equal(result.independentCorrect, 1);
  assert.equal(result.accuracy, 50); assert.equal(result.wrong, 1); assert.equal(result.assisted, 1);
  assert.equal(result.self, 1); assert.equal(result.partial, false);
  assert.equal(result.modes.find(mode => mode.id === 'spelling').total, 4);
  assert.equal(result.modes.find(mode => mode.id === 'listening').accuracy, null);
});
test('a first error followed by three correction rounds remains a first-answer error', () => {
  const { ledger, report } = setup();
  ledger.record(answer('mistake', { correct: false }));
  for (let round = 0; round < 3; round++) ledger.record(answer(`fix-${round}`, {
    kind: 'correction', first: false, assisted: true, relatedId: 'mistake', completed: round === 2,
  }));
  const result = report();
  assert.equal(result.total, 4); assert.equal(result.firstAttempts, 1); assert.equal(result.accuracy, 0);
  assert.equal(result.corrections, 3); assert.equal(result.correctionCorrect, 3); assert.equal(result.correctionCompleted, 1);
  assert.equal(result.priorities[0].wrong, 1); assert.equal(result.priorities[0].correctionCompleted, 1);
  assert.match(result.priorities[0].reason, /不等于已经掌握/);
});
test('priority completion must refer to that exact first error; completion totals deduplicate related IDs', () => {
  const { ledger, report } = setup();
  ledger.record(answer('today-error', { correct: false }));
  ledger.record(answer('unrelated-fix', { kind: 'correction', first: false, completed: true, relatedId: 'yesterday-error' }));
  ledger.record(answer('duplicate-fix', { kind: 'correction', first: false, completed: true, relatedId: 'yesterday-error' }));
  const result = report();
  assert.equal(result.correctionCompleted, 1); assert.equal(result.priorities[0].correctionCompleted, 0);
});
test('same event ID never overwrites its first saved value and remains idempotent after reload', () => {
  const { ledger, storage, report } = setup();
  assert.equal(ledger.record(answer('a:/词条')), true);
  assert.equal(ledger.record(answer('a:/词条', { correct: false })), true);
  const second = createLearningLedger({ storage, now: () => noon + 1000 });
  second.record(answer('a:/词条'));
  assert.equal(report().total, 1); assert.equal(second.snapshot().events.length, 1);
  assert.equal(second.snapshot().events[0].correct, true); assert.equal(second.snapshot().startedAt, noon);
  assert(storage.data.has(LEARNING_EVENT_PREFIX + encodeURIComponent('a:/词条')));
});
test('two tabs merge separate event keys without replacing one another', () => {
  const { ledger: a, storage } = setup();
  const b = createLearningLedger({ storage, now: () => noon });
  a.record(answer('tab-a')); b.record(answer('tab-b', { mode: 'listening' }));
  assert.deepEqual(a.snapshot().events.map(event => event.id), ['tab-a', 'tab-b']);
  assert.deepEqual(b.snapshot().events.map(event => event.id), ['tab-a', 'tab-b']);
});
test('account-memory ledger uses its validated cache instead of rescanning every report', () => {
  const storage = memoryStorage(); storage.rescanOnSnapshot = false;
  let keyReads = 0; const key = storage.key; storage.key = index => { keyReads++; return key(index); };
  const ledger = createLearningLedger({ storage, now: () => noon }); const initialReads = keyReads;
  ledger.record(answer('cached-event')); ledger.snapshot(); ledger.snapshot();
  assert.equal(keyReads, initialReads); assert.equal(ledger.snapshot().events[0].id, 'cached-event');
});
test('different storage namespaces remain isolated and unrelated progress keys are untouched', () => {
  const first = setup(), second = setup();
  first.storage.setItem('word-garden.workspace.v2', '{unchanged}');
  first.ledger.record(answer('private-entry'));
  assert.equal(first.report().total, 1); assert.equal(second.report().total, 0);
  assert.equal(first.storage.getItem('word-garden.workspace.v2'), '{unchanged}');
});
test('the report changes at local midnight without changing persisted events', () => {
  const midnight = new Date(2026, 9, 22).getTime(), { ledger } = setup(noon - 86400000);
  ledger.record(answer('before', { at: midnight - 1 }));
  ledger.record(answer('after', { at: midnight }));
  const snapshot = ledger.snapshot();
  assert.equal(buildDailyReport(snapshot, { at: midnight - 1 }).total, 1);
  assert.equal(buildDailyReport(snapshot, { at: midnight }).total, 1);
  assert.equal(buildDailyReport(snapshot, { at: midnight + 86400000 }).total, 0);
});
test('local date differs from UTC and an event keeps its original local day after timezone changes', () => {
  const moduleURL = new URL('../src/daily-insights.js', import.meta.url).href;
  const code = `import assert from 'node:assert/strict';
    import {localDay,createLearningLedger,buildDailyReport} from ${JSON.stringify(moduleURL)};
    const data=new Map(),storage={get length(){return data.size},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
    const at=Date.parse('2026-10-21T00:30:00Z');
    assert.equal(localDay(at),'2026-10-20');
    const ledger=createLearningLedger({storage,now:()=>at});
    ledger.record({id:'a',at,mode:'sentence',itemId:'s1',label:'A sentence.',kind:'answer',first:true,assisted:false,correct:true});
    const before=ledger.snapshot().events[0];assert.equal(before.day,'2026-10-20');assert.equal(before.offset,420);
    process.env.TZ='Asia/Shanghai';
    assert.equal(localDay(at),'2026-10-21');
    const after=ledger.snapshot();assert.equal(after.events[0].day,'2026-10-20');assert.equal(after.available,true);
    assert.equal(buildDailyReport(after,{at}).total,0);
    assert.equal(buildDailyReport(after,{at:Date.parse('2026-10-20T12:00:00Z')}).total,1);`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    env: { ...process.env, TZ: 'America/Los_Angeles' }, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
});
test('missing booleans, unknown modes, empty IDs, invalid timestamps and impossible completions are rejected', () => {
  const { ledger, report } = setup();
  const invalid = [answer(''), answer('a', { first: undefined }), answer('b', { assisted: undefined }),
    answer('c', { correct: undefined }), answer('d', { at: NaN }), answer('e', { at: Infinity }),
    answer('f', { at: 9e15 }), answer('g', { mode: 'old-mode' }), answer('h', { completed: true }),
    answer('i', { kind: 'correction', correct: false, completed: true }), answer('\ud800')];
  for (const event of invalid) assert.equal(ledger.record(event), false);
  assert.equal(report().total, 0); assert.equal(report().invalidCount, invalid.length);
  assert.equal(report().available, false); assert.equal(localDay(NaN), null);
});
test('bad stored schema and metadata are preserved, omitted, and flagged instead of treated as zeros', () => {
  const { ledger, storage } = setup();
  ledger.record(answer('valid'));
  const badKey = LEARNING_EVENT_PREFIX + 'old'; storage.setItem(badKey, JSON.stringify({ id: 'old' }));
  storage.setItem(DAILY_META_KEY, '{broken');
  const reload = createLearningLedger({ storage, now: () => noon + 1000 });
  const result = buildDailyReport(reload.snapshot(), { at: noon, dueCount: null, timeMs: 50, timeAvailable: false });
  assert.equal(result.total, 1); assert.equal(result.startedAt, null); assert.equal(result.available, false);
  assert.equal(result.partial, true); assert.equal(result.invalidCount, 2);
  assert.equal(result.timeMs, null); assert.equal(result.dueCount, null);
  assert.equal(storage.getItem(DAILY_META_KEY), '{broken'); assert.equal(storage.getItem(badKey), '{"id":"old"}');
});
test('missing meta with existing events cannot invent a new collection start time', () => {
  const { ledger, storage } = setup(); ledger.record(answer('valid')); storage.data.delete(DAILY_META_KEY);
  const reload = createLearningLedger({ storage, now: () => noon + 1000 });
  assert.equal(reload.snapshot().startedAt, null); assert.equal(reload.snapshot().available, false);
  assert.equal(reload.snapshot().events.length, 1); assert.equal(storage.getItem(DAILY_META_KEY), null);
  assert.equal(ledger.snapshot().startedAt, null); assert.equal(ledger.snapshot().available, false);
});
test('quota failure retains temporary submissions, supports idempotent retry, and exposes the gap', () => {
  const { ledger, storage, report } = setup();
  const setItem = storage.setItem; storage.setItem = () => { throw new Error('quota'); };
  assert.equal(ledger.record(answer('temporary', { correct: false })), false);
  assert.equal(ledger.record(answer('temporary')), false);
  assert.equal(report().total, 1); assert.equal(report().wrong, 1);
  assert.equal(report().available, false); assert.equal(report().partial, true);
  storage.setItem = setItem;
  assert.equal(ledger.record(answer('temporary')), true);
  const reload = createLearningLedger({ storage, now: () => noon + 1000 });
  assert.equal(reload.snapshot().events.length, 1); assert.equal(reload.snapshot().events[0].correct, false);
});
test('unavailable storage never throws and still returns valid temporary evidence', () => {
  const ledger = createLearningLedger({ now: () => noon });
  assert.equal(ledger.record(answer('temporary')), false);
  assert.equal(ledger.snapshot().events.length, 1); assert.equal(ledger.snapshot().available, false);
});
test('a metadata write failure cannot prevent valid events from being collected, but the gap remains', () => {
  const storage = memoryStorage(), original = storage.setItem;
  storage.setItem = (key, value) => { if (key === DAILY_META_KEY) throw Error('quota'); original(key, value); };
  const ledger = createLearningLedger({ storage, now: () => noon });
  assert.equal(ledger.record(answer('saved-event')), true);
  assert.equal(ledger.snapshot().events.length, 1); assert.equal(ledger.snapshot().available, false);
  assert.equal(ledger.snapshot().startedAt, noon); assert.equal(storage.getItem(DAILY_META_KEY), null);
  const reload = createLearningLedger({ storage, now: () => noon + 1000 });
  assert.equal(reload.snapshot().events.length, 1); assert.equal(reload.snapshot().startedAt, null);
});
test('read and enumeration failures retain known evidence and cannot claim complete coverage', () => {
  for (const method of ['getItem', 'key', 'length']) {
    const { ledger, storage } = setup(); ledger.record(answer('saved'));
    if (method === 'length') Object.defineProperty(storage, 'length', { get() { throw Error('unreadable'); } });
    else storage[method] = () => { throw Error('unreadable'); };
    const snapshot = ledger.snapshot();
    assert.equal(snapshot.events.length, 1, method); assert.equal(snapshot.available, false, method);
  }
});
test('callers cannot mutate temporary ledger events through a returned snapshot', () => {
  const { ledger, storage, report } = setup(); storage.setItem = () => { throw Error('quota'); };
  ledger.record(answer('temporary', { correct: false, detail: { step: 1 } }));
  const snapshot = ledger.snapshot(); snapshot.events[0].correct = true; snapshot.events[0].detail.step = 99;
  assert.equal(report().wrong, 1); assert.equal(ledger.snapshot().events[0].detail.step, 1);
});
test('old cumulative data is not imported and all observed errors remain available for UI pagination', () => {
  const { ledger, storage, report } = setup();
  storage.setItem('word-garden.workspace.v2', JSON.stringify({ records: { w1: { reviews: 999 } } }));
  for (let index = 0; index < 12; index++) ledger.record(answer(`error-${index}`, { itemId: `w${index}`, correct: false }));
  const result = report();
  assert.equal(result.total, 12); assert.equal(result.priorities.length, 12);
  assert(result.priorities.every(item => item.wrong === 1 && /1次首答/.test(item.reason)));
});
