# AI Build Contract — PLANET KILLER: Counterfactual K–Pg Impact Simulation

> **Purpose:** Instruct an AI coding/product agent to build a visually extraordinary, scientifically honest, fully interactive extinction-impact experience in which the **catastrophe is the interface**. The default viewport is Earth, space, the impactor, and the evolving disaster—not a dashboard.
>
> **Repository target:** `https://github.com/westkitty/Planet_Killer`
>
> **Terminology:** Use **K–Pg (Cretaceous–Paleogene)** as the modern term for the boundary/event historically called **K–T (Cretaceous–Tertiary)**.

---

## 0. Mission

Build a premium interactive 3D Earth catastrophe simulator centered on one counterfactual question:

**What would have happened if the Chicxulub-class impactor associated with the K–Pg extinction had struck somewhere else—and how much of the outcome came from the impactor versus the target it hit?**

The user must be able to move the impact point anywhere on Earth; switch between a scientifically reconstructed ~66 Ma Earth and present-day Earth; choose the impactor class and composition; change diameter, density, velocity, angle, azimuth and other supported physical parameters; launch the impact; freely rotate and zoom the camera before, during and after the event; pause; advance; rewind; scrub directly to any modeled phase; inspect the world at that moment; and compare counterfactual outcomes with historical Chicxulub.

The experience must feel closer to a flagship museum installation, NASA-grade interactive visualization, and high-end real-time VFX sequence than to a web calculator.

**Do not build a toy. Do not build a static mockup. Do not build a 2D damage-circle page with a globe pasted behind it. Do not let the explanatory interface become more visually important than the catastrophe.**

### 0.1 The catastrophe-is-the-interface law

The primary surface is a fullscreen 3D viewport. While the event is running, the ideal default state contains **no persistent words, letters, numbers, labels, metric cards, legends, tables, headings, or results panels**.

The user should see:

- the globe;
- the impactor;
- stars and celestial lighting;
- atmosphere;
- ocean and terrain;
- crater excavation and collapse;
- fireball and incandescent ejecta;
- blast/shock propagation;
- seismic propagation;
- tsunami generation and basin-scale travel;
- upper-atmosphere plume and global dispersal;
- dust/aerosol optical changes;
- longer-timescale climate consequences;
- the camera motion they choose.

Text and numbers exist, but **offstage**. They appear only when the user deliberately summons controls, pauses and inspects a phenomenon, opens Science, opens Compare, or requests a help/explanation layer. Closing that surface must return to a visually pure simulation.

### 0.2 Zero-chrome default state

After any one-time onboarding is dismissed:

- no title remains over the globe;
- no persistent scenario name remains;
- no persistent epoch label remains;
- no permanent metric strip remains;
- no permanent timeline text remains;
- no permanent legend remains;
- no permanent instructional copy remains;
- the cursor and icon affordances may auto-hide during uninterrupted playback;
- icon-only edge affordances may briefly reveal on pointer/touch/keyboard activity and fade away again.

A screen capture during playback should look like an exceptional scientific disaster visualization, not a screenshot of software controls.

### 0.3 Two Earth epochs

The product must contain two distinct, switchable globes:

1. **Earth at ~66 Ma** using a scientifically sourced late-Cretaceous paleogeographic reconstruction.
2. **Present-day Earth** using modern coastlines, topography, bathymetry, land/ocean materials and atmospheric appearance.

Changing epoch changes the actual spatial datasets and target lookup, not merely the surface texture.

---

# 1. Executor role

Act as a combined:

- senior scientific-visualization engineer;
- planetary-impact modeling engineer;
- geospatial/data-visualization engineer;
- senior Three.js/WebGPU/WebGL rendering engineer;
- senior VFX/particle/shader engineer;
- interaction and camera-systems designer;
- frontend product designer;
- accessibility-minded interaction engineer;
- scientific research integrator;
- performance engineer.

Inspect the repository and remote state before editing. At prompt-authoring time the target GitHub repository was newly created/empty; **verify that this is still true instead of assuming it**. Preserve unexpected remote work rather than overwriting it.

If the local working directory is not yet a Git repository, initialize it as specified in the Git workflow section. Build a clean production-quality web project with a maintainable architecture and documented scientific model. Do not invent inaccessible data sources, proprietary APIs, credentials, model outputs, or unverifiable scientific precision.

---

# 2. Product thesis

The experience teaches a causal idea through direct manipulation rather than through prose:

> **A Chicxulub-scale impact is globally catastrophic, but its exact consequences are not determined by diameter alone. Target geology, water depth, sediment chemistry, impact trajectory, latitude, ocean geometry, atmospheric loading, and impactor properties can change which kill mechanisms dominate and how severe the aftermath becomes.**

The central interaction is:

**Hold the impactor constant, move the impact site, and watch the causal chain change. Then change the impactor itself and watch the chain change again.**

The simulation must distinguish consequences that stay broadly similar because energy is similar from consequences that change because location, target medium, impactor class, trajectory, or atmosphere/ocean coupling changed.

## 2.1 Benchmark-informed interaction strategy

Before implementation, inspect the current official versions of the following comparator experiences and record a short design-benchmark note in project documentation. Features can change, so re-verify rather than relying only on this prompt.

### Neal.fun — Asteroid Launcher

Borrow:

- immediate comprehension;
- direct click-to-place impact location;
- a very small set of obvious primary parameters;
- satisfying cause/effect feedback;
- impactor-type presets that are understandable without reading a manual.

Do **not** copy:

- flat-map primacy;
- concentric-circle damage visualization as the whole experience;
- results that feel disconnected from a continuous physical event.

### Earth Impact Effects Program — Imperial College London / Purdue lineage

Borrow:

- disciplined physical parameterization;
- projectile diameter, density, velocity and impact angle;
- target type and water-depth awareness;
- explicit separation of crater, ejecta, ground shaking, blast and thermal effects;
- source-backed calculation methodology and uncertainty humility.

Do **not** copy:

- calculator-first visual hierarchy;
- text-dominant output pages;
- the feeling that the user is filling out a form rather than witnessing a planetary event.

### NASA Eyes

Borrow:

- free-roam browser-based 3D exploration;
- click/drag/zoom camera fluency;
- fast-forward and rewind through time;
- ride-along/follow viewpoints;
- optional guided storytelling that never removes free exploration;
- visually credible celestial scale and presentation.

Do **not** copy:

- generic mission-browser chrome;
- persistent information-card density that would compete with the catastrophe.

### earth.nullschool

Borrow:

- a globe that remains directly manipulable while data is animated;
- elegant particle-flow fields that reveal global atmospheric/ocean motion;
- time stepping, pause/resume and keyboard control;
- visually continuous global fields instead of static infographic overlays.

Do **not** copy:

- menu density as a permanent visual layer;
- treating the impact as merely another data overlay.

### Synthesis rule

Planet Killer should combine **Neal.fun's immediacy + Earth Impact Effects Program's model discipline + NASA Eyes' camera/time freedom + earth.nullschool's global flow visualization**, while remaining its own catastrophe-first experience.

---
# 3. Non-negotiable user journey

A first-time user must be able to start experimenting almost immediately, but the product must not throw text at them simply because they are new.

## 3.1 Opening state

Open directly into a cinematic orbital view of the **66 Ma Earth** suspended in a deep, high-quality star field.

The globe slowly rotates only if the user is idle. The historical impact site may be indicated by a restrained, non-text visual marker or transient pulse, never a giant map pin.

A one-time onboarding layer is permitted, but it must:

- be dismissible immediately;
- occupy only a small fraction of the viewport;
- teach rotate, zoom, place impact, launch, pause and reveal-controls in under 15 seconds;
- vanish completely after dismissal;
- never reappear automatically during a catastrophe;
- be reopenable from Help.

After onboarding, the viewport becomes clean.

## 3.2 Core flow

1. Rotate the Earth and freely move the camera.
2. Zoom from full-planet framing toward the intended target region.
3. Click/tap the globe to place or move the impact target.
4. Optionally summon the impactor drawer to change body type, composition, size or trajectory.
5. Launch.
6. Watch the body approach from the current view or choose a cinematic follow camera.
7. Keep full camera control during every phase.
8. Pause at any time.
9. Rewind, step, scrub or jump between event chapters without rerunning the scenario from zero.
10. Inspect any visible phenomenon only when desired.
11. Continue forward from that exact time.
12. Toggle/hold the historical baseline for visual comparison.
13. Switch epoch and repeat on present-day Earth.

## 3.3 Direct-manipulation standard

The impact point must support:

- click/tap placement;
- drag repositioning on the sphere;
- raycast/picking that remains accurate at high zoom;
- optional latitude/longitude entry in the hidden advanced drawer;
- Return to Chicxulub;
- Random target;
- lock-location / lock-impactor modes for controlled comparisons;
- target preview that updates land/ocean/depth/geology state without forcing a full simulation run.

