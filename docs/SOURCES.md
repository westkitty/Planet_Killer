# Sources, Provenance and Use

Planet Killer uses published impact/climate/tsunami/paleogeography literature as calibration and interpretation context for reduced-order models. The runtime does not claim to reproduce those papers' full numerical solvers. Two compact present-day Earth derivatives generated from locally installed `basemap-data 2.0.0` are distributed with retained provenance/license material under `docs/resources/`. No EarthByte binary/shapefile/raster asset is distributed.

| ID | Source | Use in current build | State / limitation |
|---|---|---|---|
| COLLINS2005 | Collins, Melosh & Marcus (2005), Earth Impact Effects Program, DOI `10.1111/j.1945-5100.2005.tb00157.x` | Impact/regional scaling reference family | Current equations are simplified project surrogates, not a reproduction of the complete program |
| COLLINS2020 | Collins et al. (2020), DOI `10.1038/s41467-020-15269-x` | Historical trajectory context | Context only; the shipped fixture is one bounded reference scenario |
| MORGAN2022 | Morgan et al. (2022), DOI `10.1038/s43017-022-00283-y` | Chicxulub scale and environmental framing | Calibration/context |
| RANGE2022 | Range et al. (2022), DOI `10.1029/2021AV000627` | Chicxulub tsunami context | Current solver is much coarser and does not use the paper's numerical paleobathymetry |
| SENEL2023 | Senel et al. (2023), DOI `10.1038/s41561-023-01290-4` | Fine-dust climate-response context | Literature context; not directly reproduced |
| RODIOUCHKINA2025 | Rodiouchkina et al. (2025), DOI `10.1038/s41467-024-55145-6` | Sulfur uncertainty context | Current runtime uses dimensionless sulfate potential rather than exact arbitrary-site sulfur tonnage |
| JOHNSON2026 | Johnson et al. (2026), DOI `10.1029/2026JG009837` | Recent fine-dust thermal-pulse context | Context only; current build has no dedicated Johnson multiplier mode |
| KAIHO2017 | Kaiho & Oshima (2017), DOI `10.1038/s41598-017-14199-x` | Target-composition sensitivity context | Global target chemistry remains categorical proxy data |
| CAO2017 | Cao et al. (2017), DOI `10.5194/bg-14-5425-2017` | 66 Ma paleogeographic source family | Runtime ships only a coarse project-owned proxy; full dataset integration remains pending |
| GSHHG236_BASEMAP | GSHHG 2.3.6 via `basemap-data` 2.0.0 | Present-day land/sea render mask, 2-degree target lookup, tsunami land blocking | GSHHG-derived package data are LGPL-3.0-or-later; derivative is global-scale, not survey-grade |
| ETOPO1_BASEMAP | ETOPO1-derived `etopo1.jpg` via `basemap-data` 2.0.0 | Present-day visual relief | Retained package metadata places this non-GSHHG data under MIT terms; visual only, never numerical bathymetry |

## Paleogeography data-family note

Published EarthByte/GPlates paleogeographic products provide a path toward materially better 66 Ma land/shallow-marine reconstruction. The current build deliberately does not redistribute or pretend to contain those datasets; `src/data/epochs/cretaceous66.js` is explicitly labeled a coarse derived proxy.

## Modern Earth derivative note

See `docs/resources/MODERN_EARTH_DATA.md`, `MODERN_EARTH_ASSET_HASHES.json`, and the retained license texts for the exact shipped present-day derivatives. The modern spatial derivative improves globe-scale land/ocean classification while target chemistry and water depth remain separate reduced-order proxies.

## Literature freshness record

The project source review performed on **2026-08-12** included primary literature through the July 2026 Johnson et al. paper. That review is recorded here as project history, not as a claim that the current runtime implements every newer result. Numerical coefficients remain governed by the explicit reduced-order model and regression tests described in `docs/SCIENCE.md` and `docs/VALIDATION.md`.
