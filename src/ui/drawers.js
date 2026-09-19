function n(value, digits = 2) { return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: digits }); }
function sci(value) { return Number(value || 0).toExponential(2); }
function escapeHtml(value = '') {
  return String(value).replace(/[&<>\"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;'
  })[char]);
}
function close(title) { return `<header class="drawer-header"><h2 id="drawer-title">${title}</h2><button class="close" data-close-drawer aria-label="Close ${title}">×</button></header>`; }

export function renderDrawer(name, context) {
  const {
    scenario,
    evaluation,
    compareEvaluation = null,
    probes = [],
    compareKey = 'preset:historical',
    comparisonHeld = false,
    autoDirector = false,
    reducedMotion = false,
    bookmarkSlots = [],
    tsunamiStatus = { state: 'idle', label: 'Tsunami field idle' },
    importStatus = null,
    editStatus = null,
    atlasEntries = [],
    provenanceRows = [],
    diagnostics = null,
    classInfo = null
  } = context;
  const result = evaluation.result, target = evaluation.target;

  if (name === 'impactor') return `${close('Impactor + target')}
    <p class="quiet">Choose a body class, then tune it. Class selection applies that class's literature-backed density and velocity defaults; after that, your manual edits stay exactly where you put them — nothing snaps back. Values outside a class envelope are allowed but flagged.</p>
    ${classSelector(scenario, classInfo)}
    <h3>Epoch</h3>
    <div class="field"><label for="epoch-field">Earth state</label><select id="epoch-field" data-field="epochId"><option value="cretaceous66" ${scenario.epochId==='cretaceous66'?'selected':''}>66 Ma · source-backed categorical reconstruction</option><option value="modern" ${scenario.epochId==='modern'?'selected':''}>Present day · derived-observational</option></select></div>
    <h3>Impactor parameters</h3>
    ${numberRange('Diameter', 'impactor.diameterM', scenario.impactor.diameterM, 10, 100000, 10, km(scenario.impactor.diameterM), 'km', editStatus, 'Diameter of the impact body at the top of the atmosphere.')}
    ${numberRange('Density', 'impactor.densityKgM3', scenario.impactor.densityKgM3, 300, 20000, 50, `${n(scenario.impactor.densityKgM3,0)} kg/m³`, 'kg/m³', editStatus, envelopeHint(scenario, 'densityKgM3'), classInfo)}
    ${numberRange('Velocity', 'impactor.velocityMS', scenario.impactor.velocityMS, 3000, 100000, 500, kmS(scenario.impactor.velocityMS), 'km/s', editStatus, envelopeHint(scenario, 'velocityMS'), classInfo)}
    ${numberRange('Impact angle', 'impactor.angleDeg', scenario.impactor.angleDeg, 1, 90, 1, `${n(scenario.impactor.angleDeg,0)}°`, '°', editStatus, 'Angle from horizontal: 90° is vertical, 45° is the historical steep trajectory.')}
    ${numberRange('Azimuth', 'impactor.azimuthDeg', scenario.impactor.azimuthDeg, 0, 359, 1, `${n(scenario.impactor.azimuthDeg,0)}°`, '°', editStatus, 'Direction the body arrives from, clockwise from north along the surface.')}
    <h3>Target</h3>
    ${metric('Longitude', `${n(scenario.target.longitude,2)}°`)}${metric('Latitude', `${n(scenario.target.latitude,2)}°`)}${metric('Medium', target.medium)}${metric('Target class', target.className)}${metric('Surface band', target.waterDepthBand || 'n/a')}
    <p class="quiet">${escapeHtml(target.uncertaintyNote)}</p>
    ${targetBadge(target)}
    <button data-preset="historical">Reset Historical Chicxulub</button>`;

  if (name === 'atlas') return `${close('Counterfactual Atlas')}
    <p class="quiet">Curated alternate impact targets for the counterfactual question. Two separate surfaces per entry: <strong>evidence</strong> — how well supported the <em>location</em> is — and <strong>modeled outcome</strong> — what the reduced-order engine returns there. They never modify each other. Applying an entry moves the target and epoch only; your impactor and probes stay as they are.</p>
    ${atlasGroups(atlasEntries, scenario)}`;

  if (name === 'camera') return `${close('Camera')}
    <p class="quiet">Every framing is composed around the impact target, so the site stays in shot wherever you place it. Camera changes never reset the scenario or modelled time, and dragging or zooming releases Auto Director at once.</p>
    <div class="button-grid"><button data-camera="globe">Globe</button><button data-camera="impact">Impact site</button><button data-camera="trajectory">Trajectory side</button><button data-camera="chase">Chase</button><button data-camera="space">Far space</button><button data-auto-director aria-pressed="${autoDirector}">${autoDirector?'Disable':'Enable'} Auto Director</button></div>
    <h3>Bookmarks</h3>
    <div class="button-grid">${[1,2,3].map(i=>bookmarkButtons(i, bookmarkSlots.includes(String(i)))).join('')}</div>
    <p class="quiet">Keys 0–4 recall camera presets. Mouse/touch drag or wheel/pinch always wins.</p>`;

  if (name === 'compare') return `${close('Scenario comparison')}
    <p>Hold <strong>B</strong> (or the button below) at any modeled time to see scenario B at that <em>same</em> modeled time. Release to return to A. Both scenarios share the exact timeline state; the table below lists factual modeled differences only — it never calls one scenario better or more accurate.</p>
    <button class="compare-hold" data-compare-hold aria-pressed="${comparisonHeld}">${comparisonHeld?'Showing B — release to return':'Hold to preview B'}</button>
    <h3>Scenario B</h3>
    <div class="field"><label for="compare-b-field">Compare target</label><select id="compare-b-field" data-compare-select>${compareOptions(compareKey)}</select></div>
    <div class="sync-line"><span class="badge sync-badge" data-state="${comparisonHeld ? 'held' : 'idle'}">${comparisonHeld ? 'B on screen' : 'A on screen'}</span><span>Modeled time A = ${escapeHtml(modelTimeLabel(evaluation))} · B = ${escapeHtml(modelTimeLabel(compareEvaluation))} — synchronized</span></div>
    ${compareEvaluation ? comparisonDetails(evaluation, compareEvaluation, probes) : ''}
    <p class="quiet">The hold control mirrors the B key for touch and pointer input. Comparison is time-synchronized and never mutates scenario A.</p>`;

  if (name === 'science') return `${close('Science + results')}
    <div><span class="badge">${target.dataQuality}</span><span class="badge">${result.crater.model}</span><span class="badge">${result.climate.uncertainty} climate uncertainty</span><span class="badge async-status" data-state="${tsunamiStatus.state}">${tsunamiStatus.label}</span></div>
    ${metric('Energy', `${sci(result.impactor.energyJ)} J`)}${metric('TNT equivalent', `${sci(result.impactor.energyMegatonsTNT)} Mt`)}${metric('Final crater', `${n(result.crater.finalDiameterKm,1)} km`)}${metric('Severe thermal reach', `${n(result.regional.thermalSevereKm,0)} km`)}${metric('Light reduction', `${n(result.climate.lightReductionFraction*100,0)}%`)}${metric('Temperature envelope', `${n(result.climate.temperatureAnomalyC,1)} °C`)}${metric('Ecological category', result.ecology.category)}
    <p class="warning">${escapeHtml(target.uncertaintyNote)} ${escapeHtml(result.ecology.precisionNote)}</p>
    <p class="quiet">The crater drawn on the globe is an illustration: its angular size tracks the modelled final diameter but is exaggerated for legibility. Read the number, not the picture.</p>
    <h3>Provenance — what is each of these?</h3>
    ${provenanceSection(provenanceRows)}
    <h3>Location probes (${probes.length}/4)</h3>
    ${probes.length ? probes.map((p,i)=>probeCard(p,i)).join('') : '<p class="quiet empty-state">No probes yet. Add one to inspect arrival order and local severity estimates.</p>'}
    <div class="button-grid"><button data-probe-add ${probes.length>=4?'disabled':''}>Add probe on Earth</button><button data-probe-clear ${!probes.length?'disabled':''}>Clear probes</button></div>`;

  if (name === 'settings') return `${close('Settings + share')}
    <h3>View preferences</h3>
    <div class="button-grid"><button data-clean-view>Toggle Clean View</button><button data-reduced-motion aria-pressed="${reducedMotion}">${reducedMotion?'Use normal motion':'Reduce motion'}</button></div>
    <h3>Scenario handoff</h3>
    <div class="button-grid"><button data-export>Export scenario</button><button data-share>Copy share link</button><button data-capture>Capture clean frame</button></div>
    <h3>Performance diagnostics</h3>
    ${diagnosticsSection(diagnostics)}
    <h3>Import scenario JSON</h3>
    <p id="scenario-import-help" class="quiet">Paste an exported Planet Killer scenario. Invalid or newer schemas are rejected without replacing the current state.</p>
    <textarea id="scenario-json" rows="8" spellcheck="false" aria-label="Scenario JSON" aria-describedby="scenario-import-help scenario-import-status" ${importStatus?.tone==='error'?'aria-invalid="true"':''}></textarea>
    <p id="scenario-import-status" class="inline-status" data-tone="${importStatus?.tone || 'idle'}" role="status">${escapeHtml(importStatus?.message || '')}</p>
    <p><button data-import>Import JSON</button></p>
    <h3>Keyboard reference</h3>
    ${shortcutList()}
    <p class="quiet">Clean View hides all chrome. Press <kbd>C</kbd> to restore it. Exported scenarios contain model/schema versions and deterministic seed.</p>`;

  return `${close('Panel')}<p>Unknown panel.</p>`;
}

