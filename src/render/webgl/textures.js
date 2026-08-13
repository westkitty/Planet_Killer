import { epochById } from '../../simulation/target.js';
import { polygonContains } from '../../data/epochs/geometry.js';

function clamp255(value) { return Math.max(0, Math.min(255, Math.round(value))); }

export function buildSurfacePixels(epochId, width = 256, height = 128) {
  const epoch = epochById(epochId), pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const latitude = 90 - (y + 0.5) / height * 180;
    for (let x = 0; x < width; x++) {
      const longitude = -180 + (x + 0.5) / width * 360;
      const land = epoch.landResolver ? epoch.landResolver(latitude, longitude) : polygonContains(longitude, latitude, epoch.land);
      const relief = epoch.reliefResolver ? epoch.reliefResolver(latitude, longitude) : 0.5;
      const variation = 0.92 + 0.08 * Math.sin(longitude * 0.19) * Math.cos(latitude * 0.31);
      const i = (y * width + x) * 4;
      if (land) {
        const polar = Math.max(0, (Math.abs(latitude) - 58) / 32);
        const dry = epochId === 'cretaceous66' ? 0.12 + 0.12 * Math.cos(latitude * 0.08) : 0;
        pixels[i] = clamp255((70 + relief * 78 + dry * 45) * variation + polar * 80);
        pixels[i + 1] = clamp255((92 + relief * 68 - dry * 35) * variation + polar * 74);
        pixels[i + 2] = clamp255((62 + relief * 38) * variation + polar * 70);
        pixels[i + 3] = 0;
      } else {
        const depth = Math.max(0, 0.62 - relief);
        pixels[i] = clamp255((10 + relief * 18) * variation);
        pixels[i + 1] = clamp255((42 + relief * 52) * variation);
        pixels[i + 2] = clamp255((78 + relief * 92 - depth * 35) * variation);
        pixels[i + 3] = 255;
      }
    }
  }
  return { width, height, pixels };
}

export function buildTsunamiPixels(field, modelTime) {
  if (!field?.width || !field?.height) return { width: 1, height: 1, pixels: new Uint8Array([0,0,0,255]) };
  const pixels = new Uint8Array(field.width * field.height * 4);
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