Do not show coordinates or site-description text on the default viewport while dragging. If the user has enabled **Inspect while targeting**, reveal that information in a temporary edge drawer or cursor-adjacent inspector that disappears when targeting ends.

## 3.4 The globe is never a movie screen

At every timeline position—before contact, during crater excavation, during tsunami propagation, during global dust loading, years into recovery—the user retains the right to:

- rotate around Earth;
- orbit around the selected target;
- change camera pitch/yaw and orbital longitude/latitude;
- zoom in/out within supported fidelity limits;
- switch to a saved camera mode;
- exit an automated cinematic camera instantly through any direct camera input.

No playback mode may trap the user in a forced shot.

---

# 4. Two Earth epochs

## 4.1 Late Cretaceous Earth (~66 Ma)

This must be a real paleogeographic reconstruction, not modern continents recolored brown.

Requirements:

- reconstruct coastlines and continental positions for approximately 66 Ma;
- distinguish emergent land, shallow marine shelf, and deep ocean where data permits;
- use paleobathymetry/paleogeography suitable for global tsunami and target-type reasoning;
- place the historical Chicxulub site in its **reconstructed paleogeographic position**, not blindly at modern coordinates on a moved-continent texture;
- visually omit modern national borders, cities, political labels, roads, or current coastlines;
- provide an unobtrusive "66 million years ago" epoch label.

Preferred source family:

- GPlates / EarthByte global plate reconstructions;
- EarthByte paleogeography datasets;
- published 66 Ma bathymetry/paleogeography used in Chicxulub tsunami/climate studies when legally and technically usable.

If site-specific late-Cretaceous lithology or geochemistry is unavailable globally, do **not** fabricate it. Use a documented categorical/proxy model and label its confidence.

## 4.2 Present-day Earth

Use a high-quality modern Earth representation with:

- current coastlines;
- topography and bathymetry;
- physically plausible ocean/land shading;
- atmosphere/cloud layer that does not obscure the impact interaction;
- optional country boundaries only as a secondary informational overlay;
- optional population/infrastructure exposure layers only if sourced and clearly separated from the physical impact model.

Preferred source families:

- GEBCO global bathymetry/terrain;
- NOAA ETOPO global relief;
- NASA Blue Marble / Earth Observatory imagery where licensing permits;
- Natural Earth for general-purpose vector coastlines/boundaries.

Do not require an API key just to display Earth.

---

# 5. Impactor controls and body classes

Primary controls must remain simple. Scientific depth belongs behind progressive disclosure.

## 5.1 Primary impactor selector

The first-level impactor control is not merely a diameter slider. It is a compact visual selector containing production-quality rotating 3D thumbnails or material swatches for broad impactor classes.

Required presets:

1. **Stony asteroid / ordinary chondritic baseline**
2. **Dense metallic asteroid** — iron/nickel-rich end member
3. **Carbonaceous asteroid** — lower-density volatile/carbon-rich rocky end member
4. **Rubble-pile asteroid** — porous/weak aggregate with different atmospheric-entry/fragmentation behavior where the model supports it
5. **Cometary nucleus** — icy/volatile-rich, low-density body with a separate entry/ablation treatment and generally different valid velocity range
6. **Historical Chicxulub reference body** — source-backed parameter envelope, not a fictional exact composition

Optional expert-only experimental presets may include an unusually fast interstellar object or other exotic scenario, but they must be clearly marked outside the calibrated model envelope if that is true.

Do not treat these as visual skins. Composition/type must alter the physical input model through density, plausible velocity range, atmospheric-entry survival/fragmentation assumptions and any other supported terms. If a difference is only visual, label it visual-only in Science.

## 5.2 Diameter and scale

Use a direct-manipulation slider plus optional numeric entry inside the hidden drawer.

Main educational range: approximately **1–30 km**, with model-supported extension available only in Expert mode.

Changing diameter must propagate through mass, kinetic energy, crater dimensions, vapor/melt production, ejecta, blast, seismic, tsunami and atmospheric forcing.

## 5.3 Composition presets are ranges, not magic constants

Each preset should define source-backed or literature-reasonable envelopes for:

- bulk density;
- porosity/strength class where modeled;
- likely fragmentation/ablation behavior;
- plausible impact-speed range at Earth;
- visual surface/material cues;
- confidence/model limitations.

The UI may expose a single friendly preset, but Science mode must reveal the actual parameter assumptions.

## 5.4 Advanced controls

Hidden by default:

- impact velocity;
- impact angle from horizontal;
- trajectory azimuth;
- custom density;
- porosity/strength class if implemented;
- fragmentation/ablation model toggle if supported;
- target-model override for testing;
- atmospheric-entry model selection if multiple validated options exist;
- scientific uncertainty/model preset.

Do not expose a control unless the model genuinely uses it.

## 5.5 Historical Chicxulub preset

Use current literature-supported ranges rather than arbitrary precision. The historical preset should carry a versioned parameter envelope for body diameter, density/composition assumption, velocity, impact angle and target setting.

## 5.6 Locking and comparison controls

Support:

- lock impactor, vary location;
- lock location, vary impactor;
- A/B scenario slots;
- restore Historical Chicxulub;
- clone current scenario before experimentation.

These controls belong in a summoned drawer, not on the catastrophe viewport.

---

# 6. Scientific modeling philosophy

This browser experience must be scientifically grounded **without pretending to run a full hydrocode and global climate model in real time**.

Separate the science into three evidence levels:

### Level A — physically calculated

Use source-backed equations/scaling laws directly when appropriate.

Examples:

- impactor mass;
- kinetic energy;
- simple geometry;
- great-circle distance;
- impact/crater scaling relations;
- regional ejecta/thermal/airblast/seismic approximations where validated formulas exist.

### Level B — calibrated surrogate/interpolated model

Use precomputed response surfaces, lookup tables, fitted functions, or documented reduced-order models for processes too expensive to solve live.

Examples:

- global aerosol optical-depth response;
- impact-winter cooling envelopes;
- photosynthetically active radiation reduction;
- precipitation change;
- global tsunami propagation at educational resolution;
- long-timescale atmospheric dispersal.

### Level C — illustrative visualization

Use physically informed graphics that communicate a modeled process but are not themselves the numerical model.

Examples:

- plume particle appearance;
- ejecta tracer particles;
- atmospheric haze texture;
- crater glow;
- cloud shading.

**Never let a Level C visual generate a Level A/B number.**

Every result panel must know the provenance of the value it displays.

---

# 7. Core impact engine

Design the numerical model as modular stages with explicit units and model metadata.

## 7.1 Fundamental impact quantities

At minimum calculate:

- diameter;
- radius;
- volume;
- density;
- mass;
- velocity;
- kinetic energy;
- TNT-equivalent only as a secondary communication aid;
- vertical/normal velocity component from impact angle where needed.

Mass for a spherical impactor should derive from:

`m = (π / 6) × ρ × d³`

Kinetic energy:

`E = 0.5 × m × v²`

Use SI units internally and convert only for display.

## 7.2 Cratering and immediate regional effects

Base the regional calculator on published, cited impact-scaling work such as the Earth Impact Effects Program and subsequent improvements where appropriate.

Model, where valid:

- transient crater diameter;
- final crater diameter;
- crater depth;
- simple vs complex crater regime;
- approximate melt/vapor volume;
- ejecta thickness as a function of distance;
- thermal radiation / fireball exposure;
- atmospheric blast / overpressure;
- wind/blast severity bands;
- seismic shaking estimate;
- arrival times of major regional effects.

Do not display more significant figures than the model justifies.

## 7.3 Target material model

Location must feed back into consequences.

Each globe cell or sampled point should expose a target descriptor containing as much of the following as the available data supports:

- land/ocean;
- elevation;
- water depth;
- crust/target class;
- sediment thickness proxy;
- broad lithology proxy;
- carbonate potential;
- sulfate/evaporite potential;
- organic-carbon/hydrocarbon potential;
- confidence/data-quality flags.

For 66 Ma, accept that global chemistry is not known at the resolution users can click. Create a **scientifically honest hierarchy**:

1. measured/reconstructed where strong data exists;
2. inferred regional class;
3. global categorical proxy;
4. unknown.

Unknown is a valid model state.

## 7.4 Location-dependent atmospheric loading

The simulation's most important counterfactual feature is that different targets can generate different amounts/types of climate-active material.

Represent separately:

- silicate dust;
- sulfate-bearing aerosol precursors;
- soot/black carbon where the target model supports it;
- water vapor;
- CO₂ or other gases only where supported and relevant.

The exact partitioning must be tied to cited research or explicitly labeled as a parameterized approximation.

Do not implement a simplistic rule such as "ocean impact = harmless" or "land impact = extinction." A deep-ocean impact can still be an extreme planetary event; a sulfate-/organic-rich shelf impact can differ from a crystalline continental target; and uncertainty can be large.

## 7.5 Tsunami model

For ocean impacts, provide a real location-sensitive tsunami layer.

Minimum requirements:

