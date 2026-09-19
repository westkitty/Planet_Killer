import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMPACTOR_CLASSES, IMPACTOR_CLASS_ORDER, impactorClass, classDefaultParameters,
  withinClassEnvelope, entryCouplingFactor
} from '../src/simulation/impactorClasses.js';
import {
  HISTORICAL_SCENARIO, normalizeScenario, applyImpactorClass, validateImpactorField,
  IMPACTOR_BOUNDS, CUSTOM_CLASS_ID
} from '../src/simulation/scenario.js';
import { deriveImpactor } from '../src/simulation/core.js';
import { evaluateScenario } from '../src/simulation/engine.js';

test('exactly six physical impactor classes exist', () => {
  assert.equal(IMPACTOR_CLASS_ORDER.length, 6);
  for (const id of IMPACTOR_CLASS_ORDER) assert.ok(IMPACTOR_CLASSES[id], id);
  assert.deepEqual(IMPACTOR_CLASS_ORDER.slice().sort(), [
    'carbonaceous', 'cometary', 'historical-reference', 'metallic', 'rubble', 'stony'
  ]);
});

test('class densities are distinct and literature-plausible', () => {
  const densities = IMPACTOR_CLASS_ORDER.map(id => IMPACTOR_CLASSES[id].densityKgM3);
  assert.equal(new Set(densities).size, 6);
  assert.ok(IMPACTOR_CLASSES.metallic.densityKgM3 >= 7000, 'metallic end member is dense');
  assert.ok(IMPACTOR_CLASSES.cometary.densityKgM3 <= 700, 'cometary nucleus is very low density');
  assert.ok(IMPACTOR_CLASSES.stony.densityKgM3 > IMPACTOR_CLASSES.carbonaceous.densityKgM3);
  // each default sits inside its own envelope
  for (const id of IMPACTOR_CLASS_ORDER) {
    const k = IMPACTOR_CLASSES[id];
    assert.ok(withinClassEnvelope(id, 'densityKgM3', k.densityKgM3), `${id} density in envelope`);
    assert.ok(withinClassEnvelope(id, 'velocityMS', k.defaultVelocityMS), `${id} velocity in envelope`);
  }
});

test('cometary velocity envelope is shifted higher than asteroidal defaults', () => {
  assert.ok(IMPACTOR_CLASSES.cometary.defaultVelocityMS > IMPACTOR_CLASSES.stony.defaultVelocityMS);
  assert.ok(IMPACTOR_CLASSES.cometary.velocityRangeMS[0] > IMPACTOR_CLASSES.stony.velocityRangeMS[0]);
});

test('class selection applies defaults and is deterministic', () => {
  const a = applyImpactorClass(HISTORICAL_SCENARIO, 'metallic');
  const b = applyImpactorClass(HISTORICAL_SCENARIO, 'metallic');
  assert.deepEqual(a, b);
  assert.equal(a.impactor.classId, 'metallic');
  assert.equal(a.impactor.densityKgM3, IMPACTOR_CLASSES.metallic.densityKgM3);
  assert.equal(a.impactor.velocityMS, IMPACTOR_CLASSES.metallic.defaultVelocityMS);
  // diameter/angle/azimuth/target are untouched by a class change
  assert.equal(a.impactor.diameterM, HISTORICAL_SCENARIO.impactor.diameterM);
  assert.equal(a.impactor.angleDeg, HISTORICAL_SCENARIO.impactor.angleDeg);
  assert.equal(a.impactor.azimuthDeg, HISTORICAL_SCENARIO.impactor.azimuthDeg);
  assert.deepEqual(a.target, HISTORICAL_SCENARIO.target);
});

test('manual edits persist — the class never snaps values back', () => {
  let scenario = applyImpactorClass(HISTORICAL_SCENARIO, 'stony');
  scenario = { ...scenario, impactor: { ...scenario.impactor, densityKgM3: 9000 } };
  scenario = normalizeScenario(scenario);
  assert.equal(scenario.impactor.classId, 'stony');
  assert.equal(scenario.impactor.densityKgM3, 9000, 'manual density edit must survive normalization');
  // re-evaluating the same scenario does not revert the edit
  const again = normalizeScenario(scenario);
  assert.equal(again.impactor.densityKgM3, 9000);
});

