# Requirement Traceability

Status vocabulary: **PASS** = implemented and supported by executed evidence; **PARTIAL** = bounded implementation exists but a required fidelity/runtime proof remains; **UNVERIFIED** = source exists but decisive runtime evidence is unavailable; **PENDING** = implementation is ready but an external delivery action is not yet verified.

| ID | Requirement group | Status | Current evidence | Remaining gap |
|---|---|---|---|---|
| RQ-01 | Catastrophe-first transient chrome and Clean View | PARTIAL | `index.html`, `styles.css`, `src/main.js`; UI contract test | Rendered occupancy not visually inspected in working WebGL2 browser |
| RQ-02 | Interactive 3D Earth, orbit/zoom, target picking | UNVERIFIED | `src/render/webgl/Renderer.js`; pointer/wheel/pinch/keyboard controller paths | Real browser interaction not executed here |
| RQ-03 | Inertial rich star environment, solar cue, atmosphere | UNVERIFIED | `RENDER_BUDGETS`: 2,400 stars + 1,500 Milky Way points + solar sprite; atmosphere shader | GPU-rendered appearance unverified |
| RQ-04 | Distinct present-day and 66 Ma Earth states | PARTIAL | 2° GSHHG-derived modern land mask, 32×16 ETOPO1 visual relief, separate `cretaceous66.js`; epoch tests | 66 Ma remains project-owned proxy; no numerical paleobathymetry |
| RQ-05 | Multiple impactor compositions and editable parameters | PASS | `src/ui/drawers.js`, `src/simulation/scenario.js`, `src/simulation/core.js` | Entry physics remain reduced-order |
| RQ-06 | Diameter/density/velocity/angle affect the model | PASS | `tests/core.test.mjs`; SI-derived mass/energy and crater/climate coupling | None for implemented reduced-order scope |
| RQ-07 | SI mass/energy discipline | PASS | `impactorMass`, `kineticEnergy`, `verticalVelocity` + regression tests | None |
| RQ-08 | Historical Chicxulub calibration fixture | PASS | `HISTORICAL_SCENARIO` + core regressions | Literature envelope intentionally coarse |
| RQ-09 | Target-dependent material/climate outcomes | PASS | `target.js`, `core.js`; sulfate-loading regression | Global chemistry is categorical proxy |
| RQ-10 | Deterministic seekable seconds-to-years timeline | PASS | `timeline.js`; round-trip/rewind determinism tests | Rendered VFX reconstruction remains visually unverified |
| RQ-11 | User-owned camera, presets, bookmarks, optional Auto Director | PARTIAL | `Renderer` camera methods; main controller manual-input release; static contract test | Runtime feel/transitions unverified |
| RQ-12 | Distinct approach/entry/contact/crater/ejecta/plume/atmosphere VFX | UNVERIFIED | renderer shaders/point systems + deterministic timeline state | Visual distinction requires GPU inspection |
| RQ-13 | Three-dimensional plume / atmospheric particulate field | PARTIAL | dedicated plume, vapor, ejecta, dust point budgets | Illustrative point volume, not volumetric transport solver |
| RQ-14 | Location-sensitive tsunami with land blocking and depth-sensitive speed | PASS solver / UNVERIFIED visual | `tsunami.js`, worker, tsunami tests, per-cell arrival texture test | Proxy depths; rendered field unverified |
| RQ-15 | Long-timescale climate state coupled to atmosphere | PARTIAL | target-coupled loading + climate envelope + atmospheric darkness state | No GCM; rendered result unverified |
| RQ-16 | Time-synchronized visual A/B comparison | PARTIAL | hold-B controller path; comparison drawer A→B target/energy/crater/light/ecology details | Real-time visual switch unverified |
| RQ-17 | Science/results are summoned rather than persistent | PASS source/static | drawer starts hidden; transient timeline; Clean View CSS; static test | Visual occupancy not GPU-inspected |
| RQ-18 | Provenance/uncertainty distinguish calculation, surrogate, proxy, illustration | PASS | model strings, target quality labels, Science copy, `SCIENCE.md`, `SOURCES.md` | Per-value citation UI could expand |
| RQ-19 | Scenario JSON import/export/share URL and frame capture | PARTIAL | `scenario.js`, `ui/io.js`, controller contract test | Browser clipboard/download path unverified |
| RQ-20 | Keyboard accessibility and reduced motion | PARTIAL | Space, time steps/jumps, speed, camera orbit/zoom, presets, B/C/T/D, semantic labels, reduced-motion CSS | Screen-reader/focus runtime unverified |
| RQ-21 | Responsive mobile core flow | UNVERIFIED | mobile CSS + Pointer Events/pinch path | No mobile browser run |
| RQ-22 | Bounded performance architecture | PARTIAL | one render loop, worker tsunami solve, DPR cap, explicit per-effect budgets | FPS/memory/thermal/context-loss evidence absent |
| RQ-23 | No paid API/login/runtime hotlink | PASS | project integrity check and self-contained build | None |
| RQ-24 | Source/provenance notices and licenses | PASS | Root and `docs/resources/` notices, derivative hash manifest, retained LGPL text, retained MIT text; published `main` tree read-back verified | None |
| RQ-25 | Automated scientific/browser tests | PASS | **41/41** executed tests | Broader reference-case coverage can expand |
| RQ-26 | Browser interaction validation | PARTIAL | static interface/render contracts + served module resolution | Real WebGL browser interaction unavailable here |
| RQ-27 | Visual QA capture states | UNVERIFIED | `VISUAL_QA.md`; deterministic capture implementation | Current rendered screenshots not produced here |
| RQ-28 | Production build | PASS | check/build/authorship/HTTP gates all pass | None for static package |
| RQ-29 | Non-force remote `main` publication and read-back | PASS | GitHub Actions validated staging and published fast-forward source commit `369628a6c407fdf6e5ee156a79babcd51e38f50d` / tree `df201ce5bf6ad9e547be6742ca2d8cb04d26b30c`; root/tests/critical source blobs read back and publication debris absent | None |
| RQ-30 | Probes, chapter navigation, clean capture, exploration layer | PARTIAL | up to 4 probes with arrival/severity details; chapters; camera modes; capture sidecar | Browser interaction/download proof pending |

## Current delivery verdict

The reconstructed implementation passes the available numerical, static, build, authorship, served-file, and remote-publication gates. Clean `main` publication and read-back are verified. GPU-rendered visual QA and a real 66 Ma reconstruction/paleobathymetry remain explicitly declared limitations rather than silently substituted claims.
