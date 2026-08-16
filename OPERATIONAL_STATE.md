# Operational State: PLANET KILLER

<!-- operational-state:metadata
{
  "artifact_path": "/mnt/data/Planet_Killer",
  "current_baseline": {
    "identity": "implementation commit ef24f22d596b9599b4f3e40715d7ca7ebf4d0bf6 / tree 624fe32df400fdd28ff83647b2688bcb733fec16",
    "last_verified": "2026-08-16T11:38:00Z",
    "state": "partially-verified"
  },
  "last_updated": "2026-08-16T12:02:37Z",
  "linked_parent_state": null,
  "project_id": "planet-killer",
  "project_name": "PLANET KILLER",
  "project_root": "/mnt/data/Planet_Killer",
  "schema_version": 1,
  "scope_boundaries": [
    "Planet Killer source, tests, docs, bundled data provenance, build, repository publication, browser presentation, interaction accessibility, and responsive controls"
  ],
  "state_revision": 14
}
-->

## 1. Project Identity and Scope

- Project: Planet Killer counterfactual K-Pg browser simulation.
- Repository: `westkitty/Planet_Killer`.
- Final delivery ref: `main`.
- Scope: source, tests, docs, bundled modern-Earth provenance, build, publication, browser presentation, interaction accessibility, and responsive controls.

## 2. Current Baseline

- State: `partially-verified`.
- Revision 14 records the published UI/controller polish baseline at implementation commit `ef24f22d596b9599b4f3e40715d7ca7ebf4d0bf6` / tree `624fe32df400fdd28ff83647b2688bcb733fec16`, preserving the simulation/model/rendering architecture.
- The catastrophe-first cinematic observatory/instrument presentation remains the governing visual direction.
- The published implementation contains exactly 25 inspectable UI/UX improvements across focus, interaction state, timeline clarity, touch parity, comparison/probe ergonomics, reduced motion, async feedback, and responsive controls.
- Regression gates after the polish and hardening passes: 44/44 tests; 22-module project check; production build success; static/diff sanity PASS; web-authorship scrub PASS; secret scan clean.
- Chromium controller harnesses exercised the actual DOM, CSS, main controller, simulation modules, and event handlers at desktop, medium, and 390×844 mobile dimensions with renderer/worker transport stubbed; exercised interaction paths produced no page or console errors. Targeted CDP checks also verified Clean View accessibility restoration, keyboard-focus-safe chrome hiding, and shortcut isolation.
- Full URL-loaded WebGL2 visual QA is blocked in this execution environment by managed Chromium policy `URLBlocklist: ["*"]`; rendered scene appearance, GPU behavior, and representative-device performance remain unverified here.
- Scientific limitation: 66 Ma geography/depth remain explicit proxies.

## 3. Artifact Contract

Dependency-free WebGL2 catastrophe-first simulation with deterministic seekable time, user-owned camera, explicit calculation/surrogate/proxy/illustration boundaries, distinct modern and 66 Ma states, bounded worker-based tsunami propagation, accessible transient controls, reproducible scenario handoff, and a cinematic interface that keeps the catastrophe viewport visually dominant.

## 4. Active Invariants

- **INV-001 — Catastrophe-first viewport:** partially verified. Source/static hierarchy is preserved; direct rendered WebGL2 visual approval remains pending.
- **INV-002 — Deterministic time + user camera ownership:** verified for numerical/controller contracts by regression tests and controller-path harness; rendered camera feel remains device-unverified.
- **INV-003 — Science/provenance boundaries:** verified by regression tests and unchanged science/provenance architecture.
- **INV-004 — Distinct epochs:** partially verified. Modern GSHHG/ETOPO derivatives remain packaged/tested; 66 Ma remains a coarse proxy with no numerical paleobathymetry.
- **INV-005 — Publication safety:** verified for the polish implementation. `main` advanced non-force to `ef24f22d596b9599b4f3e40715d7ca7ebf4d0bf6`, was read back, and GitHub compare confirmed exactly eight intended implementation paths.
- **INV-006 — Hidden fallback must stay hidden:** verified statically by `.fallback[hidden]{display:none}` plus the UI contract suite.
- **INV-007 — UI polish count:** verified. `tests/polish-regression.test.mjs` asserts exactly 25 distinct inspectable polish signals.
- **INV-008 — Async tsunami freshness:** verified. Worker replies are request-scoped and stale responses are discarded.
- **INV-009 — Keyboard/focus isolation:** verified. Drawer controls do not leak Space into global playback; drawer rerenders preserve control focus and Escape remains available.

