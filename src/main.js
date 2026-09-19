import { Renderer } from './render/webgl/Renderer.js';
import { evaluateScenario } from './simulation/engine.js';
import {
  HISTORICAL_SCENARIO, PRESETS, cloneScenario, normalizeScenario, exportScenario, importScenario,
  applyImpactorClass, validateImpactorField, IMPACTOR_CLASSES, IMPACTOR_CLASS_ORDER, CUSTOM_CLASS_ID
} from './simulation/scenario.js';
import { ATLAS, atlasEntryById, applyAtlasEntry, atlasComparisonScenario } from './simulation/atlas.js';
import { provenanceRowsFor } from './simulation/provenance.js';
import { CHAPTERS, chapterAtTime, sliderToTime, timeToSlider, visualStateAtTime, formatModelTime, formatCountdown, playbackRateAt } from './simulation/timeline.js';
import { PHASE_CHECKPOINTS } from './render/webgl/checkpoints.js';
import { probeResult } from './simulation/probes.js';
import { renderDrawer, setCompareAtlasEntries, classInfoMap } from './ui/drawers.js';
import { downloadText, scenarioFromHash, copyShareLink, captureFrame } from './ui/io.js';

// Populate the drawer's class registry once, from the simulation layer.
for (const id of IMPACTOR_CLASS_ORDER) classInfoMap[id] = IMPACTOR_CLASSES[id];
setCompareAtlasEntries(ATLAS);

const canvas = document.querySelector('#viewport');
const fallback = document.querySelector('#fallback');
const onboarding = document.querySelector('#onboarding');
const edgeControls = document.querySelector('#edge-controls');
const drawer = document.querySelector('#drawer');
const timeline = document.querySelector('#timeline');
const slider = document.querySelector('#time-slider');
const timeOutput = document.querySelector('#time-output');
const phaseOutput = document.querySelector('#phase-output');
const chapterSelect = document.querySelector('#chapter-select');
const speedSelect = document.querySelector('#speed-select');
const playPause = document.querySelector('#play-pause');
const launchButton = edgeControls.querySelector('[data-action="launch"]');
const interactionStatus = document.querySelector('#interaction-status');
const interactionStatusText = document.querySelector('#interaction-status-text');
const cancelInteraction = document.querySelector('#cancel-interaction');
const toast = document.querySelector('#toast');
const srSummary = document.querySelector('#sr-summary');
const dismissOnboarding = document.querySelector('#dismiss-onboarding');
const openScienceIntro = document.querySelector('#open-science-intro');
const mastheadNote = document.querySelector('#masthead-note');
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const MOTION_KEY = 'planet-killer-motion';

function showFallback(detail) {
  const plate = document.createElement('div');
  plate.className = 'fallback-plate';
  const add = (className, text) => { const node = document.createElement('p'); node.className = className; node.textContent = text; plate.append(node); };
  add('eyebrow', 'Renderer unavailable');
  add('fallback-title', 'Planet Killer needs WebGL2.');
  add('fallback-detail', detail);
  add('fallback-detail', 'Open this page in a current browser with hardware acceleration switched on. Nothing else on the page will work until the renderer starts.');
  fallback.replaceChildren(plate);
  fallback.hidden = false;
}

let renderer;
try { renderer = new Renderer(canvas); }
catch (error) {
  window.__pkBootError = { phase: 'renderer-construction', message: error?.message || String(error) };
  showFallback(error.message);
  throw error;
}

let scenario = cloneScenario(HISTORICAL_SCENARIO);
try {
  const shared = scenarioFromHash(location.hash);
  if (shared) scenario = importScenario(shared);
} catch { /* malformed share hashes fall back to the historical reference */ }

let motionPreference = null;
try { motionPreference = localStorage.getItem(MOTION_KEY); } catch { /* storage can be unavailable */ }
if (!['reduce', 'normal'].includes(motionPreference)) motionPreference = null;

let evaluation = evaluateScenario(scenario);
let compareKey = 'preset:historical';
let compareEvaluation = evaluateScenario({ ...PRESETS.historical, timelineTime: scenario.timelineTime });
let comparisonHeld = false;
let probes = [];
let probeResults = [];
let interactionMode = 'target';
let activeDrawer = null;
let lastDrawerTrigger = null;
let playing = false;
let playbackSpeed = 1;
let autoDirector = false;
let reducedMotion = motionPreference ? motionPreference === 'reduce' : motionQuery.matches;
let cleanView = false;
let lastFrame = performance.now();
let lastAutoChapter = null;
let contactPunched = scenario.timelineTime >= 0;   // a scenario that opens after contact must not kick the camera
let chromeTimer = 0;
let tsunamiTimer = 0;
let toastTimer = 0;
let launchPulseTimer = 0;
let primaryTsunami = null;
let compareTsunami = null;
let tsunamiStatus = { state: 'updating', label: 'Tsunami field updating' };
let tsunamiRequestId = 0;
let tsunamiRequestedAt = 0;
let importStatus = null;
let editStatus = null;
let lastSummaryAt = 0;
let lastSummaryChapter = '';
const bookmarks = new Map();
const pointerMap = new Map();
let primaryPointer = null;
let pointerMoved = false;
let pinchDistance = null;