- initial ocean displacement derived from impact/crater/water-depth parameters;
- propagation over bathymetry rather than a single circular ring moving at one speed;
- land blocks/reroutes water propagation;
- wave speed should respond to water depth;
- provide estimated first-arrival times at coastlines;
- visualize relative wave energy/amplitude with uncertainty;
- distinguish source-region hydrodynamics from the coarser far-field solver.

A browser-friendly shallow-water approximation, GPU/grid solver, or precomputed-interpolated propagation scheme is acceptable if documented.

Calibrate the historical scenario against published global Chicxulub tsunami work rather than tuning it by eye.

## 7.6 Atmosphere and climate surrogate

Do not pretend to execute a general circulation model (GCM) live in the browser.

Instead build a reduced-order model that maps impact and target outputs into time-dependent fields such as:

- stratospheric/upper-atmosphere dust burden;
- sulfate aerosol burden;
- soot burden;
- global optical-depth proxy;
- photosynthetically active radiation (PAR) reduction;
- global and latitudinal temperature anomaly;
- precipitation anomaly;
- duration of severe low-light conditions;
- broad ocean-surface cooling/chemistry stress if supported.

Use published studies to define response envelopes and uncertainty.

The model must accommodate evolving scientific estimates. In particular, do not hard-code old sulfur assumptions as unquestioned truth when newer work proposes substantially lower release estimates.

Recommended implementation concept:

- a **Consensus / Evidence Envelope** default;
- optional **Model Details** panel showing which published constraints influence the current estimate;
- internal model versioning so assumptions can be updated later.

## 7.7 Biosphere outcome layer

Avoid fake precision such as "dinosaurs have a 63.7% chance of surviving."

Instead derive broad ecological stress indicators from modeled physical drivers:

- surface-light collapse;
- duration of photosynthesis suppression;
- thermal pulse severity;
- temperature departure;
- precipitation loss;
- wildfire potential where modeled;
- marine productivity stress;
- habitat-specific exposure.

Present outcomes such as:

- localized catastrophe;
- continental-scale ecological crisis;
- severe global disruption;
- K–Pg-scale ecosystem-collapse potential;

with explicit uncertainty/confidence.

The historical Chicxulub result should be the reference calibration—not a magic hard-coded "extinction = true" flag.

---

# 8. Time architecture: reversible catastrophe

The event spans milliseconds to decades. Time control is a core interaction system, not an ordinary video player.

## 8.1 Model time must be seekable

Architect the scenario so visual state can be evaluated deterministically at an arbitrary simulation time `t`.

Do **not** implement rewind by trying to reverse an irreversible chain of random particle updates frame by frame.

Use a combination of:

- deterministic scenario seed;
- analytical/time-indexed effect functions where possible;
- event keyframes/checkpoints;
- cached field snapshots for expensive solvers;
- reproducible particle seeds;
- interpolation between stable states;
- coarse immediate seek followed by refinement when a heavy field must be recomputed.

The user must be able to drag time backward from years after impact to seconds after impact and obtain a coherent state without restarting the application.

## 8.2 Multi-scale timeline

Use a logarithmic or chapter-aware mapping that makes all of these reachable:

1. Approach — seconds before impact
2. Atmospheric entry — when relevant
3. Contact — milliseconds to seconds
4. Fireball/excavation — seconds to minutes
5. Crater modification/collapse — minutes
6. Blast/thermal/seismic propagation — minutes to hours
7. Ejecta re-entry/deposition — tens of minutes to hours
8. Tsunami propagation — minutes to days
9. Atmospheric encirclement — hours to days
10. Darkness/radiative disruption — days to years
11. Early recovery — years to decades only where supportable

## 8.3 Hidden playback interface

The time rail is **not permanently visible**.

Reveal it when:

- the user moves the pointer into a bottom interaction zone;
- presses the playback shortcut;
- pauses;
- uses a controller/touch gesture assigned to time;
- explicitly pins controls open.

When untouched during playback, it fades away completely.

When revealed, support:

- play/pause;
- restart;
- rewind;
- forward;
- frame/step or chapter stepping;
- direct scrub;
- speed control across meaningful ranges;
- jump to named event phases;
- fit-event cinematic playback;
- return to real-time scale near fast local events if appropriate.

Visible elapsed-time text belongs **inside the revealed rail only**.

## 8.4 Keyboard and accessibility time controls

Provide keyboard equivalents for play/pause, step backward/forward, larger time jumps, speed adjustment and reveal/hide interface. Keyboard use must not require the visual controls to stay onscreen.

## 8.5 Pause is an inspection state

Pause freezes model time but not the camera. The user can continue to orbit/zoom and optionally select active phenomena. Explanatory text appears only after the user requests it.

---

# 9. Visual phenomena and VFX quality bar

The visual simulation must communicate physical differences through form, motion, scale, light, occlusion and timing—not through neon infographic rings.

## 9.1 Star field and space environment

The background must be substantially better than a near-black color with random white dots.

Implement an inertial celestial environment using one of these production approaches:

- a preprocessed bright-star catalog plus a Milky Way sky texture/field;
- a carefully generated star dome calibrated to plausible magnitude/color distribution;
- a hybrid catalog + procedural faint-star field.

Requirements:

- wide dynamic range of star brightness without giant glowing discs;
- subtle stellar color variation;
- a restrained Milky Way band/deep-sky luminance field;
- stars remain effectively at infinity as the camera orbits Earth—**do not add fake nearby-star parallax**;
- **do not twinkle stars in vacuum**;
- no fantasy nebula wallpaper unless physically justified and extremely restrained;
- star field must survive exposure changes caused by the impact flash without disappearing permanently;
- sun direction, Earth terminator and atmospheric limb lighting must feel coherent with the celestial environment;
- optional Moon only if its inclusion is handled credibly and does not become a distraction.

When the impact darkens the atmosphere, distinguish reduced surface illumination from the external orbital view. Space itself does not become blacker because Earth has an impact winter.

## 9.2 Lighting and exposure

Use physically inspired rendering:

- directional solar light;
- plausible day/night terminator;
- atmospheric Rayleigh/Mie-style scattering or an efficient equivalent;
- HDR/filmic tone mapping;
- controlled bloom limited to genuinely emissive phenomena;
- local incandescent ejecta/fireball emission;
- exposure adaptation that prevents the initial flash from turning into a permanent white screen.

Never use bloom as a substitute for impact physics.

## 9.3 Impact approach and atmospheric entry

The body must be a real 3D object with composition-appropriate material, irregularity and rotation.

Depending on body class and parameters, visualize:

- vacuum approach with no flaming trail;
- onset of atmospheric interaction at plausible altitude;
- shock-heated wake;
- ablation;
- fragmentation when the entry model predicts it;
- volatile shedding/outgassing treatment for a cometary body if included;
- trajectory geometry and aim aid only when the user summons targeting/science controls.

Cinematic camera presets may include chase, side-on trajectory and target-horizon view, but the user can escape them instantly.

## 9.4 Contact, excavation and crater evolution

Use layered VFX rather than a single texture swap:

- sub-second flash with safe luminance limits;
- terrain/ocean contact deformation;
- expanding excavation cavity;
- ejecta curtain with directionality from trajectory where supported;
- vapor plume;
- molten/incandescent source material;
- fallback/collapse into the final transient/final crater morphology;
- water cavity and rebound for ocean impacts;
- secondary debris and dust that settle into the larger plume system.

Final crater dimensions must match the numerical model. The animation path is illustrative unless driven by a validated transient-crater model.

## 9.5 Particle-system taxonomy

Do not render every phenomenon with the same sprite emitter.

Create separate systems for at least:

- coarse ballistic ejecta/debris;
- incandescent droplets/fragments;
- vapor/plume condensate;
- upper-atmosphere fine dust/aerosol tracers;
- soot/smoke proxy where a selected model contains it;
- re-entry streaks/thermal tracers if included;
- ocean spray/mist near water impacts;
- optional atmospheric circulation tracers at long timescales.

Each system needs its own:

- emission geometry;
- lifetime distribution;
- velocity field;
- size evolution;
- temperature/color evolution where relevant;
- opacity/extinction behavior;
- collision/occlusion assumptions;
- level-of-detail and device-quality budget;
- deterministic seed.

Use GPU instancing, compute/WebGPU where appropriate, transform feedback or efficient shader approaches rather than CPU-spawning thousands of independent objects.

## 9.6 Volumetric plume

A Chicxulub-class plume should read as a three-dimensional planetary-scale structure, not stock smoke.

Use a hybrid of:

- low-frequency volumetric density;
- higher-frequency turbulent detail;
- embedded incandescent ejecta;
- altitude-dependent expansion;
- shadowing/self-attenuation where affordable;
- sunlight interaction;
- layered proxy fields at global scale.

Transition gracefully from near-field volume to global atmospheric distribution. Avoid a hard moment where a 3D plume simply disappears and is replaced by a 2D heatmap.

## 9.7 Atmospheric blast, seismic and thermal propagation

These are distinct systems.

### Atmospheric blast

