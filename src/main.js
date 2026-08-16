import { Renderer } from './render/webgl/Renderer.js';
import { evaluateScenario } from './simulation/engine.js';
import { HISTORICAL_SCENARIO, PRESETS, cloneScenario, normalizeScenario, exportScenario, importScenario } from './simulation/scenario.js';
import { CHAPTERS, chapterAtTime, sliderToTime, timeToSlider, visualStateAtTime, formatModelTime } from './simulation/timeline.js';
import { probeResult } from './simulation/probes.js';
import { renderDrawer } from './ui/drawers.js';
import { downloadText, scenarioFromHash, copyShareLink, captureFrame } from './ui/io.js';

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
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const MOTION_KEY = 'planet-killer-motion';

let renderer;
try { renderer = new Renderer(canvas); }
catch (error) { fallback.hidden = false; fallback.textContent = error.message; throw error; }

let scenario = cloneScenario(HISTORICAL_SCENARIO);
try {
  const shared = scenarioFromHash(location.hash);
  if (shared) scenario = importScenario(shared);
} catch { /* malformed share hashes fall back to the historical reference */ }

let motionPreference = null;
try { motionPreference = localStorage.getItem(MOTION_KEY); } catch { /* storage can be unavailable */ }
if (!['reduce', 'normal'].includes(motionPreference)) motionPreference = null;

let evaluation = evaluateScenario(scenario);
let compareKey = 'historical';
let compareEvaluation = evaluateScenario(PRESETS[compareKey]);
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
let chromeTimer = 0;
let tsunamiTimer = 0;
let toastTimer = 0;
let launchPulseTimer = 0;
let primaryTsunami = null;
let compareTsunami = null;
let tsunamiStatus = { state: 'updating', label: 'Tsunami field updating' };
let tsunamiRequestId = 0;
let importStatus = null;
let lastSummaryAt = 0;
let lastSummaryChapter = '';
const bookmarks = new Map();
const pointerMap = new Map();
let primaryPointer = null;
let pointerMoved = false;
let pinchDistance = null;

const primaryWorker = new Worker(new URL('./workers/tsunamiWorker.js', import.meta.url), { type: 'module' });
const compareWorker = new Worker(new URL('./workers/tsunamiWorker.js', import.meta.url), { type: 'module' });
primaryWorker.onmessage = ({ data }) => {
  if (data.requestId !== tsunamiRequestId) return;
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
};
primaryWorker.onerror = () => {
  tsunamiStatus = { state: 'error', label: 'Tsunami worker error' };
  primaryTsunami = null;
  if (activeDrawer === 'science') renderActiveDrawer();
  notify('Tsunami worker failed. Other model results remain available.');
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
    primaryWorker.postMessage(workerPayload(evaluation, requestId));
    compareWorker.postMessage(workerPayload(compareEvaluation, requestId));
  }, 80);
}

