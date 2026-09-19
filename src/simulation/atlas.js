// Counterfactual Atlas: a curated set of alternate impact targets for the
// counterfactual question "what if the impact had landed somewhere else?"
//
// Two deliberately separate surfaces per entry:
//   evidence — how well supported the LOCATION is (source-backed categorical
//              reconstruction for 66 Ma sites, derived-observational for
//              present-day sites). This is a statement about the map, not the
//              outcome.
//   outcome  — the modeled outcome intensity from the reduced-order engine at
//              that target. This is a statement about the model, not the map.
// The UI keeps the two apart: an entry can be well-sourced AND modest, or
// coarsely sourced AND extreme. Neither badge ever modifies the other.

import { cloneScenario, normalizeScenario } from './scenario.js';

export const EVIDENCE_STATES = Object.freeze({
  'source-backed-categorical': 'Source-backed categorical reconstruction',
  'derived-observational': 'Derived from observational data',
  'regional-proxy': 'Regional proxy'
});

export const OUTCOME_INTENSITIES = Object.freeze({
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  extreme: 'Extreme'
});

export const ATLAS = Object.freeze([
  Object.freeze({
    id: 'chicxulub-66ma',
    name: 'Chicxulub shelf (historical)',
    epochId: 'cretaceous66',
    longitude: -86.8,
    latitude: 21.2,
    summary: 'The carbonate/evaporite shelf of the Yucatan region at 66 Ma — the historical K–Pg impact site, kept here as the reference anchor.',
    evidence: {
      state: 'source-backed-categorical',
      sourceId: 'CAO2017-DERIVED-LOWRES-PROXY-0.1',
      note: 'Shelf location and character follow the published paleogeographic source family; the shipped reconstruction is categorical (shelf class), not surveyed paleobathymetry.'
    },
    outcome: {
      intensity: 'extreme',
      note: 'Reference case: sulfate-rich shallow target plus deep-basin coupling in the reduced-order engine; the historical fixture reaches the K–Pg-scale ecological stress category.'
    }
  }),
  Object.freeze({
    id: 'western-interior-seaway-66ma',
    name: 'Western Interior Seaway',
    epochId: 'cretaceous66',
    longitude: -98,
    latitude: 44,
    summary: 'An epicontinental seaway dividing the late-Cretaceous North American landmass — a broad, shallow, sediment-laden inland sea.',
    evidence: {
      state: 'source-backed-categorical',
      sourceId: 'CAO2017-DERIVED-LOWRES-PROXY-0.1',
      note: 'The seaway extent is a well-established feature of late-Cretaceous paleogeography; the shipped state places it as a categorical shallow-marine class.'
    },
    outcome: {
      intensity: 'high',
      note: 'Reduced-order estimate: sediment/sulfate loading from a shallow epicontinental target, basin-confined tsunami travel, no open-ocean dilution. Not a probability.'
    }
  }),
  Object.freeze({
    id: 'tethyan-seaway-66ma',
    name: 'Tethyan seaway shelf',
    epochId: 'cretaceous66',
    longitude: 8,
    latitude: 31,
    summary: 'Shelf seas of the late-Cretaceous Tethys between the drifting Laurasia and Gondwana margins — warm, carbonate-prone, shallow.',
    evidence: {
      state: 'source-backed-categorical',
      sourceId: 'CAO2017-DERIVED-LOWRES-PROXY-0.1',
      note: 'Tethyan shelf position is categorical reconstruction from the paleogeographic source family; carbonate character is a regional chemistry proxy.'
    },
    outcome: {
      intensity: 'extreme',
      note: 'Reduced-order estimate: shallow carbonate-rich target plus open-marine tsunami coupling — comparable to the historical case in the model, not in evidence strength.'
    }
  }),
  Object.freeze({
    id: 'laurasia-shield-66ma',
    name: 'Laurasian crystalline shield (Siberia)',
    epochId: 'cretaceous66',
    longitude: 85,
    latitude: 52,
    summary: 'Ancient continental crust of the late-Cretaceous Siberian (Laurasian) interior — dry, crystalline, far from any shelf.',
    evidence: {
      state: 'source-backed-categorical',
      sourceId: 'CAO2017-DERIVED-LOWRES-PROXY-0.1',
      note: 'Continental position is source-backed; the crystalline class is a reduced-order target-chemistry proxy, not a sampled geology model.'
    },
    outcome: {
      intensity: 'high',
      note: 'Reduced-order estimate: high dry-silicate loading and no tsunami source; local blast/thermal reach comparable, global coupling dominated by dust rather than water vapor.'
    }
  }),
  Object.freeze({
    id: 'pacific-deep-66ma',
    name: 'Pacific deep basin (66 Ma)',
    epochId: 'cretaceous66',
    longitude: -155,
    latitude: 10,
    summary: 'Open deep ocean of the late-Cretaceous Pacific — no shelf, no sediment trap, a large water column above the target.',
    evidence: {
      state: 'source-backed-categorical',
      sourceId: 'CAO2017-DERIVED-LOWRES-PROXY-0.1',
      note: 'Deep-ocean class is categorical; no 66 Ma paleobathymetry is shipped, so the water depth remains a reduced-order band value.'
    },
    outcome: {
      intensity: 'high',
      note: 'Reduced-order estimate: water-vapor-dominated loading, strong global tsunami field, lower sulfate loading than shelf targets. Not a probability.'
    }
  }),
  Object.freeze({
    id: 'indian-deep-66ma',
    name: 'Gondwanan Indian deep basin (66 Ma)',
    epochId: 'cretaceous66',
    longitude: 80,
    latitude: -35,
    summary: 'Deep ocean south of the late-Cretaceous Indian subcontinent — open-water coupling on a drifting continental margin.',
    evidence: {
      state: 'source-backed-categorical',
      sourceId: 'CAO2017-DERIVED-LOWRES-PROXY-0.1',
      note: 'Deep-ocean class is categorical; position follows the reconstructed continental margins of the source family.'
    },
    outcome: {
      intensity: 'high',
      note: 'Reduced-order estimate: deep-basin water-vapor and tsunami coupling; lower target sulfate potential than carbonate shelves.'
    }
  }),
  Object.freeze({
    id: 'pacific-deep-modern',
    name: 'Central Pacific deep basin (present day)',
    epochId: 'modern',
    longitude: -155,
    latitude: 10,
    summary: 'Open central-Pacific deep ocean at present-day coastlines — the same geometry class as the 66 Ma Pacific, on the modern globe.',
    evidence: {
      state: 'derived-observational',
      sourceId: 'GSHHG-2.3.6+ETOPO1-COMPACT-DERIVED-0.4',
      note: 'Land/sea from the 2-degree GSHHG derivative; the depth value is a 32×16 visual-relief-derived proxy, not surveyed bathymetry.'
    },
    outcome: {
      intensity: 'high',
      note: 'Reduced-order estimate: water-vapor-dominated loading and a strong global tsunami field; present-day coastlines only, no 66 Ma comparison implied.'
    }
  }),
  Object.freeze({
    id: 'canadian-shield-modern',
    name: 'Canadian crystalline shield (present day)',
    epochId: 'modern',
    longitude: -105,
    latitude: 52,
    summary: 'Exposed Precambrian continental crust of central North America — dry, high-elevation, no shelf or deep-water coupling.',
    evidence: {
      state: 'derived-observational',
      sourceId: 'GSHHG-2.3.6+ETOPO1-COMPACT-DERIVED-0.4',
      note: 'Land classification from the GSHHG derivative; the crystalline class is a regional chemistry proxy over the correct landmass.'
    },
    outcome: {
      intensity: 'high',
      note: 'Reduced-order estimate: dry-silicate loading dominates, no tsunami source; local effects comparable to other land targets at the same energy.'
    }
  }),
  Object.freeze({
    id: 'gulf-shelf-modern',
    name: 'Gulf of Mexico carbonate shelf (present day)',
    epochId: 'modern',
    longitude: -90,
    latitude: 27,
    summary: 'Present-day shallow carbonate/sedimentary shelf south of the US Gulf Coast — the modern counterpart of the historical shelf class.',
    evidence: {
      state: 'derived-observational',
      sourceId: 'GSHHG-2.3.6+ETOPO1-COMPACT-DERIVED-0.4',
      note: 'Shelf class from the modern target model over the GSHHG-derived coastline; chemistry remains a reduced-order proxy.'
    },
    outcome: {
      intensity: 'extreme',
      note: 'Reduced-order estimate: sulfate/carbonate loading plus open-ocean tsunami coupling — the high-coupling end member of the model for shallow targets.'
    }
  }),
  Object.freeze({
    id: 'south-atlantic-deep-modern',
    name: 'South Atlantic deep basin (present day)',
    epochId: 'modern',
    longitude: -20,
    latitude: -35,
    summary: 'Open South Atlantic deep ocean between the American and African plates — modern-coastline deep-basin coupling.',
    evidence: {
      state: 'derived-observational',
      sourceId: 'GSHHG-2.3.6+ETOPO1-COMPACT-DERIVED-0.4',
      note: 'Deep-ocean class from the GSHHG-derived mask; no bathymetry is used in the numerical model.'
    },
    outcome: {
      intensity: 'high',
      note: 'Reduced-order estimate: deep-basin water-vapor and tsunami coupling with no local sulfate-rich target.'
    }
  })
]);