/* ---------- shared helpers ---------- */

function km(value) { return `${(Number(value) / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`; }
function kmS(value) { return `${(Number(value) / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km/s`; }
function modelTimeLabel(evaluation) {
  const t = Number(evaluation?.visual?.time ?? evaluation?.scenario?.timelineTime ?? 0);
  if (t < 0) return `${Math.abs(t).toFixed(0)} s before impact`;
  if (t < 7200) return `${(t / 60).toFixed(1)} min`;
  if (t < 86400) return `${(t / 3600).toFixed(1)} h`;
  return `${(t / 86400).toFixed(1)} d`;
}

function classSelector(scenario, classInfo) {
  const buttons = (classInfo?.classes || []).map(klass => `
    <button class="class-swatch ${klass.id === scenario.impactor.classId ? 'active' : ''}" data-class-id="${klass.id}" aria-pressed="${klass.id === scenario.impactor.classId}" title="${escapeHtml(klass.tagline)}">
      <span class="swatch-dot" data-material="${klass.visualMaterial}" aria-hidden="true"></span>
      <span class="swatch-label">${klass.label}</span>
      <span class="swatch-density">${n(klass.densityKgM3,0)} kg/m³</span>
    </button>`).join('');
  return `<h3>Impactor class</h3>
    <div class="class-grid" role="group" aria-label="Impactor body class">${buttons}</div>
    <p class="quiet">Choosing a class applies its default density and velocity. Six physical classes; the historical reference is a source-backed envelope, not an exact composition.</p>`;
}

