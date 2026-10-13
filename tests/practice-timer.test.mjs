import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeTimer, PRACTICE_TIMER_KEY, localDateKey } from '../src/practice-timer.js';
function setup(start = new Date(2026, 9, 5, 12).getTime()) {
  let wall = start, mono = 0;
  const data = new Map();
  const storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  const make = tabId => createPracticeTimer({ storage, wallNow: () => wall, monoNow: () => mono, tabId });
  const advance = (ms, ...timers) => { for (let left = ms; left > 0;) { const n = Math.min(left, 1000); mono += n; wall += n; timers.forEach(t => t.tick()); left -= n; } };
  return { make, advance, storage, start, jump: ms => { wall += ms; }, suspend: ms => { wall += ms; mono += ms; } };
}
function begin(t) { t.setEligible(true); t.activity(); }
test('no historic invention; interaction gives precisely 60 seconds', () => {
  const s = setup(), t = s.make('a');
  s.advance(4000, t); assert.equal(t.snapshot().totalMs, 0);
  begin(t); s.advance(70000, t); assert.equal(t.snapshot().totalMs, 60000);
  t.activity(); s.advance(2500, t); assert.equal(t.snapshot().totalMs, 62500);
});
test('navigation stays within activity window; blur and refocus without activity are excluded', () => {
  const s = setup(), t = s.make('a'); begin(t); s.advance(2000, t);
  t.setEligible(false); s.advance(9000, t); t.setEligible(true); s.advance(3000, t);
  assert.equal(t.snapshot().totalMs, 14000);
  t.activity(); s.advance(1000, t); t.setVisible(false); s.advance(8000, t);
  t.setVisible(true); s.advance(3000, t); assert.equal(t.snapshot().totalMs, 15000);
});
test('audio alone counts only actual playback; waiting ends audio counting', () => {
  const s = setup(), t = s.make('a'); t.setEligible(true); s.advance(60000, t);const before=t.snapshot().totalMs;
  t.setAudioPlaying(true); s.advance(42000, t); assert.equal(t.snapshot().totalMs, before+42000);
  t.setAudioPlaying(false); s.advance(8000, t); assert.equal(t.snapshot().totalMs, before+42000);
});
test('audio and thinking overlap once', () => {
  const s = setup(), t = s.make('a'); begin(t); t.setAudioPlaying(true); s.advance(10000, t);
  t.setAudioPlaying(false); s.advance(60000, t); assert.equal(t.snapshot().totalMs, 60000);
});
test('local midnight receives exact split', () => {
  const start = new Date(2026, 9, 5, 23, 59, 59, 500).getTime();
  const s = setup(start), t = s.make('a'); begin(t); s.advance(1000, t);
  assert.deepEqual(t.snapshot().days, { [localDateKey(start)]: 500, [localDateKey(start + 1000)]: 500 });
});
test('wall clock jumps never manufacture elapsed time', () => {
  const s = setup(), t = s.make('a'); begin(t); s.advance(2000, t);
  s.jump(86400000); t.tick(); s.advance(1000, t); s.jump(-172800000); t.tick(); s.advance(1000, t);
  assert.equal(t.snapshot().totalMs, 4000);
});
test('two tabs cannot ordinarily count the same interval; takeover has no backfill', () => {
  const s = setup(), a = s.make('a'), b = s.make('b'); begin(a); begin(b);
  s.advance(4000, a, b); assert.equal(a.snapshot().totalMs, 4000);
  a.setVisible(false); s.advance(2000, b); assert.equal(b.snapshot().totalMs, 5000);
  a.setVisible(true); a.activity(); s.advance(2000, a, b); assert.equal(b.snapshot().totalMs, 7000);
});
test('stale owner cannot count over takeover', () => {
  const s = setup(), a = s.make('a'), b = s.make('b'); begin(a); begin(b);
  s.advance(6000, b); s.advance(2000, b); a.tick();
  assert.equal(a.snapshot().totalMs, 3000);
});
test('reload retains totals and does not infer time since previous session', () => {
  const s = setup(), a = s.make('a'); begin(a); s.advance(2400, a); a.stop();
  s.advance(90000); const b = s.make('b'); assert.equal(b.snapshot().totalMs, 2400);
  begin(b); s.advance(1000, b); assert.equal(b.snapshot().totalMs, 3400);
});
test('suspension is capped by lease, never backfills entire gap', () => {
  const s = setup(), t = s.make('a'); begin(t); t.setAudioPlaying(true);
  s.suspend(120000); t.tick(); assert.equal(t.snapshot().totalMs, 5000);
});
test('stop releases lease and permanently disables counting', () => {
  const s = setup(), t = s.make('a'); begin(t); s.advance(1000, t); t.stop();
  s.advance(10000, t); t.activity(); assert.equal(t.snapshot().totalMs, 1000);
  assert.equal(JSON.parse(s.storage.getItem(PRACTICE_TIMER_KEY)).lease, null);
});
test('corrupt storage is not overwritten', () => {
  const s = setup(); s.storage.setItem(PRACTICE_TIMER_KEY, '{bad'); const t = s.make('a');
  begin(t); s.advance(1000, t); assert.equal(t.snapshot().storageAvailable, false);
  assert.equal(s.storage.getItem(PRACTICE_TIMER_KEY), '{bad');
});

test('loading and waiting count until 60 seconds, callbacks never extend inactivity', () => {
 const s=setup(),t=s.make('a');begin(t);s.advance(1000,t);t.setWaiting(true);s.advance(10000,t);assert.equal(t.snapshot().totalMs,11000);
 t.setEligible(false);s.advance(10000,t);assert.equal(t.snapshot().totalMs,21000);
 t.setAudioPlaying(true);s.advance(45000,t);assert.equal(t.snapshot().totalMs,60000);
 t.setEligible(true);t.setWaiting(false);t.setAudioPlaying(false);s.advance(5000,t);assert.equal(t.snapshot().totalMs,60000);
 t.activity();s.advance(1000,t);assert.equal(t.snapshot().totalMs,61000);
});
