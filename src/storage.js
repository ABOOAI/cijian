import { isValidRecord } from './engine.js';

export const STORAGE_KEY = 'word-garden.progress.v1';
const DAMAGED_NOTICE = '本机进度数据存在损坏，原始记录已保留，未自动清空。请确认清空后重新保存进度。';

function isDictionary(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readPayload(raw) {
  const payload = JSON.parse(raw);
  if (!isDictionary(payload) || payload.version !== 1 || !isDictionary(payload.records)) {
    return { records: {}, damaged: true };
  }
  const entries = Object.entries(payload.records);
  const valid = entries.filter(([id, record]) => id.length > 0 && isValidRecord(record));
  // Object.fromEntries creates own data properties even for an unknown '__proto__' id.
  return { records: Object.fromEntries(valid), damaged: valid.length !== entries.length };
}

/** A read never changes storage, including when a damaged payload can be partly recovered. */
export function loadProgress(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    const raw = target.getItem(STORAGE_KEY);
    if (raw === null) return { records: {}, notice: '' };
    const result = readPayload(raw);
    return { records: result.records, notice: result.damaged ? DAMAGED_NOTICE : '' };
  } catch (error) {
    if (error instanceof SyntaxError) return { records: {}, notice: DAMAGED_NOTICE };
    return { records: {}, notice: '浏览器无法读取本机进度。当前学习仍可进行，但进度可能无法保留。' };
  }
}

/** Refuse to overwrite damaged existing data until the user explicitly clears it. */
export function saveProgress(storage, records) {
  if (!isDictionary(records)
    || Object.entries(records).some(([id, record]) => !id || !isValidRecord(record))) {
    return { ok: false, error: '进度格式无效，本次未保存。' };
  }
  try {
    const target = storage ?? globalThis.localStorage;
    const raw = target.getItem(STORAGE_KEY);
    if (raw !== null) {
      let existing;
      try {
        existing = readPayload(raw);
      } catch (error) {
        if (error instanceof SyntaxError) return { ok: false, error: DAMAGED_NOTICE };
        throw error;
      }
      if (existing.damaged) return { ok: false, error: DAMAGED_NOTICE };
    }
    target.setItem(STORAGE_KEY, JSON.stringify({ version: 1, records }));
    return { ok: true, error: '' };
  } catch (error) {
    const reason = error?.name === 'QuotaExceededError' ? '本机存储空间不足' : '浏览器禁止写入本机存储';
    return { ok: false, error: `${reason}，当前进度未保存。` };
  }
}