export function atlasEntryById(id) {
  return ATLAS.find(entry => entry.id === id) || null;
}

export function atlasEntriesForEpoch(epochId) {
  return ATLAS.filter(entry => entry.epochId === epochId);
}

/**
 * Apply an Atlas entry to a scenario: replaces epoch and target only. The
 * impactor class/parameters, probes and modeled time are untouched, so the
 * counterfactual changes exactly one variable family: where it hit.
 */
export function applyAtlasEntry(scenario, entry) {
  const next = cloneScenario(scenario);
  next.epochId = entry.epochId;
  next.target = { longitude: entry.longitude, latitude: entry.latitude };
  next.name = `${scenario.name || 'Scenario'} — Atlas: ${entry.name}`;
  return normalizeScenario(next);
}

/**
 * A comparison-scenario (B) built from an Atlas entry: the current scenario's
 * impactor with the entry's epoch/target. Used by the comparison instrument so
 * B is "the same body, this target" rather than an unrelated preset.
 */
export function atlasComparisonScenario(scenario, entry) {
  const next = cloneScenario(scenario);
  next.epochId = entry.epochId;
  next.target = { longitude: entry.longitude, latitude: entry.latitude };
  next.name = `Atlas B: ${entry.name}`;
  return normalizeScenario(next);
}
