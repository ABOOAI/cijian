import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(project, 'evidence');
const baseUrl = process.env.TEST_URL || 'http://127.0.0.1:4173';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CDP {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    this.events = [];
    this.dialogDecisions = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        clearTimeout(request.timer);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result);
      } else {
        this.events.push(message);
        if (message.method === 'Page.javascriptDialogOpening') {
          this.call('Page.handleJavaScriptDialog', { accept: this.dialogDecisions.shift() ?? false }).catch(() => {});
        }
      }
    });
  }
  call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timed out: ${method}`));
      }, 12000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  }
  async waitFor(expression, description = expression) {
    for (let attempt = 0; attempt < 80; attempt++) {
      if (await this.evaluate(expression)) return;
      await sleep(100);
    }
    throw new Error(`Timed out waiting for: ${description}`);
  }
  async ensureControlVisible(selector) {
    const containers = await this.evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      return {
        practiceClosed: !!element?.closest('#practice-options') && !element.matches('#practice-options > summary') && !document.querySelector('#practice-options').open,
        aboutClosed: !!element?.closest('#about-dialog') && !document.querySelector('#about-dialog').open,
      };
    })()`);
    if (containers.practiceClosed) await this.click('#practice-options > summary');
    if (containers.aboutClosed) await this.click('#about-button');
  }
  async click(selector) {
    await this.ensureControlVisible(selector);
    const point = await this.evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error('Missing element: ' + ${JSON.stringify(selector)});
      element.scrollIntoView({ block: 'center' });
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    })()`);
    await this.call('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await this.call('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    await sleep(50);
  }
  async setValue(selector, value) {
    await this.ensureControlVisible(selector);
    await this.evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      element.value = ${JSON.stringify(value)};
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await sleep(50);
  }
  async key(key, code, extra = {}) {
    const text = key === 'Enter' ? '\r' : undefined;
    await this.call('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key, code, text, unmodifiedText: text, ...extra });
    await this.call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, ...extra });
    await sleep(50);
  }
  async screenshot(name) {
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(evidence, name), Buffer.from(result.data, 'base64'));
  }
  async reload() {
    await this.call('Page.reload');
    await this.waitFor('document.readyState === "complete" && !!document.querySelector("#unit-select option")');
    await sleep(100);
  }
  async viewport(width, height = 844) {
    await this.call('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: width < 600,
    });
    await sleep(100);
  }
}

async function launch() {
  const profile = path.join(evidence, 'chrome-test-profile');
  await mkdir(profile, { recursive: true });
  const child = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--in-process-gpu', '--no-sandbox', '--disable-gpu-sandbox',
    '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-component-update',
    '--disable-features=Translate,MediaRouter', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank',
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  child.on('exit', (code, signal) => {
    if (process.argv.includes('--trace')) console.log(`Browser process exited: ${code}, ${signal}`);
  });
  child.stderr.on('data', (chunk) => {
    if (process.argv.includes('--trace')) console.log(chunk.toString().trim().slice(0, 2000));
  });
  let browserAddress;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome did not open its local debugging endpoint')), 15000);
    child.once('error', reject);
    child.stderr.on('data', (chunk) => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        browserAddress = match[1];
        clearTimeout(timer);
        resolve();
      }
    });
  });
  const address = new URL(browserAddress);
  const pages = await (await fetch(`http://${address.host}/json/list`)).json();
  const target = pages.find((item) => item.type === 'page');
  if (!target) throw new Error('Chrome opened no page target');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await once(socket, 'open');
  const cdp = new CDP(socket);
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  return { cdp, child, socket, profile };
}

const checks = [];
function assert(condition, description, detail) {
  checks.push({ description, pass: Boolean(condition), ...(detail === undefined ? {} : { detail }) });
  if (!condition) throw new Error(description + (detail === undefined ? '' : `: ${JSON.stringify(detail)}`));
}