function envelopeHint(scenario, parameter) {
  const classId = scenario.impactor.classId;
  const klass = classInfoMap[classId];
  if (!klass || classId === 'custom') return '';
  const value = scenario.impactor[parameter];
  const range = parameter === 'densityKgM3' ? klass.densityRangeKgM3 : klass.velocityRangeMS;
  if (!range) return '';
  if (value < range[0] || value > range[1]) {
    return `Currently outside the ${klass.label.toLowerCase()} envelope (${n(range[0],0)}–${n(range[1],0)}). Allowed, but the class no longer describes this body — that's fine, it's your model now.`;
  }
  return '';
}

// Populated by main.js from impactorClasses so the drawer stays dependency-light.
export const classInfoMap = {};

function numberRange(label, path, value, min, max, step, display, unit, editStatus, hint = '', klass = null) {
  const id = path.replaceAll('.', '-');
  const numericId = id + '-numeric';
  const statusHere = editStatus?.path === path ? `<p class="inline-status" data-tone="${editStatus.tone}" role="status">${escapeHtml(editStatus.message)}</p>` : '';
  const hintHtml = hint ? `<p class="quiet field-hint">${escapeHtml(hint)}</p>` : '';
  return `<div class="field field-range">
    <div class="field-head"><label for="${id}">${label}</label><output data-field-output="${path}" for="${id}">${display}</output></div>
    <div class="field-row">
      <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-field="${path}" aria-valuetext="${display}" aria-describedby="${numericId}">
      <input id="${numericId}" class="field-numeric" type="number" min="${min}" max="${max}" step="${step}" value="${value}" data-numeric="${path}" inputmode="decimal" aria-label="${label} value in ${unit}" aria-describedby="${id}">
      <span class="field-unit" aria-hidden="true">${unit}</span>
    </div>
    ${hintHtml}${statusHere}
  </div>`;
}