function compareScenarioFor(key) {
  if (key.startsWith('atlas:')) {
    const entry = atlasEntryById(key.slice('atlas:'.length));
    if (entry) return { kind: 'atlas', entry, scenario: atlasComparisonScenario(scenario, entry) };
  }
  const presetKey = key.startsWith('preset:') ? key.slice('preset:'.length) : key;
  if (PRESETS[presetKey]) return { kind: 'preset', entry: null, scenario: PRESETS[presetKey] };
  return { kind: 'preset', entry: null, scenario: PRESETS.historical };
}

function compareDisplayName() {
  const { kind, entry, scenario: s } = compareScenarioFor(compareKey);
  return kind === 'atlas' ? `Atlas — ${entry.name}` : (s.name || 'historical');
}

const primaryWorker = new Worker(new URL('./workers/tsunamiWorker.js', import.meta.url), { type: 'module' });
const compareWorker = new Worker(new URL('./workers/tsunamiWorker.js', import.meta.url), { type: 'module' });
primaryWorker.onmessage = ({ data }) => {
  if (data.requestId !== tsunamiRequestId) return;
  renderer.perf.addWorkerLatency(performance.now() - tsunamiRequestedAt);
  primaryTsunami = data.ok ? data.field : null;
  tsunamiStatus = data.ok
    ? { state: data.field?.applicable ? 'ready' : 'unavailable', label: data.field?.applicable ? 'Tsunami field ready' : 'Tsunami not applicable' }
    : { state: 'error', label: 'Tsunami field unavailable' };
  if (!comparisonHeld) renderer.setTsunamiField(primaryTsunami);
  refreshProbeResults();
  if (!data.ok) notify(`Tsunami solver: ${data.error || 'unavailable'}`);
};
compareWorker.onmessage = ({ data }) => {
  if (data.requestId !== tsunamiRequestId) return;
  compareTsunami = data.ok ? data.field : null;
  if (comparisonHeld) renderer.setTsunamiField(compareTsunami);
  refreshCompareProbeArrivals();
};
primaryWorker.onerror = () => {
  tsunamiStatus = { state: 'error', label: 'Tsunami worker error' };
  primaryTsunami = null;
  if (activeDrawer === 'science') renderActiveDrawer();
  notify('Tsunami worker failed. Other model results remain available.');
};

// Context lifecycle: the renderer owns rebuild; the controller reports it.
renderer.onContextLost = () => notify('Renderer context lost — restoring…');
renderer.onContextRestored = () => {
  renderer.render();
  notify('Renderer context restored.');
  if (activeDrawer === 'settings') renderActiveDrawer();
};

function workerPayload(current, requestId) {
  return { requestId, epochId: current.scenario.epochId, source: current.scenario.target, crater: current.result.crater, impactor: current.result.impactor, width: 72, height: 36 };
}

function requestTsunami() {
  clearTimeout(tsunamiTimer);
  const requestId = ++tsunamiRequestId;
  tsunamiStatus = { state: 'updating', label: 'Tsunami field updating' };
  if (activeDrawer === 'science') renderActiveDrawer();
  tsunamiTimer = setTimeout(() => {
    tsunamiRequestedAt = performance.now();
    primaryWorker.postMessage(workerPayload(evaluation, requestId));
    compareWorker.postMessage(workerPayload(compareEvaluation, requestId));
  }, 80);
}

function refreshCompareProbeArrivals() {
  if (!probes.length || !compareEvaluation) { compareEvaluation && (compareEvaluation.probeArrivals = null); return; }
  const first = probes[0];
  compareEvaluation.probeArrivals = probeResult({
    longitude: first.longitude, latitude: first.latitude,
    source: compareEvaluation.scenario.target,
    result: compareEvaluation.result,
    tsunamiField: compareTsunami
  }).arrivals;
}

function recompute({ refreshDrawer = true } = {}) {
  scenario = normalizeScenario(scenario);
  evaluation = evaluateScenario(scenario);
  const compare = compareScenarioFor(compareKey);
  compareEvaluation = evaluateScenario({ ...compare.scenario, timelineTime: scenario.timelineTime });
  compareEvaluation.probeArrivals = null;
  refreshCompareProbeArrivals();
  renderer.setEvaluation(comparisonHeld ? compareEvaluation : evaluation);
  renderer.setProbes(probes);
  requestTsunami();
  mastheadNote.textContent = `K–Pg counterfactual · ${scenario.epochId === 'modern' ? 'present-day Earth' : '66 Ma reconstruction'}`;
  syncTimeline();
  refreshProbeResults();
  if (refreshDrawer) renderActiveDrawer();
  updateSummary();
}

function setModelTime(time) {
  const bounded = Math.max(CHAPTERS[0].time, Math.min(CHAPTERS.at(-1).time, Number(time) || 0));
  scenario.timelineTime = bounded;
  const visual = visualStateAtTime(bounded);
  evaluation.visual = visual;
  compareEvaluation.visual = visual;
  renderer.setTime(bounded, visual);
  if (comparisonHeld) renderer.setEvaluation({ ...compareEvaluation, visual });
  syncTimeline();
  updateSummary();
  if (autoDirector) runAutoDirector();
}

