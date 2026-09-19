#!/usr/bin/env node
// Performance evidence collector for Planet Killer.
//
// Raw measurements only — no universal FPS claims, and no thresholds except
// those this project measured (see docs/PERFORMANCE.md). The report records,
// per scenario, frame time, render time, draw calls, primitives, worker
// latency, Atlas apply cost, context loss/restoration counts, and GPU resource
// counts. Scenarios cover the spec's matrix: idle, impact playback, peak plume,
// tsunami, Atlas, and synchronized comparison — plus a context restore cycle.
//
// Like the smoke harness, it needs a real browser; without one it records the
// exact external blocker (exit 3) instead of fabricating numbers.
//   0 = report captured   1 = proof error (app defect)   2 = harness error   3 = browser blocked

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const PORT = Number(process.env.PERF_PORT || 4178);
const STEP_TIMEOUT_MS = Number(process.env.PERF_STEP_TIMEOUT || 20000);

const report = {
  tool: 'planet-killer-perf-report',
  version: 1,
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: `${process.platform} ${process.arch}`,
  outcome: 'pending',
  classification: null,
  browser: null,
  environment: {},
  scenarios: [],
  notes: [
    'Raw measurements only. No universal FPS target is asserted.',
    'Thresholds, where present, come from project-measured evidence (docs/PERFORMANCE.md).',
    'Capture host/browser and GPU (SwiftShader when headless) are part of the evidence.'
  ]
};

