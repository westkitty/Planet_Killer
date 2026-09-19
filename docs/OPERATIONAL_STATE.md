# Operational State

Current operational state of the Planet Killer project as of this pass. This file answers
"how do I run it, how do I verify it, and what is actually proven right now" — it is separate
from `VALIDATION.md` (the evidence record) and `PERFORMANCE.md` (the degradation strategy).

## How to run

Requires Node.js 20+ only; **no runtime package dependencies**.

```bash
npm start          # serves the app at http://127.0.0.1:4173
```

Open the URL in a WebGL2-capable browser. There is no build step required to run from source;
`dist/` is produced only by `npm run build` for static hosting.

## How to verify (the four gates)

```bash
npm test              # 114 deterministic Node tests (stub-GL carries the framebuffer proof here)
npm run check         # module syntax, no hotlinks, no workflow residue
npm run build         # self-contained dist/ with offline docs
npm run smoke:webgl   # real-browser WebGL2 proof (needs a browser; see below)
npm run perf          # raw-measurement performance collector (needs a browser; see below)
```

The first three gates are fully executable in any environment with Node 20+. The last two
require a WebGL2-capable browser:

- `scripts/webgl-smoke.mjs` looks for a browser via `CHROME_PATH` (or `GOOGLE_CHROME` /
  `CHROMIUM_PATH`) or well-known install paths, drives it through `playwright-core` (bundled
  under `tools/webgl-smoke/`), and reports **distinct failure classes** rather than one opaque
  timeout: browser startup, WebGL2 unavailable, app boot, shader construction, runtime JS
  exception, empty/invalid framebuffer, and per-proof-step defects. Exit codes: `0` pass, `1`
  app defect, `2` harness error, `3` external browser-runtime blocker (with exact evidence in
  `docs/qa/webgl-smoke-report.json`).
- `scripts/perf-report.mjs` captures raw measurements (frame time, render time, draw calls,
  primitives, worker latency, Atlas apply cost, context loss/restoration counts, GPU resource
  counts) across the six-scenario matrix plus a context-restore cycle into
  `docs/qa/perf-report.json`. It records raw numbers only — no universal FPS target.

In CI (`.github/workflows/ci.yml`) a headless Chromium is installed so `smoke:webgl` and `perf`
execute for real; a browser-blocked result is recorded as a warning, not waved through silently.

## What is proven now vs. what is not

**Executed and passing in this environment**
- All 114 deterministic tests, including the stub-GL deterministic framebuffer checkpoint suite
  (Approach/Contact/ejecta-plume/tsunami/winter), rewind determinism, context loss/restore
  resource flatness, 12-restart no-accumulation, and stale-worker rejection.
- Project integrity checks and the self-contained build (with offline documentation).
- Historical Chicxulub calibration and SI unit discipline.

**Conclusively blocked by the environment (recorded, not claimed)**
- Live-GPU rendered visual QA: no browser executable and no reachable browser download host in
  this container. `smoke:webgl` returns exit 3 `no-browser-executable-found` with the detection
  evidence in `docs/qa/webgl-smoke-report.json`. This is an external blocker, not an app defect.

**Delivery status**
- **CI**: `.github/workflows/ci.yml` (test/check/build + browser-provisioned WebGL smoke + perf
  capture + artifact upload). Status: defined; runs on push/PR to `main`.
- **GitHub Pages**: `.github/workflows/pages.yml` builds `dist/` and deploys via
  `actions/deploy-pages`. Status: **UNVERIFIED** — the workflow exists but has not been
  confirmed against a completed Pages run. It is *not* promoted to verified until a real
  deployment run is read back.

## Reversibility

This pass was branched from a clean tree (`f6a4d8c`), which serves as the reversible checkpoint.
No reset/clean/discard was performed. All changes are additive or scoped edits on the working
branch; the `dist/`, `audit-output/`, and `docs/qa/` artifacts are git-ignored or generated and
are not part of the source contract.
