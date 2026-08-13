# Scientific Model

## Evidence-state rule

Planet Killer separates three evidence levels.

**Level A — calculated.** Direct deterministic equations and geometry: spherical mass, kinetic energy, vertical velocity component, unit conversion, and great-circle distance.

**Level B — reduced-order / surrogate.** Crater dimensions, regional-effect scales, target-dependent atmospheric-loading indices, climate envelope, ecological-stress category, and tsunami travel-time field. These are intentionally approximate and labeled as such in source/UI text.

**Level C — illustrative visualization.** Entry heating/wake, point-cloud ejecta, plume/vapor/dust, crater coloration, atmosphere, and tsunami arrival texture. These communicate Level A/B state but never generate it.

## Fundamental impact quantities

For diameter `d` in metres and bulk density `ρ` in kg/m³:

`m = (π / 6) × ρ × d³`

Kinetic energy uses SI velocity:

`E = 0.5 × m × v²`

The vertical component for an impact angle measured from horizontal is:

`v_n = v × sin(angle)`

These equations are implemented in `src/simulation/core.js` and covered by regression tests.

## Crater and regional-effects surrogate

`craterMetrics()` uses an educational energy/density/angle scaling surrogate calibrated so the Historical Chicxulub fixture remains within a broad Chicxulub-scale final-crater envelope. `regionalEffects()` derives broad blast, thermal, seismic, ejecta, and arrival-time scales from the same impact state. Neither function is a hydrocode or a reproduction of the complete Earth Impact Effects Program.

## Target model

`src/simulation/target.js` separates spatial classification from target-chemistry proxies.

- Present-day land/sea classification uses a compact 2-degree GSHHG 2.3.6 derivative.
- Present-day visual relief uses a separate 32×16 ETOPO1-derived luminance field and is not numerical depth.
- The 66 Ma epoch uses a separate project-owned coarse paleogeographic polygon proxy.
- Water depth, sulfate/carbonate/organic potential, sediment potential, and broad target class remain reduced-order/categorical values.

The target descriptor carries a data-quality state and uncertainty note so modern derived geography is not conflated with still-proxy chemistry or 66 Ma reconstruction fidelity.

## Atmospheric and climate envelope

`atmosphericLoading()` maps impact energy and target properties into dimensionless silicate-dust, sulfate, soot, and water-vapor indices. `climateEnvelope()` combines those indices into:

- an optical-depth proxy;
- a light-reduction fraction;
- severe-low-light duration;
- a broad temperature-anomaly envelope;
- a precipitation-change fraction.

This is not a live general circulation model and does not convert arbitrary counterfactual sites into exact sulfur or aerosol tonnages. A small fine-dust thermal term is enabled by default and can be disabled through scenario JSON; it is intentionally bounded and is not presented as a dedicated reproduction of a specific published thermal-pulse multiplier.

## Ecological stress

`ecologicalStress()` combines climate disruption and broad regional reach into one of four qualitative categories. The highest category is `K-Pg-scale ecosystem-collapse potential`. The output explicitly states that it is **not an extinction probability**.

## Tsunami travel-time surrogate

`src/simulation/tsunami.js` solves a coarse depth-weighted graph over an equirectangular global grid:

- land cells are impassable;
- longitude wraps around Earth;
- each ocean cell receives a proxy depth from the active epoch target model;
- edge travel time uses shallow-water wave speed `sqrt(g × depth)`;
- Dijkstra propagation produces a deterministic first-arrival field;
- a relative amplitude proxy attenuates with great-circle distance and local depth/shoaling.

This is materially different from a single expanding circular ring because continents can block routes and water depth changes travel time. It remains below the fidelity of a published bathymetry-driven shallow-water simulation.

## Historical regression

The current Historical Chicxulub fixture uses:

- diameter: **12 km**;
- density: **3000 kg/m³**;
- velocity: **20 km/s**;
- impact angle: **60°**;
- azimuth: **135°**;
- target: the 66 Ma carbonate/evaporite shelf proxy near Chicxulub.

Automated tests require the impact energy to remain in the declared `10^23 J` envelope, the reduced-order final crater to remain broadly Chicxulub-scale (roughly 150–230 km), the historical target to remain sulfate-rich, and the ecological output to reach the broad K–Pg-scale stress category. These are regression bounds, not claims of unique historical parameter certainty.
