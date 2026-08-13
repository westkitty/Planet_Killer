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
const chapterSelect = document.querySelector('#chapter-select');
const speedSelect = document.querySelector('#speed-select');
const playPause = document.querySelector('#play-pause');
const toast = document.querySelector('#toast');
const srSummary = document.querySelector('#sr-summary');

let renderer;
try { renderer = new Renderer(canvas); }
catch (error) { fallback.hidden = false; fallback.textContent = error.message; throw error; }

let scenario = cloneScenario(HISTORICAL_SCENARIO);
try {
  const shared = scenarioFromHash(location.hash);
  if (shared) scenario = importScenario(shared);
} catch { /* malformed share hashes fall back to the historical reference */ }

let evaluation = evaluateScenario(scenario);
let compareKey = 'historical';
let compareEvaluation = evaluateScenario(PRESETS[compareKey]);
let comparisonHeld = false;
let probes = [];
let probeResults = [];
let interactionMode = 'target';
let activeDrawer = null;
let playing = false;
let playbackSpeed = 1;
let autoDirector = false;
let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let cleanView = false;
let lastFrame = performance.now();
let lastAutoChapter = null;
let chromeTimer = 0;
let tsunamiTimer = 0;
let primaryTsunami = null;
let compareTsunami = null;
const bookmarks = new Map();
const pointerMap = new Map();
let primaryPointer = null;
let pointerMoved = false;
let pinchDistance = null;

const primaryWorker = new Worker(new URL('./workers/tsunamiWorker.js', import.meta.url), { type: 'module' });
const compareWorker = new Worker(new URL('./workers/tsunamiWorker.js', import.meta.url), { type: 'module' });
primaryWorker.onmessage = ({ data }) => { primaryTsunami = data.ok ? data.field : null; if (!comparisonHeld) renderer.setTsunamiField(primaryTsunami); refreshProbeResults(); };
compareWorker.onmessage = ({ data }) => { compareTsunami = data.ok ? data.field : null; if (comparisonHeld) renderer.setTsunamiField(compareTsunami); };

function workerPayload(current) {
  return { epochId: current.scenario.epochId, source: current.scenario.target, crater: current.result.crater, impactor: current.result.impactor, width: 72, height: 36 };
}