// syncTimeline runs on every animation frame during playback, so each write is
// guarded: only values that actually changed touch the DOM and force style work.
const timelineShown = { slider: null, progress: null, clock: null, chapter: null, contact: null, playing: null };

function syncTimeline() {
  const sliderValue = Math.round(timeToSlider(scenario.timelineTime));
  const chapter = chapterAtTime(scenario.timelineTime);
  const clock = formatCountdown(scenario.timelineTime);
  const clockText = `${clock.sign}${clock.value} ${clock.unit}`;
  const progress = `${sliderValue / 10}%`;
  const pastContact = String(scenario.timelineTime >= 0);

  if (timelineShown.slider !== sliderValue) { slider.value = String(sliderValue); timelineShown.slider = sliderValue; }
  // Set on the timeline, not the slider: the boundary rule's ::after reads it
  // from here and the slider track inherits it.
  if (timelineShown.progress !== progress) { timeline.style.setProperty('--timeline-progress', progress); timelineShown.progress = progress; }
  if (timelineShown.contact !== pastContact) { timeline.dataset.pastContact = pastContact; timelineShown.contact = pastContact; }
  if (timelineShown.clock !== clockText) {
    timeOutput.value = clockText;
    timeOutput.textContent = clockText;
    timeOutput.title = formatModelTime(scenario.timelineTime);
    timelineShown.clock = clockText;
  }
  if (timelineShown.chapter !== chapter.id) {
    phaseOutput.value = chapter.label;
    phaseOutput.textContent = chapter.label;
    chapterSelect.value = chapter.id;
    timelineShown.chapter = chapter.id;
  }
  if (timelineShown.playing !== playing) {
    playPause.textContent = playing ? 'Ⅱ' : '▶';
    playPause.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playPause.setAttribute('aria-pressed', String(playing));
    playPause.dataset.state = playing ? 'playing' : 'paused';
    launchButton.dataset.running = String(playing);
    timelineShown.playing = playing;
  }
}

function runAutoDirector() {
  const chapter = chapterAtTime(scenario.timelineTime).id;
  if (chapter === lastAutoChapter) return;
  lastAutoChapter = chapter;
  const preset = chapter === 'approach' ? 'trajectory' : chapter === 'entry' ? 'chase' : ['contact','excavation','crater'].includes(chapter) ? 'impact' : ['winter','recovery'].includes(chapter) ? 'space' : 'globe';
  renderer.setCameraPreset(preset);
}

function releaseDirector() {
  if (!autoDirector) return;
  autoDirector = false; lastAutoChapter = null;
  if (activeDrawer === 'camera') renderActiveDrawer();
  notify('Auto Director released — camera is yours.');
}

function syncEdgeState() {
  for (const button of edgeControls.querySelectorAll('[data-drawer]')) {
    const active = button.dataset.drawer === activeDrawer;
    button.setAttribute('aria-expanded', String(active));
    button.toggleAttribute('data-active', active);
  }
}

function syncComparisonUI() {
  const compareButton = edgeControls.querySelector('[data-drawer="compare"]');
  compareButton?.toggleAttribute('data-comparing', comparisonHeld);
  const holdButton = drawer.querySelector('[data-compare-hold]');
  if (holdButton) {
    holdButton.setAttribute('aria-pressed', String(comparisonHeld));
    holdButton.textContent = comparisonHeld ? 'Showing B — release to return' : 'Hold to preview B';
  }
}

function drawerFocusSelector(element) {
  if (!element || !drawer.contains(element)) return null;
  if (element.id) return `#${CSS.escape(element.id)}`;
  const key = Object.keys(element.dataset).find(name => ['closeDrawer','autoDirector','bookmarkSave','bookmarkRecall','compare','probeAdd','probeRemove','probeClear','cleanView','reducedMotion','export','share','import','capture','atlasApply','classId','diagnosticsRefresh'].includes(name));
  if (!key) return null;
  const attribute = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  const value = element.dataset[key];
  return value ? `[data-${attribute}="${CSS.escape(value)}"]` : `[data-${attribute}]`;
}

function diagnosticsContext() {
  const summary = renderer.perf.summary();
  const live = renderer.resourceSummary?.() || null;
  return {
    summary,
    drawCalls: renderer.drawStats.drawCalls,
    triangles: renderer.drawStats.trianglesDrawn,
    points: renderer.drawStats.pointsDrawn,
    contextLosses: renderer.lifecycle.losses,
    contextRestorations: renderer.lifecycle.restorations,
    resources: live ? `${live.programs} programs · ${live.buffers} buffers · ${live.textures} textures` : 'n/a',
    renderer: `WebGL2 · DPR cap 2 · budgets: ${2400} stars / ${520} ejecta / ${360} plume`
  };
}

