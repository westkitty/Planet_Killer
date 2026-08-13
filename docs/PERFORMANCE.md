# Performance and Degradation Strategy

## Current renderer

Planet Killer uses one project-owned WebGL2 renderer and one `requestAnimationFrame` loop. Numerical tsunami propagation runs in a module Web Worker so the coarse global path calculation does not block camera input or timeline playback.

The renderer caps device pixel ratio at **2**. There is no claimed hardware performance certification and no hidden automatic quality-tier system in the current build.

## Fixed effect budgets

`src/render/webgl/Renderer.js` declares these bounded allocations:

- inertial stars: **2,400** points;
- Milky Way band: **1,500** points;
- solar cue: **1** point sprite;
- ejecta: **520** points;
- plume: **360** points;
- vapor: **300** points;
- entry wake: **180** points;
- atmospheric dust: **640** points;
- probes: **4** fixed slots maximum;
- Earth mesh: **56 × 112** latitude/longitude segments.

The interactive tsunami worker currently requests a **72 × 36** global travel-time field.

## Main-thread discipline

- camera, WebGL drawing, DOM controls, and deterministic timeline state remain on the main thread;
- tsunami travel-time propagation runs in a worker;
- scenario changes debounce worker requests briefly rather than launching one calculation per input event;
- deterministic macro state is available immediately while the worker result may arrive later;
- two workers isolate current-scenario and comparison-scenario tsunami fields;
- one renderer-owned probe buffer is reused and capped at four positions;
- particle buffers are allocated once and updated in place rather than appended during playback;
- direct pointer, pinch, wheel, or keyboard camera input does not spawn secondary animation loops.

## Known proof gaps

The bounded architecture is inspectable and the static/test/build gates pass, but representative-device claims still require hardware evidence. Current unverified areas include:

- sustained FPS across desktop/mobile targets;
- GPU memory behavior and context loss;
- long-session memory growth;
- mobile thermal throttling;
- visual quality of the fixed budgets on real WebGL2 hardware.

No performance number should be inferred from the existence of these budgets alone.
