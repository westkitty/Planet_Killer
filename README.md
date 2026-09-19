# Planet Killer

Planet Killer is a browser-based counterfactual K–Pg impact simulation. The primary surface is the catastrophe itself: a full-screen interactive Earth with transient controls that recede during playback.

## What is implemented

- Native WebGL2 globe renderer with a deterministic inertial star field, restrained Milky Way band, solar cue, atmosphere, target picking, orbit, and zoom.
- Two distinct epoch representations: present-day GSHHG-derived land/sea classification with 32×16 ETOPO1-derived visual relief, plus a separate coarse ~66 Ma paleogeographic proxy.
- Six physical impactor classes (stony, metallic, carbonaceous, rubble-pile, cometary, plus the Historical Chicxulub reference) with literature-anchored density/velocity envelopes, an explicit Historical Chicxulub default, and bounded editing that refuses out-of-range values and flags — never silently reverts — out-of-envelope edits.
- SI-unit mass and kinetic-energy calculations plus explicitly labeled reduced-order crater, regional-effects, atmospheric-loading, climate, and ecological-stress models.
- Deterministic, seekable seconds-to-years timeline. Rewind reconstructs visual state from scenario + modeled time rather than reversing prior animation frames.
- Distinct impactor approach/entry heating, target reticle, crater/rim response, ejecta, plume, vapor, dust, atmosphere, and tsunami-field visual systems.
- Location-sensitive tsunami worker with depth-sensitive shallow-water travel speed, longitude wrap, and land blocking.
- Hold-`B` synchronized (modeled-time) visual comparison against a selected preset **or a Counterfactual Atlas target**, with factual A→B differences in energy, crater, atmospheric loading, climate, ecological stress, target context, probe outcomes, and milestones — labeled by evidence state, never as "better/more accurate."
- Counterfactual Atlas: ten curated counterfactual impact targets (66 Ma and present-day) reachable from the edge button, each showing a distinct evidence-strength badge and an outcome-intensity badge that are kept visually separate.
- Science-drawer provenance UI: every major output is classified into one of five fixed categories (direct calculation / reduced-order model / source-backed categorical reconstruction / proxy / visualization-illustration) and answers what it is, which model produced it, how strong the underlying source is, and its limitation, with offline-safe links into the repository docs.
- User-owned camera with presets, three bookmarks, optional Auto Director, pointer/touch controls, and keyboard orbit/zoom.
- Up to four location probes with reduced-order thermal, seismic, blast, ejecta, and tsunami arrival estimates where supported.
- Clean View, reduced-motion mode, keyboard time/speed controls, scenario JSON import/export, shareable URL state, and PNG capture with a JSON metadata sidecar.
- Dependency-free browser runtime and deterministic automated regression tests.

## Scientific limits

This is a reduced-order educational simulation, not a hydrocode, computational-fluid-dynamics solver, general circulation model, or local hazard-prediction tool. Present-day land/sea and visual relief use documented compact GSHHG 2.3.6 / ETOPO1 derivatives. The 66 Ma globe remains a coarse project-owned proxy informed by published paleogeography; it is **not** a transformed EarthByte/GPlates dataset. Tsunami depth is a proxy rather than numerical modern or 66 Ma bathymetry. See `docs/MODEL_LIMITATIONS.md`, `docs/SCIENCE.md`, and `docs/SOURCES.md`.

## Run

Requires Node.js 20+ only; there are no runtime package dependencies.

```bash
npm start
```

Open `http://127.0.0.1:4173` in a WebGL2-capable browser.

## Validate

```bash
npm test             # 114 deterministic Node tests (the stub-GL suite carries the framebuffer proof here)
npm run check        # module syntax, no hotlinks, no workflow residue
npm run build        # self-contained dist/ with the offline documentation tree
npm run smoke:webgl  # real-browser WebGL2 proof (needs a browser; exit 3 = conclusively-demonstrated browser blocker)
npm run perf         # raw-measurement performance collector (needs a browser)
```

The first three gates run anywhere with Node 20+. The last two drive a real WebGL2 browser via
`playwright-core` (bundled under `tools/webgl-smoke/`); set `CHROME_PATH` if your browser is not
in a well-known location. They report distinct failure classes — never one opaque timeout — and
write `docs/qa/webgl-smoke-report.json` and `docs/qa/perf-report.json`. `npm run build` creates a
self-contained static `dist/` directory and bundles the retained third-party data
notices/license texts used by the compact modern-Earth derivatives plus the full offline
documentation tree.

## Controls

- Drag: orbit Earth
- Wheel/pinch: zoom
- Click/tap Earth: move impact target; Science can switch the next click to probe placement
- Space: play/pause
- Left/Right: small time step
- Shift + Left/Right: chapter jump
- Comma/period: playback speed down/up
- `I` / `J` / `K` / `L`: keyboard camera orbit
- `+` / `-`: keyboard zoom
- `0`–`4`: camera presets
- Hold `B`: synchronized comparison
- `C`: Clean View
- `T`: reveal controls
- `D`: toggle Auto Director
- Escape: close the active drawer or leave Clean View

## Repository map

```text
src/simulation/            numerical model, scenario, classes, atlas, provenance, target, timeline, tsunami, probes
src/data/epochs/           modern compact derivatives and separate 66 Ma proxy
src/render/webgl/          project-owned WebGL2 renderer, shaders, geometry, math, textures, perf monitor, checkpoints
src/workers/               background tsunami calculation
src/ui/                    transient drawers and scenario/capture handoff helpers
scripts/                   serve, build, project checks, WebGL smoke harness, performance collector
tests/                     numerical, stub-GL framebuffer, and browser/render regression tests
docs/                      science, sources, limitations, validation, QA, provenance, operational state
.github/workflows/         CI (gates + browser smoke + perf capture) and GitHub Pages deploy
```

Current automated validation status is recorded in `docs/VALIDATION.md`; requirement-by-requirement evidence is in `docs/REQUIREMENT_TRACEABILITY.md`.
