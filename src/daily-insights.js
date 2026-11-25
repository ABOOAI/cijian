// Additive, device-local evidence only. Existing progress is never migrated or rewritten.
export const DAILY_META_KEY = 'word-garden.daily-insights.v1';
export const LEARNING_EVENT_PREFIX = 'word-garden.learning-event.v1:';
export const DAILY_MODES = Object.freeze([
  ['memory', '翻卡自评'], ['meaning', '翻译辨义'], ['listening', '听力辨义'],
  ['dictation', '听写'], ['spelling', '默写'], ['usage', '语境运用'],
  ['sentence', '句子听写'], ['phrase', '固定搭配'], ['context', '搭配与语境'],
  ['reading', '阅读理解'], ['cloze', '完形填空'], ['analysis', '句子讲解'],
].map(([id, label]) => Object.freeze({ id, label })));
const modes = new Set(DAILY_MODES.map(mode => mode.id));
const kinds = new Set(['answer', 'correction', 'self']);
const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const isTime = value => Number.isFinite(value) && value >= 0 && value <= 253402214400000;
const isText = (value, max = 600) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const dateText = (year, month, day) => `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
export function localDay(at) {
  if (!isTime(at)) return null;
  const date = new Date(at);
  return dateText(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
function dayAtOffset(at, offset) {
  const date = new Date(at - offset * 60000);
  return dateText(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}
function eventValue(value, persisted = false) {
  if (!isObject(value) || !isText(value.id, 1000) || !isTime(value.at) || !modes.has(value.mode)
      || !isText(value.itemId, 1000) || !isText(value.label) || !kinds.has(value.kind)
      || typeof value.first !== 'boolean' || typeof value.assisted !== 'boolean' || typeof value.correct !== 'boolean'
      || (value.relatedId !== undefined && !isText(value.relatedId, 1000))
      || (value.completed !== undefined && typeof value.completed !== 'boolean')
      || (value.completed === true && (value.kind !== 'correction' || !value.correct))) return null;
  try { encodeURIComponent(value.id); } catch { return null; }
  let detail;
  if (value.detail !== undefined) {
    try {
      const json = JSON.stringify(value.detail);
      if (typeof json !== 'string' || json.length > 4000) return null;
      detail = JSON.parse(json);
    } catch { return null; }
  }
  const offset = persisted ? value.offset : new Date(value.at).getTimezoneOffset();
  const day = persisted ? value.day : localDay(value.at);
  if (persisted && (value.version !== 1 || !Number.isInteger(offset) || Math.abs(offset) > 1440
      || typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day !== dayAtOffset(value.at, offset))) return null;
  return { version: 1, id: value.id, at: value.at, day, offset, mode: value.mode,
    itemId: value.itemId, label: value.label, kind: value.kind, first: value.first,
    assisted: value.assisted, correct: value.correct,
    ...(value.relatedId !== undefined ? { relatedId: value.relatedId } : {}),
    ...(value.completed !== undefined ? { completed: value.completed } : {}),
    ...(detail !== undefined ? { detail } : {}) };
}
function parseEvent(raw, key) {
  try {
    const event = eventValue(JSON.parse(raw), true);
    return event && key === LEARNING_EVENT_PREFIX + encodeURIComponent(event.id) ? event : null;
  } catch { return null; }
}

export function createLearningLedger({ storage, now = Date.now } = {}) {
  const pending = new Map(), invalidKeys = new Set();
  const rescanOnSnapshot = storage?.rescanOnSnapshot !== false;
  let cached = new Map(), startedAt = null, rejected = 0, storageFailed = false, metaUnknown = false, metaWasSaved = false;
  function scan() {
    const found = new Map();
    try {
      if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function'
          || typeof storage.key !== 'function' || !Number.isSafeInteger(storage.length) || storage.length < 0) throw Error();
      // Every answer has its own key; another tab never replaces a shared event array.
      const keys = new Set();
      for (let index = 0, length = storage.length; index < length; index++) {
        const key = storage.key(index);
        if (typeof key === 'string' && key.startsWith(LEARNING_EVENT_PREFIX)) keys.add(key);
      }
      for (const key of keys) {
        const raw = storage.getItem(key);
        if (raw === null) continue; // A concurrent clear must not manufacture an event.
        const event = parseEvent(raw, key);
        if (event) { found.set(event.id, event); invalidKeys.delete(key); }
        else invalidKeys.add(key);
      }
      cached = found;
      return true;
    } catch { storageFailed = true; return false; }
  }
  function readMeta(canInitialize = false) {
    try {
      const raw = storage?.getItem(DAILY_META_KEY);
      if (raw === null && canInitialize) {
        const at = now();
        if (!isTime(at)) { metaUnknown = true; return; }
        startedAt = at;
        storage.setItem(DAILY_META_KEY, JSON.stringify({ version: 1, startedAt }));
        metaWasSaved = true;
        return;
      }
      if (raw === null && startedAt !== null && !metaWasSaved) return; // A failed initial write remains visibly temporary.
      const meta = typeof raw === 'string' ? JSON.parse(raw) : null;
      if (!isObject(meta) || meta.version !== 1 || !isTime(meta.startedAt)) throw Error('invalid-meta');
      startedAt = meta.startedAt;
      metaWasSaved = true;
    } catch (error) {
      if (error?.message === 'invalid-meta' || error instanceof SyntaxError) {
        invalidKeys.add(DAILY_META_KEY); metaUnknown = true; startedAt = null;
      } else storageFailed = true;
    }
  }
  const initialRead = scan();
  readMeta(initialRead && cached.size === 0 && invalidKeys.size === 0);

  function record(input) {
    const event = eventValue(input);
    if (!event) { rejected++; return false; }
    const key = LEARNING_EVENT_PREFIX + encodeURIComponent(event.id);
    try {
      const raw = storage?.getItem(key);
      if (raw !== null && raw !== undefined) {
        const existing = parseEvent(raw, key);
        if (!existing) {
          invalidKeys.add(key);
          pending.set(event.id, pending.get(event.id) || event);
          return false; // Preserve corrupt bytes for recovery instead of overwriting them.
        }
        cached.set(existing.id, existing); pending.delete(existing.id);
        return true; // First persisted value wins, including across tabs and reloads.
      }
      const firstValue = pending.get(event.id) || event;
      pending.set(firstValue.id, firstValue);
      if (!storage || typeof storage.setItem !== 'function') throw Error();
      storage.setItem(key, JSON.stringify(firstValue));
      cached.set(firstValue.id, firstValue); pending.delete(firstValue.id);
      return true;
    } catch {
      storageFailed = true;
      if (!cached.has(event.id)) pending.set(event.id, pending.get(event.id) || event);
      return false;
    }
  }
  function snapshot() {
    if (rescanOnSnapshot) scan(); readMeta();
    const merged = new Map(pending);
    for (const [id, event] of cached) merged.set(id, event);
    const invalidCount = invalidKeys.size + rejected;
    const available = !storageFailed && !metaUnknown && startedAt !== null && invalidCount === 0;
    return { events: [...merged.values()].map(event => eventValue(event, true)).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)),
      startedAt, available, invalidCount, gap: !available };
  }
  return { record, snapshot };
}

function blankStats() {
  return { total: 0, firstAttempts: 0, independentAttempts: 0, independentCorrect: 0,
    accuracy: null, wrong: 0, assisted: 0, self: 0, corrections: 0,
    correctionCorrect: 0, correctionCompleted: 0 };
}
function summarize(events) {
  const stats = blankStats(), completed = new Set();
  for (const event of events) {
    stats.total++;
    if (event.kind === 'self') stats.self++;
    if (event.kind === 'answer' && event.first) {
      stats.firstAttempts++;
      if (!event.correct) stats.wrong++;
      if (event.assisted) stats.assisted++;
      else {
        stats.independentAttempts++;
        if (event.correct) stats.independentCorrect++;
      }
    }
    if (event.kind === 'correction') {
      stats.corrections++;
      if (event.correct) stats.correctionCorrect++;
      if (event.completed === true && event.correct) completed.add(event.relatedId || event.id);
    }
  }
  stats.correctionCompleted = completed.size;
  stats.accuracy = stats.independentAttempts ? 100 * stats.independentCorrect / stats.independentAttempts : null;
  return stats;
}
export function buildDailyReport(snapshot, { at = Date.now(), timeMs = null, timeAvailable = true, dueCount = 0 } = {}) {
  const day = localDay(at), source = isObject(snapshot) ? snapshot : {};
  const seen = new Set(), today = [];
  let invalidCount = Number.isSafeInteger(source.invalidCount) && source.invalidCount >= 0 ? source.invalidCount : 1;
  if (!Array.isArray(source.events)) invalidCount++;
  for (const raw of Array.isArray(source.events) ? source.events : []) {
    const event = eventValue(raw, true);
    if (!event) { invalidCount++; continue; }
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    if (event.day === day) today.push(event);
  }
  const startedAt = isTime(source.startedAt) ? source.startedAt : null;
  const available = source.available === true && startedAt !== null && invalidCount === 0 && day !== null;
  const date = day === null ? null : new Date(at);
  const dayStart = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() : null;
  const priorities = new Map();
  for (const event of today) {
    if (event.kind !== 'answer' || !event.first) continue;
    const key = JSON.stringify([event.mode, event.itemId]);
    const item = priorities.get(key) || { mode: event.mode, itemId: event.itemId, label: event.label,
      wrong: 0, independentCorrect: 0, correctionCompleted: 0, samples: 0, errors: new Set(), completed: new Set() };
    item.samples++;
    if (!event.correct) { item.wrong++; item.errors.add(event.id); }
    else if (!event.assisted) item.independentCorrect++;
    priorities.set(key, item);
  }
  for (const event of today) {
    if (event.kind !== 'correction' || !event.correct || event.completed !== true || !event.relatedId) continue;
    const item = priorities.get(JSON.stringify([event.mode, event.itemId]));
    if (item?.errors.has(event.relatedId)) item.completed.add(event.relatedId);
  }
  const ranked = [...priorities.values()].filter(item => item.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.mode.localeCompare(b.mode) || a.itemId.localeCompare(b.itemId))
    .map(item => ({ mode: item.mode, itemId: item.itemId, label: item.label,
      wrong: item.wrong, independentCorrect: item.independentCorrect, correctionCompleted: item.completed.size,
      reason: `今日已记录${item.samples}次首答，${item.wrong}次答错，${item.independentCorrect}次独立答对；${item.completed.size}项对应错误完成订正。样本仅代表这些作答，完成订正不等于已经掌握。` }));
  return { day, startedAt, available, invalidCount,
    partial: !available || source.gap === true || startedAt === null || dayStart === null || startedAt >= dayStart,
    timeMs: timeAvailable === true && Number.isFinite(timeMs) && timeMs >= 0 ? timeMs : null,
    dueCount: Number.isSafeInteger(dueCount) && dueCount >= 0 ? dueCount : null,
    ...summarize(today), modes: DAILY_MODES.map(mode => ({ ...mode, ...summarize(today.filter(event => event.mode === mode.id)) })),
    priorities: ranked };
}
