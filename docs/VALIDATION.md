# Validation Record

## Current validated baseline — model `planet-killer-0.4`

Executed in the reconstruction/publish pass:

- `node --test tests/*.test.mjs`: **41 passed, 0 failed**.
  - 36 numerical/state tests cover SI mass and energy, historical Chicxulub calibration, target coupling, scenario migration, epoch distinction, deterministic timeline, tsunami land blocking/depth sensitivity, and location probes.
  - 5 browser/render contract tests cover renderer budgets, epoch-specific surface generation, per-cell tsunami arrival texture behavior, transient/Clean View chrome, comparison, camera ownership, probe details, accessibility paths, and scenario handoff controls.
- `node scripts/check-project.mjs`: **22 JavaScript modules**, all parse; no runtime hotlinks; no production-workflow residue.
- `node scripts/build.mjs`: **31-file** self-contained static runtime generated in `dist/`, including bounded data notices/licenses.
- Web authorship audit over `dist/`: **PASS**, 31 files scanned, zero findings.
- Served-build checks returned HTTP **200** for `/`, `/styles.css`, `/src/main.js`, and `/src/render/webgl/Renderer.js`.
- Present-day GSHHG-derived **2-degree** land/sea lookup passes representative continental/open-ocean regression checks.
- Modern and 66 Ma generated surface textures are materially distinct in the render contract tests.
- Historical fixture remains Chicxulub-scale: impact energy is in the declared `10^23 J` envelope, final crater is roughly 150–230 km in the reduced-order surrogate, and ecological output reaches the broad K–Pg-scale stress category without claiming an extinction probability.

## Render validation status

Source-level WebGL2 contracts are passing, but a decisive GPU-rendered visual QA pass is not established in this container. Prior Chromium attempts in this environment failed at EGL/ANGLE graphics initialization. Until a working WebGL2 browser path is exercised, rendered shader quality, pointer/touch feel, device FPS, and screen-reader traversal remain unverified.

## Not claimed

- hydrocode fidelity;
- general circulation model fidelity;
- survey-grade modern coastline/bathymetry;
- a transformed EarthByte/GPlates 66 Ma dataset;
- published 66 Ma paleobathymetry calibration;
- exact fatality or extinction probabilities;
- representative-device frame-rate, thermal, GPU-memory, or context-loss proof;
- rendered mobile/touch/screen-reader QA.