function renderActiveDrawer() {
  const focusSelector = drawerFocusSelector(document.activeElement);
  syncEdgeState();
  if (!activeDrawer) {
    drawer.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = '';
    return;
  }
  drawer.hidden = false;
  drawer.setAttribute('aria-hidden', 'false');
  drawer.innerHTML = renderDrawer(activeDrawer, {
    scenario,
    evaluation,
    compareEvaluation,
    probes: probeResults,
    compareKey,
    comparisonHeld,
    autoDirector,
    reducedMotion,
    bookmarkSlots: [...bookmarks.keys()],
    tsunamiStatus,
    importStatus,
    editStatus,
    atlasEntries: ATLAS,
    provenanceRows: provenanceRowsFor(evaluation),
    diagnostics: activeDrawer === 'settings' ? diagnosticsContext() : null,
    classInfo: { classes: IMPACTOR_CLASS_ORDER.map(id => IMPACTOR_CLASSES[id]) }
  });
  syncComparisonUI();
  if (focusSelector) requestAnimationFrame(() => drawer.querySelector(focusSelector)?.focus({ preventScroll: true }));
}

function openDrawer(name, trigger = null) {
  activeDrawer = name;
  lastDrawerTrigger = trigger || edgeControls.querySelector(`[data-drawer="${name}"]`) || document.activeElement;
  renderActiveDrawer();
  showChrome();
  requestAnimationFrame(() => drawer.querySelector('[data-close-drawer]')?.focus({ preventScroll: true }));
}

function closeDrawer({ restoreFocus = true } = {}) {
  const restore = lastDrawerTrigger;
  activeDrawer = null;
  lastDrawerTrigger = null;
  renderActiveDrawer();
  scheduleChromeHide();
  if (restoreFocus && restore?.isConnected && !restore.closest('[hidden]')) requestAnimationFrame(() => restore.focus({ preventScroll: true }));
}

function setTransientChromeHidden(hidden) {
  for (const element of [edgeControls, timeline]) {
    element.inert = hidden;
    if (hidden) element.setAttribute('aria-hidden', 'true');
    else element.removeAttribute('aria-hidden');
  }
}

function showChrome() {
  if (cleanView) return;
  edgeControls.classList.remove('hidden-chrome');
  timeline.classList.add('revealed');
  setTransientChromeHidden(false);
  clearTimeout(chromeTimer);
  chromeTimer = setTimeout(scheduleChromeHide, 2600);
}

function scheduleChromeHide() {
  clearTimeout(chromeTimer);
  chromeTimer = setTimeout(() => {
    const focusInChrome = edgeControls.contains(document.activeElement) || timeline.contains(document.activeElement);
    if (playing && !activeDrawer && !focusInChrome) {
      edgeControls.classList.add('hidden-chrome');
      timeline.classList.remove('revealed');
      setTransientChromeHidden(true);
    }
  }, 1200);
}

function setCleanView(value) {
  cleanView = Boolean(value);
  document.body.classList.toggle('clean-view', cleanView);
  for (const element of [edgeControls, timeline, drawer, interactionStatus]) {
    element.inert = cleanView;
    if (cleanView) element.setAttribute('aria-hidden', 'true');
    else element.removeAttribute('aria-hidden');
  }
  if (cleanView) toast.setAttribute('aria-hidden', 'true');
  else {
    toast.removeAttribute('aria-hidden');
    renderActiveDrawer();
    showChrome();
  }
}

function setReducedMotion(value, { persist = true } = {}) {
  reducedMotion = Boolean(value);
  document.body.classList.toggle('reduced-motion', reducedMotion);
  renderer.setReducedMotion(reducedMotion);
  if (persist) {
    motionPreference = reducedMotion ? 'reduce' : 'normal';
    try { localStorage.setItem(MOTION_KEY, motionPreference); } catch { /* preference still applies for this session */ }
  }
  if (activeDrawer === 'settings') renderActiveDrawer();
}

motionQuery.addEventListener?.('change', event => {
  if (!motionPreference) setReducedMotion(event.matches, { persist: false });
});

function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function updateSummary({ force = false } = {}) {
  const chapter = chapterAtTime(scenario.timelineTime);
  const now = performance.now();
  const sameChapter = chapter.id === lastSummaryChapter;
  if (!force && ((playing && sameChapter) || (sameChapter && now - lastSummaryAt < 750))) return;
  lastSummaryChapter = chapter.id;
  lastSummaryAt = now;
  srSummary.textContent = `${chapter.label}. ${formatModelTime(scenario.timelineTime)}. Target ${evaluation.target.className}. ${evaluation.result.ecology.category}.`;
}

function refreshProbeResults() {
  probeResults = probes.map(p => ({ ...p, result: probeResult({ ...p, source: scenario.target, result: evaluation.result, tsunamiField: primaryTsunami }) }));
  renderer.setProbes(probes);
  if (activeDrawer === 'science') renderActiveDrawer();
}

function formatFieldValue(path, raw) {
  const value = Number(raw);
  if (path === 'impactor.diameterM') return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
  if (path === 'impactor.densityKgM3') return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/m³`;
  if (path === 'impactor.velocityMS') return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km/s`;
  if (path === 'impactor.angleDeg') return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}°`;
  if (path === 'impactor.azimuthDeg') return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}°`;
  return String(raw);
}

function updateRangeFeedback(input) {
  if (input.type !== 'range' || !input.dataset.field) return;
  const display = formatFieldValue(input.dataset.field, input.value);
  const output = input.closest('.field')?.querySelector(`[data-field-output="${input.dataset.field}"]`);
  if (output) { output.value = display; output.textContent = display; }
  input.setAttribute('aria-valuetext', display);
}

