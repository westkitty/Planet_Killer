// Deterministic catastrophe framebuffer/checkpoint proof, executed in Node
// against the real renderer with a stub WebGL2 context.
//
// What this proves without a GPU:
//   - the renderer boots and every phase renders with no GL error;
//   - projection matrices stay finite at every checkpoint;
//   - each phase's major render contributions are present (and terminated
//     systems are absent) in the per-frame draw log;
//   - the deterministic timeline state is associated with each checkpoint;
//   - the synthesized framebuffer is non-empty, non-uniform, and its luminance
//     actually changes across modeled phases (contact flash brighter than
//     approach, impact winter darker than approach);
//   - scenario fingerprints are identical across repeated runs.
//
// What it does NOT prove (recorded in docs/VALIDATION.md): real GPU pixel
// output, shader visual quality, or device FPS — those require the browser
// smoke path (scripts/webgl-smoke.mjs).

import test from 'node:test';
import assert from 'node:assert/strict';
import { createStubGL, GL_NO_ERROR } from './helpers/gl-stub.mjs';
import { Renderer } from '../src/render/webgl/Renderer.js';
import { HISTORICAL_SCENARIO, normalizeScenario, PRESETS } from '../src/simulation/scenario.js';
import { evaluateScenario } from '../src/simulation/engine.js';
import { visualStateAtTime } from '../src/simulation/timeline.js';
import { solveTsunami } from '../src/simulation/tsunami.js';
import { runPhaseCheckpoints, PHASE_CHECKPOINTS, framebufferStats } from '../src/render/webgl/checkpoints.js';

function buildRenderer() {
  const { gl, canvas } = createStubGL({ width: 800, height: 600 });
  const renderer = new Renderer(canvas);
  return { gl, canvas, renderer };
}

function seekAndRender(renderer, gl) {
  return (checkpoint) => {
    renderer.setTime(checkpoint.time, visualStateAtTime(checkpoint.time));
    renderer.render();
    const rgba = new Uint8Array(64 * 64 * 4);
    gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    return { rgba, width: 64, height: 64 };
  };
}

test('checkpoint set covers the required representative phases', () => {
  const ids = PHASE_CHECKPOINTS.map(c => c.id);
  assert.ok(ids.includes('approach'), 'approach');
  assert.ok(ids.includes('contact'), 'contact/initial impact');
  assert.ok(ids.includes('ejecta'), 'ejecta/plume');
  assert.ok(ids.includes('tsunami'), 'tsunami');
  assert.ok(ids.includes('winter'), 'winter/late atmospheric');
});

test('ocean target: full checkpoint sequence passes with framebuffer evidence', async () => {
  const { gl, renderer } = buildRenderer();
  const scenario = normalizeScenario(HISTORICAL_SCENARIO);
  renderer.setEvaluation(evaluateScenario(scenario));
  const field = solveTsunami({ epochId: scenario.epochId, source: scenario.target, crater: evaluateScenario(scenario).result.crater, impactor: evaluateScenario(scenario).result.impactor, width: 36, height: 18 });
  assert.equal(field.applicable, true, 'historical target is an ocean target');
  renderer.setTsunamiField(field);

  const results = await runPhaseCheckpoints(renderer, {
    scenario,
    seekAndRender: seekAndRender(renderer, gl),
    tsunamiFieldFor: () => field
  });
  const failed = results.filter(r => !r.ok);
  assert.equal(failed.length, 0, failed.map(f => `${f.id}: ${f.checks.filter(c => !c.pass && !c.skipped).map(c => `${c.name} (${c.detail})`).join('; ')}`).join(' | '));

  // Every non-skipped phase checkpoint must carry a scenario fingerprint
  // (the phase-spread summary row is an aggregate, not a phase checkpoint).
  for (const r of results) {
    if (r.time != null && !r.skipped) assert.match(r.fingerprint, /^[0-9a-f]{8}$/);
  }
  // The tsunami checkpoint must have active tsunami mix on the surface draw.
  const tsunamiResult = results.find(r => r.id === 'tsunami');
  assert.ok(tsunamiResult.checks.some(c => c.name === 'tsunami-mix-active' && c.pass));
  // Framebuffer statistics were attached and sane.
  const withStats = results.filter(r => r.checks?.some(c => c.stats));
  assert.ok(withStats.length >= 5);
  for (const r of withStats) {
    const stats = r.checks.find(c => c.stats).stats;
    assert.ok(stats.meanLuminance > 0.005 && stats.stdDev > 0.002, `${r.id} stats sane`);
  }
});