function requestTsunami() {
  clearTimeout(tsunamiTimer);
  tsunamiTimer = setTimeout(() => {
    primaryWorker.postMessage(workerPayload(evaluation));
    compareWorker.postMessage(workerPayload(compareEvaluation));
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
  slider.value = String(Math.round(timeToSlider(scenario.timelineTime)));
  timeOutput.value = formatModelTime(scenario.timelineTime);
  timeOutput.textContent = formatModelTime(scenario.timelineTime);
  chapterSelect.value = chapterAtTime(scenario.timelineTime).id;
  playPause.textContent = playing ? 'Ⅱ' : '▶';
  playPause.setAttribute('aria-label', playing ? 'Pause' : 'Play');
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

function renderActiveDrawer() {
  if (!activeDrawer) { drawer.hidden = true; drawer.innerHTML = ''; return; }
  drawer.hidden = false;
  drawer.innerHTML = renderDrawer(activeDrawer, { scenario, evaluation, probes: probeResults, compareKey, autoDirector, reducedMotion });
}

function openDrawer(name) { activeDrawer = name; renderActiveDrawer(); showChrome(); }
function closeDrawer() { activeDrawer = null; renderActiveDrawer(); scheduleChromeHide(); }

function showChrome() {
  if (cleanView) return;
  edgeControls.classList.remove('hidden-chrome'); timeline.classList.add('revealed');
  clearTimeout(chromeTimer); chromeTimer = setTimeout(scheduleChromeHide, 2600);
}
function scheduleChromeHide() {
  clearTimeout(chromeTimer);
  chromeTimer = setTimeout(() => { if (playing && !activeDrawer && !onboarding.hidden && false) return; if (playing && !activeDrawer) { edgeControls.classList.add('hidden-chrome'); timeline.classList.remove('revealed'); } }, 1200);
}
function setCleanView(value) { cleanView = Boolean(value); document.body.classList.toggle('clean-view', cleanView); if (!cleanView) showChrome(); }
function setReducedMotion(value) { reducedMotion = Boolean(value); document.body.classList.toggle('reduced-motion', reducedMotion); renderActiveDrawer(); }

function notify(message) {
  toast.textContent = message; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function updateSummary() {
  const chapter = chapterAtTime(scenario.timelineTime).label;
  srSummary.textContent = `${chapter}. ${formatModelTime(scenario.timelineTime)}. Target ${evaluation.target.className}. ${evaluation.result.ecology.category}.`;
}

function refreshProbeResults() {
  probeResults = probes.map(p => ({ ...p, result: probeResult({ ...p, source: scenario.target, result: evaluation.result, tsunamiField: primaryTsunami }) }));
  renderer.setProbes(probes);
  if (activeDrawer === 'science') renderActiveDrawer();
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
  notify(active ? `B: ${PRESETS[compareKey].name}` : 'A: current scenario');
}

function setCompare(key) {
  if (!PRESETS[key]) return;
  compareKey = key;
  compareEvaluation = evaluateScenario({ ...PRESETS[key], timelineTime: scenario.timelineTime });
  compareTsunami = null; requestTsunami(); renderActiveDrawer();
}

function chapterStep(direction) {
  const current = chapterAtTime(scenario.timelineTime), index = CHAPTERS.findIndex(c => c.id === current.id);
  const next = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, index + direction))];
  setModelTime(next.time);
}

function launch() { setModelTime(-30); playing = true; syncTimeline(); scheduleChromeHide(); }

function addProbeAt(hit) {
  if (probes.length >= 4) { notify('Four-probe limit reached.'); return; }
  probes.push({ longitude: hit.longitude, latitude: hit.latitude }); interactionMode = 'target'; refreshProbeResults(); renderActiveDrawer(); notify(`Probe ${probes.length} placed.`);
}

function setTargetAt(hit) {
  scenario.target = { longitude: hit.longitude, latitude: hit.latitude };
  recompute(); notify(`Target: ${hit.latitude.toFixed(2)}°, ${hit.longitude.toFixed(2)}°`);
}

function isTyping(event) { return /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || ''); }

edgeControls.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.drawer) openDrawer(button.dataset.drawer);
  if (button.dataset.action === 'launch') launch();
});
document.querySelector('#dismiss-onboarding').addEventListener('click', () => { onboarding.hidden = true; showChrome(); });
document.querySelector('#open-science-intro').addEventListener('click', () => { onboarding.hidden = true; openDrawer('science'); });

timeline.addEventListener('click', event => {
  const action = event.target.closest('button')?.dataset.timeAction; if (!action) return;
  if (action === 'restart') { playing = false; setModelTime(-30); }
  if (action === 'back') chapterStep(-1);
  if (action === 'forward') chapterStep(1);
  if (action === 'play') playing = !playing;
  syncTimeline(); showChrome();
});
slider.addEventListener('input', () => { playing = false; setModelTime(sliderToTime(slider.value)); });
chapterSelect.addEventListener('change', () => setModelTime(CHAPTERS.find(c => c.id === chapterSelect.value)?.time ?? scenario.timelineTime));
speedSelect.addEventListener('change', () => { playbackSpeed = Number(speedSelect.value) || 1; });