Represent as a pressure/disturbance front through atmospheric refraction/distortion, cloud displacement, surface interaction and subtle shell geometry—not a neon circle.

### Seismic

Represent with globe-surface displacement/shading pulses and optional translucent interior/cutaway visualization when specifically summoned. Do not imply literal glowing energy bands inside solid Earth in normal view.

### Thermal

Represent thermal exposure primarily through illumination/ground response and a temporarily summonable diagnostic field. Do not paint a permanent colored radius on Earth during cinematic playback.

## 9.8 Ejecta and re-entry

Show multiple scales:

- local excavation curtain;
- ballistic arcs leaving and re-entering the atmosphere;
- global fine-material dispersal;
- deposition state on the surface;
- optional re-entry thermal pulse if the chosen scientific model supports it.

Near-field trajectories may be individual particles; global fine material should transition to a density/transport field rather than millions of independent sprites.

## 9.9 Tsunami as moving ocean, not a ring

Ocean impacts must visibly disturb water volume/surface.

At global scale:

- propagate wave energy using the selected bathymetry-aware method;
- show wavefront texture/displacement following ocean basins;
- let continents block/redirect propagation;
- show reflection/refraction/diffraction only to the sophistication actually modeled;
- show coastal amplification with a resolution-appropriate surrogate;
- let the user lower the camera to a near-limb or coastal probe view to experience arrival.

Diagnostic arrival-time contours are allowed only when the user summons the tsunami science layer.

## 9.10 Atmosphere and global transport

The upper atmosphere must visibly evolve in 3D and over the globe:

- vertical injection;
- lateral spreading;
- hemisphere/global encirclement;
- particle/density transport;
- sunlight attenuation;
- altered terminator/sky appearance;
- settling/removal;
- model-dependent sulfate/dust/soot components as separate inspectable fields.

For global transport, borrow the visual intelligence of animated flow-field tools: advect tracers through a field so motion reveals circulation rather than painting a static opacity texture.

## 9.11 Climate and biosphere phase

Longer timescales should remain visually alive:

- atmosphere changes optical depth;
- surface illumination changes;
- temperature anomaly can influence surface palette subtly;
- sea-ice/vegetation/productivity stress may be shown only where the model supports it;
- diagnostic overlays appear only when summoned.

The underlying climate layer may be a reduced-order field, but the visual experience should remain Earth, atmosphere and light—not a full-screen chart.

## 9.12 Before, during and after remain freely explorable

No chapter owns the camera. The user can orbit the globe at any time.

Core camera modes:

- Free Orbit;
- Impact Target Orbit;
- Global Overview;
- Impactor Chase;
- Trajectory Side View;
- Atmospheric Limb;
- Plume Orbit;
- Tsunami Basin Overview;
- selected Probe / Surface Observer where implemented;
- Auto Director, optional.

Camera mode changes never reset time or scenario state.

---

# 10. Counterfactual comparison system: visual first, metrics second

Comparison is a defining feature, but it must not turn the screen into an analytics dashboard.

## 10.1 Historical baseline

Historical Chicxulub remains a pinned reference scenario.

## 10.2 Primary comparison interactions

Required visual-first options:

- **hold-to-compare**: while holding a key/button, temporarily show the historical state at the same simulation time;
- **A/B toggle**: instant, time-synchronized flip between historical and counterfactual worlds;
- **wipe/reveal**: optional draggable screen-space or globe-space comparison reveal;
- **ghost footprint**: only when requested, show historical effect extents as low-opacity geometry/field;
- **synchronized time**: both scenarios must be evaluated at the same event phase/time mapping.

The catastrophe remains full-screen during comparison.

## 10.3 Secondary metrics comparison

Only when the user opens Compare, show quantitative differences such as:

- impact energy;
- target environment;
- water depth;
- crater dimensions;
- thermal/blast severity;
- tsunami distribution;
- dust/sulfate/soot proxy;
- global radiative/climate response;
- productivity/ecological stress envelope.

This panel must explain **sameness** as well as difference and identify which causal input changed.

## 10.4 Do not manufacture contrast

If two locations produce similar outcomes for a given subsystem, render them similarly. Entertainment is not a license to exaggerate model differences.

---

# 11. Summoned site and phenomenon inspector

There is no persistent "Why this place matters" panel.

When the user explicitly inspects a target or pauses and selects a phenomenon, open a temporary overlay/drawer containing the relevant information.

For a target site, it may include:

- epoch;
- coordinates;
- paleogeographic/modern region;
- land / shelf / deep sea;
- elevation/water depth;
- target type;
- sediment/lithology proxy;
- climate-active-material proxy;
- data confidence;
- concise causal interpretation: **"This site changes the outcome mainly because..."**

For a visible phenomenon, it may include:

- what is being rendered;
- whether the visual is directly calculated, model-derived, proxy, or illustrative;
- what controls its magnitude;
- how it differs from Chicxulub;
- uncertainty;
- source/model basis.

Closing the inspector removes all its text from the viewport.

---

# 12. Results are available, never imposed

Do **not** automatically cover the aftermath with a results dashboard when the run completes.

The visual aftermath is the result.

A user who wants numbers can open a hidden **Results / Science** surface.

## 12.1 Compact result summary when requested

Show only the highest-value outcomes first, then allow deeper expansion. Possible summary items:

- impact energy;
- crater scale;
- dominant regional hazard;
- tsunami severity where relevant;
- atmospheric loading severity;
- peak radiative/cooling envelope;
- ecological stress category.

## 12.2 Deep results

Expandable sections can contain asteroid/entry, crater, thermal, blast, seismic, ejecta, tsunami, atmosphere, climate, biosphere and uncertainty.

Every number requires units, source/model family and precision appropriate to the method.

## 12.3 Confidence language

Use explicit model-state terms such as calculated, scaling-law estimate, published-model envelope, reconstructed/proxy, uncertain and illustrative visualization.

---

# 13. Science mode

Provide an optional advanced **Science** drawer for users who want to inspect the machinery.

Include:

- equations/model family;
- active data source and version;
- parameter assumptions;
- model confidence;
- cited papers;
- derived vs observed vs reconstructed distinction;
- known limitations;
- current scenario JSON.

A user should be able to answer: **"Where did this number come from?"**

---

# 14. Scenario presets

Include curated presets that demonstrate the purpose of the experience.

Suggested 66 Ma presets:

- **Historical Chicxulub**
- **Same asteroid — deep ocean**
- **Same asteroid — continental crystalline target**
- **Same asteroid — shallow carbonate/sedimentary shelf**
- **Smaller Chicxulub**
- **Larger Chicxulub**

Suggested present-day presets should be geophysically diverse rather than sensationally city-targeted:

- deep Pacific;
- shallow continental shelf;
- continental shield/interior;
- carbonate-rich sedimentary region if supported by data.

If a preset's geological interpretation is uncertain, say so.

---

# 15. Present-day optional exposure layer

The modern Earth mode may offer an **Exposure** layer, but keep it separate from the physical simulation.

Potential overlays:

- population density;
- major urban areas;
- national boundaries;
- critical coastline exposure;
- major infrastructure only if a reliable dataset is available.

Rules:

- do not fabricate casualty numbers;
- do not infer deaths from simple circular zones;
- if affected-population counts are included, label them as population within modeled hazard regions—not predicted fatalities;
- document dataset date and license.

This layer must be opt-in so the core experience remains planetary/scientific rather than disaster voyeurism.

---

# 16. Catastrophe-first UI architecture

The application must be designed around **progressive disappearance**, not persistent chrome.

## 16.1 Idle/playback state

Default visual occupancy:

- 100% simulation canvas;
- 0 persistent words/letters/numbers;
- 0 persistent cards;
- 0 persistent results;
- 0 permanent legends;
- pointer may fade after inactivity;
- edge icons may fade after inactivity.

The Earth and catastrophe own the screen.

## 16.2 Reveal behavior

On pointer movement, touch, keyboard activity or an explicit reveal gesture, show a minimal icon-only control layer.

Suggested icon affordances:

- impactor/target;
- time;
- camera;
- layers;
- compare;
- science/info;
- settings/help.

Icons may show accessible tooltips after hover/focus, but tooltips disappear and never remain during playback.

## 16.3 Drawers and sheets

When opened:

- overlay the simulation instead of resizing it;
- preserve at least ~70–75% of the desktop viewport for the globe whenever possible;
- use translucent/dimmed backing only enough for legibility;
- close on Escape/outside click where safe;
- opening one major drawer generally closes the previous one;
- closing the last drawer returns to zero-chrome mode;
- panel state never resets scenario or camera;
- panel state never pauses the simulation unless the user deliberately pauses.

On mobile, use transient bottom sheets and compact icon controls.

## 16.4 Timeline behavior

The timeline is a temporary bottom rail, not a permanent footer. It reveals on interaction and fades after inactivity while playback continues.

## 16.5 No-text catastrophe mode

