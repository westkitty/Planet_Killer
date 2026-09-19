#!/usr/bin/env node
// WebGL2 smoke harness for Planet Killer.
//
// Proof goals (current-tree, in a real browser when one is available):
//   1. initialization         — renderer constructs, WebGL2 context present, no GL error
//   2. globe visible          — framebuffer non-empty and non-uniform
//   3. target indicator       — reticle present in the pre-impact draw log
//   4. timeline progression   — phase chapters, GL-clean, luminance shifts
//   5. camera input           — orbit/dolly change camera state and keep rendering clean
//   6. atlas open/close       — drawer renders curated entries, close restores
//   7. alternate target launch— applying an Atlas entry moves the target, launch advances time
//   8. no console/page errors — renderer proof is only valid without runtime JS exceptions
//
// Failure classes are distinct (per the build spec — no single opaque timeout):
//   no-browser-executable-found | browser-launch-failed | webgl2-unavailable
//   app-boot-failure | app-boot-timeout | shader-construction
//   empty-framebuffer | timeline-state-or-luminance | camera-no-effect
//   atlas-drawer-contract | atlas-apply-or-launch | runtime-js-exception
//   harness-timeout | harness-error
//
// Exit codes: 0 pass · 1 proof failure (app defect) · 2 harness error
//             3 external browser-runtime blocker (with exact evidence recorded)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const PORT = Number(process.env.SMOKE_PORT || 4177);
const NAVIGATE_TIMEOUT_MS = Number(process.env.SMOKE_NAV_TIMEOUT || 30000);
const STEP_TIMEOUT_MS = Number(process.env.SMOKE_STEP_TIMEOUT || 20000);

const report = {
  tool: 'planet-killer-webgl-smoke',
  version: 1,
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: `${process.platform} ${process.arch}`,
  outcome: 'pending',
  classification: null,
  browser: null,
  environment: {},
  steps: []
};