function metric(label, value) { return `<div class="metric"><strong>${label}</strong><span>${escapeHtml(String(value))}</span></div>`; }
function arrival(seconds) { if (seconds == null) return 'n/a'; if (seconds < 120) return `${n(seconds,0)} s`; if (seconds < 7200) return `${n(seconds/60,1)} min`; return `${n(seconds/3600,1)} h`; }
function bookmarkButtons(index, saved) {
  return `<button data-bookmark-save="${index}" aria-label="Save camera bookmark ${index}">${saved?`Replace ${index} ✓`:`Save ${index}`}</button><button data-bookmark-recall="${index}" ${saved?'':'disabled'} aria-label="Recall camera bookmark ${index}">Recall ${index}</button>`;
}
function probeCard(probe, index) {
  const r=probe.result;
  if(!r) return `<article class="probe-card"><div class="metric"><strong>Probe ${index+1}</strong><span>${n(probe.longitude,1)}°, ${n(probe.latitude,1)}°</span></div><button class="probe-remove" data-probe-remove="${index}" aria-label="Remove probe ${index+1}">Remove</button></article>`;
  return `<article class="probe-card"><div class="probe-card-head"><div class="metric"><strong>Probe ${index+1}</strong><span>${n(probe.longitude,1)}°, ${n(probe.latitude,1)}° · ${n(r.distanceKm,0)} km</span></div><button class="probe-remove" data-probe-remove="${index}" aria-label="Remove probe ${index+1}">Remove</button></div><p class="quiet">Thermal ${arrival(r.arrivals.thermalSeconds)} · seismic ${arrival(r.arrivals.seismicSeconds)} · blast ${arrival(r.arrivals.blastSeconds)} · ejecta ${arrival(r.arrivals.ejectaSeconds)} · tsunami ${arrival(r.arrivals.tsunamiSeconds)}. Blast ${r.severity.blast}; thermal ${r.severity.thermal}; seismic ${r.severity.seismic}.</p></article>`;
}
function shortcutList() {
  return `<dl class="shortcut-list"><div><dt><kbd>Space</kbd></dt><dd>Play / pause</dd></div><div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Step time</dd></div><div><dt><kbd>Shift</kbd> + <kbd>←</kbd>/<kbd>→</kbd></dt><dd>Jump phase</dd></div><div><dt><kbd>B</kbd></dt><dd>Hold comparison</dd></div><div><dt><kbd>0–4</kbd></dt><dd>Camera presets</dd></div><div><dt><kbd>I J K L</kbd></dt><dd>Orbit camera</dd></div><div><dt><kbd>+</kbd> <kbd>−</kbd></dt><dd>Zoom</dd></div><div><dt><kbd>C</kbd></dt><dd>Clean View</dd></div><div><dt><kbd>D</kbd></dt><dd>Auto Director</dd></div><div><dt><kbd>Esc</kbd></dt><dd>Cancel / close</dd></div></dl>`;
}

