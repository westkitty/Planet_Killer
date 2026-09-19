import test from 'node:test';
import assert from 'node:assert/strict';
import { ATLAS, atlasEntryById, atlasEntriesForEpoch, applyAtlasEntry, atlasComparisonScenario, EVIDENCE_STATES, OUTCOME_INTENSITIES } from '../src/simulation/atlas.js';
import { HISTORICAL_SCENARIO, normalizeScenario } from '../src/simulation/scenario.js';
import { targetAt } from '../src/simulation/target.js';
import { evaluateScenario } from '../src/simulation/engine.js';

test('atlas is non-trivial and covers both epochs', () => {
  assert.ok(ATLAS.length >= 8, 'at least eight curated targets');
  assert.equal(atlasEntriesForEpoch('cretaceous66').length, ATLAS.filter(e => e.epochId === 'cretaceous66').length);
  assert.ok(atlasEntriesForEpoch('cretaceous66').length >= 5, 'five 66 Ma entries');
  assert.ok(atlasEntriesForEpoch('modern').length >= 3, 'three present-day entries');
});

test('every atlas entry is a valid target with coherent evidence and outcome fields', () => {
  for (const entry of ATLAS) {
    assert.ok(Number.isFinite(entry.longitude) && entry.longitude >= -180 && entry.longitude <= 180, entry.id);
    assert.ok(Number.isFinite(entry.latitude) && entry.latitude >= -90 && entry.latitude <= 90, entry.id);
    assert.ok(EVIDENCE_STATES[entry.evidence.state], `${entry.id} evidence state`);
    assert.ok(OUTCOME_INTENSITIES[entry.outcome.intensity], `${entry.id} outcome intensity`);
    assert.ok(typeof entry.evidence.note === 'string' && entry.evidence.note.length > 10, `${entry.id} evidence note`);
    assert.ok(typeof entry.outcome.note === 'string' && entry.outcome.note.length > 10, `${entry.id} outcome note`);
    const t = targetAt({ epochId: entry.epochId, longitude: entry.longitude, latitude: entry.latitude });
    assert.ok(['land', 'ocean'].includes(t.medium), `${entry.id} medium resolves`);
  }
});

test('evidence and outcome intensity are independent surfaces', () => {
  // The historical entry is well-sourced AND extreme; a modern deep basin is
  // derived-observational AND high. Evidence never derives from outcome.
  const hist = atlasEntryById('chicxulub-66ma');
  assert.equal(hist.evidence.state, 'source-backed-categorical');
  assert.equal(hist.outcome.intensity, 'extreme');
  const modernDeep = atlasEntryById('pacific-deep-modern');
  assert.equal(modernDeep.evidence.state, 'derived-observational');
  assert.notEqual(modernDeep.evidence.state, hist.evidence.state);
  assert.equal(modernDeep.outcome.intensity, 'high');
  // 66 Ma entries carry source-backed categorical evidence regardless of outcome rank
  for (const entry of atlasEntriesForEpoch('cretaceous66')) {
    assert.equal(entry.evidence.state, 'source-backed-categorical');
  }
});

test('atlas entry coordinates resolve to the documented medium', () => {
  const wits = atlasEntryById('western-interior-seaway-66ma');
  assert.equal(targetAt({ epochId: wits.epochId, longitude: wits.longitude, latitude: wits.latitude }).medium, 'ocean');
  const shield = atlasEntryById('laurasia-shield-66ma');
  assert.equal(targetAt({ epochId: shield.epochId, longitude: shield.longitude, latitude: shield.latitude }).medium, 'land');
  const pacific66 = atlasEntryById('pacific-deep-66ma');
  assert.equal(targetAt({ epochId: pacific66.epochId, longitude: pacific66.longitude, latitude: pacific66.latitude }).medium, 'ocean');
  const canadian = atlasEntryById('canadian-shield-modern');
  assert.equal(targetAt({ epochId: canadian.epochId, longitude: canadian.longitude, latitude: canadian.latitude }).medium, 'land');
});

test('applying an atlas entry changes epoch+target only (impactor untouched)', () => {
  const scenario = {
    ...HISTORICAL_SCENARIO,
    impactor: { ...HISTORICAL_SCENARIO.impactor, classId: 'metallic', densityKgM3: 7800, diameterM: 14000 }
  };
  const before = normalizeScenario(scenario);
  const entry = atlasEntryById('pacific-deep-modern');
  const after = applyAtlasEntry(before, entry);
  assert.equal(after.epochId, entry.epochId);
  assert.deepEqual(after.target, { longitude: entry.longitude, latitude: entry.latitude });
  assert.deepEqual(after.impactor, before.impactor, 'impactor must survive the atlas move');
  assert.equal(after.timelineTime, before.timelineTime, 'modeled time preserved for synchronized use');
  assert.ok(after.name.includes('Atlas'));
});

test('atlas comparison scenario keeps the current impactor with the entry target', () => {
  const scenario = normalizeScenario(HISTORICAL_SCENARIO);
  const entry = atlasEntryById('tethyan-seaway-66ma');
  const b = atlasComparisonScenario(scenario, entry);
  assert.deepEqual(b.impactor, scenario.impactor);
  assert.deepEqual(b.target, { longitude: entry.longitude, latitude: entry.latitude });
  assert.equal(b.epochId, entry.epochId);
});

test('atlas outcomes differ measurably across target classes', () => {
  const base = HISTORICAL_SCENARIO;
  const shelf = evaluateScenario(applyAtlasEntry(normalizeScenario(base), atlasEntryById('chicxulub-66ma')));
  const shield = evaluateScenario(applyAtlasEntry(normalizeScenario(base), atlasEntryById('laurasia-shield-66ma')));
  assert.ok(shelf.result.loading.sulfateIndex > shield.result.loading.sulfateIndex * 4, 'shelf target loads far more sulfate than crystalline shield');
  assert.ok(shelf.result.loading.waterVaporIndex > shield.result.loading.waterVaporIndex, 'ocean target loads more water vapor than land');
  const silicateRatio = Math.max(shelf.result.loading.silicateDustIndex, shield.result.loading.silicateDustIndex) /
    Math.max(1e-9, Math.min(shelf.result.loading.silicateDustIndex, shield.result.loading.silicateDustIndex));
  assert.ok(silicateRatio < 2.5, 'silicate dust loading stays within the same order across target classes');
});

test('atlas application is deterministic', () => {
  const entry = atlasEntryById('indian-deep-66ma');
  const a = applyAtlasEntry(normalizeScenario(HISTORICAL_SCENARIO), entry);
  const b = applyAtlasEntry(normalizeScenario(HISTORICAL_SCENARIO), entry);
  assert.deepEqual(a, b);
});
