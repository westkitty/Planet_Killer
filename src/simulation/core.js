const TNT_J_PER_MEGATON = 4.184e15;
const EARTH_G = 9.80665;

export const MODEL_VERSION = 'planet-killer-0.4';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function impactorMass({ diameterM, densityKgM3 }) {
  if (!(diameterM > 0) || !(densityKgM3 > 0)) throw new RangeError('diameter and density must be positive');
  return Math.PI / 6 * densityKgM3 * diameterM ** 3;
}

export function kineticEnergy({ massKg, velocityMS }) {
  if (!(massKg > 0) || !(velocityMS > 0)) throw new RangeError('mass and velocity must be positive');
  return 0.5 * massKg * velocityMS ** 2;
}

export function verticalVelocity({ velocityMS, angleDeg }) {
  return velocityMS * Math.sin(clamp(angleDeg, 1, 90) * Math.PI / 180);
}

export function deriveImpactor(input) {
  const massKg = impactorMass(input);
  const energyJ = kineticEnergy({ massKg, velocityMS: input.velocityMS });
  return {
    ...input,
    radiusM: input.diameterM / 2,
    volumeM3: Math.PI / 6 * input.diameterM ** 3,
    massKg,
    energyJ,
    energyMegatonsTNT: energyJ / TNT_J_PER_MEGATON,
    verticalVelocityMS: verticalVelocity(input)
  };
}

export function craterMetrics(impactor, target = {}) {
  const densityRatio = clamp(impactor.densityKgM3 / (target.densityKgM3 || 2700), 0.35, 2.5);
  const angleFactor = Math.sin(clamp(impactor.angleDeg, 5, 90) * Math.PI / 180) ** 0.28;
  const gravityFactor = (EARTH_G / 9.80665) ** -0.16;
  const scaledEnergy = Math.max(1e-6, impactor.energyMegatonsTNT / 1e6);
  const finalDiameterKm = 44 * scaledEnergy ** 0.29 * densityRatio ** 0.09 * angleFactor * gravityFactor;
  const transientDiameterKm = finalDiameterKm * (finalDiameterKm > 4 ? 0.57 : 0.78);
  const finalDepthKm = finalDiameterKm * (finalDiameterKm > 4 ? 0.055 : 0.18);
  const meltVolumeKm3 = Math.max(0, 0.0032 * (impactor.energyJ / 1e18) ** 0.82);
  const vaporVolumeKm3 = Math.max(0, 0.00072 * (impactor.energyJ / 1e18) ** 0.86);
  return {
    transientDiameterKm,
    finalDiameterKm,
    finalDepthKm,
    regime: finalDiameterKm > 4 ? 'complex' : 'simple',
    meltVolumeKm3,
    vaporVolumeKm3,
    model: 'calibrated impact-scaling surrogate',
    confidence: 'educational-envelope'
  };
}

export function regionalEffects(impactor, crater) {
  const e23 = impactor.energyJ / 1e23;
  const blast100kPaKm = 105 * e23 ** 0.32;
  const blast20kPaKm = 310 * e23 ** 0.32;
  const thermalSevereKm = 510 * e23 ** 0.34;
  const seismicMagnitude = clamp((Math.log10(impactor.energyJ) - 4.8) / 1.5, 0, 12);
  return {
    blast100kPaKm,
    blast20kPaKm,
    thermalSevereKm,
    seismicMagnitude,
    ejectaThicknessMAt1000Km: 0.12 * (crater.finalDiameterKm / 180) ** 3,
    blastArrivalSecondsAt1000Km: 1000000 / 340,
    seismicArrivalSecondsAt1000Km: 1000000 / 6000,
    model: 'reduced-order regional-effects surrogate'
  };
}

export function atmosphericLoading(impactor, target = {}) {
  const e = clamp(impactor.energyJ / 5.4e23, 0.0001, 20);
  const land = target.medium === 'land' ? 1 : 0.65;
  const sediment = clamp(target.sedimentPotential ?? 0.35, 0, 1);
  const sulfatePotential = clamp(target.sulfatePotential ?? 0.18, 0, 1);
  const organicPotential = clamp(target.organicPotential ?? 0.12, 0, 1);
  const waterDepthKm = Math.max(0, target.waterDepthKm || 0);
  return {
    silicateDustIndex: e ** 0.78 * (0.58 + 0.42 * land) * (0.75 + 0.5 * sediment),
    sulfateIndex: e ** 0.72 * sulfatePotential * (0.7 + 0.3 * land),
    sootIndex: e ** 0.7 * organicPotential * (0.55 + 0.45 * land),
    waterVaporIndex: e ** 0.66 * (target.medium === 'ocean' ? clamp(0.45 + waterDepthKm / 8, 0.45, 1.2) : 0.18),
    model: 'parameterized target-coupled loading envelope'
  };
}

export function climateEnvelope(loading, options = {}) {
  const fineDustThermal = options.fineDustThermal !== false;
  const opticalDepth = clamp(
    0.78 * loading.silicateDustIndex +
    1.05 * loading.sulfateIndex +
    0.92 * loading.sootIndex,
    0,
    8
  );
  const lightReductionFraction = clamp(1 - Math.exp(-0.9 * opticalDepth), 0, 0.995);
  const severeLowLightDays = opticalDepth < 0.35 ? 0 : 90 + 190 * opticalDepth ** 0.72;
  const temperatureAnomalyC = -clamp(2.7 * opticalDepth ** 0.62, 0, 18) +
    (fineDustThermal ? clamp(0.35 * loading.silicateDustIndex, 0, 2.2) : 0);
  const precipitationChangeFraction = -clamp(0.055 * opticalDepth ** 0.7, 0, 0.55);
  return {
    opticalDepthProxy: opticalDepth,
    lightReductionFraction,
    severeLowLightDays,
    temperatureAnomalyC,
    precipitationChangeFraction,
    model: 'consensus/evidence reduced-order climate envelope',
    uncertainty: opticalDepth > 0.5 ? 'high' : 'very-high'
  };
}

export function ecologicalStress({ impactor, target, regional, climate }) {
  const globalScore =
    climate.lightReductionFraction * 2.4 +
    clamp(climate.severeLowLightDays / 365, 0, 2) * 0.9 +
    clamp(Math.abs(climate.temperatureAnomalyC) / 8, 0, 2) * 0.7 +
    clamp(regional.thermalSevereKm / 1000, 0, 2) * 0.28 +
    clamp(Math.log10(impactor.energyJ / 1e20 + 1), 0, 5) * 0.12;
  const category = globalScore >= 3.0
    ? 'K-Pg-scale ecosystem-collapse potential'
    : globalScore >= 1.9
      ? 'severe global disruption'
      : globalScore >= 1.05
        ? 'continental-scale ecological crisis'
        : 'localized catastrophe';
  return {
    score: globalScore,
    category,
    drivers: {
      lowLight: climate.lightReductionFraction,
      temperature: climate.temperatureAnomalyC,
      thermalReachKm: regional.thermalSevereKm,
      targetClass: target.className || target.medium || 'unknown'
    },
    precisionNote: 'Broad stress category; not an extinction probability.'
  };
}

export function simulateImmediate(scenario, target) {
  const impactor = deriveImpactor(scenario.impactor);
  const crater = craterMetrics(impactor, target);
  const regional = regionalEffects(impactor, crater);
  const loading = atmosphericLoading(impactor, target);
  const climate = climateEnvelope(loading, scenario.climateOptions);
  const ecology = ecologicalStress({ impactor, target, regional, climate });
  return { modelVersion: MODEL_VERSION, impactor, target, crater, regional, loading, climate, ecology };
}