function withTimeout(promise, ms, label) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout: ${label} exceeded ${ms}ms`)), ms))]);
}

function candidateBrowsers() {
  const env = process.env.CHROME_PATH || process.env.GOOGLE_CHROME || process.env.CHROMIUM_PATH;
  const out = [];
  if (env) out.push({ source: 'env', path: env });
  for (const c of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/google/chrome/chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe']) if (existsSync(c)) out.push({ source: 'well-known', path: c });
  return out;
}

async function resolveBrowser() {
  const candidates = candidateBrowsers();
  report.environment.browserCandidates = candidates;
  if (!candidates.length) return { ok: false, classification: 'no-browser-executable-found', detail: 'no CHROME_PATH env and no well-known browser executable present' };
  let chromium;
  try { ({ chromium } = await import('playwright-core')); }
  catch {
    try { ({ chromium } = await import(resolve(root, 'tools/webgl-smoke/node_modules/playwright-core/index.mjs'))); }
    catch (err) { return { ok: false, classification: 'playwright-core-missing', detail: String(err?.message || err).slice(0, 200) }; }
  }
  for (const cand of candidates) {
    try {
      const browser = await chromium.launch({ executablePath: cand.path, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-color-profile=srgb'] });
      report.browser = { path: cand.path, source: cand.source, version: await browser.version() };
      return { ok: true, browser };
    } catch (err) {
      (report.environment.launchFailures ||= []).push({ path: cand.path, error: String(err?.message || err).slice(0, 300) });
    }
  }
  return { ok: false, classification: 'browser-launch-failed', detail: (report.environment.launchFailures || []).map(f => `${f.path}: ${f.error}`).join(' | ') };
}

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
  return new Promise((rp, rj) => { server.once('error', rj); server.listen(PORT, '127.0.0.1', () => rp(server)); });
}

const sleep = ms => page.evaluate(t => new Promise(r => setTimeout(r, t)), ms);
const raf = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
let page;

async function captureScenario(name, { settleMs = 2500, prepare = null, extra = {} } = {}) {
  if (prepare) await prepare();
  await page.evaluate(() => window.__planetKillerSmoke.clearPerf());
  await sleep(settleMs);
  const st = await page.evaluate(() => window.__planetKillerSmoke.state());
  await page.evaluate(([nm, ex]) => window.__planetKillerSmoke.recordSymbol(nm, ex), [name, extra]);
  const sym = (await page.evaluate(() => window.__planetKillerSmoke.symbols())).at(-1);
  const entry = {
    name,
    frameSeconds: sym.frameSeconds, renderSeconds: sym.renderSeconds, medianFps: sym.medianFps,
    workerMs: sym.workerMs, atlasApplyMs: sym.atlasApplyMs,
    drawCalls: st.drawStats.drawCalls, triangles: st.drawStats.trianglesDrawn, points: st.drawStats.pointsDrawn,
    resources: st.resources, contextLosses: st.lifecycle.losses, contextRestorations: st.lifecycle.restorations,
    ...extra
  };
  report.scenarios.push(entry);
  console.log(`  captured ${name}: fps=${entry.medianFps} drawCalls=${entry.drawCalls} tris=${entry.triangles}`);
  return entry;
}

async function main() {
  const server = await startServer();
  let resolved = { ok: false, browser: null };
  try {
    console.log('[perf] static server on 127.0.0.1:' + PORT);
    resolved = await resolveBrowser();
    if (!resolved.ok) {
      report.outcome = 'browser-blocked'; report.classification = resolved.classification;
      report.blocker = { reason: 'external-browser-runtime', detail: resolved.detail, environment: report.environment };
      console.error(`\n[perf] EXTERNAL BROWSER BLOCKER [${resolved.classification}]: ${resolved.detail}`);
      return 3;
    }
    const context = await resolved.browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e?.message || e)));
    await withTimeout(page.goto(`http://127.0.0.1:${PORT}/?smoke=1`, { waitUntil: 'load' }), 30000, 'navigate');
    await withTimeout(page.waitForFunction(() => Boolean(window.__pkBootReady || window.__pkBootError), null, { timeout: 30000, polling: 100 }), 35000, 'boot');
    const boot = await page.evaluate(() => ({ ready: Boolean(window.__pkBootReady), error: window.__pkBootError || null }));
    if (!boot.ready) { report.outcome = 'fail'; report.classification = 'app-boot-failure'; report.error = String(boot.error); return 1; }

    // idle
    await page.evaluate(() => { window.__planetKillerSmoke.seek(-12); });
    await captureScenario('idle', { settleMs: 3000 });

    // impact playback
    await page.evaluate(() => window.__planetKillerSmoke.launch());
    await captureScenario('impact-playback', { settleMs: 6000 });
    await page.evaluate(() => window.__planetKillerSmoke.seek(-12));

    // peak plume (ejecta phase)
    await page.evaluate(() => window.__planetKillerSmoke.seek(90));
    await raf();
    await captureScenario('peak-plume', { settleMs: 2500 });

    // tsunami (ocean target; wait for the worker field)
    await page.evaluate(() => window.__planetKillerSmoke.applyAtlas('chicxulub-66ma'));
    await page.evaluate(() => window.__planetKillerSmoke.seek(86400));
    await page.waitForFunction(() => { const s = window.__planetKillerSmoke.state(); return s.tsunami.state === 'ready' || s.tsunami.state === 'unavailable' || s.tsunami.state === 'error'; }, null, { timeout: 15000, polling: 100 }).catch(() => {});
    const tsunamiState = await page.evaluate(() => window.__planetKillerSmoke.state().tsunami.state);
    await captureScenario('tsunami', { settleMs: 2000, extra: { tsunamiFieldState: tsunamiState } });

    // atlas
    await captureScenario('atlas', { settleMs: 1500, prepare: async () => { await page.evaluate(() => window.__planetKillerSmoke.openDrawer('atlas')); await raf(); } });
    await page.evaluate(() => window.__planetKillerSmoke.closeDrawer());

    // synchronized comparison
    await captureScenario('synchronized-comparison', { settleMs: 2500, prepare: async () => { await page.evaluate(() => { window.__planetKillerSmoke.setCompare('atlas:western-interior-seaway-66ma'); window.__planetKillerSmoke.holdComparison(true); }); await raf(); } });
    await page.evaluate(() => window.__planetKillerSmoke.holdComparison(false));

    // context loss/restore cycle, with resource accounting
    const before = await page.evaluate(() => window.__planetKillerSmoke.state().resources);
    await page.evaluate(() => window.__planetKillerSmoke.simulateContextLoss());
    await sleep(400);
    await page.evaluate(() => window.__planetKillerSmoke.simulateContextRestore());
    await sleep(400);
    await captureScenario('context-restore', { settleMs: 1500, extra: { resourcesBeforeLoss: before } });
    const after = await page.evaluate(() => window.__planetKillerSmoke.state().resources);
    report.scenarios.at(-1).resourcesAfterRestore = after;
    report.scenarios.at(-1).resourceDelta = {
      programs: (after?.programs ?? 0) - (before?.programs ?? 0),
      buffers: (after?.buffers ?? 0) - (before?.buffers ?? 0),
      textures: (after?.textures ?? 0) - (before?.textures ?? 0)
    };

    if (errors.length) { report.outcome = 'fail'; report.classification = 'runtime-js-exception'; report.error = errors.slice(0, 3).join(' | '); return 1; }
    report.outcome = 'captured'; report.classification = 'all-scenarios-captured';
    return 0;
  } catch (err) {
    report.outcome = 'harness-error'; report.classification = /timeout/i.test(String(err?.message || err)) ? 'harness-timeout' : 'harness-error';
    report.error = String(err?.stack || err);
    console.error(`\n[perf] HARNESS ERROR [${report.classification}] ${err?.message || err}`);
    return 2;
  } finally {
    try { if (page) await page.close(); } catch {}
    try { if (resolved.browser) await resolved.browser.close(); } catch {}
    server.close();
    const dir = resolve(root, 'docs', 'qa');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'perf-report.json'), JSON.stringify(report, null, 2));
    console.log(`\n[perf] report → docs/qa/perf-report.json  outcome=${report.outcome}`);
  }
}

main().then(code => process.exit(code)).catch(err => {
  report.outcome = 'harness-error'; report.classification = 'fatal'; report.error = String(err?.stack || err);
  mkdirSync(resolve(root, 'docs', 'qa'), { recursive: true });
  writeFileSync(resolve(root, 'docs', 'qa', 'perf-report.json'), JSON.stringify(report, null, 2));
  process.exit(2);
});