test('unknown class identifiers normalize to the explicit custom marker', () => {
  const normalized = normalizeScenario({ ...HISTORICAL_SCENARIO, impactor: { ...HISTORICAL_SCENARIO.impactor, classId: 'warp-core' } });
  assert.equal(normalized.impactor.classId, CUSTOM_CLASS_ID);
});

test('metallic body has more energy than stony at identical geometry', () => {
  const stony = deriveImpactor({ ...HISTORICAL_SCENARIO.impactor, classId: 'stony', densityKgM3: IMPACTOR_CLASSES.stony.densityKgM3 });
  const metallic = deriveImpactor({ ...HISTORICAL_SCENARIO.impactor, classId: 'metallic', densityKgM3: IMPACTOR_CLASSES.metallic.densityKgM3 });
  assert.ok(metallic.energyJ / stony.energyJ > 2);
});

test('entry coupling factors are bounded and class-specific', () => {
  for (const id of IMPACTOR_CLASS_ORDER) {
    const f = entryCouplingFactor(id);
    assert.ok(f >= 0.5 && f <= 1.5, `${id} coupling bounded`);
  }
  assert.equal(entryCouplingFactor('historical-reference'), 1);
  assert.ok(entryCouplingFactor('cometary') < entryCouplingFactor('stony'));
  assert.ok(entryCouplingFactor('metallic') > entryCouplingFactor('stony'));
});

test('entry coupling changes loading with an explicit provenance label', () => {
  const base = evaluateScenario(HISTORICAL_SCENARIO);
  const cometary = evaluateScenario({
    ...HISTORICAL_SCENARIO,
    impactor: { ...HISTORICAL_SCENARIO.impactor, classId: 'cometary', densityKgM3: IMPACTOR_CLASSES.cometary.densityKgM3, velocityMS: IMPACTOR_CLASSES.cometary.defaultVelocityMS }
  });
  assert.notEqual(base.result.loading.silicateDustIndex, cometary.result.loading.silicateDustIndex);
  assert.equal(cometary.result.loading.entryCoupling.classId, 'cometary');
  assert.match(cometary.result.loading.entryCoupling.model, /reduced-order/i);
});

test('numeric edits fail safely outside hard bounds', () => {
  assert.throws(() => validateImpactorField('diameterM', 5, 'stony'), /outside the supported range/);
  assert.throws(() => validateImpactorField('velocityMS', Number.NaN, 'stony'), /finite/);
  assert.throws(() => validateImpactorField('nope', 1, 'stony'), /Unknown impactor field/);
  const ok = validateImpactorField('diameterM', 12000, 'stony');
  assert.ok(ok.ok && ok.value === 12000);
});

test('envelope reporting does not reject out-of-envelope edits', () => {
  const res = validateImpactorField('densityKgM3', 9000, 'stony'); // stony max 3700
  assert.ok(res.ok, 'out-of-envelope but in-bounds edit is allowed');
  assert.equal(res.outsideEnvelope, true);
  const inside = validateImpactorField('densityKgM3', 3400, 'stony');
  assert.equal(inside.outsideEnvelope, false);
});

test('hard bounds cover every editable field', () => {
  for (const field of ['diameterM', 'densityKgM3', 'velocityMS', 'angleDeg', 'azimuthDeg']) {
    const b = IMPACTOR_BOUNDS[field];
    assert.ok(b.min >= 0 && b.max > b.min, field);
  }
});

test('scenario round trip preserves class identity', () => {
  const imported = JSON.parse(JSON.stringify(applyImpactorClass(HISTORICAL_SCENARIO, 'cometary')));
  const re = normalizeScenario(imported);
  assert.equal(re.impactor.classId, 'cometary');
  assert.equal(re.impactor.densityKgM3, IMPACTOR_CLASSES.cometary.densityKgM3);
});