Provide a dedicated **Cinematic / Clean View** that forcibly hides all sighted UI, labels, cursor overlays, debug visualizations and metrics until the user invokes the reveal shortcut/gesture. This mode must still retain keyboard-accessible pause and exit behavior.

## 16.6 Visual design language

Use:

- museum/scientific restraint;
- near-black/inertial space background with a genuinely rich star field;
- high-fidelity Earth materials and atmospheric limb;
- thin, unobtrusive iconography;
- restrained translucent surfaces only while controls are open;
- motion that communicates state;
- no generic neon science-fiction HUD;
- no giant glowing cards;
- no dashboard grid;
- no gamified score language;
- no text permanently floating over Earth.

## 16.7 Accessibility without visual clutter

The visual screen can be nearly textless while the DOM/control structure remains semantically rich.

Provide:

- accessible names on icon buttons;
- keyboard shortcuts;
- a screen-reader scenario summary;
- visible focus only when keyboard navigation is active;
- a full text/science panel on demand;
- reduced-motion mode;
- no flashing/strobing.

---

# 17. Interaction and camera system

The camera and time controls are major product features.

## 17.1 Free globe manipulation

Support:

- mouse/touch drag orbit;
- wheel/pinch zoom;
- smooth inertial rotation with conservative damping;
- optional two-axis orbit that lets the viewer get above/below the equatorial plane;
- reset view;
- focus impact target;
- focus antipode;
- global view;
- keyboard rotation/zoom equivalents;
- no camera reset when time changes.

Do not make the globe feel like a flat map wrapped around a sphere.

## 17.2 Zoom domain

Allow zoom from:

- whole-Earth orbital context;
- medium orbital/regional framing;
- close regional view of the crater/plume/ocean surface within texture/terrain fidelity limits.

If the data cannot support true ground-level detail globally, stop or transition gracefully rather than showing stretched textures.

## 17.3 Camera modes

Implement a camera mode system with smooth, interruptible transitions.

Required:

- Free Orbit;
- Impact Target Orbit;
- Global Overview;
- Impactor Chase;
- Trajectory Side;
- Atmospheric Limb;
- Plume Orbit;
- Tsunami Overview.

Strong optional additions:

- Probe/Surface Observer;
- Ejecta Follow;
- Terminator View;
- Auto Director.

**Any direct camera input immediately exits or overrides Auto Director.** The user always owns the camera.

## 17.4 Camera bookmarks and return path

Allow temporary camera bookmarks so a user can inspect a close-up and instantly return to their previous orbital view. Camera bookmarks are state, not scenario parameters.

## 17.5 Target interaction

The target marker must remain legible without looking like a map pin. Use surface-reticle, glow, ring distortion or similar restrained visual language. Coordinates/text appear only when Inspect is open.

## 17.6 Probes

Allow a user to place probe points and later ask what happens there. Probe markers should be minimal and hideable.

When a probe is opened, reveal distance, arrival timing, thermal/blast/seismic/ejecta/tsunami and longer-term climate outputs supported by the model.

## 17.7 Optional tactile/audio layer

If audio is implemented, keep it optional and off/muted until user interaction satisfies browser policy. Use restrained spatial/temporal sound design to reinforce phase changes, not Hollywood explosions in vacuum. Reduced-sensory mode must be available.

---

# 18. Share, save, and reproduce scenarios

A good scientific exploration tool should make a scenario reproducible.

Implement:

- shareable URL state when practical;
- export scenario JSON;
- import scenario JSON;
- copy concise results summary;
- export a still image of the current globe if technically straightforward;
- optional comparison export.

Suggested scenario schema fields:

- modelVersion;
- epoch;
- impactLatitude;
- impactLongitude;
- diameterKm;
- densityKgM3;
- velocityKmS;
- impactAngleDeg;
- azimuthDeg;
- targetModel;
- climateModelPreset;
- timelineTime;
- activeLayers.

Do not encode gigantic binary data in the URL.

---

# 19. Scientific source and provenance requirements

Create a machine-readable and human-readable source manifest.

Each model/data source should record:

- title;
- authors/organization;
- publication/data year;
- DOI or canonical URL;
- purpose in this app;
- variables derived from it;
- license/usage notes;
- local transformed asset generated from it, if applicable;
- uncertainty/limitations.

At minimum, research and consider the following source families.

## 19.1 Chicxulub event / environmental consequences

**Morgan, J. V., Bralower, T. J., Brugger, J., Wünnemann, K., et al. (2022). _The Chicxulub impact and its environmental consequences_. Nature Reviews Earth & Environment.**  
DOI: https://doi.org/10.1038/s43017-022-00283-y

Useful anchors include the ~66 Ma timing, ~200 km structure scale, impact energy order, global ejecta transport, and impact-winter framing.

## 19.2 Impact trajectory

**Collins, G. S., Patel, N., Davison, T. M., et al. (2020). _A steeply-inclined trajectory for the Chicxulub impact_. Nature Communications.**  
DOI: https://doi.org/10.1038/s41467-020-15269-x

Use for the evidence supporting a steep ~45–60° impact and northeast-to-southwest trajectory interpretation.

## 19.3 Regional impact effects / scaling

**Collins, G. S., Melosh, H. J., & Marcus, R. A. (2005). _Earth Impact Effects Program: A Web-based computer program for calculating the regional environmental consequences of a meteoroid impact on Earth_. Meteoritics & Planetary Science.**  
DOI: https://doi.org/10.1111/j.1945-5100.2005.tb00157.x

Also inspect the current Earth Impact Effects Program implementation/documentation from Imperial College / Purdue for corrections or model updates.

## 19.4 Chicxulub global tsunami

**Range, M. M., Arbic, B. K., Johnson, B. C., et al. (2022). _The Chicxulub Impact Produced a Powerful Global Tsunami_. AGU Advances.**  
DOI: https://doi.org/10.1029/2021AV000627

Use as a calibration/source for global tsunami scale, propagation approach, and the importance of 66 Ma bathymetry.

## 19.5 Fine silicate dust / impact winter

**Senel, C. B., Kaskes, P., Temel, O., et al. (2023). _Chicxulub impact winter sustained by fine silicate dust_. Nature Geoscience.**  
DOI: https://doi.org/10.1038/s41561-023-01290-4

This study provides useful constraints on fine silicate dust, atmospheric residence, cooling, and photosynthetically active radiation response. Treat its results as a model study, not a universal exact outcome for every counterfactual impact.

## 19.6 Updated sulfur constraint

**Rodiouchkina, K., Goderis, S., Senel, C. B., et al. (2025). _Reduced contribution of sulfur to the mass extinction associated with the Chicxulub impact event_. Nature Communications.**  
DOI: https://doi.org/10.1038/s41467-024-55145-6

This work estimates substantially less sulfur release than some earlier numerical assumptions. The app should reflect this scientific uncertainty rather than silently choosing an obsolete sulfur value.

## 19.6a Emerging 2026 fine-dust thermal-pulse work

**Johnson, B. C., Johnson, A. V., Wakita, S., & Robertson, D. S. (2026). _Heat and wildfires during the K–Pg mass extinction enhanced by fine dust_. Journal of Geophysical Research: Biogeosciences. DOI: https://doi.org/10.1029/2026JG009837**

Treat this as a **recent model result, not settled baseline truth**. It argues that fine dust may have intensified the post-impact thermal pulse enough to support much more widespread ignition than older treatments imply. The simulation may expose this through an optional `2026 fine-dust thermal-pulse model` in the science/model-comparison drawer, but must:

- distinguish modeled thermal forcing from direct geographic evidence for wildfires;
- communicate the uncertainty and evidentiary limits explicitly;
- never silently replace the baseline thermal model with this newer interpretation;
- show how selecting it changes radiative heating, ignition-likelihood overlays, and uncertainty ranges;
- cite the paper in the explanation panel whenever its assumptions materially affect the displayed result.

## 19.7 Location sensitivity / target composition

**Kaiho, K. & Oshima, N. (2017). _Site of asteroid impact changed the history of life on Earth: the low probability of mass extinction_. Scientific Reports.**  
DOI: https://doi.org/10.1038/s41598-017-14199-x

This is particularly relevant to the central counterfactual concept: target hydrocarbon/sulfur content can alter climate forcing. Treat the quantitative "fraction of Earth's surface" conclusion as the result of that model, not settled universal truth.

## 19.8 Paleogeography

Use GPlates / EarthByte reconstruction data and cite the specific model/version actually used.

Starting points:

- https://www.gplates.org/
- https://www.earthbyte.org/gplates-2-3-software-and-data-sets/

For EarthByte paleogeography, cite the underlying publication/model rather than only the download page.

## 19.9 Present-day topography/bathymetry

Potential sources:

- GEBCO current global grid: https://www.gebco.net/
- NOAA ETOPO: https://www.ncei.noaa.gov/products/etopo-global-relief-model
- NASA Earth imagery: https://visibleearth.nasa.gov/
- Natural Earth vectors: https://www.naturalearthdata.com/

