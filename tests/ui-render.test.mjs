import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { RENDER_BUDGETS } from '../src/render/webgl/Renderer.js';
import { buildSurfacePixels, buildTsunamiPixels } from '../src/render/webgl/textures.js';

test('renderer preserves catastrophe effect budgets', () => {
  assert.deepEqual(RENDER_BUDGETS, { stars:2400, milkyWay:1500, solarSprite:1, ejecta:520, plume:360, vapor:300, entryWake:180, dust:640, probes:4, earthLatSegments:56, earthLonSegments:112 });
});

test('modern and 66 Ma surface textures are materially distinct', () => {
  const modern = buildSurfacePixels('modern', 48, 24).pixels;
  const ancient = buildSurfacePixels('cretaceous66', 48, 24).pixels;
  let differences = 0;
  for (let i = 0; i < modern.length; i += 4) if (modern[i] !== ancient[i] || modern[i + 3] !== ancient[i + 3]) differences++;
  assert.ok(differences > 48 * 24 * 0.2);
});

test('tsunami visual texture follows per-cell arrival time', () => {
  const field = { width:3, height:1, arrivalSeconds:[10,100,null], amplitude:[1,.5,0], ocean:[1,1,0] };
  const before = buildTsunamiPixels(field, 50).pixels;
  const after = buildTsunamiPixels(field, 150).pixels;
  assert.ok(before[0] > 0);
  assert.equal(before[4], 0);
  assert.ok(after[4] > 0);
  assert.equal(after[8], 0);
});

test('HTML and CSS preserve semantic transient chrome and Clean View', async () => {
  const html = await readFile('index.html','utf8'), css = await readFile('styles.css','utf8');
  for (const id of ['viewport','edge-controls','drawer','timeline','time-slider','chapter-select','speed-select','sr-summary']) assert.match(html, new RegExp(`id=["']${id}["']`));
  assert.match(html, /script type="module" src="\.\/src\/main\.js"/);
  assert.match(css, /body\.clean-view \.edge-controls/);
  assert.match(css, /\.timeline\{[^}]*opacity:0/);
  assert.match(css, /\.timeline\.revealed\{[^}]*opacity:1/);
});

test('controller exposes required comparison camera probe accessibility and handoff paths', async () => {
  const main = await readFile('src/main.js','utf8'), drawers = await readFile('src/ui/drawers.js','utf8');
  for (const term of ['holdComparison','new Worker','setCleanView','releaseDirector','smallTimeStep','adjustSpeed','renderer.orbitBy','renderer.dollyBy','scenarioFromHash','captureFrame','srSummary.textContent']) assert.ok(main.includes(term), term);
  for (const term of ['Hold <strong>B</strong>','A → B details','Thermal ${arrival','data-probe-add','data-auto-director','data-export','data-import','data-share']) assert.ok(drawers.includes(term), term);
});