const fixedTime = Date.UTC(2026, 9, 3, 9, 0, 0);
const storageKey = 'word-garden.progress.v1';
async function records(cdp) {
  return cdp.evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || '{"records":{}}').records`);
}
async function noOverflow(cdp, width) {
  await cdp.viewport(width, width >= 1000 ? 1000 : 844);
  const layout = await cdp.evaluate(`(() => {
    const root = document.documentElement;
    const body = document.body;
    return {
      viewport: innerWidth, document: root.scrollWidth, body: body.scrollWidth,
      offenders: [...document.querySelectorAll('body *')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && getComputedStyle(e).display !== 'none' && (r.left < -1 || r.right > innerWidth + 1);
      }).map(e => e.id || e.tagName + '.' + e.className).slice(0, 10)
    };
  })()`);
  assert(layout.document <= layout.viewport && layout.body <= layout.viewport, `No horizontal overflow at ${width}px`, layout);
}

async function assertFocus(cdp, selector, description) {
  const focus = await cdp.evaluate(`(() => {
    const element = document.activeElement;
    return {
      matches: !!element?.matches(${JSON.stringify(selector)}),
      inLearning: !!document.querySelector('#learning-content')?.contains(element),
      control: element?.id || element?.tagName,
    };
  })()`);
  assert(focus.matches && focus.inLearning, description, focus);
}

async function assertMemoryHint(cdp, word, expectedOpen, description) {
  const state = await cdp.evaluate(`(() => {
    const normalize = value => value.replace(/\\s+/g, ' ').trim();
    const expected = normalize(${JSON.stringify(word.hint)});
    const matching = [...document.querySelectorAll('#learning-content details.memory-hint')]
      .filter(element => normalize(element.textContent).includes(expected));
    return {
      exists: matching.length > 0,
      open: matching.some(element => element.open),
      visibleText: matching.some(element => element.open && normalize(element.innerText).includes(expected)),
    };
  })()`);
  assert(state.exists && state.open === expectedOpen && (!expectedOpen || state.visibleText), description, state);
}

async function assertAnswerHasNoHint(cdp, word, description) {
  const state = await cdp.evaluate(`(() => {
    const content = document.querySelector('#learning-content');
    return {
      hintCount: content.querySelectorAll('.memory-hint').length,
      containsHint: content.textContent.includes(${JSON.stringify(word.hint)}),
      containsEnglishAnswer: !!content.querySelector('.english-answer'),
    };
  })()`);
  assert(state.hintCount === 0 && !state.containsHint && !state.containsEnglishAnswer, description, state);
}

async function firstCardPlacement(cdp, width) {
  const before = width === 320
    ? { cardTop: 499, wordTop: 564, meaningBottom: 651, actionTop: 838, actionBottom: 887 }
    : { cardTop: 467, wordTop: 532, meaningBottom: 626, actionTop: 813, actionBottom: 862 };
  const placement = await cdp.evaluate(`(() => {
    const measure = () => {
      window.scrollTo(0, 0);
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      return {
        cardTop: Math.round(rect('.card').top),
        wordTop: Math.round(rect('.card .word').top),
        meaningBottom: Math.round(rect('.card .meaning').bottom),
        actionTop: Math.round(rect('#quest-next').top),
        actionBottom: Math.round(rect('#quest-next').bottom),
        viewportHeight: innerHeight,
      };
    };
    const current = measure();
    return { current, previous: ${JSON.stringify(before)} };
  })()`);
  assert(placement.current.cardTop < placement.previous.cardTop && placement.current.actionTop < placement.previous.actionTop,
    `First card and continue button appear earlier at ${width}px`, placement);
  assert(placement.current.wordTop < placement.current.viewportHeight && placement.current.meaningBottom < placement.current.viewportHeight,
    `English word and Chinese meaning are visible in the initial ${width}px viewport`, placement.current);
  assert(placement.current.actionTop >= 0 && placement.current.actionBottom <= placement.current.viewportHeight,
    `The primary continue button is fully visible in the initial ${width}px viewport`, placement.current);
}

async function runChecks(cdp) {
  if (process.argv.includes('--probe')) {
    const version = await cdp.call('Browser.getVersion');
    assert(Boolean(version.product), 'Headless Chrome CDP is available', version.product);
    return;
  }
  await cdp.call('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__WORD_GARDEN_NOW__ = ${fixedTime};
    window.__testVoices = [];
    window.__speechCalls = [];
    window.__spokenUtterances = [];
    window.__voiceReads = 0;
    window.__voiceListeners = [];
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices() { window.__voiceReads++; return window.__testVoices; },
      speak(utterance) {
        window.__speechCalls.push({ text: utterance.text, lang: utterance.lang });
        window.__spokenUtterances.push(utterance);
      },
      cancel() {},
      addEventListener(type, listener) { if (type === 'voiceschanged') window.__voiceListeners.push(listener); },
      removeEventListener(type, listener) { window.__voiceListeners = window.__voiceListeners.filter(item => item !== listener); },
      speaking: false, pending: false,
    }});
  ` });
  await cdp.viewport(390);
  await cdp.call('Page.navigate', { url: baseUrl });
  await cdp.waitFor('document.readyState === "complete" && !!document.querySelector("#unit-select option")');
  assert(await cdp.evaluate('Boolean(document.querySelector("main"))'), 'App loaded');
  await cdp.evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)})`);
  await cdp.reload();
  const vocabulary = await cdp.evaluate(`(async () => {
    const data = await import('./src/vocabulary.js');
    return { units: data.UNITS, words: data.WORDS, book: data.BOOK };
  })()`);
  const firstUnit = vocabulary.units.find((unit) => vocabulary.words.some((word) => word.unitId === unit.id));
  const secondUnit = vocabulary.units.find((unit) => unit.id !== firstUnit.id && vocabulary.words.some((word) => word.unitId === unit.id));
  const firstWord = vocabulary.words.find((word) => word.unitId === firstUnit.id);
  assert(vocabulary.words.length > 0, 'Vocabulary data is available', vocabulary.words.length);
  assert(vocabulary.words.every(word => typeof word.hint === 'string' && word.hint.trim().length > 0), 'Every vocabulary entry has a memory prompt');
  const hintGroups = new Map();
  for (const word of vocabulary.words) {
    if (!hintGroups.has(word.hint)) hintGroups.set(word.hint, new Set());
    hintGroups.get(word.hint).add(`${word.english}:${word.chinese}`);
  }
  const sharedHints = [...hintGroups.entries()].filter(([, meanings]) => meanings.size > 1).map(([hint, meanings]) => ({ hint, words: [...meanings] }));
  assert(sharedHints.length === 0, 'A memory prompt is specific to one word and meaning rather than reused across a unit', sharedHints.slice(0, 3));
  assert(vocabulary.words.length === 289 && vocabulary.units.length === 10, 'Final official vocabulary includes 289 records across ten units', { words: vocabulary.words.length, units: vocabulary.units.length });
  const centreWord = vocabulary.words.find((word) => word.english === 'centre');
  assert(centreWord?.answers.includes('center') && !vocabulary.words.some((word) => word.english === 'center'), 'The adapter combines centre and center into one entry with an accepted alias');
  const sourceUrl = new URL(vocabulary.book.source);
  assert(vocabulary.book.status === 'official-list' && sourceUrl.hostname === 'basic.smartedu.cn' && sourceUrl.searchParams.get('contentId') === '33f98190-ed21-f303-9657-d29d792f27a9' && !vocabulary.book.source.includes('&amp;'), 'Official electronic-textbook source URL uses real query separators', vocabulary.book.source);
  assert(await cdp.evaluate(`document.querySelector('#source-link').href === ${JSON.stringify(vocabulary.book.source)} && !document.querySelector('#source-link').href.includes('&amp;')`), 'The rendered textbook source link preserves the normalized official URL');
  assert(await cdp.evaluate('window.__voiceReads > 0 && window.__speechCalls.length === 0'), 'Boot warms the voice list without playing audio automatically');
  assert(await cdp.evaluate('document.querySelector("[data-mode=quest]").getAttribute("aria-pressed") === "true"'), 'Short-level quest is the default practice mode');
  assert(await cdp.evaluate('!!document.querySelector("#difficulty-select") && !!document.querySelector("#level-select")'), 'Quest exposes difficulty and level selection');
  assert(await cdp.evaluate('!document.querySelector("#practice-options").open && document.querySelector("#practice-options").contains(document.querySelector("[data-mode=flash]")) && document.querySelector("#practice-options").contains(document.querySelector("#difficulty-select")) && document.querySelector("#practice-options").contains(document.querySelector("#level-select"))'), 'Practice modes, difficulty and level choices start inside collapsed options');
  assert(await cdp.evaluate('!document.querySelector(".stage-track") && document.querySelector("#session-label.stage-label").innerText.includes("学词听音")'), 'One stage label replaces the competing stage chip list');
  assert(Object.keys(await records(cdp)).length === 0, 'Opening the app creates no learned records');
  await noOverflow(cdp, 390);
  await firstCardPlacement(cdp, 390);
  await cdp.screenshot('mobile-390-quest.png');
  await noOverflow(cdp, 320);
  await firstCardPlacement(cdp, 320);
  await cdp.screenshot('mobile-320-quest.png');
  await noOverflow(cdp, 1440);
  await cdp.screenshot('desktop-1440-quest.png');
  await cdp.viewport(390);
  await assertMemoryHint(cdp, firstWord, false, 'The first word-specific memory hint is collapsed initially');
  await cdp.click('#learning-content .memory-hint > summary');
  await assertMemoryHint(cdp, firstWord, true, 'Expanding a memory hint reveals that current word\'s dedicated prompt');
  await cdp.screenshot('mobile-390-memory-hint-expanded.png');
  assert(Object.keys(await records(cdp)).length === 0, 'Viewing a memory hint does not mark a word learned');
  await cdp.click('#learning-content .memory-hint > summary');
  await assertMemoryHint(cdp, firstWord, false, 'The memory hint can be collapsed again');

  await cdp.click('[data-view=due]');
  assert(await cdp.evaluate('!document.querySelector("#start-review") && document.querySelector("#due-content").innerText.trim().length > 0'), 'New learner sees a useful no-due-words state');
  await noOverflow(cdp, 320);
  await cdp.click('[data-view=learn]');
  await cdp.click('[data-mode=flash]');
  for (const unit of vocabulary.units) {
    await cdp.setValue('#unit-select', unit.id);
    const count = vocabulary.words.filter((word) => word.unitId === unit.id).length;
    assert(await cdp.evaluate(`document.querySelector('#unit-select').value === ${JSON.stringify(unit.id)}`), `Unit selection: ${unit.id}`);
    assert(await cdp.evaluate(`Number(document.querySelector('#card-counter').textContent.split('/')[1]) === ${count}`), `Unit count matches data: ${unit.id}`, count);
  }
  assert(Object.keys(await records(cdp)).length === 0, 'Changing unit and level does not mark words learned');
  await cdp.setValue('#unit-select', firstUnit.id);
  await cdp.click('[data-mode=flash]');
  const initiallyLocked = await cdp.evaluate(`!document.querySelector('[data-rating=again]') || document.querySelector('[data-rating=again]').disabled`);
  assert(initiallyLocked, 'Rating is unavailable before active recall reveal');
  await cdp.evaluate('document.querySelector("#reveal-button").focus()');
  await cdp.key('Enter', 'Enter', { windowsVirtualKeyCode: 13 });
  assert(await cdp.evaluate('!!document.querySelector("[data-rating=again]") && !document.querySelector("[data-rating=again]").disabled'), 'Keyboard Enter reveals the card and enables rating');
  assert(await cdp.evaluate(`document.querySelector('#learning-content').innerText.includes(${JSON.stringify(firstWord.chinese)})`), 'Revealed card shows its Chinese meaning');
  await assertMemoryHint(cdp, firstWord, false, 'Revealing a flashcard leaves its dedicated memory hint optional');
  for (const rating of ['good', 'hard']) {
    const beforeHintAssisted = JSON.stringify(await records(cdp));
    const beforeHintAssistedGame = await cdp.evaluate('localStorage.getItem("word-garden.game.v1")');
    if (rating === 'good') {
      const synchronousAttempt = await cdp.evaluate(`(() => {
        const details = document.querySelector('#learning-content .memory-hint');
        const summary = details.querySelector('summary');
        let toggleEvents = 0;
        details.addEventListener('toggle', () => toggleEvents++);
        summary.click();
        summary.click();
        const beforeRating = { closed: !details.open, toggleEvents };
        document.querySelector('[data-rating=good]').click();
        return beforeRating;
      })()`);
      assert(synchronousAttempt.closed && synchronousAttempt.toggleEvents === 0, 'Opening, closing and rating a prompt synchronously cannot bypass assisted-practice handling', synchronousAttempt);
    } else {
      await cdp.click('#learning-content .memory-hint > summary');
      await assertMemoryHint(cdp, firstWord, true, `Opening a flashcard prompt makes ${rating} an assisted attempt`);
      await cdp.click('#learning-content .memory-hint > summary');
      await cdp.click(`[data-rating=${rating}]`);
    }
    assert(JSON.stringify(await records(cdp)) === beforeHintAssisted, `Hint-assisted ${rating} does not change the word's review record or interval`);
    assert(await cdp.evaluate('localStorage.getItem("word-garden.game.v1")') === beforeHintAssistedGame, `Hint-assisted ${rating} does not persist a recall star`);
    assert(await cdp.evaluate('document.querySelector("#session-status").innerText.includes("辅助练习")'), `Hint-assisted ${rating} is clearly identified in the status`);
    await cdp.setValue('#unit-select', firstUnit.id);
    await cdp.click('#reveal-button');
  }
  await cdp.click('#learning-content .memory-hint > summary');
  await cdp.click('[data-rating=again]');
  await assertMemoryHint(cdp, firstWord, true, 'A wrong flashcard rating automatically expands its memory hint');
  let saved = await records(cdp);
  assert(Object.keys(saved).length === 1 && saved[firstWord.id]?.mistake === true, 'Wrong rating records only the current word', Object.keys(saved));
  assert(saved[firstWord.id].dueAt === fixedTime + 10 * 60_000, 'Wrong answer schedules same-day practice after 10 minutes', saved[firstWord.id].dueAt);
  const persisted = JSON.stringify(saved);
  await cdp.reload();
  assert(JSON.stringify(await records(cdp)) === persisted, 'Progress survives a browser refresh');
  await cdp.click('[data-mode=flash]');
  await cdp.click('[data-view=mistakes]');
  assert(await cdp.evaluate('!!document.querySelector("#start-mistakes")'), 'Wrong word appears in the mistake review list');
  await noOverflow(cdp, 320);
  await cdp.screenshot('mobile-320-mistakes.png');
  await cdp.evaluate(`window.__WORD_GARDEN_NOW__ = ${saved[firstWord.id].dueAt}`);
  await cdp.click('#start-mistakes');
  await cdp.click('#reveal-button');
  await cdp.click('[data-rating=good]');
  saved = await records(cdp);
  assert(saved[firstWord.id].mistake && saved[firstWord.id].streak === 1, 'One successful due review keeps a mistake for another spaced success');
  assert(saved[firstWord.id].intervalDays === 1, 'First successful due review schedules one day');
  const beforeEarlyPractice = JSON.stringify(saved);
  const gameBeforeEarlyPractice = await cdp.evaluate('localStorage.getItem("word-garden.game.v1")');
  await cdp.click('[data-view=mistakes]');
  await cdp.click('#start-mistakes');
  await cdp.click('#reveal-button');
  await cdp.click('[data-rating=good]');
  assert(JSON.stringify(await records(cdp)) === beforeEarlyPractice, 'Repeating a correct answer before due does not inflate review count or interval');
  assert(await cdp.evaluate('localStorage.getItem("word-garden.game.v1")') === gameBeforeEarlyPractice, 'Repeating a correct answer before due cannot farm stars');
  await cdp.click('[data-rating=good]');
  assert(JSON.stringify(await records(cdp)) === beforeEarlyPractice, 'A disabled second rating cannot change progress again');
  await cdp.evaluate(`window.__WORD_GARDEN_NOW__ = ${saved[firstWord.id].dueAt}`);
  await cdp.click('[data-view=mistakes]');
  await cdp.click('#start-mistakes');
  await cdp.click('#reveal-button');
  await cdp.click('[data-rating=good]');
  saved = await records(cdp);
  assert(!saved[firstWord.id].mistake && saved[firstWord.id].streak === 2, 'Two successful spaced reviews remove that word from mistakes');
  assert(saved[firstWord.id].intervalDays === 3, 'Second successful due review extends the interval to three days');
  await cdp.click('[data-view=mistakes]');
  assert(await cdp.evaluate('!document.querySelector("#start-mistakes")'), 'Resolved mistake leaves a useful empty mistake state');
  await cdp.click('[data-view=due]');
  assert(await cdp.evaluate('!document.querySelector("#start-review")'), 'Future scheduled word is not incorrectly listed as due');
  await cdp.evaluate(`window.__WORD_GARDEN_NOW__ = ${saved[firstWord.id].dueAt}`);
  await cdp.click('[data-view=due]');
  assert(await cdp.evaluate('!!document.querySelector("#start-review")'), 'Due list updates at the testable due time');
  await cdp.click('#start-review');
  await cdp.click('#reveal-button');
  await cdp.click('[data-rating=hard]');
  saved = await records(cdp);
  assert(saved[firstWord.id].intervalDays < 7 && saved[firstWord.id].intervalDays <= 3, 'Fuzzy recall shortens the next interval', saved[firstWord.id].intervalDays);
  assert(Object.keys(saved).length === 1, 'Review session does not grade other words');

  if (secondUnit) {
    await cdp.click('[data-view=learn]');
    await cdp.setValue('#unit-select', secondUnit.id);
    await cdp.click('[data-mode=spell]');
    const word = vocabulary.words.find((item) => item.unitId === secondUnit.id);
    await assertAnswerHasNoHint(cdp, word, 'A new spelling question contains no memory hint or revealed answer in its DOM');
    await cdp.setValue('#spell-input', word.english.toUpperCase());
    await cdp.evaluate('document.querySelector("#spell-input").focus()');
    await cdp.key('Enter', 'Enter', { windowsVirtualKeyCode: 13 });
    saved = await records(cdp);
    assert(saved[word.id]?.streak === 1 && !saved[word.id]?.mistake, 'Correct spelling works with keyboard Enter and case normalization');
    await assertMemoryHint(cdp, word, false, 'A correct spelling result leaves its memory hint collapsed');
    await assertFocus(cdp, '#next-button', 'Spelling submission restores focus to its continue button');
    await cdp.click('#next-button');
    await assertFocus(cdp, '#spell-input', 'The next spelling card restores focus to its answer input');
    const nextWord = vocabulary.words.filter((item) => item.unitId === secondUnit.id)[1];
    await assertAnswerHasNoHint(cdp, nextWord, 'The next spelling question does not retain the previous word\'s hint or answer');
    await cdp.setValue('#spell-input', 'definitely-wrong-answer');
    await cdp.click('#check-answer');
    saved = await records(cdp);
    assert(saved[nextWord.id]?.mistake === true && saved[nextWord.id]?.wrongCount === 1, 'Incorrect spelling adds only that word to mistakes');
    assert(await cdp.evaluate(`document.querySelector('#learning-content').innerText.includes(${JSON.stringify(nextWord.english)})`), 'Incorrect spelling reveals the correct answer');
    await assertMemoryHint(cdp, nextWord, true, 'A wrong spelling result automatically expands the correct word-specific memory hint');
    await assertFocus(cdp, '#next-button', 'Incorrect spelling submission keeps keyboard focus in learning controls');
    await noOverflow(cdp, 320);
    await cdp.screenshot('mobile-320-spelling-feedback.png');
    await cdp.click('#retry-answer');
    await assertAnswerHasNoHint(cdp, nextWord, 'Retrying a missed word removes its hint and revealed answer before the next submission');
    await assertFocus(cdp, '#spell-input', 'Retrying a missed word restores focus to its answer input');
  }
  const beforeSpeech = JSON.stringify(await records(cdp));
  await cdp.click('[data-mode=listen]');
  const listeningWord = vocabulary.words.filter(word => word.unitId === (secondUnit?.id || firstUnit.id))[secondUnit ? 1 : 0];
  await assertAnswerHasNoHint(cdp, listeningWord, 'A new listening question contains no memory hint or revealed answer in its DOM');
  await cdp.click('#play-audio');
  assert(await cdp.evaluate('document.querySelector("#speech-notice")?.innerText.includes("英语")'), 'Listening clearly explains when no English voice is available');
  assert(await cdp.evaluate('window.__speechCalls.length === 0'), 'No unavailable or wrong-language TTS voice is silently used');
  await cdp.evaluate('window.__testVoices = [{ name: "QA English", lang: "en-US", localService: true, default: true }]');
  await cdp.evaluate('window.__voiceListeners.forEach(listener => listener())');
  assert(await cdp.evaluate('document.querySelector("#speech-notice").innerText.includes("再次点击") && window.__speechCalls.length === 0'), 'A newly ready voice asks for another click without automatic playback');
  await cdp.click('#play-audio');
  assert(await cdp.evaluate('window.__speechCalls.length === 1 && window.__speechCalls[0].text.length > 0 && window.__speechCalls[0].lang.startsWith("en")'), 'English TTS is triggered only by the play button');
  assert(JSON.stringify(await records(cdp)) === beforeSpeech, 'Playing pronunciation does not change learning progress');
  await noOverflow(cdp, 390);
  await cdp.screenshot('mobile-390-listening.png');

  await cdp.evaluate('window.__oldUtterance = window.__spokenUtterances.at(-1)');
  await cdp.click('[data-mode=spell]');
  await cdp.evaluate('window.__oldUtterance.onerror({ error: "late-canceled" })');
  assert(await cdp.evaluate('!document.querySelector("#check-answer").disabled && document.querySelector("#speech-notice").hidden'), 'An old speech error cannot disable a new spelling card');
  await cdp.click('[data-mode=listen]');
  await cdp.click('#play-audio');
  await cdp.evaluate('window.__previousCardUtterance = window.__spokenUtterances.at(-1)');
  await cdp.click('#skip-listening');
  await assertFocus(cdp, '#next-button', 'Skipping a regular listening exercise restores focus to continue');
  await cdp.click('#next-button');
  await cdp.click('#play-audio');
  await cdp.evaluate('window.__previousCardUtterance.onerror({ error: "late-canceled" })');
  assert(await cdp.evaluate('!document.querySelector("#check-answer").disabled && document.querySelector("#speech-notice").hidden'), 'An old speech error cannot disable the next listening card');
  await cdp.evaluate('window.__earlierPlayUtterance = window.__spokenUtterances.at(-1)');
  await cdp.click('#play-audio');
  await cdp.evaluate('window.__earlierPlayUtterance.onerror({ error: "late-canceled" })');
  assert(await cdp.evaluate('!document.querySelector("#check-answer").disabled && document.querySelector("#speech-notice").hidden'), 'An earlier replay error cannot disable a newer successful replay');
  await cdp.evaluate('window.__spokenUtterances.at(-1).onerror({ error: "current-failed" })');
  assert(await cdp.evaluate('document.querySelector("#check-answer").disabled && !document.querySelector("#speech-notice").hidden'), 'A current speech error still disables listening submit and shows help');
  assert(JSON.stringify(await records(cdp)) === beforeSpeech, 'Speech failures and listening skips do not modify word progress');

  await cdp.click('[data-mode=quest]');
  await cdp.setValue('#unit-select', firstUnit.id);
  await cdp.setValue('#difficulty-select', 'standard');
  await cdp.setValue('#level-select', '0');
  const levelWords = vocabulary.words.filter((word) => word.unitId === firstUnit.id).slice(0, 5);
  const beforeStudy = JSON.stringify(await records(cdp));
  const starsBeforeStudy = await cdp.evaluate("JSON.parse(localStorage.getItem('word-garden.game.v1') || 'null')?.stars ?? 0");
  assert(await cdp.evaluate('Number(document.querySelector("#session-label.stage-label").dataset.stageCount) === 4'), 'Standard difficulty has study, meaning, spelling and listening stages');
  for (const word of levelWords) {
    assert(await cdp.evaluate(`document.querySelector('#learning-content .word').innerText === ${JSON.stringify(word.english)}`), `Study follows the selected five-word level: ${word.id}`);
    await cdp.click('#quest-next');
  }
  await assertFocus(cdp, '[data-choice]', 'Finishing study restores focus to the first meaning choice');
  assert(JSON.stringify(await records(cdp)) === beforeStudy, 'Study preview does not mark any word learned');
  assert(await cdp.evaluate(`JSON.parse(localStorage.getItem('word-garden.game.v1') || '{"stars":0}').stars === ${starsBeforeStudy}`), 'Study preview does not award recall stars');
  await cdp.evaluate(`window.__wrongChoice = [...document.querySelectorAll('[data-choice]')].find(button => button.dataset.choice !== ${JSON.stringify(firstWord.chinese)}).dataset.choice`);
  const wrongChoice = await cdp.evaluate('window.__wrongChoice');
  await cdp.click(`[data-choice=${JSON.stringify(wrongChoice)}]`);
  await assertMemoryHint(cdp, firstWord, true, 'A wrong meaning choice expands the current word-specific memory hint');
  await assertFocus(cdp, '#quest-next', 'A meaning-choice result restores focus to continue');
  const afterWrongChoice = await records(cdp);
  assert(afterWrongChoice[firstWord.id].mistake && afterWrongChoice[firstWord.id].dueAt === await cdp.evaluate('window.__WORD_GARDEN_NOW__ + 600000'), 'Wrong meaning choice enters the review plan after 10 minutes');
  await cdp.click('#quest-next');
  for (const word of levelWords.slice(1)) {
    await cdp.click(`[data-choice=${JSON.stringify(word.chinese)}]`);
    await cdp.click('#quest-next');
  }
  assert(await cdp.evaluate(`document.querySelector('#learning-content .word').innerText === ${JSON.stringify(firstWord.english)} && document.querySelector('#card-counter').innerText === '${levelWords.length + 1} / ${levelWords.length + 1}'`), 'A missed meaning question repeats later in the same stage');
  await cdp.click(`[data-choice=${JSON.stringify(firstWord.chinese)}]`);
  await cdp.click('#quest-next');
  await assertFocus(cdp, '#spell-input', 'Entering quest spelling restores focus to its answer input');
  assert(JSON.stringify(await records(cdp)) === JSON.stringify(afterWrongChoice), 'Meaning choices do not silently mark the whole level mastered');
  for (const [position, word] of levelWords.entries()) {
    await assertAnswerHasNoHint(cdp, word, `Quest spelling ${word.id} hides the memory hint until submission`);
    await cdp.setValue('#spell-input', word.english);
    await cdp.click('#check-answer');
    if (position === 0) await assertFocus(cdp, '#quest-next', 'Quest spelling submission restores focus to continue');
    await cdp.click('#quest-next');
    if (position === 0) await assertFocus(cdp, '#spell-input', 'Continuing quest spelling restores focus to the next answer input');
  }
  assert(await cdp.evaluate('document.querySelector("#session-label.stage-label").innerText.includes("听音拼写")'), 'Standard level proceeds to listening after spelling');
  await assertFocus(cdp, '#play-audio', 'Entering quest listening restores focus to its play button');
  await cdp.evaluate('window.__testVoices = []; window.__speechCalls = []');
  const beforeSkip = JSON.stringify(await records(cdp));
  const gameBeforeSkip = await cdp.evaluate('localStorage.getItem("word-garden.game.v1")');
  await assertAnswerHasNoHint(cdp, firstWord, 'Quest listening hides the word-specific memory hint until submission');
  await cdp.click('#play-audio');
  assert(await cdp.evaluate('document.querySelector("#check-answer").disabled && !document.querySelector("#speech-notice").hidden'), 'Unavailable English voice keeps listening submit disabled and shows help');
  await cdp.click('#skip-listening');
  await assertFocus(cdp, '#quest-next', 'Skipping quest listening restores focus to continue');
  assert(await cdp.evaluate(`!document.querySelector('#learning-content').innerText.includes(${JSON.stringify(firstWord.english)})`), 'Skipping unavailable listening does not expose the English answer');
  assert(JSON.stringify(await records(cdp)) === beforeSkip && await cdp.evaluate('localStorage.getItem("word-garden.game.v1")') === gameBeforeSkip, 'Skipping unavailable listening does not grade or award stars');
  await cdp.click('#quest-next');
  await assertFocus(cdp, '#play-audio', 'Continuing skipped quest listening restores focus to the next play button');
  for (const word of levelWords.slice(1)) {
    await assertAnswerHasNoHint(cdp, word, `Quest listening ${word.id} has no hint or revealed answer before submission`);
    await cdp.click('#skip-listening');
    await cdp.click('#quest-next');
  }
  assert(await cdp.evaluate('!!document.querySelector(".quest-complete")'), 'A five-word level reaches its completion screen');
  await assertFocus(cdp, '.completion-actions button', 'Completing a quest keeps keyboard focus on its next learning action');
  assert(await cdp.evaluate(`JSON.parse(localStorage.getItem('word-garden.game.v1')).completedLevels.includes(${JSON.stringify(`${firstUnit.id}:0`)})`), 'Level completion is saved locally');
  assert(await cdp.evaluate('document.querySelector(".quest-complete").innerText.includes("不代表已经记牢")'), 'Completing a level does not claim that every word is mastered');
  await noOverflow(cdp, 320);
  await cdp.screenshot('mobile-320-level-complete.png');
  const expectedLevels = Math.ceil(vocabulary.words.filter((word) => word.unitId === firstUnit.id).length / 5);
  assert(await cdp.evaluate(`document.querySelector('#level-select').options.length === ${expectedLevels}`), 'Level choices divide a unit into at most five-word blocks');
  if (expectedLevels > 1) {
    await cdp.setValue('#level-select', '1');
    const nextLevelWord = vocabulary.words.filter((word) => word.unitId === firstUnit.id)[5];
    assert(await cdp.evaluate(`document.querySelector('#learning-content .word').innerText === ${JSON.stringify(nextLevelWord.english)}`), 'Selecting a different level changes its first word');
  }
  await cdp.setValue('#difficulty-select', 'easy');
  assert(await cdp.evaluate('Number(document.querySelector("#session-label.stage-label").dataset.stageCount) === 3 && !!document.querySelector("#quest-next")'), 'Easy difficulty starts with three-stage study practice');
  await cdp.setValue('#difficulty-select', 'challenge');
  assert(await cdp.evaluate('Number(document.querySelector("#session-label.stage-label").dataset.stageCount) === 2 && !!document.querySelector("#spell-input")'), 'Challenge difficulty starts directly with spelling and listening');
  await noOverflow(cdp, 390);
  assert(await cdp.evaluate('document.querySelector("#about-button").getBoundingClientRect().height >= 44'), 'The mobile source control remains an accessible touch target');
  await cdp.click('#about-button');
  assert(await cdp.evaluate('document.querySelector("#about-dialog").contains(document.querySelector("#clear-progress")) && document.querySelector("#clear-progress").getBoundingClientRect().height >= 44'), 'Local progress clearing remains an accessible action inside the source dialog');
  assert(await cdp.evaluate(`document.querySelector('#about-dialog').open && document.querySelector('#source-scope').innerText.includes(${JSON.stringify(vocabulary.book.scope)})`), 'Mobile source dialog shows the data coverage and version');
  await noOverflow(cdp, 320);
  await cdp.screenshot('mobile-320-source-dialog.png');
  await cdp.key('Escape', 'Escape', { windowsVirtualKeyCode: 27 });
  assert(await cdp.evaluate('!document.querySelector("#about-dialog").open'), 'Source dialog closes with keyboard Escape');

  const beforeClear = JSON.stringify(await records(cdp));
  const gameBeforeClear = await cdp.evaluate('localStorage.getItem("word-garden.game.v1")');
  await cdp.viewport(1440, 1000);
  cdp.dialogDecisions.push(false);
  await cdp.click('#clear-progress');
  assert(cdp.events.some((event) => event.method === 'Page.javascriptDialogOpening' && event.params.type === 'confirm'), 'Clearing progress requires an explicit confirmation');
  assert(JSON.stringify(await records(cdp)) === beforeClear, 'Canceling clear preserves all progress');
  assert(await cdp.evaluate('localStorage.getItem("word-garden.game.v1")') === gameBeforeClear, 'Canceling clear also preserves stars and completed levels');
  await cdp.viewport(390);
  cdp.dialogDecisions.push(true);
  await cdp.click('#clear-progress');
  assert(Object.keys(await records(cdp)).length === 0, 'Confirming clear removes only local word progress');
  assert(await cdp.evaluate('localStorage.getItem("word-garden.game.v1") === null'), 'Confirming clear removes local stars and completed levels');
  await cdp.reload();
  assert(Object.keys(await records(cdp)).length === 0, 'Cleared progress remains empty after refresh');
  await cdp.evaluate('document.querySelector("#unit-select").focus()');
  await cdp.key('Tab', 'Tab', { windowsVirtualKeyCode: 9 });
  assert(await cdp.evaluate('document.activeElement !== document.body && document.activeElement.id !== "unit-select"'), 'Keyboard Tab moves to the next accessible control');

  const legacyRecord = {
    lastReviewed: fixedTime - 86_400_000,
    dueAt: fixedTime,
    intervalDays: 1,
    streak: 1,
    reviews: 2,
    wrongCount: 1,
    mistake: true,
  };
  const legacyPayload = JSON.stringify({ version: 1, records: { [firstWord.id]: legacyRecord } });
  const legacyGame = JSON.stringify({ version: 1, stars: 9, completedLevels: [`${firstUnit.id}:0`] });
  await cdp.evaluate(`(() => {
    localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(legacyPayload)});
    localStorage.setItem('word-garden.game.v1', ${JSON.stringify(legacyGame)});
  })()`);
  await cdp.reload();
  assert(await cdp.evaluate(`localStorage.getItem(${JSON.stringify(storageKey)}) === ${JSON.stringify(legacyPayload)} && localStorage.getItem('word-garden.game.v1') === ${JSON.stringify(legacyGame)}`), 'Opening the redesigned UI preserves previous-version progress, stars and completed levels byte for byte');
  assert(JSON.stringify(await records(cdp)) === JSON.stringify({ [firstWord.id]: legacyRecord }), 'Previous-version word records are loaded without losing their schedule or mistake flag');
  await cdp.click('[data-view=due]');
  assert(await cdp.evaluate(`!!document.querySelector('#start-review') && document.querySelector('#due-content').innerText.includes(${JSON.stringify(firstWord.english)})`), 'Previous-version due words remain visible after the UI change');
  await cdp.click('[data-view=mistakes]');
  assert(await cdp.evaluate(`!!document.querySelector('#start-mistakes') && document.querySelector('#mistakes-content').innerText.includes(${JSON.stringify(firstWord.english)})`), 'Previous-version mistake words remain available after the UI change');
  await cdp.reload();
  assert(await cdp.evaluate(`localStorage.getItem(${JSON.stringify(storageKey)}) === ${JSON.stringify(legacyPayload)} && localStorage.getItem('word-garden.game.v1') === ${JSON.stringify(legacyGame)}`), 'Refreshing the redesigned UI keeps all previous-version local data intact');

  const damagedPayload = JSON.stringify({ version: 1, records: { 'damaged-word': {} } });
  const seedGame = JSON.stringify({ version: 1, stars: 7, completedLevels: [] });
  await cdp.evaluate(`(() => {
    localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(damagedPayload)});
    localStorage.setItem('word-garden.game.v1', ${JSON.stringify(seedGame)});
  })()`);
  await cdp.reload();
  assert(await cdp.evaluate('!document.querySelector("#storage-notice").hidden && document.querySelector("#storage-notice").innerText.includes("损坏")'), 'Damaged stored progress is reported without automatic clearing');
  await cdp.click('[data-mode=spell]');
  await cdp.setValue('#spell-input', firstWord.english);
  await cdp.click('#check-answer');
  assert(await cdp.evaluate(`localStorage.getItem(${JSON.stringify(storageKey)}) === ${JSON.stringify(damagedPayload)}`), 'A successful answer does not overwrite damaged progress');
  assert(await cdp.evaluate(`localStorage.getItem('word-garden.game.v1') === ${JSON.stringify(seedGame)}`), 'A successful answer with failed progress saving does not persist a new star');
  assert(await cdp.evaluate('document.querySelector("#stars-summary").innerText.includes("7") && !document.querySelector(".feedback").innerText.includes("获得1颗")'), 'Failed progress saving does not display an earned-star reward');
  await assertFocus(cdp, '#next-button', 'Even a save failure preserves keyboard focus on continue');
  await noOverflow(cdp, 390);
  await cdp.screenshot('mobile-390-storage-error.png');
  await cdp.reload();
  assert(await cdp.evaluate(`localStorage.getItem(${JSON.stringify(storageKey)}) === ${JSON.stringify(damagedPayload)} && localStorage.getItem('word-garden.game.v1') === ${JSON.stringify(seedGame)}`), 'Refresh preserves the original damaged data and unchanged reward state');
}

await mkdir(evidence, { recursive: true });
let browser;
try {
  browser = await launch();
  await runChecks(browser.cdp);
  const errors = browser.cdp.events.filter((event) => event.method === 'Runtime.exceptionThrown');
  assert(errors.length === 0, 'No uncaught browser exceptions', errors.length);
  await writeFile(path.join(evidence, 'browser-test-results.json'), JSON.stringify({ baseUrl, checks }, null, 2));
  console.log(`PASS: ${checks.length} browser checks. Evidence: ${evidence}`);
} catch (error) {
  await writeFile(path.join(evidence, 'browser-test-results.json'), JSON.stringify({ baseUrl, checks, error: error.message }, null, 2));
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (browser) {
    try { browser.socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); } catch {}
    await sleep(150);
    browser.socket.close();
    browser.child.kill();
    // Only this runner's isolated, known profile may be removed.
    const expectedProfile = path.resolve(evidence, 'chrome-test-profile');
    if (path.resolve(browser.profile) !== expectedProfile || !expectedProfile.startsWith(path.resolve(project) + path.sep)) {
      throw new Error('Refusing to remove an unexpected browser profile path');
    }
    await rm(expectedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
