import test from 'node:test';
import assert from 'node:assert/strict';
import { impactorMass, kineticEnergy, verticalVelocity, deriveImpactor, craterMetrics, atmosphericLoading, climateEnvelope, ecologicalStress, simulateImmediate } from '../src/simulation/core.js';
import { HISTORICAL_SCENARIO } from '../src/simulation/scenario.js';
import { historicalTarget } from '../src/simulation/target.js';

const historicalImpactor = () => deriveImpactor(HISTORICAL_SCENARIO.impactor);

test('sphere mass uses pi/6 rho d^3', () => {
  const got = impactorMass({ diameterM: 2, densityKgM3: 1000 });
  assert.ok(Math.abs(got - Math.PI / 6 * 8000) < 1e-9);
});
test('kinetic energy uses one-half m v squared', () => assert.equal(kineticEnergy({ massKg: 2, velocityMS: 3 }), 9));
test('vertical velocity respects impact angle', () => assert.ok(Math.abs(verticalVelocity({ velocityMS: 1000, angleDeg: 30 }) - 500) < 1e-9));
test('historical impactor mass is order 1e15 kg', () => assert.ok(historicalImpactor().massKg > 2e15 && historicalImpactor().massKg < 4e15));
test('historical energy is order 1e23 J', () => assert.ok(historicalImpactor().energyJ > 4e23 && historicalImpactor().energyJ < 7e23));
test('diameter increase strongly raises energy', () => {
  const a = deriveImpactor({ ...HISTORICAL_SCENARIO.impactor, diameterM: 6000 });
  const b = deriveImpactor(HISTORICAL_SCENARIO.impactor);
  assert.ok(b.energyJ / a.energyJ > 7.9 && b.energyJ / a.energyJ < 8.1);
});
test('historical crater calibration is Chicxulub scale', () => {
  const c = craterMetrics(historicalImpactor(), historicalTarget());
  assert.ok(c.finalDiameterKm > 150 && c.finalDiameterKm < 230);
});
test('historical crater uses complex regime', () => assert.equal(craterMetrics(historicalImpactor(), historicalTarget()).regime, 'complex'));
test('target chemistry affects sulfate loading', () => {
  const i = historicalImpactor();
  const low = atmosphericLoading(i, { medium:'land', sulfatePotential:0.02, sedimentPotential:0.3, organicPotential:0.1 });
  const high = atmosphericLoading(i, { medium:'land', sulfatePotential:0.9, sedimentPotential:0.3, organicPotential:0.1 });
  assert.ok(high.sulfateIndex > low.sulfateIndex * 10);
});
test('climate envelope darkens as loading rises', () => {
  const a = climateEnvelope({silicateDustIndex:.1,sulfateIndex:.1,sootIndex:.1});
  const b = climateEnvelope({silicateDustIndex:1,sulfateIndex:1,sootIndex:1});
  assert.ok(b.lightReductionFraction > a.lightReductionFraction);
});
test('historical scenario reaches K-Pg-scale ecological category', () => {
  const s = simulateImmediate(HISTORICAL_SCENARIO, historicalTarget());
  assert.equal(s.ecology.category, 'K-Pg-scale ecosystem-collapse potential');
});
test('ecological output is categorical, not probability', () => {
  const i=historicalImpactor(), t=historicalTarget(), c=craterMetrics(i,t); const r={thermalSevereKm:c.finalDiameterKm*4};
  const e=ecologicalStress({impactor:i,target:t,regional:r,climate:{lightReductionFraction:.7,severeLowLightDays:300,temperatureAnomalyC:-6}});
  assert.match(e.precisionNote,/not an extinction probability/i);
});