test('land target: tsunami checkpoint is honestly skipped, others pass', async () => {
  const { gl, renderer } = buildRenderer();
  const scenario = normalizeScenario(PRESETS.crystalline);
  renderer.setEvaluation(evaluateScenario(scenario));
  const field = solveTsunami({ epochId: scenario.epochId, source: scenario.target, crater: evaluateScenario(scenario).result.crater, impactor: evaluateScenario(scenario).result.impactor, width: 36, height: 18 });
  assert.equal(field.applicable, false, 'crystalline preset is a land target');
  renderer.setTsunamiField(field);

  const results = await runPhaseCheckpoints(renderer, {
    scenario,
    seekAndRender: seekAndRender(renderer, gl),
    tsunamiFieldFor: () => field
  });
  const failed = results.filter(r => !r.ok);
  assert.equal(failed.length, 0, failed.map(f => f.id).join(','));
  const tsunamiResult = results.find(r => r.id === 'tsunami');
  assert.equal(tsunamiResult.skipped, true);
});

test('rewind determinism: seeking back and forth reproduces identical state', async () => {
  const { gl, renderer } = buildRenderer();
  const scenario = normalizeScenario(HISTORICAL_SCENARIO);
  renderer.setEvaluation(evaluateScenario(scenario));
  const seek = seekAndRender(renderer, gl);

  const run = async (time) => {
    renderer.setTime(time, visualStateAtTime(time));
    renderer.render();
    return {
      visual: { ...renderer.visual },
      fingerprint: undefined,
      drawStats: { ...renderer.drawStats }
    };
  };
  const a1 = await run(7200);
  const mid = await run(1e7);
  const a2 = await run(7200);
  assert.deepEqual(a1.visual, a2.visual, 'rewind reconstructs identical visual state');
  assert.deepEqual(a1.drawStats.drawCalls, a2.drawStats.drawCalls, 'draw call count identical on rewind');
  assert.ok(mid.visual.time > a1.visual.time);
});

test('no NaN/Infinity leaks into projection at extreme times', () => {
  const { renderer } = buildRenderer();
  renderer.setEvaluation(evaluateScenario(HISTORICAL_SCENARIO));
  for (const t of [-60, -0.0001, 0, 1e-6, 1, 1e6, 3.15576e9, 3.15576e10]) {
    renderer.setTime(t, visualStateAtTime(t));
    const { allFinite } = renderer.projectionState();
    assert.ok(allFinite, `time ${t} produces finite projection`);
    renderer.render();
    assert.equal(renderer.drawStats.lastGLError, 'none', `time ${t} renders without GL error`);
  }
});

test('injected GL error is reported, not swallowed', () => {
  const { gl, renderer } = buildRenderer();
  renderer.setEvaluation(evaluateScenario(HISTORICAL_SCENARIO));
  renderer.setTime(10, visualStateAtTime(10));
  renderer.render();
  gl.injectError(0x0502); // GL_INVALID_OPERATION
  renderer.render();
  assert.notEqual(renderer.drawStats.lastGLError, 'none');
});

