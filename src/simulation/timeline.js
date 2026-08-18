const YEAR = 365.25 * 86400;

export const CHAPTERS = Object.freeze([
  { id: 'approach', label: 'Approach', time: -30 },
  { id: 'entry', label: 'Atmospheric entry', time: -10 },
  { id: 'contact', label: 'Contact', time: 0 },
  { id: 'excavation', label: 'Fireball / excavation', time: 90 },
  { id: 'crater', label: 'Crater modification', time: 600 },
  { id: 'regional', label: 'Blast / thermal / seismic', time: 3600 },
  { id: 'ejecta', label: 'Ejecta re-entry', time: 10800 },
  { id: 'tsunami', label: 'Tsunami propagation', time: 86400 },
  { id: 'encirclement', label: 'Atmospheric encirclement', time: 172800 },
  { id: 'winter', label: 'Impact winter', time: YEAR },
  { id: 'recovery', label: 'Early recovery', time: 10 * YEAR }
]);

const SEGMENTS = CHAPTERS.map((chapter, index) => ({
  ...chapter,
  slider: Math.round(index / (CHAPTERS.length - 1) * 1000)
}));

export function chapterAtTime(time) {
  let chapter = CHAPTERS[0];
  for (const candidate of CHAPTERS) {
    if (time >= candidate.time) chapter = candidate;
    else break;
  }
  return chapter;
}

function logInterpolate(a, b, t) {
  if (a < 0 || b <= 0) return a + (b - a) * t;
  const aa = Math.log10(a + 1);
  const bb = Math.log10(b + 1);
  return 10 ** (aa + (bb - aa) * t) - 1;
}

export function sliderToTime(value) {
  const slider = Math.max(0, Math.min(1000, Number(value) || 0));
  for (let i = 0; i < SEGMENTS.length - 1; i++) {
    const a = SEGMENTS[i], b = SEGMENTS[i + 1];
    if (slider <= b.slider) {
      const t = (slider - a.slider) / Math.max(1, b.slider - a.slider);
      return logInterpolate(a.time, b.time, t);
    }
  }
  return CHAPTERS.at(-1).time;
}

export function timeToSlider(time) {
  const x = Math.max(CHAPTERS[0].time, Math.min(CHAPTERS.at(-1).time, Number(time) || 0));
  for (let i = 0; i < SEGMENTS.length - 1; i++) {
    const a = SEGMENTS[i], b = SEGMENTS[i + 1];
    if (x <= b.time) {
      let t;
      if (a.time < 0 || b.time <= 0) t = (x - a.time) / Math.max(1e-9, b.time - a.time);
      else t = (Math.log10(x + 1) - Math.log10(a.time + 1)) / Math.max(1e-9, Math.log10(b.time + 1) - Math.log10(a.time + 1));
      return a.slider + (b.slider - a.slider) * Math.max(0, Math.min(1, t));
    }
  }
  return 1000;
}

function ramp(time, start, duration) {
  if (time <= start) return 0;
  return Math.max(0, Math.min(1, (time - start) / Math.max(1e-9, duration)));
}

function pulse(time, start, rise, fall) {
  if (time <= start) return 0;
  const x = time - start;
  if (x <= rise) return Math.max(0, Math.min(1, x / rise));
  return Math.max(0, 1 - (x - rise) / fall);
}

export function visualStateAtTime(time) {
  const t = Number(time) || 0;
  return {
    time: t,
    chapter: chapterAtTime(t).id,
    approach: t < 0 ? Math.max(0, Math.min(1, (t + 30) / 30)) : 1,
    entryHeating: pulse(t, -14, 10, 9),
    contactFlash: pulse(t, 0, 0.4, 7),
    excavation: pulse(t, 0, 60, 420),
    fireball: pulse(t, 0, 12, 240),
    crater: ramp(t, 1, 180),
    rimHeat: pulse(t, 0.5, 4, 3600),
    ejecta: pulse(t, 1, 240, 20000),
    plume: pulse(t, 0, 120, 86400),
    reentryGlow: pulse(t, 600, 5400, 28000),
    seismic: pulse(t, 5, 1800, 16000),
    pressure: pulse(t, 10, 3000, 18000),
    thermal: pulse(t, 0.5, 600, 12000),
    tsunami: ramp(t, 300, 2 * 86400),
    atmosphere: ramp(t, 3600, 2 * 86400),
    dust: ramp(t, 3600, 5 * 86400),
    darkness: 0.92 * ramp(t, 86400, 20 * 86400) * (t > 2 * YEAR ? Math.exp(-(t - 2 * YEAR) / (2.2 * YEAR)) : 1),
    recovery: ramp(t, YEAR, 9 * YEAR)
  };
}

const HELD_BEATS = [
  { from: 0, to: 150, rate: 1.4 },      // the approach is anticipation, not content
  { from: 185, to: 255, rate: 0.3 },    // contact and excavation: the piece holds here
  { from: 255, to: 340, rate: 0.62 },   // crater modification settles
  { from: 560, to: 660, rate: 0.8 }     // ejecta re-entry reads across the whole globe
];

/**
 * Playback is choreographed, not uniform: the run accelerates through dead time and
 * holds through contact so the impact is legible at 1x instead of passing in a frame.
 */
export function playbackRateAt(sliderPosition) {
  const x = Math.max(0, Math.min(1000, Number(sliderPosition) || 0));
  let rate = 1;
  for (const beat of HELD_BEATS) {
    if (x <= beat.from || x >= beat.to) continue;
    const span = beat.to - beat.from;
    const edge = Math.min(1, Math.min(x - beat.from, beat.to - x) / Math.max(1, span * 0.28));
    const eased = edge * edge * (3 - 2 * edge);
    rate = 1 + (beat.rate - 1) * eased;
  }
  return rate;
}

/** Mission-clock voice for the hero readout: short, signed, always the same shape. */
export function formatCountdown(seconds) {
  const s = Number(seconds) || 0;
  const sign = s < 0 ? '\u2212' : '+';
  const a = Math.abs(s);
  if (a < 100) return { sign, value: a.toFixed(a < 10 ? 1 : 0), unit: 's' };
  if (a < 7200) return { sign, value: (a / 60).toFixed(1), unit: 'min' };
  if (a < 3 * 86400) return { sign, value: (a / 3600).toFixed(1), unit: 'h' };
  if (a < YEAR) return { sign, value: (a / 86400).toFixed(1), unit: 'd' };
  return { sign, value: (a / YEAR).toFixed(2), unit: 'yr' };
}

export function formatModelTime(seconds) {
  const s = Number(seconds) || 0;
  if (s < 0) return `${Math.abs(s).toFixed(1)} s before impact`;
  if (s < 120) return `${s.toFixed(s < 10 ? 2 : 0)} s`;
  if (s < 7200) return `${(s / 60).toFixed(1)} min`;
  if (s < 3 * 86400) return `${(s / 3600).toFixed(1)} h`;
  if (s < YEAR) return `${(s / 86400).toFixed(1)} d`;
  return `${(s / YEAR).toFixed(2)} y`;
}