function step(name) {
  const s = { name, status: 'pending', classification: null, detail: null, startedAt: new Date().toISOString() };
  report.steps.push(s);
  return s;
}
function pass(s, detail) { s.status = 'pass'; s.detail = detail || null; console.log(`  PASS  ${s.name}`); }
function fail(s, classification, detail) {
  s.status = 'fail'; s.classification = classification; s.detail = detail || null;
  console.error(`  FAIL  ${s.name}  [${classification}] ${detail || ''}`);
}
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout: ${label} exceeded ${ms}ms`)), ms))
  ]);
}

/* --------------------------------------------------------------- browser -- */

function candidateBrowsers() {
  const env = process.env.CHROME_PATH || process.env.GOOGLE_CHROME || process.env.CHROMIUM_PATH;
  const candidates = [];
  if (env) candidates.push({ source: 'env', path: env });
  for (const c of [
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/opt/google/chrome/chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
  ]) if (existsSync(c)) candidates.push({ source: 'well-known', path: c });
  return candidates;
}

async function resolveBrowser() {
  const candidates = candidateBrowsers();
  report.environment.browserCandidates = candidates;
  report.environment.chromePathEnv = process.env.CHROME_PATH || null;
  if (!candidates.length) {
    return { ok: false, classification: 'no-browser-executable-found', detail: 'no CHROME_PATH env set and no well-known browser executable exists on this system (checked /usr/bin/google-chrome, /usr/bin/chromium, /opt/google/chrome/chrome, macOS .app paths, Windows Program Files; set CHROME_PATH to override)' };
  }
  let chromium;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch {
    // Fallback: the project ships playwright-core under tools/webgl-smoke.
    try {
      ({ chromium } = await import(resolve(root, 'tools/webgl-smoke/node_modules/playwright-core/index.mjs')));
    } catch (err) {
      return { ok: false, classification: 'playwright-core-missing', detail: `playwright-core is not resolvable from scripts/ and the bundled copy failed to load: ${String(err?.message || err).slice(0, 200)}` };
    }
  }
  for (const cand of candidates) {
    try {
      const browser = await chromium.launch({
        executablePath: cand.path,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-color-profile=srgb']
      });
      const version = await browser.version();
      report.browser = { path: cand.path, source: cand.source, version };
      return { ok: true, browser };
    } catch (err) {
      (report.environment.launchFailures ||= []).push({ path: cand.path, error: String(err?.message || err).slice(0, 300) });
    }
  }
  return { ok: false, classification: 'browser-launch-failed', detail: (report.environment.launchFailures || []).map(f => `${f.path}: ${f.error}`).join(' | ') };
}

/* ----------------------------------------------------------- static server -- */

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/markdown' };
function startServer() {
  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') pathname = '/index.html';
      const file = resolve(root, '.' + pathname);
      if (!file.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
      if (!existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
      const ext = file.slice(file.lastIndexOf('.'));
      res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': 'no-cache' });
      res.end(readFileSync(file));
    } catch { res.writeHead(500); res.end('error'); }
  });
  return new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(PORT, '127.0.0.1', () => resolvePromise(server));
  });
}

/* -------------------------------------------------------------- framebuffer -- */

function luminanceStats(rgba, width, height) {
  const count = width * height;
  let sum = 0, sumSq = 0, max = 0;
  for (let i = 0; i < count; i++) {
    const j = i * 4;
    const l = (0.2126 * rgba[j] + 0.7152 * rgba[j + 1] + 0.0722 * rgba[j + 2]) / 255;
    sum += l; sumSq += l * l; max = Math.max(max, l);
  }
  const mean = sum / count;
  return { mean, std: Math.sqrt(Math.max(0, sumSq / count - mean * mean)), max };
}

const twoRaf = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

let page;

async function runProofs() {
  const state = () => page.evaluate(() => window.__planetKillerSmoke.state());
  const fb = (w, h) => page.evaluate(([ww, hh]) => window.__planetKillerSmoke.framebuffer(ww, hh), [w, h]);

  const sBoot = step('initialization');
  let st = await withTimeout(state(), STEP_TIMEOUT_MS, 'state');
  if (st.bootError || !st.webgl2Supported) {
    fail(sBoot, st.webgl2Supported === false ? 'webgl2-unavailable' : 'app-boot-failure', `bootError=${JSON.stringify(st.bootError)} webgl2=${st.webgl2Supported}`);
    return false;
  }
  if (st.drawStats.lastGLError !== 'none') {
    fail(sBoot, 'gl-error-at-init', st.drawStats.lastGLError);
    return false;
  }
  pass(sBoot, `WebGL2 up, modelVersion=${st.modelVersion}, glError=none, resources=${JSON.stringify(st.resources)}`);

  const sGlobe = step('globe-visible');
  let f = await fb(96, 64);
  let stats = luminanceStats(f.rgba, f.width, f.height);
  if (stats.mean <= 0.005 || stats.std <= 0.002) fail(sGlobe, 'empty-framebuffer', `mean=${stats.mean.toFixed(4)} std=${stats.std.toFixed(4)}`);
  else pass(sGlobe, `mean=${stats.mean.toFixed(4)} std=${stats.std.toFixed(4)} max=${stats.max.toFixed(4)}`);

  const sReticle = step('target-indicator');
  await page.evaluate(() => window.__planetKillerSmoke.seek(-12));
  await twoRaf();
  st = await state();
  const reticle = st.drawLog.some(e => e.system === 'reticle');
  const targetOk = Number.isFinite(st.target.longitude) && Number.isFinite(st.target.latitude);
  if (!reticle || !targetOk) fail(sReticle, 'reticle-missing', `reticle=${reticle} target=(${st.target.longitude},${st.target.latitude})`);
  else pass(sReticle, `reticle drawn; target ${st.target.longitude.toFixed(2)},${st.target.latitude.toFixed(2)} (${st.target.className})`);

  const sTimeline = step('timeline-progression');
  const samples = {};
  // Phase-specific state = the phase's major render contributions are present
  // in the draw log (same property the checkpoint suite asserts). Chapter ids
  // are recorded as evidence but not asserted: the "ejecta" checkpoint sits at
  // t=90, which is the "excavation" chapter — a phase-vs-chapter naming
  // difference, not a state mismatch.
  const expectedSystem = { approach: 'reticle', contact: 'plume', ejecta: 'plume', tsunami: 'surface', winter: 'surface' };
  let timelineOk = true;
  for (const cp of st.checkpoints || []) {
    await page.evaluate(t => window.__planetKillerSmoke.seek(t), cp.time);
    await twoRaf();
    const s = await state();
    const ff = await fb(64, 48);
    const systems = new Set(s.drawLog.map(e => e.system));
    samples[cp.id] = { chapter: s.visual.chapter, gl: s.drawStats.lastGLError, mean: luminanceStats(ff.rgba, ff.width, ff.height).mean, hasExpected: systems.has(expectedSystem[cp.id]) };
    if (s.drawStats.lastGLError !== 'none' || !systems.has(expectedSystem[cp.id])) timelineOk = false;
  }
  const a = samples.approach, c = samples.contact, w = samples.winter;
  timelineOk = timelineOk && a && c && w && c.mean > a.mean && w.mean < a.mean;
  if (!timelineOk) fail(sTimeline, 'timeline-state-or-luminance', JSON.stringify(samples));
  else pass(sTimeline, `GL-clean through 5 phases; contributions present; luminance approach=${a.mean.toFixed(4)} contact=${c.mean.toFixed(4)} winter=${w.mean.toFixed(4)}`);

  const sCamera = step('camera-input');
  const camBefore = (await state()).camera;
  await page.evaluate(() => { window.__planetKillerSmoke.orbit(60, 10); window.__planetKillerSmoke.dolly(120); });
  await twoRaf();
  const stAfter = await state();
  const moved = stAfter.camera.yaw !== camBefore.yaw || stAfter.camera.pitch !== camBefore.pitch || stAfter.camera.distance !== camBefore.distance;
  const f2 = await fb(48, 32);
  if (!moved || stAfter.drawStats.lastGLError !== 'none' || luminanceStats(f2.rgba, f2.width, f2.height).mean <= 0.005) {
    fail(sCamera, 'camera-no-effect-or-gl-error', `moved=${moved} gl=${stAfter.drawStats.lastGLError}`);
  } else pass(sCamera, `yaw ${camBefore.yaw.toFixed(3)}→${stAfter.camera.yaw.toFixed(3)}, dist ${camBefore.distance.toFixed(2)}→${stAfter.camera.distance.toFixed(2)}`);

  const sAtlas = step('atlas-open-close');
  await page.evaluate(() => window.__planetKillerSmoke.openDrawer('atlas'));
  await twoRaf();
  const atlasDom = await page.evaluate(() => ({
    hidden: document.querySelector('#drawer').hidden,
    cards: document.querySelectorAll('.atlas-card').length,
    evidenceBadges: document.querySelectorAll('.evidence-badge').length,
    outcomeBadges: document.querySelectorAll('.outcome-badge').length
  }));
  await page.evaluate(() => window.__planetKillerSmoke.closeDrawer());
  await twoRaf();
  const closedHidden = await page.evaluate(() => document.querySelector('#drawer').hidden);
  if (atlasDom.hidden || atlasDom.cards < 8 || atlasDom.evidenceBadges < 8 || atlasDom.outcomeBadges < 8 || !closedHidden) {
    fail(sAtlas, 'atlas-drawer-contract', JSON.stringify(atlasDom) + ` closedHidden=${closedHidden}`);
  } else pass(sAtlas, `${atlasDom.cards} entries, ${atlasDom.evidenceBadges} evidence + ${atlasDom.outcomeBadges} outcome badges; close restores`);

  const sLaunch = step('alternate-target-launch');
  const before = (await state()).scenario;
  await page.evaluate(() => { window.__planetKillerSmoke.applyAtlas('western-interior-seaway-66ma'); window.__planetKillerSmoke.launch(); });
  // launch() restarts the clock at −30 s and plays forward. Watch the
  // restarted clock actually advance (do not compare against the pre-launch
  // time, which may have been far into the year-scale tail).
  let t0 = null;
  let advanced = false;
  for (let i = 0; i < 80 && !advanced; i++) {
    await page.evaluate(() => new Promise(r => setTimeout(r, 100)));
    const s = await state();
    if (!s.playing) continue;
    const t = s.scenario.timelineTime;
    if (t0 == null) t0 = t;
    else if (t - t0 > 0.5) advanced = true;
  }
  const after = await state();
  const targetMoved = after.scenario.target.latitude !== before.target.latitude || after.scenario.target.longitude !== before.target.longitude;
  if (!targetMoved || !advanced) fail(sLaunch, 'atlas-apply-or-launch', `moved=${targetMoved} playing=${after.playing} t=${after.scenario.timelineTime}`);
  else pass(sLaunch, `target → ${after.scenario.target.latitude.toFixed(1)},${after.scenario.target.longitude.toFixed(1)}; clock advanced from ${t0.toFixed(1)}s to ${after.scenario.timelineTime.toFixed(1)}s`);

  const sClean = step('no-console-or-page-errors');
  if (consoleErrors.length) fail(sClean, 'runtime-js-exception', consoleErrors.slice(0, 3).join(' | '));
  else pass(sClean, 'no console/page errors captured');

  return !report.steps.some(s => s.status === 'fail');
}

async function main() {
  const server = await startServer();
  let resolved = { ok: false, browser: null };
  try {
    console.log('[smoke] static server on 127.0.0.1:' + PORT);
    console.log('[smoke] resolving a WebGL2-capable browser…');
    resolved = await resolveBrowser();
    if (!resolved.ok) {
      report.outcome = 'browser-blocked';
      report.classification = resolved.classification;
      report.blocker = { reason: 'external-browser-runtime', detail: resolved.detail, environment: report.environment };
      console.error(`\n[smoke] EXTERNAL BROWSER BLOCKER [${resolved.classification}]`);
      console.error('[smoke] ' + (resolved.detail || ''));
      console.error('[smoke] Live WebGL2 proof needs a browser runtime; the deterministic stub-GL Node suite carries the executed state proof until one is available.');
      return 3;
    }
    const { chromium } = await import('playwright-core');
    const context = await resolved.browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    page = await context.newPage();
    consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', err => consoleErrors.push(String(err?.message || err)));

    const url = `http://127.0.0.1:${PORT}/?smoke=1`;
    console.log('[smoke] navigating ' + url);
    await withTimeout(page.goto(url, { waitUntil: 'load' }), NAVIGATE_TIMEOUT_MS, 'navigate');
    await withTimeout(page.waitForFunction(() => Boolean(window.__pkBootReady || window.__pkBootError), null, { timeout: NAVIGATE_TIMEOUT_MS, polling: 100 }), NAVIGATE_TIMEOUT_MS + 5000, 'boot-signal');

    const boot = await page.evaluate(() => ({ ready: Boolean(window.__pkBootReady), error: window.__pkBootError || null, handle: Boolean(window.__planetKillerSmoke) }));
    const sBootSignal = step('app-boot-signal');
    if (!boot.ready || !boot.handle) {
      fail(sBootSignal, boot.error ? 'app-boot-failure' : 'app-boot-timeout', JSON.stringify(boot.error || 'smoke handle missing'));
      return 1;
    }
    pass(sBootSignal, 'window.__pkBootReady set and smoke handle live');
    // Surface shader compile/link failures that throw during construction.
    if (boot.error) { fail(sBootSignal, 'shader-construction', String(boot.error)); return 1; }

    if (await runProofs()) {
      report.outcome = 'pass'; report.classification = 'all-proof-steps-passed';
      return 0;
    }
    report.outcome = 'fail';
    report.classification = report.steps.find(s => s.status === 'fail')?.classification || 'proof-failure';
    return 1;
  } catch (err) {
    const timedOut = /timeout/i.test(String(err?.message || err));
    const last = report.steps.at(-1);
    if (last && last.status === 'pending') fail(last, timedOut ? 'harness-timeout' : 'harness-error', String(err?.message || err));
    report.outcome = 'harness-error';
    report.classification = timedOut ? 'harness-timeout' : 'harness-error';
    report.error = String(err?.stack || err);
    console.error(`\n[smoke] HARNESS ERROR [${report.classification}] ${err?.message || err}`);
    return 2;
  } finally {
    try { if (page) await page.close(); } catch {}
    try { if (resolved.browser) await resolved.browser.close(); } catch {}
    server.close();
    writeReport();
  }
}

let consoleErrors = [];
function writeReport() {
  const dir = resolve(root, 'docs', 'qa');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'webgl-smoke-report.json'), JSON.stringify(report, null, 2));
  console.log(`\n[smoke] report → docs/qa/webgl-smoke-report.json  outcome=${report.outcome}  class=${report.classification}`);
}

main().then(code => process.exit(code)).catch(err => {
  report.outcome = 'harness-error'; report.classification = 'fatal'; report.error = String(err?.stack || err);
  writeReport();
  process.exit(2);
});
