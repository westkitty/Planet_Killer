import test from 'node:test';
import assert from 'node:assert/strict';
import { HISTORICAL_SCENARIO, PRESETS, hashSeed, normalizeScenario, exportScenario, importScenario } from '../src/simulation/scenario.js';
import { evaluateScenario } from '../src/simulation/engine.js';
import { solveTsunami, sampleTsunami, tsunamiSourceStrength } from '../src/simulation/tsunami.js';
import { probeResult, greatCircleKm } from '../src/simulation/probes.js';

test('historical scenario normalizes to schema version 1', () => assert.equal(normalizeScenario(HISTORICAL_SCENARIO).schemaVersion,1));
test('scenario JSON export/import round-trips', () => assert.deepEqual(importScenario(exportScenario(PRESETS.deepOcean)), normalizeScenario(PRESETS.deepOcean)));
test('future schema is rejected', () => assert.throws(()=>importScenario('{"schemaVersion":99}'),/newer/));
test('seed hashing is deterministic', () => assert.equal(hashSeed('abc'),hashSeed('abc')));
test('invalid target latitude is rejected', () => assert.throws(()=>normalizeScenario({target:{latitude:100}}),/latitude/));
test('evaluateScenario returns target and immediate result', () => { const e=evaluateScenario(HISTORICAL_SCENARIO); assert.ok(e.target && e.result?.crater?.finalDiameterKm>100); });
test('land impact has zero tsunami source strength', () => {
  const e=evaluateScenario(PRESETS.crystalline); assert.equal(tsunamiSourceStrength({crater:e.result.crater,target:e.target,impactor:e.result.impactor}),0);
});
test('ocean impact tsunami field is applicable', () => {
  const e=evaluateScenario(PRESETS.deepOcean); const f=solveTsunami({epochId:e.scenario.epochId,source:e.scenario.target,crater:e.result.crater,impactor:e.result.impactor,width:36,height:18}); assert.equal(f.applicable,true); assert.ok(f.sourceStrength>0);
});
test('tsunami solver blocks land cells', () => {
  const e=evaluateScenario(PRESETS.deepOcean); const f=solveTsunami({epochId:e.scenario.epochId,source:e.scenario.target,crater:e.result.crater,impactor:e.result.impactor,width:36,height:18}); const landIndex=f.ocean.findIndex(v=>!v); assert.equal(f.arrivalSeconds[landIndex],null);
});
test('sampleTsunami returns a cell sample', () => {
  const e=evaluateScenario(PRESETS.deepOcean); const f=solveTsunami({epochId:e.scenario.epochId,source:e.scenario.target,crater:e.result.crater,impactor:e.result.impactor,width:36,height:18}); const s=sampleTsunami(f,-155,10); assert.equal(typeof s.ocean,'boolean');
});
test('great-circle distance is symmetric', () => assert.ok(Math.abs(greatCircleKm(0,0,20,10)-greatCircleKm(20,10,0,0))<1e-9));
test('probe returns ordered physical arrivals', () => {
  const e=evaluateScenario(HISTORICAL_SCENARIO); const p=probeResult({longitude:-70,latitude:25,source:e.scenario.target,result:e.result}); assert.ok(p.arrivals.thermalSeconds < p.arrivals.seismicSeconds && p.arrivals.seismicSeconds < p.arrivals.blastSeconds);
});
