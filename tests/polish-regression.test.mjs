import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderDrawer } from '../src/ui/drawers.js';

const read = async () => {
  const [html, css, main, drawers, worker] = await Promise.all([
    readFile('index.html','utf8'), readFile('styles.css','utf8'), readFile('src/main.js','utf8'),
    readFile('src/ui/drawers.js','utf8'), readFile('src/workers/tsunamiWorker.js','utf8')
  ]);
  return { html, css, main, drawers, worker };
};

test('production polish contract contains exactly 25 inspectable UI UX improvements', async () => {
  const { html, css, main, drawers } = await read();
  const checks = [
    html.includes('id="onboarding" class="onboarding" role="dialog"') && main.includes('dismissOnboarding.focus'),
    html.includes('aria-controls="drawer" aria-expanded="false"') && main.includes("setAttribute('aria-expanded'") && css.includes('button[data-active]'),
    html.includes('id="drawer" class="drawer" hidden role="dialog"') && html.includes('aria-labelledby="drawer-title"'),
    main.includes('lastDrawerTrigger') && main.includes('restore.focus'),
    drawers.includes('class="drawer-header"') && /\.drawer-header\{[^}]*position:sticky/.test(css),
    main.includes('function updateRangeFeedback') && drawers.includes('data-field-output'),
    drawers.includes('aria-valuetext="${display}"') && main.includes("setAttribute('aria-valuetext'"),
    html.includes('id="phase-output"') && main.includes('phaseOutput.textContent'),
    main.includes("setProperty('--timeline-progress'") && css.includes('var(--timeline-progress)'),
    html.includes('aria-pressed="false" data-state="paused"') && main.includes("playPause.setAttribute('aria-pressed'"),
    main.includes("notify('Impact sequence launched.')") && css.includes('.edge-controls button.launching'),
    drawers.includes('data-compare-hold') && main.includes("closest('[data-compare-hold]')"),
    html.includes('id="interaction-status"') && html.includes('id="cancel-interaction"'),
    css.includes('#viewport[data-mode="probe"]{cursor:crosshair}'),
    drawers.includes('data-probe-remove="${index}"') && main.includes('button.dataset.probeRemove'),
    drawers.includes('function bookmarkButtons') && drawers.includes("${saved?'':'disabled'} aria-label=\"Recall camera bookmark"),
    main.includes('function setTransientChromeHidden') && main.includes('element.inert = hidden'),
    main.includes("const MOTION_KEY = 'planet-killer-motion'") && main.includes('localStorage.setItem(MOTION_KEY'),
    drawers.includes('id="scenario-import-status"') && drawers.includes('aria-invalid="true"'),
    main.includes('clearTimeout(toastTimer)'),
    main.includes('lastSummaryChapter') && main.includes('playing && sameChapter'),
    drawers.includes('class="badge async-status"') && main.includes("state: 'updating', label: 'Tsunami field updating'"),
    drawers.includes('class="shortcut-list"') && drawers.includes('<kbd>Space</kbd>'),
    /@media\(max-width:700px\)[\s\S]*\.edge-controls button\{width:44px;height:44px/.test(css) && css.includes('min-height:44px'),
    css.includes('grid-template-areas:') && css.includes('[data-time-action="forward"]{grid-area:forward;display:grid}') && css.includes('#chapter-select{grid-area:chapter;display:block') && css.includes('#speed-select{grid-area:speed;display:block')
  ];
  assert.equal(checks.length, 25);
  checks.forEach((value, index) => assert.equal(Boolean(value), true, `polish item ${index + 1}`));
});

test('stale tsunami responses and drawer shortcut leakage are regression guarded', async () => {
  const { main, worker } = await read();
  assert.match(main, /const requestId = \+\+tsunamiRequestId;[\s\S]*setTimeout\(\(\) => \{/);
  assert.match(main, /if \(data\.requestId !== tsunamiRequestId\) return;/);
  assert.match(worker, /const requestId = event\.data\?\.requestId;/);
  assert.match(worker, /postMessage\(\{ ok: true, requestId, field \}\)/);
  assert.match(main, /if \(event\.defaultPrevented\) return;/);
  assert.match(main, /if \(isTyping\(event\) && event\.key !== 'Escape'\) return;/);
  assert.match(main, /if \(event\.target\?\.tagName === 'BUTTON' && \(event\.code === 'Space' \|\| event\.key === 'Enter'\)\) return;/);
  assert.match(main, /function drawerFocusSelector\(element\)/);
  assert.match(main, /else element\.removeAttribute\('aria-hidden'\)/);
  assert.match(main, /const focusInChrome = edgeControls\.contains\(document\.activeElement\) \|\| timeline\.contains\(document\.activeElement\)/);
  assert.doesNotMatch(main, /pointerdown[\s\S]{0,240}event\.preventDefault\(\);[\s\S]{0,160}holdComparison\(true\)/);
});


test('hardening repair pass protects untrusted errors, clipboard truth, escape behavior and server boundaries', async () => {
  const settings = renderDrawer('settings', {
    scenario: {},
    evaluation: { result: {}, target: {} },
    importStatus: { tone: 'error', message: 'bad <img src=x onerror=alert(1)>' }
  });
  assert.doesNotMatch(settings, /<img\b/i);
  assert.match(settings, /&lt;img/);

  const [main, io, serve] = await Promise.all([
    readFile('src/main.js','utf8'),
    readFile('src/ui/io.js','utf8'),
    readFile('scripts/serve.mjs','utf8')
  ]);
  assert.match(main, /if \(isTyping\(event\) && event\.key !== 'Escape'\) return;/);
  assert.match(main, /window\.addEventListener\('keyup',[\s\S]*event\.key\.toLowerCase\(\) === 'b'[\s\S]*holdComparison\(false\)/);
  assert.match(io, /if \(!copied\) throw new Error\('Clipboard copy failed'\)/);
  assert.match(serve, /file!==root&&!file\.startsWith\(root\+sep\)/);
});
