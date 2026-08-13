# Third-Party Data Notices

Planet Killer's runtime code is project-owned. Two compact present-day Earth derivatives were generated from data distributed by `mpl_toolkits.basemap_data` / `basemap-data 2.0.0`:

- `src/data/epochs/modernLandMask.js` — a 2-degree categorical land/sea derivative from GSHHG 2.3.6 data. The upstream package states that its GSHHG-derived land/sea/coastline data are distributed under LGPL-3.0-or-later. Retained license text: `docs/resources/licenses/basemap-data-COPYING-LESSER.txt`.
- `src/data/epochs/modernRelief.js` — a 32×16 luminance derivative from the package's `etopo1.jpg`, used only for globe shading and never numerical bathymetry. The upstream package states that non-GSHHG files other than EPSG are distributed under its MIT license. Retained text: `docs/resources/licenses/basemap-data-LICENSE-MIT.txt`.

The compact derivatives are intentionally global-scale and must not be presented as survey-grade coastline, elevation, or bathymetry.