test('context loss/restore rebuilds identical resources with no leak', () => {
  const { gl, canvas, renderer } = buildRenderer();
  renderer.setEvaluation(evaluateScenario(HISTORICAL_SCENARIO));
  renderer.render();
  const liveBefore = gl.liveResources();
  assert.equal(liveBefore.programs, 5);

  canvas.dispatchEvent('webglcontextlost');
  assert.equal(renderer.lifecycle.contextLost, true);
  assert.equal(renderer.lifecycle.losses, 1);

  canvas.dispatchEvent('webglcontextrestored');
  assert.equal(renderer.lifecycle.contextLost, false);
  assert.equal(renderer.lifecycle.restorations, 1);
  assert.deepEqual(gl.liveResources(), liveBefore, 'live resource counts are flat across the cycle');

  // The restored renderer must render cleanly and keep the same budgets.
  renderer.setTime(90, visualStateAtTime(90));
  renderer.render();
  assert.equal(renderer.drawStats.lastGLError, 'none');
  assert.ok(renderer.drawStats.drawCalls >= 5);
});

test('repeated restarts do not accumulate GPU objects or duplicate state', () => {
  const { gl, canvas, renderer } = buildRenderer();
  const scenario = normalizeScenario(HISTORICAL_SCENARIO);
  const baseline = gl.liveResources();
  for (let i = 0; i < 12; i++) {
    renderer.setEvaluation(evaluateScenario(scenario));
    renderer.setTime(-30, visualStateAtTime(-30));
    renderer.render();
    renderer.setTime(86400, visualStateAtTime(86400));
    renderer.render();
  }
  assert.deepEqual(gl.liveResources(), baseline, 'no allocations accumulate across repeated runs');
  assert.equal(gl.getError(), GL_NO_ERROR);
});

test('epoch switch rewrites the surface texture without leaking textures', () => {
  const { gl, renderer } = buildRenderer();
  renderer.setEvaluation(evaluateScenario(HISTORICAL_SCENARIO));
  const before = gl.liveResources().textures;
  renderer.setEpoch('modern');
  renderer.setEpoch('cretaceous66');
  renderer.setEpoch('modern');
  renderer.render();
  assert.equal(gl.liveResources().textures, before, 'epoch texture updates reuse storage');
});

test('framebuffer is non-empty and non-uniform at a representative frame', () => {
  const { gl, renderer } = buildRenderer();
  renderer.setEvaluation(evaluateScenario(HISTORICAL_SCENARIO));
  renderer.setTime(-12, visualStateAtTime(-12));
  renderer.render();
  const rgba = new Uint8Array(64 * 64 * 4);
  gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
  const stats = framebufferStats(rgba, 64, 64);
  assert.ok(stats.meanLuminance > 0.005, `mean ${stats.meanLuminance}`);
  assert.ok(stats.stdDev > 0.002, `std ${stats.stdDev}`);
});

test('contact flash and winter darkness shift the frame measurably', () => {
  const { gl, renderer } = buildRenderer();
  renderer.setEvaluation(evaluateScenario(HISTORICAL_SCENARIO));
  const read = () => {
    const rgba = new Uint8Array(32 * 32 * 4);
    gl.readPixels(0, 0, 32, 32, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    return framebufferStats(rgba, 32, 32).meanLuminance;
  };
  renderer.setTime(-12, visualStateAtTime(-12)); renderer.render();
  const approach = read();
  renderer.setTime(1.2, visualStateAtTime(1.2)); renderer.render();
  const contact = read();
  renderer.setTime(31557600, visualStateAtTime(31557600)); renderer.render();
  const winter = read();
  assert.ok(contact > approach, `flash raises luminance: ${contact} > ${approach}`);
  assert.ok(winter < approach, `winter darkens the frame: ${winter} < ${approach}`);
});

test('probe points appear in the draw log only when probes exist', () => {
  const { gl, renderer } = buildRenderer();
  renderer.setEvaluation(evaluateScenario(HISTORICAL_SCENARIO));
  renderer.setProbes([]);
  renderer.setTime(-12, visualStateAtTime(-12));
  renderer.render();
  assert.ok(!renderer.drawLog.some(e => e.system === 'probes'));
  renderer.setProbes([{ longitude: -70, latitude: 25 }]);
  renderer.render();
  assert.ok(renderer.drawLog.some(e => e.system === 'probes' && e.count === 1));
});