function recompute({ refreshDrawer = true } = {}) {
  scenario = normalizeScenario(scenario);
  evaluation = evaluateScenario(scenario);
  compareEvaluation = evaluateScenario({ ...PRESETS[compareKey], timelineTime: scenario.timelineTime });
  renderer.setEvaluation(comparisonHeld ? compareEvaluation : evaluation);
  renderer.setProbes(probes);
  requestTsunami();
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

function syncTimeline() {
  const sliderValue = Math.round(timeToSlider(scenario.timelineTime));
  const chapter = chapterAtTime(scenario.timelineTime);
  slider.value = String(sliderValue);
  slider.style.setProperty('--timeline-progress', `${sliderValue / 10}%`);
  timeOutput.value = formatModelTime(scenario.timelineTime);
  timeOutput.textContent = formatModelTime(scenario.timelineTime);
  phaseOutput.value = chapter.label;
  phaseOutput.textContent = chapter.label;
  chapterSelect.value = chapter.id;
  playPause.textContent = playing ? 'Ⅱ' : '▶';
  playPause.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  playPause.setAttribute('aria-pressed', String(playing));
  playPause.dataset.state = playing ? 'playing' : 'paused';
  launchButton.dataset.running = String(playing);
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
  const key = Object.keys(element.dataset).find(name => ['closeDrawer','autoDirector','bookmarkSave','bookmarkRecall','compare','probeAdd','probeRemove','probeClear','cleanView','reducedMotion','export','share','import','capture'].includes(name));
  if (!key) return null;
  const attribute = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  const value = element.dataset[key];
  return value ? `[data-${attribute}="${CSS.escape(value)}"]` : `[data-${attribute}]`;
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
    importStatus
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
  toast.setAttribute('aria-hidden', cleanView ? 'true' : 'false');
  if (!cleanView) {
    toast.removeAttribute('aria-hidden');
    renderActiveDrawer();
    showChrome();
  }
}

function setReducedMotion(value, { persist = true } = {}) {
  reducedMotion = Boolean(value);
  document.body.classList.toggle('reduced-motion', reducedMotion);
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

function holdComparison(active) {
  if (comparisonHeld === active) return;
  comparisonHeld = active;
  const current = active ? compareEvaluation : evaluation;
  renderer.setEvaluation({ ...current, visual: visualStateAtTime(scenario.timelineTime) });
  renderer.setTsunamiField(active ? compareTsunami : primaryTsunami);
  renderer.setProbes(active ? [] : probes);
  syncComparisonUI();
  notify(active ? `B: ${PRESETS[compareKey].name}` : 'A: current scenario');
}

function setCompare(key) {
  if (!PRESETS[key]) return;
  compareKey = key;
  compareEvaluation = evaluateScenario({ ...PRESETS[key], timelineTime: scenario.timelineTime });
  compareTsunami = null;
  requestTsunami();
  renderActiveDrawer();
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
  playing = true;
  syncTimeline();
  clearTimeout(launchPulseTimer);
  launchButton.classList.remove('launching');
  void launchButton.offsetWidth;
  launchButton.classList.add('launching');
  launchPulseTimer = setTimeout(() => launchButton.classList.remove('launching'), 900);
  notify('Impact sequence launched.');
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
  notify(`Target: ${hit.latitude.toFixed(2)}°, ${hit.longitude.toFixed(2)}°`);
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
  if (button.dataset.preset === 'historical') { scenario = cloneScenario(HISTORICAL_SCENARIO); importStatus = null; recompute(); }
  if (button.dataset.camera) { releaseDirector(); renderer.setCameraPreset(button.dataset.camera); }
  if (button.dataset.autoDirector !== undefined) { autoDirector = !autoDirector; lastAutoChapter = null; if (autoDirector) runAutoDirector(); renderActiveDrawer(); }
  if (button.dataset.bookmarkSave) { bookmarks.set(button.dataset.bookmarkSave, renderer.getCamera()); notify(`Camera ${button.dataset.bookmarkSave} saved.`); renderActiveDrawer(); }
  if (button.dataset.bookmarkRecall) { const saved = bookmarks.get(button.dataset.bookmarkRecall); if (saved) { releaseDirector(); renderer.setCamera(saved); } }
  if (button.dataset.compare) setCompare(button.dataset.compare);
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
      importStatus = { tone: 'error', message: `Import failed: ${error.message}` };
      renderActiveDrawer();
      requestAnimationFrame(() => {
        const input = drawer.querySelector('#scenario-json');
        if (!input) return;
        input.value = invalidDraft;
        input.focus({ preventScroll: true });
      });
    }
  }
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
drawer.addEventListener('change', event => { if (event.target.dataset.field) renderActiveDrawer(); });

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
  if (playing) {
    const position = timeToSlider(scenario.timelineTime) + dt * 13 * playbackSpeed;
    if (position >= 1000) { playing = false; setModelTime(CHAPTERS.at(-1).time); }
    else setModelTime(sliderToTime(position));
  }
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
