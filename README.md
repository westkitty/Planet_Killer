# Planet Killer

Planet Killer is a browser-based counterfactual K–Pg impact simulation. The primary surface is the catastrophe itself: a full-screen interactive Earth with transient controls that recede during playback.

## What is implemented

- Native WebGL2 globe renderer with a deterministic inertial star field, restrained Milky Way band, solar cue, atmosphere, target picking, orbit, and zoom.
- Two distinct epoch representations: present-day GSHHG-derived land/sea classification with 32×16 ETOPO1-derived visual relief, plus a separate coarse ~66 Ma paleogeographic proxy.
- Editable impactor diameter, density, velocity, angle, azimuth, and composition with a Historical Chicxulub default.
- SI-unit mass and kinetic-energy calculations plus explicitly labeled reduced-order crater, regional-effects, atmospheric-loading, climate, and ecological-stress models.
- Deterministic, seekable seconds-to-years timeline. Rewind reconstructs visual state from scenario + modeled time rather than reversing prior animation frames.
- Distinct impactor approach/entry heating, target reticle, crater/rim response, ejecta, plume, vapor, dust, atmosphere, and tsunami-field visual systems.
- Location-sensitive tsunami worker with depth-sensitive shallow-water travel speed, longitude wrap, and land blocking.
- Hold-`B` synchronized visual comparison against a selected preset, with target/energy/crater/light/ecology details.
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
npm test
npm run check
npm run build
```

`npm run build` creates a self-contained static `dist/` directory and bundles the retained third-party data notices/license texts used by the compact modern-Earth derivatives.

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
src/simulation/            numerical model, scenario, target, timeline, tsunami, probes
src/data/epochs/           modern compact derivatives and separate 66 Ma proxy
src/render/webgl/          project-owned WebGL2 renderer, shaders, geometry, math, textures
src/workers/               background tsunami calculation
src/ui/                    transient drawers and scenario/capture handoff helpers
tests/                     numerical and browser/render regression tests
docs/                      science, sources, limitations, validation, QA, provenance
```

Current automated validation status is recorded in `docs/VALIDATION.md`; requirement-by-requirement evidence is in `docs/REQUIREMENT_TRACEABILITY.md`.
