# Model Limitations

## Current hard limits

1. **66 Ma paleogeography is not dataset-complete.** The shipped globe uses a low-resolution project-owned polygon proxy informed by published paleogeographic relationships. It is not a transformed EarthByte/GPlates dataset and contains no numerical 66 Ma paleobathymetry.
2. **Modern geography is resolution-limited.** Present-day land/sea uses a 2-degree GSHHG 2.3.6 derivative and globe shading uses a 32×16 ETOPO1-derived luminance field. These are appropriate for globe-scale interaction and coarse basin blocking, not survey or local-hazard work. The relief field is never numerical bathymetry.
3. **Global target chemistry is categorical.** Sulfate, carbonate, organic-potential, and sediment values are educational regional/global proxies, not site-specific geochemistry.
4. **Cratering and regional effects are reduced-order.** The browser does not execute a hydrocode, shock-physics solver, or detailed atmospheric-entry solver.
5. **Tsunami propagation uses proxy depth.** The solver blocks land and uses depth-sensitive shallow-water travel speed, but it is not a published modern or 66 Ma bathymetry-driven hydrodynamic solution.
6. **Climate is a response envelope.** No general circulation model runs in the browser. The current code maps dimensionless dust, sulfate, soot, and water-vapor loading indices into an optical-depth/light/temperature/precipitation envelope. A small fine-dust thermal term can be disabled through scenario JSON, but it is not a reproduction of any one published 2026 multiplier study.
7. **Plume, ejecta, entry wake, atmospheric dust, crater coloration, and tsunami rendering are illustrative.** They are deterministic and scenario-responsive but do not feed Level A/B numerical results.
8. **No fatality or exact extinction probability is computed.** Ecological output is a broad stress category with an explicit non-probability note.
9. **Ground-level terrain fidelity is not supported.** The globe remains a planetary/regional visualization rather than a globally detailed terrain engine.
10. **WebGPU and representative-device performance certification are not implemented.** The renderer intentionally uses dependency-free WebGL2 with bounded effect counts and a capped device-pixel ratio; FPS, thermal, memory-growth, and context-loss proof remain outstanding.

## Model-version discipline

A change that materially moves the Historical Chicxulub regression outside its documented range must update the model version and explain the numerical/scientific reason. Visual tuning must not silently change numerical outputs.
