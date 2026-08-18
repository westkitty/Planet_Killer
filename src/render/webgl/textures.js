import { epochById } from '../../simulation/target.js';
import { polygonContains } from '../../data/epochs/geometry.js';

function clamp255(value) { return Math.max(0, Math.min(255, Math.round(value))); }
function mix(a, b, t) { return a + (b - a) * t; }
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function buildSurfacePixels(epochId, width = 256, height = 128) {
  const epoch = epochById(epochId), pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const latitude = 90 - (y + 0.5) / height * 180;
    for (let x = 0; x < width; x++) {
      const longitude = -180 + (x + 0.5) / width * 360;
      const land = epoch.landResolver ? epoch.landResolver(latitude, longitude) : polygonContains(longitude, latitude, epoch.land);
      const relief = epoch.reliefResolver ? epoch.reliefResolver(latitude, longitude) : 0.5;
      const flatten = smoothstep(72, 89, Math.abs(latitude));
      const variation = mix(0.92 + 0.08 * Math.sin(longitude * 0.19) * Math.cos(latitude * 0.31), 0.96, flatten);
      const i = (y * width + x) * 4;
      if (land) {
        // No polar ice at 66 Ma. Where a modern cap does belong it is written as a
        // flat value so the texture's meridian convergence has nothing to streak.
        const ice = epochId === 'modern' ? smoothstep(64, 78, Math.abs(latitude)) : 0;
        const dry = epochId === 'cretaceous66' ? 0.12 + 0.12 * Math.cos(latitude * 0.08) : 0;
        pixels[i] = clamp255(mix((72 + relief * 72 + dry * 42) * variation, 196, ice));
        pixels[i + 1] = clamp255(mix((90 + relief * 60 - dry * 30) * variation, 204, ice));
        pixels[i + 2] = clamp255(mix((60 + relief * 36) * variation, 214, ice));
        pixels[i + 3] = 0;
      } else {
        const depth = Math.max(0, 0.62 - relief);
        pixels[i] = clamp255((14 + relief * 22) * variation);
        pixels[i + 1] = clamp255((58 + relief * 62) * variation);
        pixels[i + 2] = clamp255((104 + relief * 104 - depth * 38) * variation);
        pixels[i + 3] = 255;
      }
    }
  }
  return { width, height, pixels };
}

/** `out` lets a caller recycle its buffer across frames; omit it for a fresh array. */
export function buildTsunamiPixels(field, modelTime, out = null) {
  if (!field?.width || !field?.height) return { width: 1, height: 1, pixels: new Uint8Array([0,0,0,255]) };
  const bytes = field.width * field.height * 4;
  const pixels = out?.length === bytes ? out : new Uint8Array(bytes);
  let maxAmplitude = 0;
  for (const value of field.amplitude || []) maxAmplitude = Math.max(maxAmplitude, Number(value) || 0);
  maxAmplitude = maxAmplitude || 1;
  for (let i = 0; i < field.width * field.height; i++) {
    const arrival = field.arrivalSeconds?.[i], ocean = Boolean(field.ocean?.[i]);
    const age = arrival == null ? -1 : modelTime - arrival;
    const front = ocean && age >= 0 ? Math.exp(-Math.max(0, age) / 21600) : 0;
    const normalizedAmplitude = ocean ? Math.min(1, (Number(field.amplitude?.[i]) || 0) / maxAmplitude) : 0;
    const j = i * 4;
    pixels[j] = clamp255(front * 255);
    pixels[j + 1] = clamp255(normalizedAmplitude * 255);
    pixels[j + 2] = 0;
    pixels[j + 3] = 255;
  }
  return { width: field.width, height: field.height, pixels };
}