drawer.addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.closeDrawer !== undefined) return closeDrawer();
  if (button.dataset.preset === 'historical') { scenario = cloneScenario(HISTORICAL_SCENARIO); recompute(); }
  if (button.dataset.camera) { releaseDirector(); renderer.setCameraPreset(button.dataset.camera); }
  if (button.dataset.autoDirector !== undefined) { autoDirector = !autoDirector; lastAutoChapter = null; if (autoDirector) runAutoDirector(); renderActiveDrawer(); }
  if (button.dataset.bookmarkSave) { bookmarks.set(button.dataset.bookmarkSave, renderer.getCamera()); notify(`Camera ${button.dataset.bookmarkSave} saved.`); }
  if (button.dataset.bookmarkRecall) { const saved = bookmarks.get(button.dataset.bookmarkRecall); if (saved) { releaseDirector(); renderer.setCamera(saved); } else notify('Bookmark is empty.'); }
  if (button.dataset.compare) setCompare(button.dataset.compare);
  if (button.dataset.probeAdd !== undefined) { interactionMode = 'probe'; closeDrawer(); notify('Click Earth to place a probe.'); }
  if (button.dataset.probeClear !== undefined) { probes = []; refreshProbeResults(); renderActiveDrawer(); }
  if (button.dataset.cleanView !== undefined) { setCleanView(!cleanView); closeDrawer(); }
  if (button.dataset.reducedMotion !== undefined) setReducedMotion(!reducedMotion);
  if (button.dataset.export !== undefined) downloadText('planet-killer-scenario.json', exportScenario(scenario));
  if (button.dataset.share !== undefined) { try { await copyShareLink(exportScenario(scenario)); notify('Share link copied.'); } catch { notify('Could not copy share link.'); } }
  if (button.dataset.import !== undefined) {
    try { scenario = importScenario(document.querySelector('#scenario-json').value); recompute(); notify('Scenario imported.'); }
    catch (error) { notify(`Import failed: ${error.message}`); }
  }
  if (button.dataset.capture !== undefined) {
    const wasClean = cleanView; setCleanView(true); renderer.render(); await new Promise(requestAnimationFrame);
    try { await captureFrame(canvas, { scenario: normalizeScenario(scenario), time: scenario.timelineTime, camera: renderer.getCamera(), target: evaluation.target, models: { crater: evaluation.result.crater.model, climate: evaluation.result.climate.model } }); notify('Frame + metadata captured.'); }
    catch (error) { notify(error.message); }
    finally { setCleanView(wasClean); }
  }
});
drawer.addEventListener('input', event => { const path = event.target.dataset.field; if (path) applyField(path, event.target.value); });
drawer.addEventListener('change', event => { if (event.target.dataset.field) renderActiveDrawer(); });

canvas.addEventListener('pointerdown', event => {
  canvas.setPointerCapture(event.pointerId); pointerMap.set(event.pointerId, { x:event.clientX, y:event.clientY });
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
  if (isTyping(event)) return;
  if (event.code === 'Space') { event.preventDefault(); playing = !playing; syncTimeline(); }
  if (event.key === 'ArrowLeft') chapterStep(-1);
  if (event.key === 'ArrowRight') chapterStep(1);
  if (event.key.toLowerCase() === 'b' && !event.repeat) holdComparison(true);
  if (event.key.toLowerCase() === 'c') setCleanView(!cleanView);
  if (event.key.toLowerCase() === 't') showChrome();
  if (event.key.toLowerCase() === 'd') { autoDirector = !autoDirector; lastAutoChapter = null; if (autoDirector) runAutoDirector(); }
  if (/^[0-4]$/.test(event.key)) { releaseDirector(); renderer.setCameraPreset(['globe','impact','trajectory','chase','space'][Number(event.key)]); }
  if (event.key === 'Escape') { if (cleanView) setCleanView(false); else closeDrawer(); }
});
window.addEventListener('keyup', event => { if (!isTyping(event) && event.key.toLowerCase() === 'b') holdComparison(false); });

function frame(now) {
  const dt = Math.min(0.08, (now - lastFrame) / 1000); lastFrame = now;
  if (playing) {
    const position = timeToSlider(scenario.timelineTime) + dt * 13 * playbackSpeed;
    if (position >= 1000) { playing = false; setModelTime(CHAPTERS.at(-1).time); }
    else setModelTime(sliderToTime(position));
  }
  renderer.render();
  requestAnimationFrame(frame);
}

setReducedMotion(reducedMotion);
recompute();
showChrome();
requestAnimationFrame(frame);