## 5. Verified Working Behavior

- **VER-001:** 44 automated numerical/static/browser-contract tests pass.
- **VER-002:** project check passes for 22 JavaScript modules with no runtime hotlinks or production-workflow residue.
- **VER-003:** production build succeeds with bundled notices/licenses.
- **VER-004:** static source/diff sweep reports no duplicate static IDs, trailing whitespace, NUL characters, or whitespace errors in changed surfaces; secret scan is clean.
- **VER-005:** desktop/medium/mobile controller harness covers onboarding, drawers, comparison hold, focus restoration, Escape, invalid JSON recovery, Clean View restoration, keyboard isolation, and responsive control availability without console/page errors.
- **VER-006:** exactly 25 new UI/UX improvements are represented by code and enforced by regression contract.
- **VER-007:** dev-server containment serves the intended root with HTTP 200 and rejects a crafted sibling traversal with HTTP 404.
- **VER-008:** implementation publication is verified at `ef24f22d596b9599b4f3e40715d7ca7ebf4d0bf6`; GitHub compare shows one fast-forward commit with exactly eight intended paths.

## 6. Known Not Working

- No active numerical, static-test, project-check, or build failure.
- Full URL-loaded Chromium/WebGL2 QA is blocked by the container's managed `URLBlocklist: ["*"]` policy.
- Direct scene appearance, GPU context behavior, sustained FPS, GPU memory, thermals, and device-specific pointer/touch feel are therefore not verified in this environment.

## 7. Implemented but Unverified

- Final WebGL2 visual balance of the polished chrome against the live planetary scene.
- Representative-device camera/pinch feel and long-session performance.
- Clipboard/download behavior under a normal browser profile, because this managed Chromium environment also restricts browser capabilities.
- Screen-reader traversal with an actual assistive-technology stack; semantic/focus behavior is source/runtime-harness verified only.

## 8. Unknown or Evidence-Stale State

- User visual acceptance of the published polish implementation on the actual MacBook display.
- Desktop/mobile sustained FPS, GPU memory/context loss, thermal throttling, and native screen-reader behavior.
- Fidelity against a real transformed 66 Ma reconstruction and numerical paleobathymetry.

## 9. Pending Work

- Direct visual acceptance in a normal WebGL2-capable browser on the user Mac.
- Package the standalone macOS/Dock wrapper only after browser presentation is accepted, preserving the previous gate.
- Higher-fidelity 66 Ma reconstruction remains outside this UI/UX polish scope.

## 10. Active Decisions, Defaults, and Prohibitions

- Historical default remains 12 km, 3000 kg/m³, 20 km/s, 60°, azimuth 135°, 66 Ma Chicxulub-area carbonate/evaporite shelf proxy.
- Modern spatial data remains the 2-degree GSHHG land/sea derivative plus 32×16 ETOPO1 visual luminance derivative.
- 66 Ma geography/depth remain explicit proxies; never silently substitute modern geography.
- Runtime remains dependency-free native WebGL2 + semantic DOM.
- Presentation remains cinematic scientific instrument, not generic dashboard/glassmorphism; the planetary scene remains dominant.
- Do not add a second WebGL/canvas effects runtime merely for decoration while the core renderer owns the GPU path.
- Never claim hydrocode, GCM, local-hazard, fatality, or extinction-probability fidelity.
- Never force-push `main`; never claim publication without remote read-back.

## 11. Validation and Evidence Matrix

