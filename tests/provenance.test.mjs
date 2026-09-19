import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PROVENANCE, PROVENANCE_CATEGORIES, provenanceRecord, provenanceRowsFor, allowedCategories, DOCUMENT_LINKS
} from '../src/simulation/provenance.js';
import { HISTORICAL_SCENARIO } from '../src/simulation/scenario.js';
import { evaluateScenario } from '../src/simulation/engine.js';

test('provenance categories are a fixed, non-overlapping vocabulary', () => {
  const cats = Object.keys(PROVENANCE_CATEGORIES);
  assert.deepEqual(cats.sort(), [
    'direct-calculation',
    'proxy',
    'reduced-order-model',
    'source-backed-categorical-reconstruction',
    'visualization-illustration'
  ]);
  assert.equal(allowedCategories().length, cats.length);
});

test('every major output category is registered with all four answers', () => {
  const required = ['mass-energy', 'impactor-class', 'crater', 'regional', 'loading', 'climate', 'ecology', 'tsunami', 'target-modern', 'target-66ma', 'visual-effects'];
  for (const id of required) {
    const rec = provenanceRecord(id);
    assert.ok(rec, id);
    assert.ok(PROVENANCE_CATEGORIES[rec.category], `${id} uses an allowed category`);
    assert.ok(rec.what.length > 20, `${id} what`);
    assert.ok(rec.model.length > 10, `${id} model`);
    assert.ok(rec.sourceStrength.length > 10, `${id} source strength`);
    assert.ok(rec.limitation.length > 10, `${id} limitation`);
    assert.ok(rec.docs?.path?.startsWith('docs/'), `${id} docs link`);
  }
});

test('categories are used correctly: calculation is direct, visuals are illustration', () => {
  assert.equal(PROVENANCE['mass-energy'].category, 'direct-calculation');
  assert.equal(PROVENANCE['visual-effects'].category, 'visualization-illustration');
  assert.equal(PROVENANCE['crater'].category, 'reduced-order-model');
  assert.equal(PROVENANCE['target-66ma'].category, 'source-backed-categorical-reconstruction');
  assert.equal(PROVENANCE['loading'].category, 'proxy');
});

test('impactor-class row is reduced-order and cites all five density anchors', () => {
  const rec = PROVENANCE['impactor-class'];
  assert.equal(rec.category, 'reduced-order-model');
  for (const id of ['COMET67P_DENSITY_Jorda2016', 'STONE_Meteorite_Densities', 'CARBONACEOUS_Meteorite_Densities', 'RUBBLE_Pile_Densities', 'IRON_Meteorite_Densities']) {
    assert.ok(rec.sourceIds.includes(id), `${id} cited`);
  }
  assert.match(rec.limitation, /never silently snapped back/i);
});

test('scenario rows select the epoch-appropriate target surface', () => {
  const modern = evaluateScenario({ ...HISTORICAL_SCENARIO, epochId: 'modern' });
  const ancient = evaluateScenario(HISTORICAL_SCENARIO);
  const modernIds = provenanceRowsFor(modern).map(r => r.id);
  const ancientIds = provenanceRowsFor(ancient).map(r => r.id);
  assert.ok(modernIds.includes('target-modern'));
  assert.ok(!modernIds.includes('target-66ma'));
  assert.ok(ancientIds.includes('target-66ma'));
  assert.ok(!ancientIds.includes('target-modern'));
  assert.ok(modernIds.includes('impactor-class'));
  assert.equal(modernIds.length, 10);
});

test('document links resolve to real repository files (offline-safe)', async () => {
  for (const link of DOCUMENT_LINKS) {
    await assert.doesNotReject(readFile(link.path, 'utf8'), `${link.path} must exist`);
  }
  for (const rec of Object.values(PROVENANCE)) {
    await assert.doesNotReject(readFile(rec.docs.path, 'utf8'), `${rec.id} doc path`);
  }
});

test('provenance doc anchors resolve to real heading slugs (no dead links)', async () => {
  // GitHub-style slug: lowercase, spaces→dashes, drop non-alphanumerics (keep hyphens).
  const slug = h => h.toLowerCase().replace(/[^a-z0-9 _-]/g, '').trim().replace(/\s+/g, '-');
  const cache = new Map();
  const slugsFor = async path => {
    if (!cache.has(path)) {
      const text = await readFile(path, 'utf8');
      cache.set(path, [
        ...[...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m => slug(m[1])),
        ...[...text.matchAll(/<a\s+id="([^"]+)"/g)].map(m => m[1])
      ]);
    }
    return cache.get(path);
  };
  for (const rec of Object.values(PROVENANCE)) {
    if (!rec.docs?.anchor) continue;
    const slugs = await slugsFor(rec.docs.path);
    assert.ok(slugs.includes(rec.docs.anchor), `${rec.id}: anchor "${rec.docs.anchor}" missing in ${rec.docs.path}`);
  }
});

test('provenance copy never uses probability or confidence language for ecology', async () => {
  const science = await readFile('docs/SCIENCE.md', 'utf8');
  assert.match(science, /not an extinction probability/i);
  const rec = PROVENANCE.ecology;
  assert.match(rec.limitation, /NOT an extinction probability/i);
  assert.doesNotMatch(rec.what, /% chance|probability of extinction/i);
});

test('66 Ma target surface carries the categorical reconstruction state', () => {
  const ancient = evaluateScenario(HISTORICAL_SCENARIO);
  assert.equal(ancient.target.reconstructionState, 'source-backed-categorical-reconstruction');
  assert.match(ancient.target.surfaceDataState, /source-backed-categorical/);
  assert.ok(['land', 'shallow-marine', 'deep-ocean'].includes(ancient.target.waterDepthBand));
});
