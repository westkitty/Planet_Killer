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

## Sharing and files

- **Export scenario** downloads the normalized JSON document.
- **Import JSON** parses and normalizes that document.
- **Copy share link** encodes the normalized JSON into the URL hash as `#scenario=...`.
- Large derived fields such as tsunami grids are not serialized; they are recomputed from scenario state.
- Clean-frame capture writes a PNG plus a separate JSON metadata sidecar containing the scenario, modeled time, camera state, target descriptor, and model-family labels.