| ID | Capability | State | Evidence | Recheck trigger |
|---|---|---|---|---|
| INV-001 | Catastrophe-first viewport | partially-verified | CSS/DOM contracts + build; live WebGL visual blocked | visual/UI change |
| INV-002 | Deterministic time + camera ownership | verified/partially visual | time tests + controller harness + renderer source | timeline/camera change |
| INV-003 | Science/provenance boundaries | verified | tests + unchanged model/provenance surfaces | science/model change |
| INV-004 | Distinct epochs | partially-verified | modern derivative tests + explicit 66 Ma proxy | epoch change |
| INV-005 | Non-force publication/read-back | verified | `main` read back at `ef24f22d...`; GitHub compare = exactly eight intended paths | main/ref change |
| INV-006 | Hidden fallback guard | verified | CSS + UI contract test | fallback/CSS change |
| INV-007 | Exactly 25 UI/UX improvements | verified | dedicated 25-signal regression test | UI/UX change |
| INV-008 | Stale tsunami worker protection | verified | request-scoped worker regression test | worker/recompute change |
| INV-009 | Drawer keyboard/focus isolation | verified | keyboard leakage regression + Chromium harness | drawer/keyboard change |
| VER-001 | Automated suite | verified | 44/44 | source/test change |
| VER-002 | Project check | verified | 22 modules | source/build change |
| VER-003 | Build/package | verified | `npm run build`; authorship PASS; secret scan clean | package/UI change |
| UNV-001 | Full rendered WebGL2 experience | unverified in this environment | Chromium managed URL block | normal browser visual check |
| PND-001 | macOS Dock wrapper | pending | intentionally gated on accepted browser presentation | visual acceptance |

## 12. Current Change Scope and Impact Radius

- Revision 14 records a deliberately UI/controller-scoped implementation. Numerical simulation, epoch data, shaders, renderer budgets, model formulas, and provenance sources are unchanged.
- Protected surfaces: deterministic simulation, modern/66 Ma distinction, user-camera priority, comparison semantics, probes, Clean View, import/export/share/capture, reduced motion, transient chrome, no-runtime-dependency constraint, and hidden fallback behavior.
- New behavior is restricted to accessibility/state semantics, async freshness, drawer/timeline ergonomics, responsive parity, interaction feedback, clipboard truthfulness, and local dev-server path containment.
- Stop condition: all deterministic/static/build gates green, two bug-sweep passes closed, intended diff only, non-force publication/read-back complete; full WebGL visual QA remains explicitly deferred to a normal browser.

## 13. Compact Revision Log

- Revision 9: source reconstructed after failed archive publication; local validation passed, durable publication remained incomplete.
- Revision 10: evidence reconciled conservatively after direct-file reconstruction; 41-test / 22-module / build baseline recorded.
- Revision 11: clean source published to `main`; tree/read-back and temporary-path absence verified.
- Revision 12: corrected the full-screen fallback overlay regression and replaced generic glass-card presentation with a cinematic observatory/instrument interface.
- Revision 13: implemented exactly 25 UI/UX improvements, added stale-worker and keyboard/focus regression protection, and completed the initial adversarial polish sweep while preserving the simulation/model/rendering core.

### Revision 14 — 2026-08-16T12:02:37Z

- **Artifact/source identity:** implementation commit ef24f22d596b9599b4f3e40715d7ca7ebf4d0bf6 / tree 624fe32df400fdd28ff83647b2688bcb733fec16
- **State deltas:** Updated metadata: current_baseline
- **New evidence:** 44/44 automated tests pass; 22-module project check passes; production build passes; web-authorship scrub and secret scan pass; desktop, medium, and mobile controller harnesses pass without console/page errors; server containment returns 200 for root and 404 for crafted sibling traversal; GitHub compare shows exactly eight intended implementation paths; main advanced non-force and read back at ef24f22d596b9599b4f3e40715d7ca7ebf4d0bf6
- **Newly verified behavior:** None.
- **Newly known failure:** None.
- **Superseded rule:** None.
- **Validation not performed:** Full URL-loaded GPU-rendered WebGL2 visual QA is blocked by managed Chromium URL policy; Representative-device FPS, thermals, GPU memory/context-loss, and native assistive-technology traversal remain unverified
- **Reason for broad revalidation:** UI/controller polish affected focus, keyboard, responsive chrome, async status, and handoff behavior while numerical/model/rendering surfaces remained unchanged.
- **Summary:** Record verified UI polish publication and current validation evidence

