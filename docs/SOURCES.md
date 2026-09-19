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

## Impactor class density anchors

<a id="impactor-class-density-anchors"></a>

The six physical impactor classes in `src/simulation/impactorClasses.js` are reduced-order
parameter envelopes, not a petrology model. Their **density defaults** are anchored to the
published measurements below; their **allowed envelopes and entry-coupling factors** are
project-set bounds and are labeled as such in provenance. Each class's `sourceIds` reference
the IDs in this table.

| ID | Source | Density anchor used | Note / limitation |
|---|---|---|---|
| STONE_Meteorite_Densities | Wilkison & Robinson (2000), *Bulk density of ordinary chondrite meteorites and implications for asteroidal internal structure*, Meteoritics & Planetary Science 35:1203–1213, DOI `10.1111/j.1945-5100.2000.tb01509.x`; ADS `2000M&PS...35.1203W` | Ordinary chondrite bulk ≈ 3.0–3.7 g/cm³ (H ≈ 3.44, L ≈ 3.40, LL ≈ 3.29 g/cm³) | Stony class default 3.4 g/cm³, envelope 3.0–3.7 g/cm³ |
| CARBONACEOUS_Meteorite_Densities | Flynn, Consolmagno, Brown & Macke (2018), *Physical properties of the stone meteorites: implications for the properties of their parent bodies*, Geochemistry 78:3, DOI `10.1016/j.chemer.2017.04.002`; NTRS 20230000872 https://ntrs.nasa.gov/citations/20230000872 | Stone-meteorite bulk 2.7–3.7 g/cm³; carbonaceous falls (e.g. Allende) sit at the low, porous end | Carbonaceous class default 2.2 g/cm³, envelope 1.9–2.7 g/cm³ (porous, volatile-bearing) |
| RUBBLE_Pile_Densities | Veverka et al. (2001), *NEAR at Eros: imaging and spectral results*, Science 289:2088, DOI `10.1126/science.289.5487.2088`; https://www.science.org/doi/abs/10.1126/science.289.5487.2088 | 433 Eros mean density 2.67 ± 0.1 g/cm³ ⇒ internal porosity ≈ 10–30% | Rubble-pile default 2.0 g/cm³, envelope 1.5–2.7 g/cm³; represents the porous-aggregate end member |
| IRON_Meteorite_Densities | Meteorite field hand-measurement range as compiled in the Wustl meteorite "Density & specific gravity" reference, https://sites.wustl.edu/meteoritesite/items/density-specific-gravity/ | Iron-nickel irons ≈ 7–8 g/cm³ | Metallic class default 7.8 g/cm³, envelope 7.2–8.0 g/cm³; broad field range, not a single lab value |
| COMET67P_DENSITY_Jorda2016 | Jorda et al. (2016), *The global shape, density and rotation of comet 67P/Churyumov–Gerasimenko from preperihelion Rosetta/OSIRIS observations*, Icarus 277:257–278, DOI `10.1016/j.icarus.2016.05.002`; https://www.sciencedirect.com/science/article/pii/S0019103516301385 | 67P bulk density 532 ± 7 kg/m³ (volume 18.8 ± 0.3 km³, mass 9.982 ± 0.003 ×10¹² kg) | Cometary class default 0.53 g/cm³, envelope 0.4–0.7 g/cm³; a single nucleus, used as the icy end member |

The `historical-reference` class is **not** an added physical material; it is the bounded
source-backed envelope for the K–Pg impactor, cited to `MORGAN2022` and `COLLINS2020` above.
No class claims statistical confidence in a unique body: each is a labeled envelope, and the
entry-coupling factors (cometary 0.88, rubble 0.93, metallic 1.03) are a reduced-order
atmospheric-coupling proxy, explicitly **not** an entry solver.

## Paleogeography data-family note

Published EarthByte/GPlates paleogeographic products provide a path toward materially better 66 Ma land/shallow-marine reconstruction. The current build deliberately does not redistribute or pretend to contain those datasets; `src/data/epochs/cretaceous66.js` is explicitly labeled a coarse derived proxy.

## Modern Earth derivative note

See `docs/resources/MODERN_EARTH_DATA.md`, `MODERN_EARTH_ASSET_HASHES.json`, and the retained license texts for the exact shipped present-day derivatives. The modern spatial derivative improves globe-scale land/ocean classification while target chemistry and water depth remain separate reduced-order proxies.

## Literature freshness record

The project source review performed on **2026-08-12** included primary literature through the July 2026 Johnson et al. paper. That review is recorded here as project history, not as a claim that the current runtime implements every newer result. Numerical coefficients remain governed by the explicit reduced-order model and regression tests described in `docs/SCIENCE.md` and `docs/VALIDATION.md`.