Verify the exact license and attribution requirements for every distributed asset.

## 19.10 Freshness requirement

Before finalizing the scientific model, search for peer-reviewed Chicxulub/impact-winter/thermal-pulse work published after the references above.

If newer high-quality work materially changes a modeled quantity:

- update the default model;
- retain old model presets only when educationally useful;
- document the change;
- do not mix incompatible assumptions without explanation.

---

# 20. Model uncertainty is a feature, not an embarrassment

The application should make uncertainty understandable without drowning the user in error bars.

## Default mode

Show clean central estimates/ranges.

## Science mode

Show:

- plausible range;
- source studies;
- input uncertainty;
- model uncertainty;
- where proxy data is being used;
- where results are extrapolated beyond calibration.

## Uncertainty visualization options

Use restrained methods such as:

- translucent bands;
- range bars;
- "low / central / high" envelopes;
- dotted boundaries for low-confidence spatial fields;
- confidence badges.

Never use false precision to make the simulation feel more authoritative.

---

# 21. Data/model behavior when the user clicks anywhere

The product must gracefully handle areas with limited geology data.

Possible states:

### High data confidence

Use site-specific or high-quality regional inputs.

### Moderate confidence

Use reconstructed target class / sediment proxy.

### Low confidence

Use broad crust/lithology class and widen uncertainty.

### Unknown chemistry

Calculate energy/crater/regional mechanics using known physical parameters, but label aerosol/climate estimates as underconstrained and use a neutral target-chemistry envelope rather than inventing sulfate/organic content.

**Do not block the user from simulating simply because the geology is uncertain. Make the uncertainty visible.**

---

# 22. Technical architecture

Preferred greenfield stack unless existing project constraints dictate otherwise:

- TypeScript;
- React;
- Vite or equivalent modern bundler;
- Three.js through React Three Fiber or a comparably maintainable Three.js integration;
- custom GLSL shaders where needed for atmosphere/effects;
- Web Workers for numerical calculations/grid propagation;
- lightweight deterministic state store;
- typed model/data schemas;
- Vitest or equivalent for model unit tests;
- Playwright or equivalent for core interaction testing.

Do not add a heavyweight GIS or game engine merely because the app contains a globe. Add dependencies only when they materially solve a requirement.

## 22.1 Architectural separation

Keep these concerns separate:

### `simulation/core`

Pure numerical functions, units, scaling laws, uncertainty, target response.

### `simulation/timeline`

Maps model outputs onto event time and chapter states.

### `data/epochs`

66 Ma and modern spatial datasets, transforms, target lookup.

### `data/science`

Model coefficients, source IDs, uncertainty envelopes.

### `render/globe`

Earth rendering, cameras, LOD, picking.

### `render/effects`

Shock, ejecta, plume, atmosphere, tsunami, climate fields.

### `ui`

Controls, timeline, drawers, inspectors, explanations.

### `workers`

Heavy simulation/grid tasks.

### `tests`

Scientific regression and UX interaction tests.

If project conventions differ, preserve them while keeping equivalent separation of responsibility.

## 22.2 Determinism

For a given model version and scenario JSON, numerical outputs must be deterministic.

Particle positions may use a seeded random generator so screenshots/replays remain reproducible.

## 22.3 Unit discipline

Use a unit-safe layer or strict conventions.

Store canonical quantities in SI units. Never mix km/m or km/s/m/s casually.

Add tests specifically for unit conversions because impact energy is extremely sensitive to diameter and velocity.

---

# 23. Rendering, particles and performance strategy

The experience should look expensive because the GPU work is disciplined, not because the browser is overloaded.

## 23.1 Rendering stack

Prefer a modern Three.js architecture capable of WebGPU where practical, with WebGL2 fallback unless project constraints dictate otherwise. Keep rendering implementation modular so effect systems can degrade independently.

Use:

- level of detail (LOD) for globe and terrain;
- high-resolution assets only near the current camera need;
- instanced particles/geometry;
- GPU simulation/compute for large particle fields when support justifies it;
- shader-driven global fields;
- Web Workers for CPU scientific calculations;
- cached solver outputs;
- lazy loading for the inactive epoch;
- texture compression/streaming where appropriate;
- frustum/occlusion culling;
- adaptive render scale;
- adaptive effect budgets.

## 23.2 Tiered effect architecture

Each expensive effect must define quality tiers instead of simply turning the whole app from "high" to "low."

Examples:

- star density;
- atmosphere sample count;
- plume volumetric steps;
- ejecta particle count;
- tracer count;
- ocean displacement resolution;
- field texture resolution;
- shadow quality;
- post-processing quality.

Auto mode should lower the least scientifically important visual cost first.

## 23.3 Performance goals

Target:

- ~60 fps during ordinary camera interaction on a modern desktop;
- stable usable behavior near ~30 fps on weaker supported hardware;
- no long main-thread stalls from model calculations;
- coarse simulation state available quickly, then refined if necessary;
- responsive camera even while a heavy field is computing;
- clean recovery from context loss where feasible.

Do not promise a fixed frame rate on all devices. Measure and adapt.

## 23.4 Visual consistency while seeking time

Time scrubbing must not create particle explosions, stale frames or state mismatches.

When seeking:

1. immediately update deterministic macro state;
2. reconstruct seeded particles for the requested time;
3. restore/interpolate cached field states;
4. refine expensive fields asynchronously;
5. never let the camera freeze while the seek completes.

## 23.5 Post-processing discipline

Allowed when subtle and purposeful:

- filmic tone mapping;
- restrained bloom;
- temporal anti-aliasing or high-quality AA;
- depth haze/atmospheric scattering;
- motion blur only if it remains comfortable and does not smear scientific fields;
- color grading limited to a coherent physically plausible presentation.

Disallowed:

- constant lens flare;
- chromatic aberration as decoration;
- camera dirt overlays;
- fake handheld shake during orbital view;
- effects that make data/effect boundaries unreadable.

Camera shake near a close impact view, if used at all, must be restrained, physically motivated, optional and disabled by reduced-motion mode.

## 23.6 Quality controls

Settings may expose Auto, High, Balanced and Reduced. Include a hidden diagnostics panel for frame time, particle counts, solver timing and render tier during development; it must not be part of normal viewing.

---

# 24. Accessibility

The app is visual, but it still needs an accessible operational path.

Requirements:

- keyboard-accessible major controls;
- visible focus states;
- semantic buttons and labels;
- screen-reader names for impact parameters and playback;
- text alternative for the current scenario/result summary;
- no color-only encoding of severity;
- sufficient UI contrast over the globe;
- touch targets suitable for mobile/tablet;
- on-demand text explanations for every important visual phenomenon, available when the user intentionally opens Inspect/Science rather than persistently overlaying playback;
- respect `prefers-reduced-motion`;
- reduced-motion mode disables unnecessary camera sweeps and replaces aggressive motion with slower/faded state transitions;
- **no strobing or rapid repeated full-screen flashes**.

Pausing the simulation must never be hidden from keyboard or assistive technology users.

---

# 25. Responsive behavior

## Desktop

Full globe with edge drawers and compact timeline.

## Tablet

Same model, larger touch targets, drawers convert to narrower overlays or bottom sheets.

## Mobile

Maintain the core experience:

- rotate/pinch globe;
- position impact;
- change diameter;
- simulate;
- pause/scrub;
- inspect results.

Use simplified effects/resolution where necessary.

Do not simply show "desktop required" unless a specific advanced diagnostic truly cannot work on mobile.

---

# 26. Loading, failure, and degraded states

Implement real product states.

## Initial loading

Show a restrained globe-loading state with progress categories:

- globe;
- epoch data;
- science model;

Do not fake a percentage if total work is unknown.

## Heavy simulation calculation

Keep the globe interactive. Show a subtle "calculating tsunami field…" or equivalent status.

## Dataset failure

If a nonessential dataset fails:

- keep the simulation usable;
- disable only the affected layer;
- explain what is unavailable;
- never silently substitute invented data.

## WebGL/WebGPU failure

Provide a meaningful compatibility message and, if feasible, a simplified 2D fallback summary rather than a blank canvas.

## Offline

If local assets are already cached, the core physical simulation should continue where practical. Do not require live network access for every interaction.

---

# 27. Visual asset and celestial-environment quality

Create or source production-grade assets for:

- stony, metallic, carbonaceous, rubble-pile and cometary impactor materials where those presets exist;
- ~66 Ma Earth albedo/terrain/ocean reconstruction;
- modern Earth albedo/topography/bathymetry;
- atmosphere/cloud layers;
- star field / bright-star catalog or generated celestial sphere;
- restrained Milky Way luminance/color field;
- impact crater local materials;
- plume/ejecta noise and lookup textures;
- ocean wave/displacement support textures;
- UI icons.

Every external asset requires provenance, license, transformation notes and optimized runtime representation.

## 27.1 Star-field standard

Do not ship:

