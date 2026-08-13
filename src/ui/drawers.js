function n(value, digits = 2) { return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: digits }); }
function sci(value) { return Number(value || 0).toExponential(2); }
function close(title) { return `<button class="close" data-close-drawer aria-label="Close ${title}">×</button><h2>${title}</h2>`; }

export function renderDrawer(name, context) {
  const { scenario, evaluation, compareEvaluation = null, probes = [], compareKey = 'historical', autoDirector = false, reducedMotion = false } = context;
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
    <div class="button-grid"><button data-camera="globe">Globe</button><button data-camera="impact">Impact site</button><button data-camera="trajectory">Trajectory side</button><button data-camera="chase">Chase</button><button data-camera="space">Far space</button><button data-auto-director>${autoDirector?'Disable':'Enable'} Auto Director</button></div>
    <h3>Bookmarks</h3>
    <div class="button-grid">${[1,2,3].map(i=>`<button data-bookmark-save="${i}">Save ${i}</button><button data-bookmark-recall="${i}">Recall ${i}</button>`).join('')}</div>
    <p class="quiet">Keys 0–4 recall camera presets. Mouse/touch drag or wheel/pinch always wins.</p>`;

  if (name === 'compare') return `${close('Visual comparison')}
    <p>Hold <strong>B</strong> at any modeled time to see the comparison scenario at that same time. Release B to return to A.</p>
    <div class="button-grid"><button data-compare="historical" ${compareKey==='historical'?'aria-current="true"':''}>Historical</button><button data-compare="deepOcean" ${compareKey==='deepOcean'?'aria-current="true"':''}>Deep ocean</button><button data-compare="crystalline" ${compareKey==='crystalline'?'aria-current="true"':''}>Crystalline land</button><button data-compare="carbonateShelf" ${compareKey==='carbonateShelf'?'aria-current="true"':''}>Carbonate shelf</button></div>
    ${compareEvaluation ? comparisonDetails(evaluation, compareEvaluation) : ''}
    <p class="quiet">Comparison is visual-first and time-synchronized; these details identify what stayed similar and what changed.</p>`;

  if (name === 'science') return `${close('Science + results')}
    <div><span class="badge">${target.dataQuality}</span><span class="badge">${result.crater.model}</span><span class="badge">${result.climate.uncertainty} climate uncertainty</span></div>
    ${metric('Energy', `${sci(result.impactor.energyJ)} J`)}${metric('TNT equivalent', `${sci(result.impactor.energyMegatonsTNT)} Mt`)}${metric('Final crater', `${n(result.crater.finalDiameterKm,1)} km`)}${metric('Severe thermal reach', `${n(result.regional.thermalSevereKm,0)} km`)}${metric('Light reduction', `${n(result.climate.lightReductionFraction*100,0)}%`)}${metric('Temperature envelope', `${n(result.climate.temperatureAnomalyC,1)} °C`)}${metric('Ecological category', result.ecology.category)}
    <p class="warning">${target.uncertaintyNote} ${result.ecology.precisionNote}</p>
    <h3>Location probes (${probes.length}/4)</h3>
    ${probes.length ? probes.map((p,i)=>probeCard(p,i)).join('') : '<p class="quiet">No probes yet.</p>'}
    <div class="button-grid"><button data-probe-add ${probes.length>=4?'disabled':''}>Add probe on Earth</button><button data-probe-clear ${!probes.length?'disabled':''}>Clear probes</button></div>`;

  if (name === 'settings') return `${close('Settings + handoff')}
    <div class="button-grid"><button data-clean-view>Toggle Clean View</button><button data-reduced-motion>${reducedMotion?'Use normal motion':'Reduce motion'}</button><button data-export>Export scenario</button><button data-share>Copy share link</button><button data-capture>Capture clean frame</button></div>
    <h3>Import scenario JSON</h3><textarea id="scenario-json" rows="8" spellcheck="false" aria-label="Scenario JSON"></textarea><p><button data-import>Import JSON</button></p>
    <p class="quiet">Clean View hides all chrome. Press C to restore it. Exported scenarios contain model/schema versions and deterministic seed.</p>`;

  return `${close('Panel')}<p>Unknown panel.</p>`;
}

function range(label, path, value, min, max, step, display) {
  const id = path.replaceAll('.', '-');
  return `<div class="field"><label for="${id}">${label}</label><output>${display}</output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-field="${path}"></div>`;
}
function metric(label, value) { return `<div class="metric"><strong>${label}</strong><span>${value}</span></div>`; }
function arrival(seconds) { if (seconds == null) return 'n/a'; if (seconds < 120) return `${n(seconds,0)} s`; if (seconds < 7200) return `${n(seconds/60,1)} min`; return `${n(seconds/3600,1)} h`; }
function probeCard(probe, index) {
  const r=probe.result; if(!r) return `<div class="metric"><strong>Probe ${index+1}</strong><span>${n(probe.longitude,1)}°, ${n(probe.latitude,1)}°</span></div>`;
  return `<div class="probe-card"><div class="metric"><strong>Probe ${index+1}</strong><span>${n(probe.longitude,1)}°, ${n(probe.latitude,1)}° · ${n(r.distanceKm,0)} km</span></div><p class="quiet">Thermal ${arrival(r.arrivals.thermalSeconds)} · seismic ${arrival(r.arrivals.seismicSeconds)} · blast ${arrival(r.arrivals.blastSeconds)} · ejecta ${arrival(r.arrivals.ejectaSeconds)} · tsunami ${arrival(r.arrivals.tsunamiSeconds)}. Blast ${r.severity.blast}; thermal ${r.severity.thermal}; seismic ${r.severity.seismic}.</p></div>`;
}

function comparisonDetails(a,b) { return `<h3>A → B details</h3>${metric('Target class', `${a.target.className} → ${b.target.className}`)}${metric('Impactor energy', `${sci(a.result.impactor.energyJ)} → ${sci(b.result.impactor.energyJ)} J`)}${metric('Final crater', `${n(a.result.crater.finalDiameterKm,1)} → ${n(b.result.crater.finalDiameterKm,1)} km`)}${metric('Light reduction', `${n(a.result.climate.lightReductionFraction*100,0)} → ${n(b.result.climate.lightReductionFraction*100,0)}%`)}${metric('Ecological category', `${a.result.ecology.category} → ${b.result.ecology.category}`)}`; }
