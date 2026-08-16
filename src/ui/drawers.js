function n(value, digits = 2) { return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: digits }); }
function sci(value) { return Number(value || 0).toExponential(2); }
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
function close(title) { return `<header class="drawer-header"><h2 id="drawer-title">${title}</h2><button class="close" data-close-drawer aria-label="Close ${title}">×</button></header>`; }

export function renderDrawer(name, context) {
  const {
    scenario,
    evaluation,
    compareEvaluation = null,
    probes = [],
    compareKey = 'historical',
    comparisonHeld = false,
    autoDirector = false,
    reducedMotion = false,
    bookmarkSlots = [],
    tsunamiStatus = { state: 'idle', label: 'Tsunami field idle' },
    importStatus = null
  } = context;
  const result = evaluation.result, target = evaluation.target;

  if (name === 'impactor') return `${close('Impactor + target')}
    <p class="quiet">Change the body or epoch, then click Earth to place the target. The same numerical state drives the timeline and rendering.</p>
    <h3>Epoch</h3>
    <div class="field"><label for="epoch-field">Earth state</label><select id="epoch-field" data-field="epochId"><option value="cretaceous66" ${scenario.epochId==='cretaceous66'?'selected':''}>66 Ma proxy</option><option value="modern" ${scenario.epochId==='modern'?'selected':''}>Present day</option></select></div>
    <h3>Impactor</h3>
    ${range('Diameter', 'impactor.diameterM', scenario.impactor.diameterM, 500, 30000, 100, `${n(scenario.impactor.diameterM/1000,1)} km`)}
    ${range('Density', 'impactor.densityKgM3', scenario.impactor.densityKgM3, 500, 9000, 50, `${n(scenario.impactor.densityKgM3,0)} kg/m³`)}
    ${range('Velocity', 'impactor.velocityMS', scenario.impactor.velocityMS, 5000, 70000, 500, `${n(scenario.impactor.velocityMS/1000,1)} km/s`)}
    ${range('Angle', 'impactor.angleDeg', scenario.impactor.angleDeg, 5, 90, 1, `${n(scenario.impactor.angleDeg,0)}°`)}
    <div class="field"><label for="composition-field">Composition</label><select id="composition-field" data-field="impactor.composition"><option ${/rocky|carbon/i.test(scenario.impactor.composition)?'selected':''}>rocky-carbonaceous reference envelope</option><option ${/iron|metal/i.test(scenario.impactor.composition)?'selected':''}>fractured iron-rich body</option><option ${/rubble/i.test(scenario.impactor.composition)?'selected':''}>heterogeneous rubble pile</option><option ${/comet|ice/i.test(scenario.impactor.composition)?'selected':''}>dusty cometary body</option></select></div>
    <h3>Target</h3>
    ${metric('Longitude', `${n(scenario.target.longitude,2)}°`)}${metric('Latitude', `${n(scenario.target.latitude,2)}°`)}${metric('Medium', target.medium)}${metric('Target class', target.className)}
    <button data-preset="historical">Reset Historical Chicxulub</button>`;

  if (name === 'camera') return `${close('Camera')}
    <p class="quiet">Camera changes never reset the scenario or modeled time. Direct drag/zoom immediately releases Auto Director.</p>
    <div class="button-grid"><button data-camera="globe">Globe</button><button data-camera="impact">Impact site</button><button data-camera="trajectory">Trajectory side</button><button data-camera="chase">Chase</button><button data-camera="space">Far space</button><button data-auto-director aria-pressed="${autoDirector}">${autoDirector?'Disable':'Enable'} Auto Director</button></div>
    <h3>Bookmarks</h3>
    <div class="button-grid">${[1,2,3].map(i=>bookmarkButtons(i, bookmarkSlots.includes(String(i)))).join('')}</div>
    <p class="quiet">Keys 0–4 recall camera presets. Mouse/touch drag or wheel/pinch always wins.</p>`;

  if (name === 'compare') return `${close('Visual comparison')}
    <p>Hold <strong>B</strong> at any modeled time to see the comparison scenario at that same time. Release B to return to A.</p>
    <button class="compare-hold" data-compare-hold aria-pressed="${comparisonHeld}">${comparisonHeld?'Showing B — release to return':'Hold to preview B'}</button>
    <div class="button-grid compare-presets"><button data-compare="historical" ${compareKey==='historical'?'aria-current="true"':''}>Historical</button><button data-compare="deepOcean" ${compareKey==='deepOcean'?'aria-current="true"':''}>Deep ocean</button><button data-compare="crystalline" ${compareKey==='crystalline'?'aria-current="true"':''}>Crystalline land</button><button data-compare="carbonateShelf" ${compareKey==='carbonateShelf'?'aria-current="true"':''}>Carbonate shelf</button></div>
    ${compareEvaluation ? comparisonDetails(evaluation, compareEvaluation) : ''}
    <p class="quiet">The hold control mirrors the B key for touch and pointer input. Comparison is time-synchronized and never mutates scenario A.</p>`;

  if (name === 'science') return `${close('Science + results')}
    <div><span class="badge">${target.dataQuality}</span><span class="badge">${result.crater.model}</span><span class="badge">${result.climate.uncertainty} climate uncertainty</span><span class="badge async-status" data-state="${tsunamiStatus.state}">${tsunamiStatus.label}</span></div>
    ${metric('Energy', `${sci(result.impactor.energyJ)} J`)}${metric('TNT equivalent', `${sci(result.impactor.energyMegatonsTNT)} Mt`)}${metric('Final crater', `${n(result.crater.finalDiameterKm,1)} km`)}${metric('Severe thermal reach', `${n(result.regional.thermalSevereKm,0)} km`)}${metric('Light reduction', `${n(result.climate.lightReductionFraction*100,0)}%`)}${metric('Temperature envelope', `${n(result.climate.temperatureAnomalyC,1)} °C`)}${metric('Ecological category', result.ecology.category)}
    <p class="warning">${target.uncertaintyNote} ${result.ecology.precisionNote}</p>
    <h3>Location probes (${probes.length}/4)</h3>
    ${probes.length ? probes.map((p,i)=>probeCard(p,i)).join('') : '<p class="quiet empty-state">No probes yet. Add one to inspect arrival order and local severity estimates.</p>'}
    <div class="button-grid"><button data-probe-add ${probes.length>=4?'disabled':''}>Add probe on Earth</button><button data-probe-clear ${!probes.length?'disabled':''}>Clear probes</button></div>`;

  if (name === 'settings') return `${close('Settings + share')}
    <h3>View preferences</h3>
    <div class="button-grid"><button data-clean-view>Toggle Clean View</button><button data-reduced-motion aria-pressed="${reducedMotion}">${reducedMotion?'Use normal motion':'Reduce motion'}</button></div>
    <h3>Scenario handoff</h3>
    <div class="button-grid"><button data-export>Export scenario</button><button data-share>Copy share link</button><button data-capture>Capture clean frame</button></div>
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

function range(label, path, value, min, max, step, display) {
  const id = path.replaceAll('.', '-');
  return `<div class="field"><label for="${id}">${label}</label><output data-field-output="${path}" for="${id}">${display}</output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-field="${path}" aria-valuetext="${display}"></div>`;
}
function metric(label, value) { return `<div class="metric"><strong>${label}</strong><span>${value}</span></div>`; }
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
function comparisonDetails(a,b) { return `<h3>A → B details</h3>${metric('Target class', `${a.target.className} → ${b.target.className}`)}${metric('Impactor energy', `${sci(a.result.impactor.energyJ)} → ${sci(b.result.impactor.energyJ)} J`)}${metric('Final crater', `${n(a.result.crater.finalDiameterKm,1)} → ${n(b.result.crater.finalDiameterKm,1)} km`)}${metric('Light reduction', `${n(a.result.climate.lightReductionFraction*100,0)} → ${n(b.result.climate.lightReductionFraction*100,0)}%`)}${metric('Ecological category', `${a.result.ecology.category} → ${b.result.ecology.category}`)}`; }