function applyField(path, raw) {
  const value = path === 'epochId' || path.endsWith('composition') ? raw : Number(raw);
  if (path === 'epochId') scenario.epochId = value;
  else { const [group, key] = path.split('.'); scenario[group] = { ...scenario[group], [key]: value }; }
  recompute({ refreshDrawer: false });
}

/**
 * Numeric edit with safe failure: hard bounds are enforced by
 * validateImpactorField; on failure the scenario is untouched and the error is
 * surfaced inline. Valid commits mirror into the paired range control.
 */
function commitNumericEdit(input) {
  const path = input.dataset.numeric;
  if (!path) return;
  try {
    const { value } = validateImpactorField(path.split('.')[1], input.value, scenario.impactor.classId);
    editStatus = null;
    applyField(path, value);
    const range = drawer.querySelector(`[data-field="${path}"]`);
    if (range) { range.value = String(value); updateRangeFeedback(range); }
    renderActiveDrawer();
    requestAnimationFrame(() => drawer.querySelector(`[data-numeric="${path}"]`)?.focus({ preventScroll: true }));
  } catch (error) {
    editStatus = { tone: 'error', path, message: `Not applied — ${error.message}. The scenario is unchanged.` };
    renderActiveDrawer();
    requestAnimationFrame(() => drawer.querySelector(`[data-numeric="${path}"]`)?.focus({ preventScroll: true }));
  }
}

function holdComparison(active) {
  if (comparisonHeld === active) return;
  comparisonHeld = active;
  const current = active ? compareEvaluation : evaluation;
  renderer.setEvaluation({ ...current, visual: visualStateAtTime(scenario.timelineTime) });
  renderer.setTsunamiField(active ? compareTsunami : primaryTsunami);
  renderer.setProbes(active ? [] : probes);
  syncComparisonUI();
  notify(active ? `B: ${compareDisplayName()}` : 'A: current scenario');
}

function setCompare(key) {
  const known = key.startsWith('atlas:') ? Boolean(atlasEntryById(key.slice('atlas:'.length))) : Boolean(PRESETS[key.startsWith('preset:') ? key.slice('preset:'.length) : key]);
  if (!known) return;
  compareKey = key.startsWith('atlas:') ? key : (key.startsWith('preset:') ? key : `preset:${key}`);
  compareTsunami = null;
  recompute({ refreshDrawer: true });
}

function chapterStep(direction) {
  const current = chapterAtTime(scenario.timelineTime), index = CHAPTERS.findIndex(c => c.id === current.id);
  const next = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, index + direction))];
  setModelTime(next.time);
}

function smallTimeStep(direction) {
  const next = Math.max(0, Math.min(1000, Number(slider.value) + direction * 15));
  playing = false;
  setModelTime(sliderToTime(next));
}

function adjustSpeed(direction) {
  const speeds = [0.25, 1, 4, 16];
  const current = speeds.indexOf(playbackSpeed);
  const next = speeds[Math.max(0, Math.min(speeds.length - 1, (current < 0 ? 1 : current) + direction))];
  playbackSpeed = next;
  speedSelect.value = String(next);
  notify(`Playback ${next}×`);
}

function launch() {
  setModelTime(-30);
  contactPunched = false;
  // The camera stays the viewer's. Only recover the framing when the impact
  // site is off the near face, so the sequence never plays out of shot.
  const recovered = !autoDirector && !renderer.targetInFrame();
  if (recovered) renderer.setCameraPreset('trajectory');
  playing = true;
  syncTimeline();
  clearTimeout(launchPulseTimer);
  launchButton.classList.remove('launching');
  void launchButton.offsetWidth;
  launchButton.classList.add('launching');
  launchPulseTimer = setTimeout(() => launchButton.classList.remove('launching'), 900);
  if (recovered) notify('Impact sequence launched — camera returned to the target.');
  else notify('Impact sequence launched.');
  scheduleChromeHide();
}

function setInteractionMode(mode) {
  interactionMode = mode;
  const placingProbe = mode === 'probe';
  canvas.dataset.mode = mode;
  interactionStatus.hidden = !placingProbe;
  if (placingProbe) {
    interactionStatusText.textContent = 'Probe placement active — select a point on Earth.';
    showChrome();
  }
}

function addProbeAt(hit) {
  if (probes.length >= 4) { notify('Four-probe limit reached.'); return; }
  probes.push({ longitude: hit.longitude, latitude: hit.latitude });
  setInteractionMode('target');
  refreshProbeResults();
  renderActiveDrawer();
  notify(`Probe ${probes.length} placed.`);
}

function removeProbe(index) {
  if (!Number.isInteger(index) || index < 0 || index >= probes.length) return;
  probes.splice(index, 1);
  refreshProbeResults();
  renderActiveDrawer();
  notify('Probe removed.');
}

function setTargetAt(hit) {
  scenario.target = { longitude: hit.longitude, latitude: hit.latitude };
  recompute();
  if (autoDirector) runAutoDirector();
  notify(`Target: ${hit.latitude.toFixed(2)}°, ${hit.longitude.toFixed(2)}°`);
}

