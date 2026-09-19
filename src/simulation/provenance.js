// Provenance registry: every major output category in the app maps to a
// machine-inspectable record answering the four questions the Science drawer
// asks — what is this, what model produced it, how strong is the underlying
// source, and what limitation applies.
//
// Categories are fixed vocabulary (allowedCategories). A record may only use
// one category; the Science drawer renders them with distinct badges so the
// user never confuses a direct calculation with an illustration.

export const PROVENANCE_CATEGORIES = Object.freeze({
  'direct-calculation': 'Direct calculation',
  'reduced-order-model': 'Reduced-order model',
  'source-backed-categorical-reconstruction': 'Source-backed categorical reconstruction',
  'proxy': 'Proxy',
  'visualization-illustration': 'Visualization / illustration'
});

export const PROVENANCE = Object.freeze({
  'mass-energy': Object.freeze({
    id: 'mass-energy',
    label: 'Impactor mass & kinetic energy',
    category: 'direct-calculation',
    what: 'Sphere mass m = (π/6)·ρ·d³ and kinetic energy E = ½·m·v² in SI units, from the diameter, density, velocity and angle you set.',
    model: 'Deterministic equations in src/simulation/core.js (Level A).',
    sourceStrength: 'Strong — exact unit-consistent arithmetic; no fitting involved.',
    sourceIds: Object.freeze(['COLLINS2005']),
    limitation: 'Only as good as the input parameters; class envelopes are reduced-order, not petrology.',
    docs: Object.freeze({ path: 'docs/SCIENCE.md', anchor: 'fundamental-impact-quantities', label: 'SCIENCE.md — fundamental quantities' })
  }),
  'impactor-class': Object.freeze({
    id: 'impactor-class',
    label: 'Impactor class envelopes & entry coupling',
    category: 'reduced-order-model',
    what: 'The six physical impactor classes — stony, metallic (iron-nickel), carbonaceous, rubble-pile, cometary nucleus, and the historical Chicxulub reference — each define labeled density/velocity defaults and allowed editing envelopes, plus an entry-coupling factor applied to the atmospheric loading.',
    model: 'Class registry in src/simulation/impactorClasses.js (Level B). Density anchors are published measurements; allowed envelopes are project-set bounds, not a petrologic model.',
    sourceStrength: 'Moderate — density anchors cite measured bodies (67P nucleus: Jorda et al. 2016; ordinary chondrites: Wilkison & Robinson 2000 and Flynn et al. 2018; Eros-class rubble: Veverka et al. 2001; iron-nickel: 7–8 g/cm³ field range). The envelopes, defaults and coupling factors are project reductions.',
    sourceIds: Object.freeze(['COMET67P_DENSITY_Jorda2016', 'STONE_Meteorite_Densities', 'CARBONACEOUS_Meteorite_Densities', 'RUBBLE_Pile_Densities', 'IRON_Meteorite_Densities', 'COLLINS2005']),
    limitation: 'Class defaults are representative point values inside a bounded envelope, not a unique body. Manual edits are preserved and never silently snapped back. The entry-coupling factor is a first-order atmospheric-coupling proxy, not a numerical entry simulation.',
    docs: Object.freeze({ path: 'docs/SOURCES.md', anchor: 'impactor-class-density-anchors', label: 'SOURCES.md — impactor class density anchors' })
  }),
  'crater': Object.freeze({
    id: 'crater',
    label: 'Crater dimensions & regime',
    category: 'reduced-order-model',
    what: 'Transient/final diameter, depth, simple-vs-complex regime, melt and vapor volumes for the impact.',
    model: 'Energy/density/angle scaling surrogate in core.craterMetrics (Level B), calibrated so the historical fixture stays in the Chicxulub envelope.',
    sourceStrength: 'Moderate — scaling family follows published impact-scaling work (COLLINS2005); coefficients are simplified, not a full program reproduction.',
    sourceIds: Object.freeze(['COLLINS2005', 'MORGAN2022']),
    limitation: 'Not a hydrocode; the drawn crater is a legibility-exaggerated illustration of the modeled diameter.',
    docs: Object.freeze({ path: 'docs/SCIENCE.md', anchor: 'crater-and-regional-effects-surrogate', label: 'SCIENCE.md — crater surrogate' })
  }),
  'regional': Object.freeze({
    id: 'regional',
    label: 'Regional blast / thermal / seismic reach',
    category: 'reduced-order-model',
    what: 'Broad overpressure, thermal, seismic and ejecta-thickness scales and their arrival times.',
    model: 'Reduced-order regional-effects surrogate in core.regionalEffects (Level B).',
    sourceStrength: 'Moderate — order-of-magnitude scaling; calibrated to published regional-effect families.',
    sourceIds: Object.freeze(['COLLINS2005']),
    limitation: 'Educational envelope, not a site hazard estimate; do not use for local hazard prediction.',
    docs: Object.freeze({ path: 'docs/MODEL_LIMITATIONS.md', anchor: 'current-hard-limits', label: 'MODEL_LIMITATIONS.md — hard limits' })
  }),
  'loading': Object.freeze({
    id: 'loading',
    label: 'Atmospheric loading indices',
    category: 'proxy',
    what: 'Dimensionless silicate-dust, sulfate, soot and water-vapor loading indices coupling impact energy to target chemistry.',
    model: 'Parameterized target-coupled loading envelope in core.atmosphericLoading (Level B), optionally scaled by the class entry-coupling term.',
    sourceStrength: 'Moderate-to-weak — target chemistry is categorical proxy data; sulfur context follows the reduced-sulfur literature (RODIOUCHKINA2025).',
    sourceIds: Object.freeze(['RODIOUCHKINA2025', 'KAIHO2017']),
    limitation: 'Indices, not tonnages: never converts to exact sulfur or aerosol masses for arbitrary sites.',
    docs: Object.freeze({ path: 'docs/SCIENCE.md', anchor: 'atmospheric-and-climate-envelope', label: 'SCIENCE.md — loading & climate' })
  }),
  'climate': Object.freeze({
    id: 'climate',
    label: 'Climate envelope (light, temperature, precipitation)',
    category: 'reduced-order-model',
    what: 'Optical-depth proxy, light-reduction fraction, severe-low-light duration, temperature-anomaly and precipitation-change envelope.',
    model: 'Consensus/evidence reduced-order envelope in core.climateEnvelope (Level B), informed by the impact-winter and fine-dust literature.',
    sourceStrength: 'Moderate — consensus-scale response; fine-dust thermal term is optional and bounded (SENEL2023, JOHNSON2026 context).',
    sourceIds: Object.freeze(['SENEL2023', 'JOHNSON2026']),
    limitation: 'Not a general circulation model; uncertainty is high above optical-depth 0.5 and very high overall.',
    docs: Object.freeze({ path: 'docs/SCIENCE.md', anchor: 'atmospheric-and-climate-envelope', label: 'SCIENCE.md — climate envelope' })
  }),
  'ecology': Object.freeze({
    id: 'ecology',
    label: 'Ecological stress category',
    category: 'reduced-order-model',
    what: 'A four-level qualitative stress category combining climate disruption and regional reach.',
    model: 'core.ecologicalStress (Level B); the highest category is "K-Pg-scale ecosystem-collapse potential".',
    sourceStrength: 'Moderate — broad category, deliberately coarse.',
    sourceIds: Object.freeze(['MORGAN2022']),
    limitation: 'Explicitly NOT an extinction probability and not a fatality estimate.',
    docs: Object.freeze({ path: 'docs/SCIENCE.md', anchor: 'ecological-stress', label: 'SCIENCE.md — ecological stress' })
  }),
  'tsunami': Object.freeze({
    id: 'tsunami',
    label: 'Tsunami travel-time & amplitude field',
    category: 'reduced-order-model',
    what: 'Global first-arrival and relative-amplitude proxy field computed in a worker on a 72×36 grid.',
    model: 'Depth-weighted Dijkstra shallow-water travel-time surrogate in src/simulation/tsunami.js (Level B).',
    sourceStrength: 'Moderate at global scale — land blocking and depth-sensitive speed are physically grounded; context from the global-tsunami literature (RANGE2022).',
    sourceIds: Object.freeze(['RANGE2022']),
    limitation: 'Coarse grid, proxy depth, no source-region hydrodynamics; far-field educational resolution only.',
    docs: Object.freeze({ path: 'docs/SCIENCE.md', anchor: 'tsunami-travel-time-surrogate', label: 'SCIENCE.md — tsunami surrogate' })
  }),
  'target-modern': Object.freeze({
    id: 'target-modern',
    label: 'Present-day target surface',
    category: 'proxy',
    what: 'Land/sea classification and visual relief for the present-day globe, plus target-chemistry proxies.',
    model: 'Compact GSHHG 2.3.6 land/sea derivative (2°) + 32×16 ETOPO1-derived luminance derivative; chemistry is a reduced-order proxy in target.js.',
    sourceStrength: 'Strong for land/sea classification (observational derivative); weak for chemistry (categorical proxy).',
    sourceIds: Object.freeze(['GSHHG236_BASEMAP', 'ETOPO1_BASEMAP']),
    limitation: 'Not survey-grade; the relief field is never numerical bathymetry.',
    docs: Object.freeze({ path: 'docs/SOURCES.md', anchor: 'modern-earth-derivative-note', label: 'SOURCES.md — modern derivatives' })
  }),
  'target-66ma': Object.freeze({
    id: 'target-66ma',
    label: '66 Ma target surface',
    category: 'source-backed-categorical-reconstruction',
    what: 'Land / shallow-marine / deep-ocean classification for the 66 Ma globe, with regional shallow-water classes (shelf, seaway).',
    model: 'Project-owned categorical reconstruction in src/data/epochs/cretaceous66.js derived from the paleogeographic source family; water depth stays a categorical band, not surveyed paleobathymetry.',
    sourceStrength: 'Moderate for land/shelf/deep classification (source-backed, categorical); weak for depth values (reduced-order interpolation inside the band).',
    sourceIds: Object.freeze(['CAO2017']),
    limitation: 'Not a transformed EarthByte/GPlates dataset; no numerical 66 Ma paleobathymetry is shipped.',
    docs: Object.freeze({ path: 'docs/SOURCES.md', anchor: 'paleogeography-data-family-note', label: 'SOURCES.md — paleogeography note' })
  }),
  'visual-effects': Object.freeze({
    id: 'visual-effects',
    label: 'VFX: ejecta, plume, vapor, wake, dust, crater coloration, tsunami texture',
    category: 'visualization-illustration',
    what: 'The animated point-cloud and texture systems you see during playback.',
    model: 'Deterministic renderer systems (Level C) driven by the modeled timeline state; fixed point budgets, no physics beyond the visual choreography.',
    sourceStrength: 'Visual only — they communicate Level A/B state and never generate it.',
    sourceIds: Object.freeze([]),
    limitation: 'Reading the picture as a measurement would be a category error; read the numbers in this drawer.',
    docs: Object.freeze({ path: 'docs/SCIENCE.md', anchor: 'evidence-state-rule', label: 'SCIENCE.md — evidence-state rule' })
  })
});

