# Visual QA Matrix

Automated source/render contracts pass, but a decisive GPU-rendered QA session has not been completed in this container. Use a WebGL2-capable browser and the normal timeline/camera controls to inspect these states.

| State | How to reach it | What to inspect |
|---|---|---|
| Approach | Historical preset, seek to about −12 s | inertial star field, Milky Way restraint, Earth lighting, dark irregular impactor, target reticle |
| Entry | seek between about −10 s and contact | atmosphere interaction, entry heating/wake, material remains readable rather than becoming a generic fireball |
| Contact | seek just after 0 s | flash exposure, target coherence, crater/rim onset |
| Excavation | jump to Fireball / excavation | ejecta/plume separation, crater growth, Earth remains primary surface |
| Regional | jump to Blast / thermal / seismic | catastrophe state remains readable without persistent dashboard chrome |
| Tsunami | jump to Tsunami propagation; use an ocean target | arrival field remains ocean-only and respects land-blocked travel paths |
| Encirclement / winter | jump to Atmospheric encirclement and Impact winter | atmosphere/dust state communicates global change without replacing Earth with an overlay map |
| Recovery | jump to Early recovery | long-timescale state remains deterministic and camera remains controllable |
| Present day | Impactor drawer → Present day | modern GSHHG-derived land/sea and ETOPO1 visual relief are visibly distinct from the 66 Ma proxy |
| Comparison | choose a comparison preset; hold `B` | A/B switches at the same modeled time and clearly reflects target-dependent differences |

## Interaction review

- Drag, wheel, pinch, and keyboard orbit/zoom should remain available throughout modeled time.
- Any manual camera input must release Auto Director immediately.
- Drawers must overlay rather than resize the globe.
- Timeline and side controls should recede during uninterrupted playback and remain recoverable with interaction / `T`.
- Clean View (`C`) must remove interface chrome without altering the simulation state.
- Reduced-motion mode must suppress CSS transition/animation duration without removing essential controls.
- Keyboard time stepping, chapter jumps, speed control, camera controls, presets, comparison, and drawer escape paths must remain usable without pointer input.

## Probe review

Place up to four probes from Science and verify:

- positions stay fixed when modeled time changes;
- moving the impact target recomputes the listed reduced-order arrivals/severity;
- thermal, seismic, blast, ejecta, and tsunami arrival fields are shown only where supported;
- the fifth probe is refused by the four-probe cap.

## Capture review

Use Settings → **Capture clean frame**. Verify:

- the PNG is captured with interface chrome hidden;
- a JSON sidecar is downloaded separately;
- sidecar state includes normalized scenario, modeled time, camera, target descriptor, and model-family labels;
- capture does not mutate scenario or camera state after the temporary Clean View transition.

## Current blocker

If the available browser cannot initialize WebGL2/EGL/ANGLE, record that as an environment limitation rather than treating a static build as rendered visual proof. See `docs/VALIDATION.md` for the current evidence state.
