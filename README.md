# Planet Killer

Planet Killer is a browser-based counterfactual K–Pg impact simulation. The primary surface is the catastrophe itself: a full-screen interactive Earth with transient controls that disappear during playback.

## What is implemented

- Native WebGL2 globe renderer with inertial procedural star field, solar lighting, atmosphere, target picking and unrestricted orbit/zoom.
- Two distinct epoch representations: a present-day low-resolution coastline proxy and a separate ~66 Ma paleogeographic proxy.
- Stony, metallic, carbonaceous, rubble-pile, cometary and historical-reference impactor presets.
- SI-unit mass and kinetic-energy calculations plus explicitly labeled reduced-order crater, regional-hazard and climate-response models.
- Deterministic, seekable seconds-to-decades timeline. Rewind reconstructs state from scenario + time instead of reversing prior animation frames.
- Distinct entry wake, ejecta, plume, pressure-front, seismic, thermal, tsunami and atmospheric-dust visual systems.
- Bathymetry-proxy tsunami travel-time worker with depth-dependent wave speed and land blocking.
- Hold-`B` historical comparison at synchronized simulation time.
- Keyboard-operable transient UI, Clean View, reduced-motion mode, scenario JSON import/export and shareable URL state.
- Historical Chicxulub regression fixture and deterministic scientific unit tests.

## Important scientific limits

This is a reduced-order educational simulation, not a hydrocode, computational-fluid-dynamics solver, or general circulation model. The current 66 Ma globe is a coarse project-owned proxy informed by published paleogeography; it is **not** yet a transformed EarthByte/GPlates 66 Ma dataset. The tsunami solver uses categorical shelf/deep-ocean depth proxies rather than a published 66 Ma bathymetric grid. Those limitations are visible in Science and documented in `docs/MODEL_LIMITATIONS.md`.

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

`npm run build` creates a static `dist/` directory with no runtime CDN imports.

## Controls

- Drag: orbit Earth
- Wheel/pinch: zoom
- Click/tap Earth: move impact target
- Space: play/pause
- Left/Right: seek backward/forward
- Shift + Left/Right: larger seek
- Hold `B`: historical Chicxulub comparison
- `C`: Clean View
- `H`: reveal controls / leave Clean View
- Escape: close a drawer / leave Clean View

## QA capture URLs

Deterministic states can be opened directly for capture:

```text
/?capture=1&clean=1&time=-12
/?capture=1&clean=1&time=0.7
/?capture=1&clean=1&time=600
/?capture=1&clean=1&time=86400
/?capture=1&clean=1&time=31557600
/?capture=1&drawer=science&time=600
```

See `docs/VISUAL_QA.md` for the capture matrix.

## Repository map

```text
src/simulation/core/       numerical model, units, target model, tsunami surrogate
src/simulation/timeline/   deterministic multi-scale time mapping and effect state
src/data/epochs/           epoch-specific coastline/target proxies
src/data/science/          source registry used by the Science drawer
src/render/webgl/          project-owned WebGL2 renderer and geometry/math
src/workers/               background tsunami field calculation
src/ui/                    drawers and formatting
tests/                     numerical, regression, timeline and tsunami tests
docs/                      model, sources, schema, benchmark and QA documentation
```