function applyAtlas(id) {
  const entry = atlasEntryById(id);
  if (!entry) return;
  const started = performance.now();
  scenario = applyAtlasEntry(scenario, entry);
  renderer.perf.addAtlasApply(performance.now() - started);
  recompute();
  notify(`Atlas target: ${entry.name}`);
}

function isTyping(event) { return /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || '') || Boolean(event.target?.isContentEditable); }

edgeControls.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.drawer) openDrawer(button.dataset.drawer, button);
  if (button.dataset.action === 'launch') launch();
});

dismissOnboarding.addEventListener('click', () => {
  onboarding.hidden = true;
  showChrome();
  edgeControls.querySelector('button')?.focus({ preventScroll: true });
});
openScienceIntro.addEventListener('click', () => {
  onboarding.hidden = true;
  openDrawer('science', edgeControls.querySelector('[data-drawer="science"]'));
});

cancelInteraction.addEventListener('click', () => {
  setInteractionMode('target');
  notify('Probe placement cancelled.');
});

timeline.addEventListener('click', event => {
  const action = event.target.closest('button')?.dataset.timeAction; if (!action) return;
  if (action === 'restart') { playing = false; setModelTime(-30); }
  if (action === 'back') chapterStep(-1);
  if (action === 'forward') chapterStep(1);
  if (action === 'play') playing = !playing;
  syncTimeline();
  showChrome();
});
slider.addEventListener('input', () => { playing = false; setModelTime(sliderToTime(slider.value)); });
slider.addEventListener('change', () => updateSummary({ force: true }));
chapterSelect.addEventListener('change', () => { playing = false; setModelTime(CHAPTERS.find(c => c.id === chapterSelect.value)?.time ?? scenario.timelineTime); updateSummary({ force: true }); });
speedSelect.addEventListener('change', () => { playbackSpeed = Number(speedSelect.value) || 1; notify(`Playback ${playbackSpeed}×`); });

drawer.addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.closeDrawer !== undefined) return closeDrawer();
  if (button.dataset.preset === 'historical') { scenario = cloneScenario(HISTORICAL_SCENARIO); importStatus = null; editStatus = null; recompute(); }
  if (button.dataset.camera) { releaseDirector(); renderer.setCameraPreset(button.dataset.camera); }
  if (button.dataset.autoDirector !== undefined) { autoDirector = !autoDirector; lastAutoChapter = null; if (autoDirector) runAutoDirector(); renderActiveDrawer(); }
  if (button.dataset.bookmarkSave) { bookmarks.set(button.dataset.bookmarkSave, renderer.getCamera()); notify(`Camera ${button.dataset.bookmarkSave} saved.`); renderActiveDrawer(); }
  if (button.dataset.bookmarkRecall) { const saved = bookmarks.get(button.dataset.bookmarkRecall); if (saved) { releaseDirector(); renderer.setCamera(saved); } }
  if (button.dataset.compare) setCompare(button.dataset.compare);
  if (button.dataset.compareSelect !== undefined) return; // handled on change
  if (button.dataset.atlasApply) applyAtlas(button.dataset.atlasApply);
  if (button.dataset.classId) {
    scenario = applyImpactorClass(scenario, button.dataset.classId);
    editStatus = null;
    recompute();
    notify('Class defaults applied — manual edits stay put from here.');
  }
  if (button.dataset.probeAdd !== undefined) { setInteractionMode('probe'); closeDrawer({ restoreFocus: false }); }
  if (button.dataset.probeRemove !== undefined) removeProbe(Number(button.dataset.probeRemove));
  if (button.dataset.probeClear !== undefined) { probes = []; refreshProbeResults(); renderActiveDrawer(); notify('All probes cleared.'); }
  if (button.dataset.cleanView !== undefined) { setCleanView(!cleanView); closeDrawer({ restoreFocus: false }); }
  if (button.dataset.reducedMotion !== undefined) setReducedMotion(!reducedMotion);
  if (button.dataset.export !== undefined) { downloadText('planet-killer-scenario.json', exportScenario(scenario)); notify('Scenario exported.'); }
  if (button.dataset.share !== undefined) { try { await copyShareLink(exportScenario(scenario)); notify('Share link copied.'); } catch { notify('Could not copy share link.'); } }
  if (button.dataset.import !== undefined) {
    try {
      const imported = importScenario(document.querySelector('#scenario-json').value);
      importStatus = { tone: 'success', message: 'Scenario imported successfully.' };
      scenario = imported;
      recompute();
      notify('Scenario imported.');
    } catch (error) {
      const invalidDraft = document.querySelector('#scenario-json')?.value || '';
      importStatus = { tone: 'error', message: `Nothing was imported and the current scenario is unchanged. ${error.message}` };
      renderActiveDrawer();
      requestAnimationFrame(() => {
        const input = drawer.querySelector('#scenario-json');
        if (!input) return;
        input.value = invalidDraft;
        input.focus({ preventScroll: true });
      });
    }
  }
  if (button.dataset.diagnosticsRefresh !== undefined) { renderActiveDrawer(); }
  if (button.dataset.capture !== undefined) {
    const wasClean = cleanView;
    setCleanView(true);
    renderer.render();
    await new Promise(requestAnimationFrame);
    try {
      await captureFrame(canvas, { scenario: normalizeScenario(scenario), time: scenario.timelineTime, camera: renderer.getCamera(), target: evaluation.target, models: { crater: evaluation.result.crater.model, climate: evaluation.result.climate.model } });
      notify('Frame + metadata captured.');
    } catch (error) { notify(error.message); }
    finally { setCleanView(wasClean); }
  }
});

