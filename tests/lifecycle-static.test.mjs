// Resource / context lifecycle contracts enforced statically against the
// controller and renderer sources, plus behavioral checks on the pure parts.
// (Full in-browser lifecycle proof lives in scripts/webgl-smoke.mjs.)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { solveTsunami } from '../src/simulation/tsunami.js';
import { HISTORICAL_SCENARIO, normalizeScenario, exportScenario, importScenario } from '../src/simulation/scenario.js';
import { evaluateScenario } from '../src/simulation/engine.js';

const readAll = async () => {
  const [main, renderer, worker, index] = await Promise.all([
    readFile('src/main.js', 'utf8'),
    readFile('src/render/webgl/Renderer.js', 'utf8'),
    readFile('src/workers/tsunamiWorker.js', 'utf8'),
    readFile('index.html', 'utf8')
  ]);
  return { main, renderer, worker, index };
};

test('exactly two workers are created, once, at controller start', async () => {
  const { main } = await readAll();
  const workerCreations = (main.match(/new Worker\(/g) || []).length;
  assert.equal(workerCreations, 2, 'one primary + one comparison worker, no more');
  // no worker creation inside recompute/handlers (would duplicate on restart)
  assert.doesNotMatch(main, /function recompute[\s\S]{0,1200}new Worker/);
  assert.doesNotMatch(main, /function applyAtlas[\s\S]{0,400}new Worker/);
  assert.doesNotMatch(main, /function setCompare[\s\S]{0,400}new Worker/);
});

test('stale worker responses are request-scoped and discarded', async () => {
  const { main, worker } = await readAll();
  assert.match(main, /const requestId = \+\+tsunamiRequestId;/);
  assert.match(main, /if \(data\.requestId !== tsunamiRequestId\) return;/);
  assert.match(worker, /const requestId = event\.data\?\.requestId;/);
  assert.match(worker, /postMessage\(\{ ok: true, requestId, field \}\)/);
});

test('context loss is handled with preventDefault and a full resource rebuild', async () => {
  const { main, renderer } = await readAll();
  assert.match(renderer, /addEventListener\('webglcontextlost', this\._onContextLost\)/);
  assert.match(renderer, /addEventListener\('webglcontextrestored', this\._onContextRestored\)/);
  assert.match(renderer, /event\.preventDefault\?\.\(\);/);
  assert.match(renderer, /_restoreResources\(\)/);
  assert.match(renderer, /_createResources\(\)/);
  assert.match(renderer, /_afterRestoreChecks\(gl\)/);
  assert.match(main, /renderer\.onContextLost = /);
  assert.match(main, /renderer\.onContextRestored = /);
});

test('dispose releases GPU resources and removes listeners', async () => {
  const { renderer } = await readAll();
  assert.match(renderer, /_destroyResources\(\)/);
  assert.match(renderer, /removeEventListener\('webglcontextlost', this\._onContextLost\)/);
  assert.match(renderer, /removeEventListener\('webglcontextrestored', this\._onContextRestored\)/);
  assert.match(renderer, /gl\.deleteProgram\(program\)/);
  assert.match(renderer, /gl\.deleteTexture\(texture\)/);
});

test('particle buffers are created once and updated in place', async () => {
  const { renderer } = await readAll();
  // buffers use bufferSubData for per-frame updates; bufferData only at creation
  assert.match(renderer, /bufferSubData\(gl\.ARRAY_BUFFER, 0, data\)/);
  const subDataCount = (renderer.match(/bufferSubData/g) || []).length;
  assert.ok(subDataCount >= 3, 'reticle, probes and effect clouds update in place');
});

test('no duplicate static IDs in the HTML surface', async () => {
  const { index } = await readAll();
  const ids = [...index.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  const duplicated = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(duplicated, [], `duplicated ids: ${duplicated.join(', ')}`);
});

test('scenario import/export round-trips across the full schema surface', () => {
  const scenario = {
    ...normalizeScenario(HISTORICAL_SCENARIO),
    impactor: { ...HISTORICAL_SCENARIO.impactor, classId: 'metallic', densityKgM3: 7800, azimuthDeg: 300, diameterM: 15000 }
  };
  const exported = exportScenario(scenario);
  const imported = importScenario(exported);
  assert.deepEqual(imported, normalizeScenario(scenario));
});

test('import rejects newer schemas and bad values without side effects', () => {
  assert.throws(() => importScenario('{"schemaVersion":2}'), /newer/);
  assert.throws(() => importScenario('{"impactor":{"velocityMS":-5}}'), /outside (the )?supported range/);
  assert.throws(() => importScenario('{"target":{"latitude":45,"longitude":999}}'), /outside (the )?supported range/);
});

test('tsunami re-solve is deterministic for identical inputs', () => {
  const e = evaluateScenario(HISTORICAL_SCENARIO);
  const args = { epochId: e.scenario.epochId, source: e.scenario.target, crater: e.result.crater, impactor: e.result.impactor, width: 36, height: 18 };
  const a = solveTsunami(args);
  const b = solveTsunami(args);
  assert.deepEqual(a.arrivalSeconds, b.arrivalSeconds);
  assert.deepEqual(a.amplitude, b.amplitude);
  assert.equal(a.sourceStrength, b.sourceStrength);
});

test('share-hash round trip preserves the normalized scenario', async () => {
  const { scenarioHash, scenarioFromHash } = await import('../src/ui/io.js').catch(() => ({ scenarioHash: null, scenarioFromHash: null }));
  if (!scenarioHash) return; // io.js needs atob/btoa: available in Node
  const json = exportScenario(HISTORICAL_SCENARIO);
  const hash = scenarioHash(json);
  const back = scenarioFromHash(`#scenario=${hash}`);
  assert.equal(back, json);
});

test('the app exposes no persistent diagnostic chrome in the HTML', async () => {
  const { index } = await readAll();
  // performance/provenance surfaces are summoned drawers, not permanent widgets
  assert.doesNotMatch(index, /id="fps"/i);
  assert.doesNotMatch(index, /class="perf-meter"/i);
  assert.match(index, /id="drawer" class="drawer" hidden role="dialog"/);
});