- a single low-resolution star JPEG;
- uniform random dots;
- obvious repeated star tiles;
- fake twinkling in space;
- giant fantasy nebula clouds;
- stars that rotate with the Earth texture.

The celestial sphere should remain inertial while Earth rotates/orbits visually within the scene.

## 27.2 Impactor materials

Each impactor type needs a distinct material response visible in close view without becoming game loot rarity styling.

Examples:

- metallic: high reflectance but rough/oxidized/irregular, not chrome;
- stony: fractured regolith/rock;
- carbonaceous: very dark low-albedo material;
- rubble pile: heterogeneous aggregate silhouette/material treatment;
- comet: dark dusty crust with icy/volatile cues; no cartoon snowball.

## 27.3 Placeholder policy

No placeholder checkerboards, generic smooth spheres, repeated stock smoke, default Three.js star field, or generic particle burst may remain in user-visible core states at completion.

---

# 28. Educational explanation design

The app should answer questions at the moment they arise.

Examples of contextual explanations:

### "Why did the climate result change so much when I moved the impact only 2,000 km?"

Explain target chemistry / sediment / water-depth changes and name the model assumptions involved.

### "Why is the crater similar but the tsunami completely different?"

Explain similar impact energy versus changed ocean depth/basin geometry.

### "Why is the impact still globally bad even though this site produces less sulfur?"

Explain dust, ejecta, thermal effects, and other forcing rather than treating sulfur as the only kill mechanism.

### "Why does the atmosphere look dark for years?"

Connect visualization to modeled dust/aerosol optical effects and photosynthetically active radiation.

### "Did the dinosaurs survive in this version?"

Do not answer with a fictional certainty. Summarize whether the modeled physical stress still reaches a K–Pg-scale ecological-collapse range and why, with confidence limits.

---

# 29. High-value experiential features

Implement these after the core simulation and time/camera architecture are stable, but design the architecture so they do not require a rewrite.

## 29.1 Probe bookmarks

Pin 2–4 locations and revisit them through time. In clean view, probe markers can hide automatically.

## 29.2 Antipode inspection

Show the antipode when requested and allow seismic/global inspection without unsupported volcanism claims.

## 29.3 Auto Director

Provide an optional cinematic director that chooses contextually useful shots:

- approach chase;
- impact-site orbital;
- global blast/ejecta reveal;
- atmospheric limb during plume rise;
- basin overview during tsunami propagation;
- orbital global view during atmospheric encirclement;
- sunlit/terminator view during impact winter.

Rules:

- never force it on;
- any manual camera input exits it immediately;
- do not cut so rapidly that the user loses spatial context;
- reduced-motion mode disables or softens it.

## 29.4 Surface/observer probe view

For selected locations, optionally allow a ground/near-surface view of sky illumination, distant plume, ejecta arrival, atmospheric darkness or tsunami arrival. Treat this as a visualization layer with explicit limits; do not imply CFD-scale local fidelity if the data cannot support it.

## 29.5 Visual historical comparison

Add hold-to-compare and A/B wipe/flip interactions that remain synchronized in time.

## 29.6 Guided scientific story

An optional short tour can walk the user through Historical Chicxulub, move the same impactor to deep ocean, compare, then switch to modern Earth. It should feel like a museum guide temporarily borrowing the camera, not like a slideshow.

## 29.7 Photo / frame capture

Allow clean-view screenshots with deterministic scenario/time metadata embedded in a separate downloadable/sidecar record rather than stamped across the image.

## 29.8 Model comparison

Science mode may compare multiple published climate-response assumptions as an uncertainty teaching tool, provided incompatible models are not blended into a false composite.

## 29.9 Optional spatial sound

If added, use restrained impact-phase audio and optional surface-observer sound. Never play roaring impact audio from an external space camera as if sound travels through vacuum.

---

# 30. Prohibited shortcuts and failure modes

Do **not**:

- use modern coastlines for the 66 Ma globe;
- treat every impact location as the same target;
- treat impactor composition as a cosmetic skin;
- model a comet as "rock asteroid but white";
- animate a circular tsunami through continents;
- use one expanding ring for blast, seismic, heat and tsunami;
- use flat 2D damage circles as the primary visual language;
- hard-code "Chicxulub = 75% extinction" as an algorithm;
- claim a full hydrocode/global climate model when using scaling/surrogates;
- show fake precision;
- hide uncertainty;
- derive scientific numbers from arbitrary particle brightness;
- lock the camera during playback;
- force Auto Director after the user touches the camera;
- make the timeline permanently visible;
- make a results panel automatically cover the aftermath;
- keep labels, metrics, coordinates, legends or explanatory text permanently over the globe;
- use a low-resolution star wallpaper;
- twinkle stars in external space view;
- use generic fantasy nebulae as visual filler;
- rotate the star field with Earth;
- use generic stock smoke as the impact plume;
- use a single generic particle emitter for every phenomenon;
- reverse random particles frame-by-frame and call that deterministic rewind;
- require an account/login;
- require a paid map token for the core experience;
- silently send scenario data externally;
- ship placeholder assets while claiming completion;
- invent citations/datasets;
- force-push or overwrite unexpected GitHub history;
- claim a push succeeded without verifying the remote branch/commit.

---

# 31. Calibration requirements

Before trusting arbitrary counterfactual scenarios, prove the historical reference behaves plausibly.

For the Chicxulub preset, validate against literature-level order-of-magnitude/range expectations for:

- crater diameter on the order of ~180–200 km;
- impact energy around the published Chicxulub scale;
- global ejecta/atmospheric dispersal on hour-scale transport;
- extremely energetic global tsunami behavior;
- severe multi-year atmospheric/climate disruption;
- photosynthetic light reduction consistent with the selected published model envelope.

Do not tune every subsystem independently until it "looks right." Calibration values must share a coherent parameter set.

Create a `historical-chicxulub` regression fixture and fail tests when major model changes push it outside documented acceptance ranges without an intentional model-version update.

---

# 32. Testing requirements

## 32.1 Scientific unit tests

Test at minimum:

- asteroid mass calculation;
- kinetic energy calculation;
- angle conversion;
- unit conversions;
- great-circle distance;
- target lookup;
- crater scaling reference cases;
- regional effect falloff reference cases;
- tsunami solver conservation/stability checks appropriate to the implementation;
- climate surrogate interpolation bounds;
- uncertainty propagation sanity;
- scenario serialization round-trip.

## 32.2 Regression fixtures

Include:

- historical Chicxulub;
- same asteroid, deep-ocean target;
- same asteroid, crystalline continental target;
- significantly smaller asteroid;
- significantly larger asteroid;
- polar/high-latitude target;
- coastline/shallow-water target;
- missing-target-chemistry fallback.

## 32.3 UX interaction tests

Verify:

- globe rotates/zooms;
- impact marker moves;
- diameter changes outputs;
- switching epochs replaces the correct datasets;
- simulation plays;
- pause freezes model time;
- scrub restores a stable prior state;
- opening/closing drawers does not reset simulation;
- compare mode shows the correct baseline;
- result/source inspector works;
- keyboard controls work for core flow;
- reduced-motion mode works;
- mobile layout retains the core flow.

## 32.4 Visual QA

Inspect real rendered states for:

- default 66 Ma globe;
- modern globe;
- impact instant;
- 10-minute state;
- tsunami propagation;
- atmospheric encirclement;
- impact-winter state;
- paused explanation;
- comparison mode;
- mobile viewport;
- reduced-motion mode.

Look specifically for:

- effect layers clipping through Earth incorrectly;
- wavefront z-fighting;
- impact marker occlusion;
- unreadable text over bright globe areas;
- overly thick/shiny atmosphere;
- UI clutter;
- physically misleading colors;
- time scrub desynchronization.

---

# 33. Acceptance criteria

The build is not complete until all mandatory criteria pass.

## Catastrophe-first experience

- [ ] During normal playback, the viewport can reach a state with **no persistent visible words, letters, numbers, metric cards or legends**.
- [ ] Closing all drawers returns to a pure simulation view.
- [ ] No results panel automatically covers the post-impact world.
- [ ] The globe/catastrophe remains the dominant visual surface in every normal state.
- [ ] Cinematic/Clean View hides all sighted UI without removing keyboard-accessible pause/exit.

## Globe, star field and camera

- [ ] The Earth is a genuinely interactive 3D globe, not a 2D map on a sphere with limited interaction.
- [ ] The user can rotate/orbit and zoom before, during and after impact.
- [ ] Camera control remains live while the simulation is playing and while heavy fields are computing.
- [ ] Auto Director, if active, yields immediately to manual input.
- [ ] Multiple useful camera modes exist, including Free Orbit, Impact Target, Global Overview and Impactor Chase.
- [ ] The star field is multi-layered/catalog/procedural-quality, not uniform random dots or a low-resolution wallpaper.
- [ ] Stars do not visibly twinkle in external space view and do not rotate with Earth.
- [ ] Solar direction, terminator and atmospheric limb are coherent.

## Time control

