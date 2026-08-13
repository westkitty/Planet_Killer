# Modern Earth Runtime Derivatives

The present-day epoch uses compact project-shipped derivatives generated locally from `basemap-data 2.0.0`:

- land/sea: GSHHG 2.3.6 categorical mask sampled to 180×90 cells (2-degree global lookup), run-length encoded in JavaScript;
- visual relief: `etopo1.jpg` downsampled to 32×16 luminance values, used only for render shading.

These files support globe-scale interaction and tsunami land blocking. They are not numerical bathymetry and are not appropriate for local hazard prediction. The 66 Ma epoch does not reuse this modern geography; it remains a separate coarse project-owned paleogeographic proxy.
