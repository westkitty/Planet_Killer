// Impactor body classes. Each class is a reduced-order parameter envelope, not a
// petrology model: it fixes a literature-plausible density and velocity envelope
// plus entry behavior notes. Manual edits to any parameter remain explicit after
// a class is chosen; the class never snaps values back (see scenario.js).
//
// Density anchors (see docs/SOURCES.md, IDs in sourceIds):
//  - ordinary chondrites 3.0–3.7 g/cm³ (H ≈ 3.44, L ≈ 3.40, LL ≈ 3.29 g/cm³)
//  - iron-nickel irons 7–8 g/cm³
//  - carbonaceous chondrites ~2.0–2.7 g/cm³ (porous, volatile-bearing)
//  - rubble-pile aggregates ~1.5–2.7 g/cm³ (Eros-class mean ≈ 2.67 g/cm³, 10–30% porosity)
//  - cometary nuclei ≈ 0.53 g/cm³ (67P/Churyumov–Gerasimenko: 532 ± 7 kg/m³)

export const IMPACTOR_CLASSES = Object.freeze({
  stony: Object.freeze({
    id: 'stony',
    label: 'Stony asteroid',
    tagline: 'Ordinary-chondritic baseline; the most common natural impactor type.',
    densityKgM3: 3400,
    densityRangeKgM3: Object.freeze([3000, 3700]),
    velocityRangeMS: Object.freeze([11000, 72000]),
    defaultVelocityMS: 20000,
    entryNote: 'Silicate strength class; moderate fragmentation and ablation during entry.',
    compositionString: 'stony chondritic body',
    visualMaterial: 'stony-silicate',
    sourceIds: Object.freeze(['STONE_Meteorite_Densities', 'COLLINS2005'])
  }),
  metallic: Object.freeze({
    id: 'metallic',
    label: 'Metallic asteroid',
    tagline: 'Iron/nickel end member; highest density for the same diameter.',
    densityKgM3: 7800,
    densityRangeKgM3: Object.freeze([7200, 8000]),
    velocityRangeMS: Object.freeze([11000, 72000]),
    defaultVelocityMS: 20000,
    entryNote: 'High-strength metallic body; survives to the surface with the least ablation.',
    compositionString: 'metallic iron-nickel body',
    visualMaterial: 'metallic-iron-nickel',
    sourceIds: Object.freeze(['IRON_Meteorite_Densities', 'COLLINS2005'])
  }),
  carbonaceous: Object.freeze({
    id: 'carbonaceous',
    label: 'Carbonaceous asteroid',
    tagline: 'Volatile- and carbon-rich, lower-density rocky end member.',
    densityKgM3: 2200,
    densityRangeKgM3: Object.freeze([1900, 2700]),
    velocityRangeMS: Object.freeze([11000, 72000]),
    defaultVelocityMS: 20000,
    entryNote: 'Porous carbon-rich matrix; higher ablation fraction, weaker aggregate strength.',
    compositionString: 'carbonaceous volatile-rich body',
    visualMaterial: 'carbonaceous-dark',
    sourceIds: Object.freeze(['CARBONACEOUS_Meteorite_Densities', 'COLLINS2005'])
  }),
  rubble: Object.freeze({
    id: 'rubble',
    label: 'Rubble-pile asteroid',
    tagline: 'Porous, gravitationally bound aggregate with high internal porosity.',
    densityKgM3: 2000,
    densityRangeKgM3: Object.freeze([1500, 2700]),
    velocityRangeMS: Object.freeze([11000, 72000]),
    defaultVelocityMS: 20000,
    entryNote: 'Weak aggregate; substantial aerodynamic disruption and mass loss above the target.',
    compositionString: 'rubble-pile aggregate body',
    visualMaterial: 'rubble-pile',
    sourceIds: Object.freeze(['RUBBLE_Pile_Densities', 'COLLINS2005'])
  }),
  cometary: Object.freeze({
    id: 'cometary',
    label: 'Cometary nucleus',
    tagline: 'Icy/volatile-rich, very low-density body on a high-velocity trajectory.',
    densityKgM3: 530,
    densityRangeKgM3: Object.freeze([400, 700]),
    velocityRangeMS: Object.freeze([19000, 72000]),
    defaultVelocityMS: 45000,
    entryNote: 'Volatile-rich body; ablates and fragments high in the atmosphere, shifting energy deposition upward.',
    compositionString: 'cometary icy body',
    visualMaterial: 'cometary-icy',
    sourceIds: Object.freeze(['COMET67P_DENSITY_Jorda2016', 'COLLINS2005'])
  }),
  'historical-reference': Object.freeze({
    id: 'historical-reference',
    label: 'Historical Chicxulub reference',
    tagline: 'Source-backed parameter envelope for the K–Pg impactor; a bounded reference, not an exact composition.',
    densityKgM3: 3000,
    densityRangeKgM3: Object.freeze([2800, 3400]),
    velocityRangeMS: Object.freeze([15000, 25000]),
    defaultVelocityMS: 20000,
    entryNote: 'Reference envelope from the published Chicxulub parameter studies; velocity 20 km/s is the fixture default.',
    compositionString: 'rocky-carbonaceous reference envelope',
    visualMaterial: 'rocky-carbonaceous-reference',
    sourceIds: Object.freeze(['MORGAN2022', 'COLLINS2020'])
  })
});

export const IMPACTOR_CLASS_ORDER = Object.freeze([
  'historical-reference',
  'stony',
  'metallic',
  'carbonaceous',
  'rubble',
  'cometary'
]);

export function impactorClass(id) {
  return IMPACTOR_CLASSES[id] || null;
}

/**
 * Returns the parameters a class would set. This is used when the user chooses a
 * class (class selection applies defaults) and when the UI shows envelope hints.
 * It does NOT mutate live scenario parameters: choosing a class is an explicit
 * user action; later manual edits persist and are never snapped back.
 */
export function classDefaultParameters(id) {
  const klass = impactorClass(id);
  if (!klass) return null;
  return {
    densityKgM3: klass.densityKgM3,
    velocityMS: klass.defaultVelocityMS
  };
}

/** True when a value sits inside the class's literature-plausible envelope. */
export function withinClassEnvelope(id, parameter, value) {
  const klass = impactorClass(id);
  if (!klass || !Number.isFinite(value)) return false;
  if (parameter === 'densityKgM3') {
    const [lo, hi] = klass.densityRangeKgM3;
    return value >= lo && value <= hi;
  }
  if (parameter === 'velocityMS') {
    const [lo, hi] = klass.velocityRangeMS;
    return value >= lo && value <= hi;
  }
  return true;
}

/**
 * Class-derived entry behavior term. Reduced-order: cometary and rubble bodies
 * deposit a fraction of their energy higher in the atmosphere, so the ground
 * coupling is slightly reduced. This is labeled 'reduced-order entry-coupling
 * surrogate' in provenance and is not an atmospheric-entry solver.
 */
export function entryCouplingFactor(id) {
  switch (id) {
    case 'cometary': return 0.88;
    case 'rubble': return 0.93;
    case 'metallic': return 1.03;
    default: return 1.0;
  }
}
