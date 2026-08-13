# Operational State: PLANET KILLER

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "planet-killer",
  "project_name": "PLANET KILLER",
  "project_root": "/mnt/data/Planet_Killer",
  "artifact_path": "/mnt/data/Planet_Killer",
  "state_revision": 12,
  "last_updated": "2026-08-13T08:06:39Z",
  "current_baseline": {
    "identity": "main commit 40beed97c82dd7c424ddeaa1a5c5a98312a6cd10 / tree de9e9623171d7c6fa18275fc7d1dbecb48e1f10d",
    "state": "partially-verified",
    "last_verified": "2026-08-13T08:06:39Z"
  },
  "scope_boundaries": ["Planet Killer source, tests, docs, bundled data provenance, build, repository publication, and browser presentation"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

- Project: Planet Killer counterfactual K-Pg browser simulation.
- Repository: `westkitty/Planet_Killer`.
- Final delivery ref: `main`.
- Scope: source, tests, docs, bundled modern-Earth provenance, build, publication, and browser presentation.

## 2. Current Baseline

- State: `partially-verified`.
- Published `main` is commit `40beed97c82dd7c424ddeaa1a5c5a98312a6cd10` with tree `de9e9623171d7c6fa18275fc7d1dbecb48e1f10d`.
- Parent `e2fbe81557903e2c0ec1622e07cf448ef672fda7` added the explicit `.fallback[hidden]{display:none}` guard after the full-screen blank overlay defect was identified.
- Current baseline replaces the generic glass-card presentation with a cinematic observatory/instrument interface while preserving the simulation DOM and browser controller contracts.
- Regression gates after the redesign: 41/41 tests; 22-module project check; production build success; web-authorship PASS.
- Implemented but unverified: final visual acceptance on the user Mac, rendered WebGL2 appearance, pointer/touch feel, camera/Auto Director runtime behavior, clipboard/download paths, screen-reader traversal, and representative-device performance.
- Scientific limitation: 66 Ma geography/depth remain explicit proxies.

## 3. Artifact Contract

Dependency-free WebGL2 catastrophe-first simulation with deterministic seekable time, user-owned camera, explicit calculation/surrogate/proxy/illustration boundaries, distinct modern and 66 Ma states, bounded worker-based tsunami propagation, accessible transient controls, reproducible scenario handoff, and a cinematic interface that keeps the catastrophe viewport visually dominant.

## 4. Active Invariants

- **INV-001 — Catastrophe-first viewport:** partially verified. Static contracts and presentation hierarchy pass; direct rendered visual approval is pending.
- **INV-002 — Deterministic time + user camera ownership:** partially verified. Timeline determinism is test-verified; camera override is source/static-verified but not browser-runtime-verified.
- **INV-003 — Science/provenance boundaries:** verified by regression tests and aligned science/provenance documents.
- **INV-004 — Distinct epochs:** partially verified. Modern GSHHG/ETOPO derivatives are packaged/tested; 66 Ma remains a coarse proxy with no numerical paleobathymetry.
- **INV-005 — Publication:** verified. `main` was published non-force and read back; temporary publication machinery is absent.
- **INV-006 — Hidden fallback must stay hidden:** verified statically by `.fallback[hidden]{display:none}` plus the existing UI contract suite.

## 5. Verified Working Behavior

- **VER-001:** 41 automated numerical/static/browser-render contract tests pass after the redesign.
- **VER-002:** project check passes for 22 JS modules with no runtime hotlinks or production-workflow residue.
- **VER-003:** production build succeeds with bundled notices/licenses; web-authorship audit returns PASS.
- **VER-004:** current redesign stylesheet is durable on `main` as blob `747df73ad7571b1b0f42c51cfe37d2c4e0463f02`.
- **VER-005:** clean `main` publication remains verified; current main commit is `40beed97c82dd7c424ddeaa1a5c5a98312a6cd10`.

## 6. Known Not Working

- No active numerical/test/build failure.
- Previous blank-screen behavior was traced to `.fallback` overriding the HTML `hidden` attribute; the explicit hidden-state rule is now a regression guard.
- This environment has not produced a successful GPU-rendered WebGL2 QA session; prior Chromium EGL/ANGLE initialization failed.
- The redesigned presentation is source/test/build verified but awaits direct visual approval on the user Mac.

## 7. Implemented but Unverified

- Cinematic observatory/instrument visual hierarchy: editorial onboarding, narrow command rail, corrected eight-column timeline, serious instrument drawers, responsive mobile treatment, and scene vignette.
- Full rendered catastrophe appearance and visual balance against the WebGL scene.
- Pointer/touch camera feel, Auto Director release, A/B visual switching, probe marker behavior, Clean View capture behavior, reduced motion, browser clipboard/downloads, and screen-reader/focus traversal.
- Representative-device performance and long-session lifecycle behavior.

## 8. Unknown or Evidence-Stale State

- User visual acceptance of the redesign on the MacBook display.
- Desktop/mobile sustained FPS, GPU memory/context loss, thermal throttling, and screen-reader behavior.
- Fidelity against a real transformed 66 Ma reconstruction and numerical paleobathymetry.

## 9. Pending Work

- Direct visual acceptance of the redesigned browser presentation.
- Package the requested standalone macOS/Dock wrapper only after the browser presentation is accepted, so the wrapper does not freeze a rejected visual state.
- GPU-rendered browser QA, representative-device performance, and higher-fidelity 66 Ma reconstruction remain declared limitations.

## 10. Active Decisions, Defaults, and Prohibitions

- Historical default: 12 km, 3000 kg/m³, 20 km/s, 60°, azimuth 135°, 66 Ma Chicxulub-area carbonate/evaporite shelf proxy.
- Modern spatial data: 2-degree GSHHG land/sea derivative plus 32×16 ETOPO1 visual luminance derivative.
- 66 Ma geography/depth remain explicit proxies; never silently substitute modern geography.
- Runtime remains dependency-free native WebGL2 + semantic DOM.
- Presentation direction: cinematic scientific instrument, not generic dashboard/glassmorphism; the planetary scene remains dominant.
- Do not add a second WebGL/canvas effects runtime merely for decoration while the core renderer already owns the GPU path.
- Never claim hydrocode, GCM, local-hazard, fatality, or extinction-probability fidelity.
- Never force-push `main`; never claim publication without remote read-back.

## 11. Validation and Evidence Matrix

| ID | Capability | State | Evidence | Recheck trigger |
|---|---|---|---|---|
| INV-001 | Catastrophe-first viewport | partially-verified | redesigned CSS + static UI/render contracts | visual/UI change |
| INV-002 | Deterministic time + camera ownership | partially-verified | time tests + controller source contracts | timeline/camera change |
| INV-003 | Science/provenance boundaries | verified | tests + docs + provenance | science/model change |
| INV-004 | Distinct epochs | partially-verified | modern derivative tests + explicit 66 Ma proxy | epoch change |
| INV-005 | Non-force publication/read-back | verified | clean main publication/read-back | main/ref change |
| INV-006 | Hidden fallback guard | verified | `.fallback[hidden]{display:none}` + UI contract test | fallback/CSS change |
| VER-001 | Automated suite | verified | 41/41 after redesign | source/test change |
| VER-002 | Project check | verified | 22 modules | source/build change |
| VER-003 | Build/authorship | verified | build success + authorship PASS | package/CSS change |
| VER-004 | Redesign stylesheet durability | verified | main blob `747df73a...` | CSS change |
| UNV-001 | Rendered browser experience | implemented-unverified | source/static evidence only | user/browser visual check |
| PND-001 | macOS Dock wrapper | pending | intentionally gated on accepted browser presentation | visual acceptance |

## 12. Current Change Scope and Impact Radius

- Current work is presentation-only: preserve all simulation behavior while replacing the rejected generic dashboard aesthetic with a cinematic instrument-panel hierarchy.
- Protected surfaces: numerical regression behavior, deterministic time, modern/66 Ma distinction, provenance package, user-camera priority, transient UI, accessibility paths, no-runtime-dependency constraint, and hidden fallback behavior.
- Stop condition for this pass: redesigned source is published and regression-clean; final visual approval must come from the actual Mac browser before wrapper packaging.

## 13. Compact Revision Log

- Revision 9: source reconstructed after failed archive publication; local validation passed, durable publication remained incomplete.
- Revision 10: evidence reconciled conservatively after direct-file reconstruction to `tmp-do-not-use`; current 41-test / 22-module / 31-file baseline recorded.
- Revision 11: GitHub-hosted validation passed; clean source published to `main`; tree/read-back and temporary-path absence verified.
- Revision 12: corrected the full-screen fallback overlay regression and replaced the generic glass-card presentation with a cinematic observatory/instrument interface. Regression gates remain green. User visual approval and Dock-wrapper packaging are pending.