function targetBadge(target) {
  const state = target.reconstructionState === 'source-backed-categorical-reconstruction'
    ? '66 Ma: source-backed categorical reconstruction'
    : 'Present day: derived from observational data';
  return `<p class="quiet"><span class="badge">${escapeHtml(state)}</span></p>`;
}

/* ---------- Atlas ---------- */

function atlasGroups(entries, scenario) {
  const groups = [
    { epochId: 'cretaceous66', title: '66 Ma — source-backed categorical reconstruction' },
    { epochId: 'modern', title: 'Present day — derived-observational' }
  ];
  return groups.map(group => {
    const list = (entries || []).filter(e => e.epochId === group.epochId);
    if (!list.length) return '';
    const cards = list.map(entry => `
      <article class="atlas-card ${scenario.target.longitude === entry.longitude && scenario.target.latitude === entry.latitude && scenario.epochId === entry.epochId ? 'current' : ''}">
        <header><h4>${escapeHtml(entry.name)}</h4>
          <div class="atlas-badges">
            <span class="badge evidence-badge" title="How well supported the LOCATION is">${escapeHtml(entry.evidence.state)}</span>
            <span class="badge outcome-badge outcome-${entry.outcome.intensity}" title="Modeled outcome intensity from the reduced-order engine (independent of evidence)">${escapeHtml(entry.outcome.intensity)} outcome</span>
          </div>
        </header>
        <p class="quiet">${escapeHtml(entry.summary)}</p>
        <dl class="atlas-facts">
          <div><dt>Evidence</dt><dd>${escapeHtml(entry.evidence.note)}</dd></div>
          <div><dt>Modeled outcome</dt><dd>${escapeHtml(entry.outcome.note)}</dd></div>
        </dl>
        <button data-atlas-apply="${entry.id}" ${scenario.target.longitude === entry.longitude && scenario.target.latitude === entry.latitude && scenario.epochId === entry.epochId ? 'disabled' : ''}>${scenario.target.longitude === entry.longitude && scenario.target.latitude === entry.latitude && scenario.epochId === entry.epochId ? 'Current target' : 'Apply this target'}</button>
      </article>`).join('');
    return `<h3>${group.title}</h3>${cards}`;
  }).join('');
}

/* ---------- Comparison ---------- */

let atlasForCompare = [];
/** main.js feeds the Atlas entries used as comparison B targets. */
export function setCompareAtlasEntries(entries) { atlasForCompare = entries || []; }

