import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(project, 'evidence');
const baseUrl = process.env.TEST_URL || 'http://127.0.0.1:4173';
const chromePath = process.env.CHROME_PATH || '/usr/bin/chromium';
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
    await this.waitFor('document.readyState === "complete" && !!document.querySelector("#navigation .nav-button")');
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
  const profile = path.join(evidence, 'chrome-test-profile-' + Date.now());
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


export { CDP, launch, evidence, baseUrl, sleep };