- [ ] Play, pause, restart, forward, rewind and direct scrub work.
- [ ] The user can seek backward from later phases to earlier phases without restarting the app.
- [ ] Seeking reconstructs deterministic visual state rather than naively reversing random simulation steps.
- [ ] Seconds-to-years remain navigable through a chapter/logarithmic time system.
- [ ] Time controls can auto-hide completely during playback.

## Impactor options

- [ ] The user can change diameter.
- [ ] The user can choose at least stony, metallic, carbonaceous, rubble-pile and cometary body classes plus the historical reference preset.
- [ ] Impactor type changes model inputs/entry assumptions where supported, not merely surface texture.
- [ ] Cometary entry is not treated identically to a dense rocky asteroid.
- [ ] Velocity, angle, azimuth and density/custom assumptions are available in advanced controls.

## Dual epochs and target dependence

- [ ] A distinct ~66 Ma paleogeographic Earth is implemented.
- [ ] A distinct present-day Earth is implemented.
- [ ] Target lookup changes with epoch.
- [ ] Land, shelf, deep-ocean and available geology/chemistry proxies affect model outputs.
- [ ] Missing geology is represented honestly.
- [ ] Historical Chicxulub can be restored at any time.

## Visual phenomena

- [ ] Impact approach/entry, contact, crater excavation/collapse, ejecta, blast, seismic, tsunami and atmosphere are visually distinct.
- [ ] The crater visibly evolves rather than appearing as a static decal.
- [ ] The plume reads as a 3D volume/field, not stock smoke.
- [ ] Particle systems use distinct behaviors for coarse ejecta, fine dust/aerosol and other implemented media.
- [ ] Tsunami motion follows ocean/bathymetry at the sophistication claimed by the model and does not cross continents as a ring.
- [ ] Atmospheric loading visibly spreads and evolves globally.
- [ ] Long-timescale climate state remains visually integrated with Earth/atmosphere rather than becoming a chart-first mode.

## Counterfactual comparison

- [ ] Same-impactor/different-location scenarios can be compared against historical Chicxulub.
- [ ] At least one visual-first compare method exists: hold-to-compare, synchronized A/B toggle or wipe.
- [ ] The comparison identifies what stayed similar and what changed when the user opens details.
- [ ] The simulation does not exaggerate differences simply for spectacle.

## Scientific integrity

- [ ] Every major numerical subsystem has a named model/source.
- [ ] Calculated, scaling-law, surrogate, reconstructed/proxy, uncertain and illustrative outputs remain distinguishable.
- [ ] Historical Chicxulub passes a source-backed regression fixture.
- [ ] No unsupported exact extinction/fatality claim appears.
- [ ] Dataset versions/licenses are documented.
- [ ] Newer peer-reviewed work has been checked before freezing coefficients.

## Performance and reliability

- [ ] Camera interaction remains responsive during normal calculation.
- [ ] Major particle/volumetric systems have independent quality tiers.
- [ ] No placeholder visual assets remain in user-visible core states.
- [ ] Core simulation requires no paid API key.
- [ ] WebGL/WebGPU/context/data failures degrade gracefully.
- [ ] Scenario/time reconstruction is deterministic enough for regression tests and saved scenarios.

## Accessibility

- [ ] Icon-only sighted controls have semantic accessible names.
- [ ] Core flow is keyboard-operable.
- [ ] Reduced-motion mode works.
- [ ] No important status relies only on color.
- [ ] Clean View does not make pause/exit inaccessible.

## Repository completion

- [ ] Local repository is initialized or verified as Git.
- [ ] `origin` points to `https://github.com/westkitty/Planet_Killer` unless the user/environment explicitly requires a different authenticated remote form.
- [ ] Build/test/validation succeeds to the level required before commit.
- [ ] Intended project files are staged.
- [ ] A commit is created with a meaningful message.
- [ ] The final commit is pushed to `main` without force.
- [ ] Remote `main` is verified to contain the pushed commit.

---

# 34. Required deliverables

Return a working repository plus concise documentation.

At minimum, the project must contain:

1. working production-ready web application;
2. README with setup/run/build/test instructions;
3. scientific model/source documentation;
4. data-source/license/provenance ledger;
5. scenario schema documentation;
6. historical Chicxulub regression fixture;
7. automated scientific unit tests;
8. interaction/time-seeking tests;
9. visual QA checklist/screenshots or reproducible capture states;
10. comparator benchmark note summarizing what was learned from Neal.fun Asteroid Launcher, Earth Impact Effects Program, NASA Eyes and earth.nullschool;
11. performance/degradation notes for particle/volumetric effects;
12. Git commit pushed to the target repository.

If a requested dataset or visual technique cannot be implemented honestly, document the limitation and use the best scientifically defensible fallback. Do not silently fake it.

---

# 35. Implementation order

Use this sequence to avoid building a beautiful dead-end demo.

1. Inspect/verify GitHub remote and initialize local Git/project safely.
2. Establish application architecture, renderer capability detection and deterministic scenario schema.
3. Implement high-quality star field, solar lighting, atmosphere and interactive globe camera first; prove rotate/orbit/zoom and clean-view UI behavior.
4. Integrate 66 Ma and present-day Earth datasets and epoch switching.
5. Implement impact target picking/repositioning and target lookup.
6. Implement impactor classes/composition presets and parameter model, including cometary differences.
7. Implement scientific impact core and historical Chicxulub regression fixture.
8. Implement seekable/reversible time architecture before complex VFX.
9. Implement approach/entry/contact/crater VFX.
10. Implement distinct ejecta, blast, seismic and thermal visual systems.
11. Implement bathymetry-aware tsunami state and visual propagation.
12. Implement volumetric plume, global atmospheric transport and long-timescale optical/climate state.
13. Implement camera modes and optional Auto Director.
14. Implement visual-first A/B comparison.
15. Add hidden controls/results/science drawers, keeping default playback zero-chrome.
16. Add probes, save/share/import/export and optional guided tour.
17. Run scientific calibration/regression tests.
18. Run time-seek determinism tests.
19. Run interaction/accessibility tests.
20. Run rendered visual QA at multiple times/cameras/quality tiers.
21. Remove placeholders/debug overlays.
22. Run final build/tests, inspect `git diff`/`git status`, stage intended files, commit and push to target `main`.
23. Verify remote `main` points at the intended final commit.

Do not spend the first implementation phase on results cards. Prove the Earth, camera, star field, targeting, time architecture and catastrophe rendering first.

---

# 36. Final completion report

Return a compact evidence-based report containing:

- what was implemented;
- major files/modules created or changed;
- scientific datasets/models actually used;
- which visual systems are calculated/model-derived/proxy/illustrative;
- camera/time controls implemented;
- impactor presets implemented;
- tests/build/visual QA run and results;
- performance/degraded-mode evidence;
- known limitations or skipped checks;
- Git branch;
- final commit SHA;
- push result;
- explicit verification that remote `main` contains that commit.

Do not include hidden chain-of-thought. Do not claim a model, render, test, commit or push happened unless it was actually observed.

---

# 37. Repository initialization, staging, commit and push

The target repository is:

`https://github.com/westkitty/Planet_Killer`

At the start of work:

1. Inspect the current working directory for `.git`.
2. Inspect the target remote state before assuming it is empty.
3. If this is a new local project with no Git repository, run an equivalent of `git init -b main`.
4. If `origin` is missing, add the target repository as `origin`.
5. If `origin` already exists, verify it points to the intended repository before changing it.
6. If the remote contains commits, fetch and reconcile safely; **do not overwrite or force-push unexpected history**.

After implementation and validation:

1. run `git status`;
2. inspect the diff/changed-file set;
3. stage the intended project files (`git add ...` or `git add -A` only when every change is intended);
4. commit with a meaningful message such as `Build Planet Killer impact simulation` or a more accurate summary;
5. push with an equivalent of `git push -u origin main` when setting upstream is needed;
6. never use `--force` for this task;
7. verify the remote branch/commit after push;
8. if authentication prevents push, stop after the verified local commit and report the exact blocker instead of claiming success.

Because the user explicitly authorized initialization, staging and push for this repository, no separate approval ritual is needed for the ordinary non-force push described here. This authorization does **not** permit destructive history rewriting, deleting remote branches, exposing credentials or pushing unrelated local files.

---

# 38. Final quality standard

The finished product should make a user forget they are looking at a web interface until they deliberately ask for the interface back.

A successful run should let the user watch a body cross the star field, alter the atmosphere on entry, strike a physically distinct Earth, excavate a crater, throw incandescent material into space, send different hazard systems outward through their appropriate media, wrap the atmosphere in evolving dust/aerosol fields, move freely around the planet while all of this happens, stop time at any instant, rewind years back toward the impact, switch camera perspectives without resetting anything, and compare another worldline without covering the planet in analytics.

The benchmark is **scientifically honest, visually exceptional, spatially legible, temporally reversible, fluid to control, difficult to stop exploring, and clean enough that the catastrophe—not the software chrome—is what the user remembers.**