function compareOptions(compareKey) {
  const options = [
    { key: 'preset:historical', label: 'Historical Chicxulub (reference preset)' },
    { key: 'preset:deepOcean', label: 'Same asteroid — deep ocean (preset)' },
    { key: 'preset:crystalline', label: 'Same asteroid — crystalline land (preset)' },
    { key: 'preset:carbonateShelf', label: 'Same asteroid — carbonate shelf (preset)' }
  ];
  for (const entry of atlasForCompare) options.push({ key: `atlas:${entry.id}`, label: `Atlas — ${entry.name}` });
  return options.map(o => `<option value="${o.key}" ${o.key === compareKey ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('');
}

function comparisonDetails(a, b, probes = []) {
  const row = (label, va, vb, fmt = v => escapeHtml(String(v))) => {
    const sa = fmt(va), sb = fmt(vb);
    const changed = sa !== sb;
    return `<div class="cmp-row ${changed ? 'changed' : ''}"><span class="cmp-label">${label}</span><span class="cmp-a">${sa}</span><span class="cmp-b">${sb}</span></div>`;
  };
  const num = (v, d = 1) => n(v, d);
  const probeA = probes[0]?.result?.arrivals || null;
  const probeB = (b.probeArrivals) || null;
  return `<h3>A → B details</h3>
    <div class="cmp-table" role="table" aria-label="Factual modeled differences between scenario A and scenario B">
      <div class="cmp-head" role="row"><span></span><span class="cmp-a">A · current</span><span class="cmp-b">B · ${escapeHtml(b.scenario.name || 'scenario')}</span></div>
      ${row('Impactor class', a.scenario.impactor.classId, b.scenario.impactor.classId)}
      ${row('Energy', sci(a.result.impactor.energyJ) + ' J', sci(b.result.impactor.energyJ) + ' J')}
      ${row('Mass', sci(a.result.impactor.massKg) + ' kg', sci(b.result.impactor.massKg) + ' kg')}
      ${row('Final crater', num(a.result.crater.finalDiameterKm) + ' km', num(b.result.crater.finalDiameterKm) + ' km')}
      ${row('Transient crater', num(a.result.crater.transientDiameterKm) + ' km', num(b.result.crater.transientDiameterKm) + ' km')}
      ${row('Blast 100 kPa reach', num(a.result.regional.blast100kPaKm, 0) + ' km', num(b.result.regional.blast100kPaKm, 0) + ' km')}
      ${row('Severe thermal reach', num(a.result.regional.thermalSevereKm, 0) + ' km', num(b.result.regional.thermalSevereKm, 0) + ' km')}
      ${row('Seismic magnitude', num(a.result.regional.seismicMagnitude), num(b.result.regional.seismicMagnitude))}
      ${row('Silicate dust index', num(a.result.loading.silicateDustIndex, 2), num(b.result.loading.silicateDustIndex, 2))}
      ${row('Sulfate index', num(a.result.loading.sulfateIndex, 2), num(b.result.loading.sulfateIndex, 2))}
      ${row('Soot index', num(a.result.loading.sootIndex, 2), num(b.result.loading.sootIndex, 2))}
      ${row('Water vapor index', num(a.result.loading.waterVaporIndex, 2), num(b.result.loading.waterVaporIndex, 2))}
      ${row('Optical depth proxy', num(a.result.climate.opticalDepthProxy, 2), num(b.result.climate.opticalDepthProxy, 2))}
      ${row('Light reduction', n(a.result.climate.lightReductionFraction * 100, 0) + '%', n(b.result.climate.lightReductionFraction * 100, 0) + '%')}
      ${row('Temperature envelope', num(a.result.climate.temperatureAnomalyC) + ' °C', num(b.result.climate.temperatureAnomalyC) + ' °C')}
      ${row('Ecological stress category', a.result.ecology.category, b.result.ecology.category)}
      ${row('Target class', a.target.className, b.target.className)}
      ${row('Target band', a.target.waterDepthBand || a.target.medium, b.target.waterDepthBand || b.target.medium)}
      ${row('Target surface state', a.target.surfaceDataState, b.target.surfaceDataState)}
      ${probeA ? row('Probe 1 blast arrival', arrival(probeA.blastSeconds), probeB ? arrival(probeB.blastSeconds) : 'n/a') : ''}
      ${probeA ? row('Probe 1 tsunami arrival', arrival(probeA.tsunamiSeconds), probeB ? arrival(probeB.tsunamiSeconds) : 'n/a') : ''}
    </div>
    <p class="quiet">Values are factual outputs of the same reduced-order engine at the same modeled time. Differences reflect target and scenario inputs, not model confidence: neither scenario is "more accurate" than the other.</p>`;
}

/* ---------- Provenance ---------- */

const CATEGORY_ICONS = {
  'direct-calculation': 'Σ',
  'reduced-order-model': '≈',
  'source-backed-categorical-reconstruction': '▦',
  'proxy': '◔',
  'visualization-illustration': '✶'
};

function provenanceSection(rows) {
  if (!rows?.length) return '';
  const items = rows.map((rec, index) => `
    <details class="provenance-row" ${index === 0 ? 'open' : ''}>
      <summary>
        <span class="badge category-badge category-${rec.category}" title="Provenance category">${CATEGORY_ICONS[rec.category] || ''} ${escapeHtml(rec.label)}</span>
        <span class="provenance-category-name">${escapeHtml(categoryName(rec.category))}</span>
      </summary>
      <dl class="provenance-facts">
        <div><dt>What is this</dt><dd>${escapeHtml(rec.what)}</dd></div>
        <div><dt>Model that produced it</dt><dd>${escapeHtml(rec.model)}</dd></div>
        <div><dt>Source strength</dt><dd>${escapeHtml(rec.sourceStrength)}</dd></div>
        <div><dt>Limitation</dt><dd>${escapeHtml(rec.limitation)}</dd></div>
      </dl>
      <p class="quiet provenance-docs">In this repository: <a href="${escapeHtml(rec.docs.path)}${rec.docs.anchor ? '#' + escapeHtml(rec.docs.anchor) : ''}">${escapeHtml(rec.docs.label)}</a></p>
    </details>`).join('');
  return items;
}

function categoryName(id) {
  const names = {
    'direct-calculation': 'Direct calculation',
    'reduced-order-model': 'Reduced-order model',
    'source-backed-categorical-reconstruction': 'Source-backed categorical reconstruction',
    'proxy': 'Proxy',
    'visualization-illustration': 'Visualization / illustration'
  };
  return names[id] || id;
}

/* ---------- Diagnostics ---------- */

function diagnosticsSection(diagnostics) {
  if (!diagnostics) return '<p class="quiet">No diagnostics collected yet. Interact with the simulation and refresh.</p>';
  const row = (label, value) => `<div class="metric"><strong>${label}</strong><span>${escapeHtml(String(value))}</span></div>`;
  const w = diagnostics.summary?.window || {};
  const fmt = v => (v == null ? 'n/a' : v);
  return `<div class="diagnostics-grid">
    ${row('Median frame time (window)', w.frameSeconds?.median != null ? n(w.frameSeconds.median * 1000, 1) + ' ms' : 'n/a')}
    ${row('Median render time', w.renderSeconds?.median != null ? n(w.renderSeconds.median * 1000, 1) + ' ms' : 'n/a')}
    ${row('Median FPS (windowed)', fmt(w.medianFps))}
    ${row('Draw calls (last frame)', fmt(diagnostics.drawCalls))}
    ${row('Triangles (last frame)', fmt(diagnostics.triangles))}
    ${row('Points (last frame)', fmt(diagnostics.points))}
    ${row('Tsunami worker latency (median)', w.workerMs?.median != null ? n(w.workerMs.median, 0) + ' ms' : 'no samples yet')}
    ${row('Atlas apply (median)', w.atlasApplyMs?.median != null ? n(w.atlasApplyMs.median, 2) + ' ms' : 'no samples yet')}
    ${row('Context losses / restorations', `${diagnostics.contextLosses} / ${diagnostics.contextRestorations}`)}
    ${row('Live GPU resources', diagnostics.resources)}
    ${row('Renderer', diagnostics.renderer)}
  </div>
  <button data-diagnostics-refresh>Refresh diagnostics</button>
  <p class="quiet">Windowed measurements from this session on this device — representative evidence, not a universal FPS claim. Raw per-symbol captures are recorded by the performance harness (scripts/perf-report.mjs).</p>`;
}
