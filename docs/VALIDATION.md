# Validation Record

## Current validated baseline — model `planet-killer-0.4`

Executed in this pass (branch `arena/01a0b839-planet-killer`, working tree; reversible checkpoint = clean tree at `f6a4d8c`):

- `npm test` (`node --test tests/*.test.mjs`): **114 passed, 0 failed**.
  - 45 numerical/state/render-contract tests cover SI mass and energy, historical Chicxulub calibration, target coupling, scenario migration, epoch distinction, deterministic timeline, tsunami land blocking/depth sensitivity, location probes, renderer budgets, epoch-specific surface generation, per-cell tsunami arrival texture behavior, transient/Clean View chrome, comparison, camera ownership, probe details, accessibility paths, scenario handoff controls, and the WIS water-cut agreement between target lookup and the 66 Ma surface texture.
  - 69 upgrade tests across six new files and the baseline scenario suite cover:
    - **impactor classes** (14): six physical classes + historical reference, per-class density/velocity envelopes, `entryCouplingFactor` (cometary 0.88 / rubble 0.93 / metallic 1.03 / others 1.0), `compositionString`, safe-failure validation (`RangeError` wording), azimuth normalization, export/import round trip through the class fields, class/composition reconciliation (a known class always renders with its own composition label — stale or missing imported compositions are reconciled on normalization), and safe import of malformed documents (non-object JSON is rejected with a clean error; null normalizes to defaults).
    - **counterfactual atlas** (8): entry registry, coordinate→documented-medium resolution against the epoch land predicate (ocean entries resolve ocean, land entries resolve land), outcome measurability across target classes (sulfate far higher for carbonate shelf, water-vapor higher for ocean, silicate within the same order), and `applyAtlasEntry` immutability.
    - **provenance** (9): fixed category vocabulary, all outputs registered with the four answers, category usage, epoch-appropriate target-surface row, the reduced-order `impactor-class` row citing all five density anchors, offline-safe document links, and no probability/confidence language for ecology.
    - **camera** (13): orbit/dolly bounds and monotonic response, pitch clamping, distance bounds, preset restore, no drift on zero input, and user-input release of Auto Director state.
    - **deterministic framebuffer checkpoints** (12, executed against the stub-GL driver): Approach/Contact/ejecta-plume/tsunami/winter checkpoints pass with framebuffer evidence (non-empty, contribution present, luminance-distribution difference, phase-specific state, no NaN matrices, no GL error); ocean target runs the full sequence including the tsunami checkpoint, land target honestly skips the tsunami checkpoint; rewind reproduces identical state; extreme times stay finite; an injected GL error surfaces in `drawStats`; context loss/restore leaves resource counts flat; 12 restarts accumulate no GPU objects; epoch texture reuse is stable; the framebuffer is non-empty and non-uniform; and the draw log records each visual system per phase.
    - **lifecycle/static** (11): exactly two tsunami workers, none spawned by recompute/atlas/compare paths, request-id stale-response rejection regex, context/dispose handling regexes, in-place buffer updates (`bufferSubData`), no duplicate HTML ids, export/import round trip + rejection, tsunami determinism, share-hash stability, and no persistent diagnostic chrome.
- `npm run check`: **28 JavaScript modules** all parse; no runtime hotlinks; no production-workflow residue.
- `npm run build`: self-contained static runtime generated in `dist/` including the **full offline documentation tree** (`docs/`) so in-app provenance links resolve without network, plus bounded data notices/licenses.
- `npm run smoke:webgl` (`scripts/webgl-smoke.mjs`): the WebGL2 smoke harness is implemented with distinct failure classes (browser startup, WebGL2 unavailable, app boot, shader construction, runtime JS exception, empty framebuffer, timeline/camera/atlas/launch defects, harness timeout) and exit codes 0/1/2/3. **In this container it returns exit 3 `no-browser-executable-found`** — a conclusively demonstrated external browser-runtime blocker (no Chrome/Chromium executable and no reachable browser download host). The report is written to `docs/qa/webgl-smoke-report.json`. In CI (`.github/workflows/ci.yml`) a headless Chromium is installed and the harness executes the full proof.
- `npm run perf` (`scripts/perf-report.mjs`): the raw-measurement performance collector is implemented for the six scenario matrix (idle, impact playback, peak plume, tsunami, Atlas, synchronized comparison) plus a context loss/restore cycle with resource accounting; it writes `docs/qa/perf-report.json`. In this container it records the same external browser blocker instead of fabricating numbers.
- Present-day GSHHG-derived 2-degree land/sea lookup passes representative continental/open-ocean regression checks; modern and 66 Ma generated surface textures are materially distinct in the render contract tests.
- Historical fixture remains Chicxulub-scale: impact energy in the declared `10^23 J` envelope, final crater roughly 150–230 km in the reduced-order surrogate, ecological output at the broad K–Pg-scale stress category without claiming an extinction probability.

## Render validation status

Source-level WebGL2 contracts and the deterministic stub-GL framebuffer checkpoint suite are passing. A decisive **live-GPU** rendered QA pass is not established in this container: no WebGL2-capable browser executable exists here and no browser download host is reachable. The stub-GL suite carries the executed state/framebuffer/resource-lifecycle proof; the live-hardware visual pass, pointer/touch feel, and device FPS remain **UNVERIFIED** until `npm run smoke:webgl` runs with a real browser (as CI provisions).

## Not claimed

- hydrocode fidelity;
- general circulation model fidelity;
- survey-grade modern coastline/bathymetry;
- a transformed EarthByte/GPlates 66 Ma dataset or published 66 Ma paleobathymetry calibration;
- exact fatality or extinction probabilities;
- representative-device frame-rate, thermal, or GPU-memory claims (raw measurements only, where captured);
- live-hardware rendered visual QA or rendered mobile/touch/screen-reader QA in this environment;
- a verified GitHub Pages deployment (workflow present; see `docs/OPERATIONAL_STATE.md` — status UNVERIFIED until a run completes).
