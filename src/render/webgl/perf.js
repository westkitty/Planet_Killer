// Bounded runtime diagnostics. Everything here is observation: no input is
// altered, no allocations escape the ring buffers. The Settings drawer renders
// a snapshot on demand; scripts/perf-report.mjs consumes the same structure.

const RING = 240;

export class PerfMonitor {
  constructor() {
    this.frameTimes = [];       // full rAF-to-rAF seconds
    this.renderTimes = [];      // renderer.render() seconds
    this.workerLatencies = [];  // tsunami request -> response ms
    this.workerSamples = 0;
    this.atlasApplyMs = [];
    this.contextLosses = 0;
    this.contextRestorations = 0;
    this.startedAt = Date.now();
    this.symbols = [];          // per-scenario snapshots (capped)
    this.maxSymbols = 16;
  }

  push(value, ring) {
    ring.push(value);
    if (ring.length > RING) ring.shift();
  }

  addFrameTime(seconds) { this.push(Number.isFinite(seconds) ? seconds : 0, this.frameTimes); }
  addRenderTime(seconds) { this.push(Number.isFinite(seconds) ? seconds : 0, this.renderTimes); }
  addWorkerLatency(ms) { this.push(Number.isFinite(ms) ? ms : 0, this.workerLatencies); this.workerSamples++; }
  addAtlasApply(ms) { this.push(Number.isFinite(ms) ? ms : 0, this.atlasApplyMs); }
  noteContextLoss() { this.contextLosses++; }
  noteContextRestoration() { this.contextRestorations++; }

  quantile(ring, q) {
    if (!ring.length) return null;
    const sorted = [...ring].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
    return sorted[index];
  }

  /** Representative measurements over the window already collected. */
  summary() {
    const fps = this.quantile(this.frameTimes.map(t => t > 0 ? 1 / t : 0), 0.5);
    return {
      window: {
        frameSeconds: { median: this.quantile(this.frameTimes, 0.5), p95: this.quantile(this.frameTimes, 0.95), samples: this.frameTimes.length },
        renderSeconds: { median: this.quantile(this.renderTimes, 0.5), p95: this.quantile(this.renderTimes, 0.95), samples: this.renderTimes.length },
        medianFps: fps == null ? null : Number(fps.toFixed(1)),
        workerMs: { median: this.quantile(this.workerLatencies, 0.5), p95: this.quantile(this.workerLatencies, 0.95), samples: this.workerLatencies.length },
        atlasApplyMs: { median: this.quantile(this.atlasApplyMs, 0.5), max: this.atlasApplyMs.length ? Math.max(...this.atlasApplyMs) : null, samples: this.atlasApplyMs.length }
      },
      contextLosses: this.contextLosses,
      contextRestorations: this.contextRestorations,
      uptimeMs: Date.now() - this.startedAt
    };
  }

  /** Record one representative-scenario snapshot (idle, impact, plume, tsunami, atlas, comparison). */
  recordSymbol(name, extra = {}) {
    this.symbols.push({ name, at: Date.now(), ...this.summary().window, ...extra });
    if (this.symbols.length > this.maxSymbols) this.symbols.shift();
  }

  clear() {
    this.frameTimes.length = 0;
    this.renderTimes.length = 0;
    this.workerLatencies.length = 0;
    this.atlasApplyMs.length = 0;
  }
}
