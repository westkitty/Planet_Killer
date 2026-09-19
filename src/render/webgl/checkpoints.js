// Deterministic catastrophe framebuffer/checkpoint definitions.
//
// These are NOT cross-GPU pixel baselines. Each checkpoint asserts robust,
// project-appropriate properties at a representative modeled phase:
//   - the modeled visual state matches the deterministic timeline
//   - projection/view matrices contain no NaN or Infinity
//   - the frame ended with no GL error
//   - the phase's major render contributions are present in the draw log
//   - the framebuffer is non-empty and non-uniform (real readPixels in a
//     browser; the stub GL synthesizes the same statistics in Node tests)
//   - luminance actually varies across the modeled phases (contact flash vs
//     impact winter), so the sequence is not a static frame
//   - every checkpoint carries a deterministic scenario fingerprint
//
// Run twice with the same scenario and both runs must produce identical
// fingerprints and the same pass/fail pattern.

import { visualStateAtTime, chapterAtTime, CHAPTERS } from '../../simulation/timeline.js';
import { normalizeScenario } from '../../simulation/scenario.js';

const YEAR = 365.25 * 86400;

export const PHASE_CHECKPOINTS = Object.freeze([
  Object.freeze({ id: 'approach', label: 'Approach', time: -12, oceanOnly: false, expects: ['surface', 'atmosphere', 'stars', 'impactor', 'reticle'] }),
  Object.freeze({ id: 'contact', label: 'Contact / initial impact', time: 1.2, oceanOnly: false, expects: ['surface', 'atmosphere', 'ejecta', 'plume'] }),
  Object.freeze({ id: 'ejecta', label: 'Ejecta / plume phase', time: 90, oceanOnly: false, expects: ['ejecta', 'plume', 'vapor'], notExpects: ['reticle', 'impactor'] }),
  Object.freeze({ id: 'tsunami', label: 'Tsunami state', time: 86400, oceanOnly: true, expects: ['dust', 'surface'], notExpects: ['reticle'] }),
  Object.freeze({ id: 'winter', label: 'Impact winter / late atmosphere', time: YEAR, oceanOnly: false, expects: ['dust', 'surface'], notExpects: ['reticle'] })
]);

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Frame statistics from an RGBA buffer (real readPixels or the stub GL). */
export function framebufferStats(rgba, width, height) {
  const count = Math.max(1, width * height);
  let sum = 0, sumSq = 0, max = 0;
  const step = Math.max(1, Math.floor(count / 4096));
  let sampled = 0;
  for (let i = 0; i < count; i += step) {
    const j = i * 4;
    const l = luminance(rgba[j], rgba[j + 1], rgba[j + 2]) / 255;
    sum += l; sumSq += l * l; max = Math.max(max, l); sampled++;
  }
  const mean = sum / sampled;
  const variance = Math.max(0, sumSq / sampled - mean * mean);
  return { meanLuminance: mean, stdDev: Math.sqrt(variance), maxLuminance: max };
}

/**
 * Deterministic fingerprint for "this scenario at this modeled time": the
 * normalized scenario JSON plus the chapter id and time. Two runs of the same
 * scenario must produce the same fingerprint string.
 */