drawer.addEventListener('input', event => {
  const path = event.target.dataset.field;
  if (!path) return;
  updateRangeFeedback(event.target);
  applyField(path, event.target.value);
});
drawer.addEventListener('change', event => {
  if (event.target.dataset.numeric) { commitNumericEdit(event.target); return; }
  if (event.target.id === 'compare-b-field') { setCompare(event.target.value); return; }
  if (event.target.dataset.field) renderActiveDrawer();
});

drawer.addEventListener('pointerdown', event => {
  const button = event.target.closest('[data-compare-hold]');
  if (!button) return;
  button.setPointerCapture?.(event.pointerId);
  holdComparison(true);
});
drawer.addEventListener('pointerup', event => { if (event.target.closest('[data-compare-hold]')) holdComparison(false); });
drawer.addEventListener('pointercancel', event => { if (event.target.closest('[data-compare-hold]')) holdComparison(false); });
drawer.addEventListener('keydown', event => {
  if (!event.target.closest('[data-compare-hold]') || ![' ', 'Enter'].includes(event.key)) return;
  event.preventDefault();
  holdComparison(true);
});
drawer.addEventListener('keyup', event => {
  if (!event.target.closest('[data-compare-hold]') || ![' ', 'Enter'].includes(event.key)) return;
  event.preventDefault();
  holdComparison(false);
});

canvas.addEventListener('pointerdown', event => {
  canvas.setPointerCapture(event.pointerId);
  pointerMap.set(event.pointerId, { x:event.clientX, y:event.clientY });
  if (primaryPointer == null) { primaryPointer = event.pointerId; pointerMoved = false; }
  showChrome();
});
canvas.addEventListener('pointermove', event => {
  if (!pointerMap.has(event.pointerId)) { showChrome(); return; }
  const previous = pointerMap.get(event.pointerId), dx = event.clientX - previous.x, dy = event.clientY - previous.y;
  pointerMap.set(event.pointerId, { x:event.clientX, y:event.clientY });
  if (pointerMap.size >= 2) {
    const [a,b] = [...pointerMap.values()], distance = Math.hypot(a.x-b.x,a.y-b.y);
    if (pinchDistance != null) { releaseDirector(); renderer.dollyBy((pinchDistance-distance)*2.5); }
    pinchDistance = distance; pointerMoved = true;
  } else if (event.pointerId === primaryPointer && Math.hypot(dx,dy) > 0) {
    if (Math.hypot(dx,dy) > 2) pointerMoved = true;
    releaseDirector(); renderer.orbitBy(dx, dy);
  }
});
canvas.addEventListener('pointerup', event => {
  const wasPrimary = event.pointerId === primaryPointer, shouldClick = wasPrimary && !pointerMoved && pointerMap.size === 1;
  pointerMap.delete(event.pointerId); pinchDistance = null;
  if (wasPrimary) primaryPointer = pointerMap.keys().next().value ?? null;
  if (shouldClick) { const hit = renderer.pick(event.clientX,event.clientY); if (hit) interactionMode === 'probe' ? addProbeAt(hit) : setTargetAt(hit); }
});
canvas.addEventListener('pointercancel', event => { pointerMap.delete(event.pointerId); if (event.pointerId === primaryPointer) primaryPointer = null; pinchDistance = null; });
canvas.addEventListener('wheel', event => { event.preventDefault(); releaseDirector(); renderer.dollyBy(event.deltaY); showChrome(); }, { passive:false });
window.addEventListener('resize', () => renderer.resize());
window.addEventListener('mousemove', showChrome, { passive:true });

window.addEventListener('keydown', event => {
  if (event.defaultPrevented) return;
  if (isTyping(event) && event.key !== 'Escape') return;
  if (event.target?.tagName === 'BUTTON' && (event.code === 'Space' || event.key === 'Enter')) return;
  if (event.code === 'Space') { event.preventDefault(); playing = !playing; syncTimeline(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); event.shiftKey ? chapterStep(-1) : smallTimeStep(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); event.shiftKey ? chapterStep(1) : smallTimeStep(1); }
  if (event.key === ',') adjustSpeed(-1);
  if (event.key === '.') adjustSpeed(1);
  if (event.key.toLowerCase() === 'j') { releaseDirector(); renderer.orbitBy(-18,0); }
  if (event.key.toLowerCase() === 'l') { releaseDirector(); renderer.orbitBy(18,0); }
  if (event.key.toLowerCase() === 'i') { releaseDirector(); renderer.orbitBy(0,-18); }
  if (event.key.toLowerCase() === 'k') { releaseDirector(); renderer.orbitBy(0,18); }
  if (event.key === '+' || event.key === '=') { releaseDirector(); renderer.dollyBy(-180); }
  if (event.key === '-' || event.key === '_') { releaseDirector(); renderer.dollyBy(180); }
  if (event.key.toLowerCase() === 'b' && !event.repeat) holdComparison(true);
  if (event.key.toLowerCase() === 'c') setCleanView(!cleanView);
  if (event.key.toLowerCase() === 't') showChrome();
  if (event.key.toLowerCase() === 'd') { autoDirector = !autoDirector; lastAutoChapter = null; if (autoDirector) runAutoDirector(); if (activeDrawer === 'camera') renderActiveDrawer(); }
  if (/^[0-4]$/.test(event.key)) { releaseDirector(); renderer.setCameraPreset(['globe','impact','trajectory','chase','space'][Number(event.key)]); }
  if (event.key === 'Escape') {
    if (interactionMode === 'probe') { setInteractionMode('target'); notify('Probe placement cancelled.'); }
    else if (cleanView) setCleanView(false);
    else closeDrawer();
  }
});
window.addEventListener('keyup', event => { if (event.key.toLowerCase() === 'b') holdComparison(false); });

