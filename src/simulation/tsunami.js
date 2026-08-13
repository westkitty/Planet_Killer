import { targetAt } from './target.js';

const EARTH_RADIUS_KM = 6371;
const G = 9.80665;

function haversineKm(lon1, lat1, lon2, lat2) {
  const r = Math.PI / 180;
  const p1 = lat1 * r, p2 = lat2 * r;
  const dp = (lat2 - lat1) * r, dl = (lon2 - lon1) * r;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

class MinHeap {
  constructor() { this.items = []; }
  push(item) {
    const a = this.items; a.push(item); let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= item[0]) break; a[i] = a[p]; i = p; } a[i] = item;
  }
  pop() {
    const a = this.items; if (!a.length) return null; const root = a[0]; const tail = a.pop();
    if (a.length) { let i = 0; while (true) { let l = i * 2 + 1, r = l + 1, c = i; if (l < a.length && a[l][0] < a[c][0]) c = l; if (r < a.length && a[r][0] < a[c][0]) c = r; if (c === i) break; a[i] = a[c]; i = c; } a[i] = tail; }
    return root;
  }
  get length() { return this.items.length; }
}

export function tsunamiSourceStrength({ crater, target, impactor }) {
  if (target.medium !== 'ocean') return 0;
  const depthCoupling = Math.max(0.18, Math.min(1.4, target.waterDepthKm / 2.5));
  return (crater.transientDiameterKm / 100) ** 1.4 * (impactor.energyJ / 5.4e23) ** 0.25 * depthCoupling;
}

export function solveTsunami({ epochId, source, crater, impactor, width = 72, height = 36 }) {
  const sourceTarget = targetAt({ epochId, longitude: source.longitude, latitude: source.latitude });
  const size = width * height;
  const arrivalSeconds = new Float64Array(size); arrivalSeconds.fill(Infinity);
  const amplitude = new Float32Array(size);
  const waterDepthKm = new Float32Array(size);
  const ocean = new Uint8Array(size);

  for (let y = 0; y < height; y++) {
    const lat = -90 + (y + 0.5) * 180 / height;
    for (let x = 0; x < width; x++) {
      const lon = -180 + (x + 0.5) * 360 / width;
      const t = targetAt({ epochId, longitude: lon, latitude: lat });
      const i = y * width + x;
      if (t.medium === 'ocean') {
        ocean[i] = 1;
        waterDepthKm[i] = Math.max(0.08, t.waterDepthKm || 2.5);
      }
    }
  }

  if (sourceTarget.medium !== 'ocean') {
    return { applicable: false, width, height, arrivalSeconds: Array.from(arrivalSeconds), amplitude: Array.from(amplitude), ocean: Array.from(ocean), sourceStrength: 0, model: 'coarse shallow-water travel-time proxy' };
  }

  let sx = Math.floor((source.longitude + 180) / 360 * width) % width; if (sx < 0) sx += width;
  let sy = Math.max(0, Math.min(height - 1, Math.floor((source.latitude + 90) / 180 * height)));
  let sourceIndex = sy * width + sx;
  if (!ocean[sourceIndex]) {
    let best = null;
    for (let radius = 1; radius < 5 && !best; radius++) {
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        const yy = sy + dy; if (yy < 0 || yy >= height) continue;
        const xx = (sx + dx + width) % width; const ii = yy * width + xx;
        if (ocean[ii]) { best = [xx, yy, ii]; break; }
      }
    }
    if (best) [sx, sy, sourceIndex] = best;
  }

  const heap = new MinHeap(); arrivalSeconds[sourceIndex] = 0; heap.push([0, sourceIndex]);
  const neighbors = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while (heap.length) {
    const [time, index] = heap.pop(); if (time !== arrivalSeconds[index]) continue;
    const y = Math.floor(index / width), x = index % width;
    const lat1 = -90 + (y + 0.5) * 180 / height, lon1 = -180 + (x + 0.5) * 360 / width;
    for (const [dx, dy] of neighbors) {
      const yy = y + dy; if (yy < 0 || yy >= height) continue;
      const xx = (x + dx + width) % width, ni = yy * width + xx; if (!ocean[ni]) continue;
      const lat2 = -90 + (yy + 0.5) * 180 / height, lon2 = -180 + (xx + 0.5) * 360 / width;
      const distanceM = haversineKm(lon1, lat1, lon2, lat2) * 1000;
      const avgDepthM = Math.max(50, (waterDepthKm[index] + waterDepthKm[ni]) * 500);
      const speedMS = Math.sqrt(G * avgDepthM);
      const next = time + distanceM / speedMS;
      if (next < arrivalSeconds[ni]) { arrivalSeconds[ni] = next; heap.push([next, ni]); }
    }
  }

  const strength = tsunamiSourceStrength({ crater, target: sourceTarget, impactor });
  const sourceLon = -180 + (sx + 0.5) * 360 / width, sourceLat = -90 + (sy + 0.5) * 180 / height;
  for (let i = 0; i < size; i++) {
    if (!ocean[i] || !Number.isFinite(arrivalSeconds[i])) continue;
    const y = Math.floor(i / width), x = i % width;
    const lat = -90 + (y + 0.5) * 180 / height, lon = -180 + (x + 0.5) * 360 / width;
    const distanceKm = haversineKm(sourceLon, sourceLat, lon, lat);
    const shoal = Math.min(2.2, Math.sqrt(3 / Math.max(0.2, waterDepthKm[i])));
    amplitude[i] = strength * shoal / Math.sqrt(1 + distanceKm / 180);
  }

  return {
    applicable: true,
    width,
    height,
    arrivalSeconds: Array.from(arrivalSeconds, v => Number.isFinite(v) ? v : null),
    amplitude: Array.from(amplitude),
    ocean: Array.from(ocean),
    sourceStrength: strength,
    model: 'coarse shallow-water travel-time proxy with land blocking and depth-sensitive speed',
    uncertainty: 'far-field educational resolution; source-region hydrodynamics unresolved'
  };
}

export function sampleTsunami(field, longitude, latitude) {
  const { width, height } = field;
  let x = Math.floor((longitude + 180) / 360 * width) % width; if (x < 0) x += width;
  const y = Math.max(0, Math.min(height - 1, Math.floor((latitude + 90) / 180 * height)));
  const i = y * width + x;
  return { arrivalSeconds: field.arrivalSeconds[i], amplitude: field.amplitude[i], ocean: Boolean(field.ocean[i]) };
}
