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
    entryHeating: pulse(t, -12, 8, 7),
    contactFlash: pulse(t, 0, 0.35, 4.5),
    excavation: pulse(t, 0, 80, 420),
    crater: ramp(t, 15, 600),
    ejecta: pulse(t, 5, 2400, 22000),
    plume: pulse(t, 0, 900, 2.5 * 86400),
    seismic: pulse(t, 5, 1800, 16000),
    pressure: pulse(t, 10, 3000, 18000),
    thermal: pulse(t, 0.5, 600, 12000),
    tsunami: ramp(t, 300, 2 * 86400),
    atmosphere: ramp(t, 3600, 2 * 86400),
    darkness: t > 86400 ? Math.exp(-Math.max(0, t - 86400) / (1.8 * YEAR)) : 0,
    recovery: ramp(t, YEAR, 9 * YEAR)
  };
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