export function scenarioFingerprint(scenario, time) {
  const normalized = normalizeScenario(scenario);
  delete normalized.timelineTime;
  const payload = JSON.stringify(normalized) + '|' + time;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function drawSystems(drawLog = []) {
  const map = new Map();
  for (const entry of drawLog) {
    const existing = map.get(entry.system);
    if (!existing) map.set(entry.system, { ...entry });
    else {
      existing.count += entry.count;
      if (entry.intensity) existing.intensity = Math.max(existing.intensity || 0, entry.intensity);
    }
  }
  return map;
}

/**
 * Evaluate one checkpoint. `frame` is { rgba, width, height } read from the
 * actual drawing buffer after a render at this phase's time, or null (the
 * framebuffer checks are then reported as skipped, which the caller must treat
 * as weaker evidence — see the smoke harness and the stub GL tests).
 *
 * Returns { id, time, fingerprint, ok, checks: [{name, pass, detail, skipped}] }.
 */
export function evaluateCheckpoint(renderer, checkpoint, { scenario, frame = null, tsunamiField = null } = {}) {
  const time = checkpoint.time;
  const visual = visualStateAtTime(time);
  const checks = [];
  const check = (name, pass, detail = '', skipped = false) => checks.push({ name, pass, detail, skipped });

  // 1. Deterministic visual state association.
  const expectedChapter = chapterAtTime(time).id;
  const v = renderer.visual || {};
  check('visual-state-consistent',
    v.chapter === expectedChapter && Object.values(v).every(x => typeof x !== 'object' && (typeof x !== 'number' || Number.isFinite(x))),
    `chapter=${v.chapter} expected=${expectedChapter}`);

  // 2. No NaN/invalid matrices.
  const proj = renderer.projectionState?.() || { allFinite: false };
  check('matrices-finite', Boolean(proj.allFinite), proj.allFinite ? '' : 'non-finite view/projection value');

  // 3. No GL error from this frame.
  const glError = renderer.drawStats?.lastGLError ?? 'unknown';
  check('no-gl-error', glError === 'none', glError);

  // 4. Phase-specific major render contributions.
  const systems = drawSystems(renderer.drawLog);
  const missing = (checkpoint.expects || []).filter(s => !systems.has(s));
  const present = (checkpoint.notExpects || []).filter(s => systems.has(s));
  check('expected-contributions-present', missing.length === 0,
    missing.length ? `missing: ${missing.join(', ')}` : (checkpoint.expects || []).join(', '));
  check('phase-terminations-respected', present.length === 0,
    present.length ? `should not be drawn: ${present.join(', ')}` : '');
  if (checkpoint.id === 'tsunami' && tsunamiField?.applicable) {
    const surfaceDraw = systems.get('surface');
    check('tsunami-mix-active', Boolean(surfaceDraw && surfaceDraw.tsunamimix > 0),
      `uTsunamiMix=${surfaceDraw?.tsunamimix}`);
  }

  // 5. Framebuffer evidence (robust statistics, not pixel baselines).
  if (frame && frame.rgba && frame.width > 0 && frame.height > 0) {
    const stats = framebufferStats(frame.rgba, frame.width, frame.height);
    check('framebuffer-not-empty', stats.meanLuminance > 0.005, `mean=${stats.meanLuminance.toFixed(4)}`);
    check('framebuffer-non-uniform', stats.stdDev > 0.002, `std=${stats.stdDev.toFixed(4)}`);
    checks.push({ name: 'frame-luminance', pass: true, skipped: false, detail: `mean=${stats.meanLuminance.toFixed(4)} max=${stats.maxLuminance.toFixed(4)}`, stats });
  } else {
    check('framebuffer-not-empty', true, 'no framebuffer read available (weaker evidence)', true);
    check('framebuffer-non-uniform', true, 'no framebuffer read available (weaker evidence)', true);
  }

  const fingerprint = scenarioFingerprint(scenario, time);
  const ok = checks.every(c => c.pass || c.skipped);
  return { id: checkpoint.id, label: checkpoint.label, time, fingerprint, ok, checks };
}

/**
 * Run the full checkpoint sequence. `seekAndRender` must: set the renderer to
 * this time (with the deterministic visual state), run one render, and return
 * the framebuffer read { rgba, width, height } (or null). `tsunamiFieldFor`
 * returns the current tsunami field when applicable.
 */
export async function runPhaseCheckpoints(renderer, { scenario, seekAndRender, tsunamiFieldFor = () => null }) {
  const results = [];
  for (const checkpoint of PHASE_CHECKPOINTS) {
    if (checkpoint.oceanOnly) {
      // Tsunami state only applies to ocean targets; the caller's field check
      // keeps the checkpoint honest for land targets.
      const field = tsunamiFieldFor() ;
      if (!field?.applicable) {
        results.push({ ...checkpoint, ok: true, skipped: true, checks: [{ name: 'tsunami-not-applicable', pass: true, detail: 'land target: no tsunami field', skipped: true }] });
        continue;
      }
    }
    const frame = await seekAndRender(checkpoint);
    results.push(evaluateCheckpoint(renderer, checkpoint, { scenario, frame, tsunamiField: tsunamiFieldFor() }));
  }
  // 6. Phase-to-phase luminance spread: the catastrophe must visibly change
  // the frame (contact flash brighter than approach, winter darker than
  // approach) instead of redrawing the same picture.
  const withStats = results.filter(r => r.checks?.some(c => c.stats));
  if (withStats.length >= 3) {
    const means = withStats.map(r => r.checks.find(c => c.stats).stats.meanLuminance);
    const min = Math.min(...means), max = Math.max(...means);
    const approach = results.find(r => r.id === 'approach');
    const contact = results.find(r => r.id === 'contact');
    const winter = results.find(r => r.id === 'winter');
    const spreadOk = max / Math.max(1e-6, min) > 1.02;
    const flashOk = Boolean(approach?.checks && contact?.checks &&
      contact.checks.find(c => c.stats)?.stats.meanLuminance > approach.checks.find(c => c.stats)?.stats.meanLuminance);
    const winterOk = Boolean(approach?.checks && winter?.checks &&
      winter.checks.find(c => c.stats)?.stats.meanLuminance < approach.checks.find(c => c.stats)?.stats.meanLuminance);
    results.push({
      id: 'phase-spread',
      label: 'Phase-to-phase luminance spread',
      ok: spreadOk && flashOk && winterOk,
      checks: [
        { name: 'luminance-varies-across-phases', pass: spreadOk, detail: `min=${min.toFixed(4)} max=${max.toFixed(4)} ratio=${(max / Math.max(1e-6, min)).toFixed(3)}` },
        { name: 'contact-flash-brighter-than-approach', pass: flashOk, detail: '' },
        { name: 'winter-darker-than-approach', pass: winterOk, detail: '' }
      ]
    });
  }
  return results;
}

/** Deterministic chapter list re-exported for harness convenience. */
export { CHAPTERS };