function frame(now) {
  const dt = Math.min(0.08, (now - lastFrame) / 1000);
  lastFrame = now;
  renderer.perf.addFrameTime(dt);
  if (playing) {
    const current = timeToSlider(scenario.timelineTime);
    const position = current + dt * 13 * playbackSpeed * playbackRateAt(current);
    if (position >= 1000) { playing = false; setModelTime(CHAPTERS.at(-1).time); }
    else setModelTime(sliderToTime(position));
  }
  // One kick at contact, once per run, and only travelling forwards.
  if (scenario.timelineTime >= 0 && !contactPunched) { contactPunched = true; renderer.punch(1); }
  if (scenario.timelineTime < -0.5) contactPunched = false;
  renderer.stepCamera(dt);
  renderer.render();
  requestAnimationFrame(frame);
}

setReducedMotion(reducedMotion, { persist: false });
setInteractionMode('target');
recompute();
showChrome();
updateSummary({ force: true });
requestAnimationFrame(() => dismissOnboarding.focus({ preventScroll: true }));
requestAnimationFrame(frame);

/* ------------------------------------------------------------------ */
/* Smoke/test handle. Exposed only when the page is loaded with the    */
/* ?smoke=1 query parameter so the production surface stays clean.     */
/* ------------------------------------------------------------------ */
if (new URLSearchParams(location.search).has('smoke')) {
  window.__planetKillerSmoke = {
    boot: { ok: true, at: Date.now(), modelVersion: evaluation.result.modelVersion },
    webgl2: Boolean(renderer.gl),
    seek(time) { setModelTime(time); },
    launch() { launch(); },
    openDrawer(name) { openDrawer(name); },
    closeDrawer() { closeDrawer(); },
    applyAtlas(id) { applyAtlas(id); },
    applyClass(id) { scenario = applyImpactorClass(scenario, id); recompute(); },
    holdComparison(active) { holdComparison(Boolean(active)); },
    setCompare(key) { setCompare(key); },
    placeProbe(lng, lat) { addProbeAt({ longitude: lng, latitude: lat }); },
    orbit(dx, dy) { renderer.orbitBy(dx, dy); },
    dolly(delta) { renderer.dollyBy(delta); },
    simulateContextLoss() { canvas.dispatchEvent(new Event('webglcontextlost')); },
    // Faithful restore simulation on a live context: the driver has discarded
    // the old GPU handles, so emulate that discard first, then let the
    // renderer rebuild exactly as it would after a real restoration.
    simulateContextRestore() {
      renderer._destroyResources();
      canvas.dispatchEvent(new Event('webglcontextrestored'));
    },
    state() {
      return {
        bootError: window.__pkBootError || null,
        webgl2Supported: Boolean(renderer.gl),
        modelVersion: evaluation.result.modelVersion,
        resources: renderer.resourceSummary?.() || null,
        scenario: normalizeScenario(scenario),
        camera: renderer.getCamera(),
        visual: { time: scenario.timelineTime, chapter: chapterAtTime(scenario.timelineTime).id },
        drawStats: { ...renderer.drawStats },
        drawLog: renderer.drawLog.map(e => ({ system: e.system, type: e.type, count: e.count })),
        lifecycle: { ...renderer.lifecycle },
        perf: renderer.perf.summary(),
        comparison: { held: comparisonHeld, key: compareKey, name: compareDisplayName() },
        activeDrawer,
        playing,
        probes: probes.length,
        tsunami: { state: tsunamiStatus.state, label: tsunamiStatus.label, applicable: primaryTsunami?.applicable ?? null },
        target: { ...evaluation.target },
        checkpoints: PHASE_CHECKPOINTS
      };
    },
    recordSymbol(name, extra = {}) { renderer.perf.recordSymbol(name, extra); },
    symbols() { return renderer.perf.symbols; },
    clearPerf() { renderer.perf.clear(); },
    framebuffer(width = 96, height = 64) {
      const gl = renderer.gl;
      const w = Math.max(1, Math.min(512, width)), h = Math.max(1, Math.min(512, height));
      const rgba = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      return { rgba: Array.from(rgba), width: w, height: h };
    }
  };
  // Boot success signal: part of the smoke surface, set only under ?smoke=1.
  // (__pkBootError is set unconditionally during renderer construction because
  // it is the failure signal the harness waits on when boot does not succeed.)
  window.__pkBootReady = true;
}
