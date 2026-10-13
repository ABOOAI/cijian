/** Effective practice time. Call tick at least once per second while mounted.
 * State transitions settle the preceding interval before changing eligibility.
 * The caller must use real audio `playing`/`waiting`/`pause`/`ended` events.
 */
export const PRACTICE_TIMER_KEY = 'vocabulary.effective-practice.v1';
export const IDLE_MS = 60_000;
export const LEASE_MS = 5_000;

export function localDateKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function createPracticeTimer({
  storage = globalThis.localStorage,
  wallNow = () => Date.now(),
  monoNow = () => performance.now(),
  tabId = globalThis.crypto?.randomUUID?.() || `tab-${Math.random().toString(36).slice(2)}`,
} = {}) {
  let eligible = false, visible = true, audio = false, waiting = false, stopped = false;
  let lastActivity = -Infinity;
  let lastMono = monoNow(), lastWall = wallNow();
  let held = false, token = '', sequence = 0;
  let available = true;
  let cached = { version: 1, days: {}, lease: null };
  const activeAt = m => !stopped && eligible && visible && ((audio && !waiting) || m < lastActivity + IDLE_MS);

  function read() {
    try {
      const raw = storage.getItem(PRACTICE_TIMER_KEY);
      const value = raw ? JSON.parse(raw) : null;
      const days = {};
      if (value?.version === 1 && value.days && typeof value.days === 'object') {
        for (const [day, ms] of Object.entries(value.days)) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(ms) && ms >= 0) days[day] = ms;
        }
      }
      cached = { version: 1, days, lease: value?.version === 1 ? value.lease || null : null };
      available = true;
      return cached;
    } catch {
      // Never invent a fresh total over an unreadable existing record.
      available = false;
      return null;
    }
  }
  function write(value) {
    try {
      storage.setItem(PRACTICE_TIMER_KEY, JSON.stringify(value));
      cached = value;
      available = true;
      return true;
    } catch { available = false; return false; }
  }
  const ours = lease => lease?.owner === tabId && lease?.token === token;

  function allocate(days, start, elapsed) {
    let cursor = start, remaining = elapsed;
    while (remaining > 0) {
      const d = new Date(cursor);
      const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      const part = Math.min(remaining, next - cursor);
      if (!(part > 0)) break;
      const key = localDateKey(cursor);
      days[key] = (days[key] || 0) + part;
      cursor += part;
      remaining -= part;
    }
  }

  function settle(m, w) {
    const state = read();
    const elapsed = Math.max(0, m - lastMono);
    if (state && held && ours(state.lease) && eligible && visible && !stopped) {
      // Never count past our lease's monotonic budget, even after suspension.
      const duration = Math.min(elapsed, LEASE_MS, audio && !waiting ? Infinity : Math.max(0, lastActivity + IDLE_MS - lastMono));
      if (duration > 0) {
        // Wall time chooses the date only. Clock edits cannot create duration.
        // For discontinuities, allocate this last segment from its known start.
        allocate(state.days, lastWall, duration);
        if (!write(state)) held = false;
      }
    } else held = false;
    lastMono = m;
    lastWall = w;
  }

  function reconcile(m, w) {
    const state = read();
    if (!state) { held = false; return; }
    if (!activeAt(m)) {
      if (held && ours(state.lease)) { state.lease = null; write(state); }
      held = false;
      return;
    }
    const lease = state.lease;
    // A clock moved backwards by more than a lease cannot lock all tabs out.
    const expired = !lease || !Number.isFinite(lease.until) || lease.until <= w || lease.until > w + LEASE_MS;
    if ((held && ours(lease)) || expired) {
      if (!held || !ours(lease)) token = `${tabId}:${++sequence}:${m}`;
      state.lease = { owner: tabId, token, until: w + LEASE_MS };
      held = write(state) && ours(read()?.lease);
    } else held = false;
  }
  function tick() {
    if (stopped) return;
    const m = monoNow(), w = wallNow();
    settle(m, w);
    reconcile(m, w);
  }
  function transition(change) {
    if (stopped) return;
    tick();
    change();
    reconcile(lastMono, lastWall);
  }
  function snapshot() {
    tick();
    const state = read() || cached;
    const days = { ...state.days };
    return {
      days,
      todayMs: days[localDateKey(wallNow())] || 0,
      totalMs: Object.values(days).reduce((sum, n) => sum + n, 0),
      active: activeAt(monoNow()),
      ownsLease: held,
      storageAvailable: available,
      status: !available ? 'unavailable' : !eligible || !visible || stopped ? 'paused' : activeAt(monoNow()) ? held ? 'active' : 'other-tab' : 'idle',
    };
  }
  return {
    setEligible(value) {
      transition(() => {
        // Once study starts, in-app navigation and loading retain the activity window.
        // Only explicit user activity refreshes it; hiding/stopping still pauses.
        if(value&&!eligible){eligible=true;lastActivity=visible?lastMono:-Infinity;}
      });
    },
    activity() { transition(() => { if (eligible && visible) lastActivity = lastMono; }); },
    setWaiting(value) { transition(() => { waiting = Boolean(value); }); },
    setAudioPlaying(value) { transition(() => { audio = Boolean(value); }); },
    setVisible(value) {
      transition(() => {
        visible = Boolean(value);
        // Refocusing does not resurrect a pre-blur thinking window or audio.
        if (!visible) { lastActivity = -Infinity; audio = false; }
      });
    },
    tick,
    snapshot,
    stop() { if (!stopped) { transition(() => { stopped = true; }); } },
  };
}
