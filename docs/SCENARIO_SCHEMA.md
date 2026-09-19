# Scenario Schema

Current schema version: **1**
Current model version: **`planet-killer-0.4`**

A normalized scenario has this shape:

```json
{
  "schemaVersion": 1,
  "modelVersion": "planet-killer-0.4",
  "name": "Historical Chicxulub",
  "seed": 66000001,
  "epochId": "cretaceous66",
  "target": {
    "longitude": -86.8,
    "latitude": 21.2
  },
  "impactor": {
    "classId": "historical-reference",
    "composition": "rocky-carbonaceous reference envelope",
    "diameterM": 12000,
    "densityKgM3": 3000,
    "velocityMS": 20000,
    "angleDeg": 60,
    "azimuthDeg": 135
  },
  "climateOptions": {
    "preset": "consensus-envelope",
    "fineDustThermal": true
  },
  "timelineTime": -30
}
```

## Normalization and validation

`src/simulation/scenario.js` normalizes imported objects against the Historical Chicxulub defaults and enforces bounded numeric ranges for target position and impactor parameters. Schema versions newer than `1` are rejected rather than silently reinterpreted. Missing/older fields are normalized into the current schema rather than treated as authoritative hidden state.

The deterministic seed is stored with the scenario. Level A/B numerical results are deterministic for the same normalized scenario and model version. Timeline visual state is a pure function of modeled time; seeking backward reconstructs the same macro state instead of reversing accumulated animation history.

## Impactor class and bounded editing

`impactor.classId` names one of the six physical classes in `src/simulation/impactorClasses.js`
(`historical-reference`, `stony`, `metallic`, `carbonaceous`, `rubble`, `cometary`); `impactor.composition`
is the class's label string. `classId` selects literature-anchored density/velocity defaults and an
**allowed envelope** — it does not lock the parameters.

Bounded editing has two layers, both in `src/simulation/scenario.js`:

- **Hard bounds** (`IMPACTOR_BOUNDS`): diameter, density, velocity, angle and azimuth each have a
  supported physical range. A value outside the hard range is rejected with a `RangeError`
  (`<field> <value> is outside the supported range <min>–<max> <unit>`); the scenario is left
  unchanged and the error is surfaced inline in the drawer.
- **Class envelope** (advisory): within the hard bounds, a density/velocity value that leaves the
  selected class's literature envelope is still applied, but the UI flags it
  (`outsideEnvelope`) as a class deviation. The class never silently re-snaps a manual edit.

Angle is bounded `10–90°`; azimuth is bounded `0–360°` and normalized modulo 360. These bounds and
envelopes are part of the scenario contract: the displayed value, the URL hash, and the simulation
input are all derived from the same normalized scenario, so they cannot disagree.

## Sharing and files

- **Export scenario** downloads the normalized JSON document.
- **Import JSON** parses and normalizes that document.
- **Copy share link** encodes the normalized JSON into the URL hash as `#scenario=...`.
- Large derived fields such as tsunami grids are not serialized; they are recomputed from scenario state.
- Clean-frame capture writes a PNG plus a separate JSON metadata sidecar containing the scenario, modeled time, camera state, target descriptor, and model-family labels.