export function provenanceRecord(id) {
  return PROVENANCE[id] || null;
}

export function allowedCategories() {
  return Object.keys(PROVENANCE_CATEGORIES);
}

/**
 * Concrete rows for the current scenario. Target surface category depends on
 * epoch; entry coupling is appended only when a class changed the loading.
 */
export function provenanceRowsFor(evaluation) {
  const targetId = evaluation?.target?.epochId === 'modern' ? 'target-modern' : 'target-66ma';
  const ids = ['mass-energy', 'impactor-class', 'crater', 'regional', 'loading', 'climate', 'ecology', 'tsunami', targetId, 'visual-effects'];
  return ids.map(id => PROVENANCE[id]);
}

/** Static link list for the offline-safe "documents" footer of the drawer. */
export const DOCUMENT_LINKS = Object.freeze([
  Object.freeze({ path: 'docs/SCIENCE.md', label: 'Scientific model' }),
  Object.freeze({ path: 'docs/SOURCES.md', label: 'Sources & provenance' }),
  Object.freeze({ path: 'docs/MODEL_LIMITATIONS.md', label: 'Model limitations' }),
  Object.freeze({ path: 'docs/SCENARIO_SCHEMA.md', label: 'Scenario schema' }),
  Object.freeze({ path: 'docs/PERFORMANCE.md', label: 'Performance & degradation strategy' }),
  Object.freeze({ path: 'docs/VISUAL_QA.md', label: 'Visual QA matrix' }),
  Object.freeze({ path: 'docs/VALIDATION.md', label: 'Validation record' })
]);
