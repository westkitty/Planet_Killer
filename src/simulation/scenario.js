import { MODEL_VERSION } from './core.js';

export const SCHEMA_VERSION = 1;

export const HISTORICAL_SCENARIO = Object.freeze({
  schemaVersion: SCHEMA_VERSION,
  modelVersion: MODEL_VERSION,
  name: 'Historical Chicxulub',
  seed: 66000001,
  epochId: 'cretaceous66',
  target: { longitude: -86.8, latitude: 21.2 },
  impactor: {
    classId: 'historical-reference',
    composition: 'rocky-carbonaceous reference envelope',
    diameterM: 12000,
    densityKgM3: 3000,
    velocityMS: 20000,
    angleDeg: 60,
    azimuthDeg: 135
  },
  climateOptions: { preset: 'consensus-envelope', fineDustThermal: true },
  timelineTime: -30
});

export const PRESETS = {
  historical: HISTORICAL_SCENARIO,
  deepOcean: {
    ...HISTORICAL_SCENARIO,
    name: 'Same asteroid — deep ocean',
    seed: 66000002,
    epochId: 'modern',
    target: { longitude: -155, latitude: 10 }
  },
  crystalline: {
    ...HISTORICAL_SCENARIO,
    name: 'Same asteroid — continental crystalline target',
    seed: 66000003,
    epochId: 'modern',
    target: { longitude: -105, latitude: 52 }
  },
  carbonateShelf: {
    ...HISTORICAL_SCENARIO,
    name: 'Same asteroid — shallow carbonate/sedimentary shelf',
    seed: 66000004,
    epochId: 'cretaceous66',
    target: { longitude: -86, latitude: 20 }
  }
};

export function hashSeed(value) {
  const text = String(value ?? 'planet-killer');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

export function cloneScenario(scenario = HISTORICAL_SCENARIO) {
  return JSON.parse(JSON.stringify(scenario));
}

function finite(name, value, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} outside supported range`);
  return value;
}

export function normalizeScenario(input = {}) {
  const base = cloneScenario(HISTORICAL_SCENARIO);
  const source = { ...base, ...input };
  source.target = { ...base.target, ...(input.target || {}) };
  source.impactor = { ...base.impactor, ...(input.impactor || {}) };
  source.climateOptions = { ...base.climateOptions, ...(input.climateOptions || {}) };
  source.schemaVersion = SCHEMA_VERSION;
  source.modelVersion = MODEL_VERSION;
  source.seed = Number.isInteger(source.seed) ? source.seed >>> 0 : hashSeed(source.seed);
  source.epochId = source.epochId === 'modern' ? 'modern' : 'cretaceous66';
  source.target.longitude = finite('longitude', source.target.longitude, -180, 180);
  source.target.latitude = finite('latitude', source.target.latitude, -90, 90);
  source.impactor.diameterM = finite('diameterM', source.impactor.diameterM, 10, 100000);
  source.impactor.densityKgM3 = finite('densityKgM3', source.impactor.densityKgM3, 300, 20000);
  source.impactor.velocityMS = finite('velocityMS', source.impactor.velocityMS, 3000, 100000);
  source.impactor.angleDeg = finite('angleDeg', source.impactor.angleDeg, 1, 90);
  source.impactor.azimuthDeg = ((finite('azimuthDeg', source.impactor.azimuthDeg, -3600, 3600) % 360) + 360) % 360;
  source.timelineTime = finite('timelineTime', Number(source.timelineTime ?? -30), -60, 3155760000);
  return source;
}

export function exportScenario(scenario) {
  return JSON.stringify(normalizeScenario(scenario), null, 2);
}

export function importScenario(text) {
  const parsed = JSON.parse(text);
  if (parsed.schemaVersion != null && parsed.schemaVersion > SCHEMA_VERSION) throw new Error('Scenario schema is newer than this build');
  return normalizeScenario(parsed);
}
