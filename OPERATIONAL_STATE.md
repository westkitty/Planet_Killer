# Operational State: PLANET KILLER

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "planet-killer",
  "project_name": "PLANET KILLER",
  "project_root": "/mnt/data/Planet_Killer",
  "artifact_path": "/mnt/data/Planet_Killer",
  "state_revision": 10,
  "last_updated": "2026-08-13T07:32:43Z",
  "current_baseline": {
    "identity": "reconstructed source durable on GitHub tmp-do-not-use; main publication pending",
    "state": "partially-verified",
    "last_verified": "2026-08-13T07:32:43Z"
  },
  "scope_boundaries": ["Planet Killer source, tests, docs, bundled data provenance, build, and repository publication"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

- Project: Planet Killer counterfactual K-Pg browser simulation.
- Repository: `westkitty/Planet_Killer`.
- Durable staging ref: `tmp-do-not-use`.
- Final delivery ref: `main`.
- Scope: source, tests, docs, bundled modern-Earth provenance, build, and publication.

## 2. Current Baseline

- State: `partially-verified`.
- Reconstructed source/test/docs/provenance are durable on `tmp-do-not-use`; key files were individually read back with exact Git blob SHAs.
- Verified local gates: 41/41 tests; 22-module project check; 31-file self-contained build; web-authorship PASS; HTTP 200 for root, stylesheet, main module, and renderer module.
- Implemented but unverified here: rendered WebGL2 appearance; pointer/touch feel; camera/Auto Director runtime behavior; browser download/clipboard paths; screen-reader traversal; representative-device FPS/thermal/memory.
- Scientific limitation: 66 Ma geography/depth remain explicit proxies.
- Delivery limitation: `main` publication/read-back remains pending.

## 3. Artifact Contract

Dependency-free WebGL2 catastrophe-first simulation with deterministic seekable time, user-owned camera, explicit calculation/surrogate/proxy/illustration boundaries, distinct modern and 66 Ma states, bounded worker-based tsunami propagation, accessible transient controls, reproducible scenario handoff, and non-force repository publication verified by remote read-back.

## 4. Active Invariants

- **INV-001 — Catastrophe-first viewport:** partially verified. Static contracts pass; rendered WebGL2 occupancy is unverified.
- **INV-002 — Deterministic time + user camera ownership:** partially verified. Timeline determinism is test-verified; camera override is source/static-verified but not browser-runtime-verified.
- **INV-003 — Science/provenance boundaries:** verified by regression tests and aligned science/provenance documents.
- **INV-004 — Distinct epochs:** partially verified. Modern GSHHG/ETOPO derivatives are packaged/tested; 66 Ma remains a coarse proxy with no numerical paleobathymetry.
- **INV-005 — Publication:** pending. `main` must be updated without force and read back before completion.

## 5. Verified Working Behavior

- **VER-001:** 41 automated numerical/static/browser-render contract tests pass.
- **VER-002:** project check passes for 22 JS modules with no runtime hotlinks or production-workflow residue.
- **VER-003:** production build succeeds with 31 files including bounded data notices/licenses; authorship audit passes; key served paths return HTTP 200.
- **VER-004:** reconstructed source, tests, docs, and provenance are durable on `tmp-do-not-use` with exact SHA read-backs for key files.

## 6. Known Not Working

- No active numerical/test/build failure.
- This environment has not produced a successful GPU-rendered WebGL2 QA session; prior Chromium EGL/ANGLE initialization failed.

## 7. Implemented but Unverified

- Full rendered catastrophe appearance and visual hierarchy.
- Pointer/touch camera feel, Auto Director release, A/B visual switching, probe marker behavior, Clean View capture behavior, reduced motion, browser clipboard/downloads, and screen-reader/focus traversal.
- Representative-device performance and long-session lifecycle behavior.

## 8. Unknown or Evidence-Stale State

- Desktop/mobile sustained FPS, GPU memory/context loss, thermal throttling, and screen-reader behavior.
- Fidelity against a real transformed 66 Ma reconstruction and numerical paleobathymetry.

## 9. Pending Work

- **PND-001 (blocking):** validate the complete staging tree in GitHub Actions, publish a clean fast-forward child to `main` without force, then read back the `main` commit/tree and representative file SHAs.

## 10. Active Decisions, Defaults, and Prohibitions

- Historical default: 12 km, 3000 kg/m³, 20 km/s, 60°, azimuth 135°, 66 Ma Chicxulub-area carbonate/evaporite shelf proxy.
- Modern spatial data: 2-degree GSHHG land/sea derivative plus 32×16 ETOPO1 visual luminance derivative.
- 66 Ma geography/depth remain explicit proxies; never silently substitute modern geography.
- Runtime remains dependency-free native WebGL2 + semantic DOM.
- Never claim hydrocode, GCM, local-hazard, fatality, or extinction-probability fidelity.
- Never force-push `main`; never claim publication without remote read-back.
- Do not publish `.publish/`, `.publish-ready`, the temporary publication workflow, or `.bootstrap` into final `main`.

## 11. Validation and Evidence Matrix

| ID | Capability | State | Evidence | Recheck trigger |
|---|---|---|---|---|
| INV-001 | Catastrophe-first viewport | partially-verified | static UI/render contracts | UI/renderer change |
| INV-002 | Deterministic time + camera ownership | partially-verified | time tests + controller source contracts | timeline/camera change |
| INV-003 | Science/provenance boundaries | verified | tests + docs + provenance | science/model change |
| INV-004 | Distinct epochs | partially-verified | modern derivative tests + explicit 66 Ma proxy | epoch change |
| INV-005 | Non-force publication/read-back | pending | staging durable; main proof pending | publication |
| VER-001 | Automated suite | verified | 41/41 | source/test change |
| VER-002 | Project check | verified | 22 modules | source/build change |
| VER-003 | Build/package | verified | 31 files; authorship PASS; HTTP 200 | package change |
| VER-004 | Durable staging source | verified | exact GitHub SHA read-backs | staging ref change |
| UNV-001 | Rendered browser experience | implemented-unverified | source/static evidence only | working WebGL2 browser |
| PND-001 | Publish/read-back main | pending | not executed | publication |

## 12. Current Change Scope and Impact Radius

- Finish durable reconstruction, run final GitHub-hosted validation, publish a clean source tree to `main`, and prove remote state.
- Protect numerical regression behavior, deterministic time, modern/66 Ma distinction, provenance package, user-camera priority, transient UI, accessibility paths, and no-runtime-dependency constraint.
- Mandatory final checks: GitHub-hosted 41-test suite, project check, production build, then `main` recursive-tree and representative-file read-back.

## 13. Compact Revision Log

- Revision 9: source reconstructed after failed archive publication; local validation passed, durable publication remained incomplete.
- Revision 10: evidence reconciled conservatively after direct-file reconstruction to `tmp-do-not-use`; current 41-test / 22-module / 31-file baseline recorded; staging durability verified; GPU/browser interaction remains unverified; non-force `main` publication/read-back remains blocking.
