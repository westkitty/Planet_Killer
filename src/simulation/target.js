import { modernEpoch } from '../data/epochs/modern.js';
import { cretaceous66Epoch } from '../data/epochs/cretaceous66.js';
import { polygonContains } from '../data/epochs/geometry.js';

const EPOCHS = { modern: modernEpoch, cretaceous66: cretaceous66Epoch };

export function epochById(id = 'cretaceous66') {
  return EPOCHS[id] || cretaceous66Epoch;
}

export function angularDistanceDeg(aLon, aLat, bLon, bLat) {
  const toRad = Math.PI / 180;
  const p1 = aLat * toRad, p2 = bLat * toRad;
  const dp = (bLat - aLat) * toRad, dl = (bLon - aLon) * toRad;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h))) / toRad;
}

function nearestZone(zones = [], lon, lat) {
  let best = null;
  for (const zone of zones) {
    const distanceDeg = angularDistanceDeg(lon, lat, zone.center[0], zone.center[1]);
    if (distanceDeg <= zone.radiusDeg && (!best || distanceDeg < best.distanceDeg)) best = { ...zone, distanceDeg };
  }
  return best;
}

function modernSurface(epoch, lon, lat) {
  const land = epoch.landResolver ? epoch.landResolver(lat, lon) : polygonContains(lon, lat, epoch.land);
  const relief = epoch.reliefResolver ? epoch.reliefResolver(lat, lon) : 0.5;
  if (land) {
    return {
      medium: 'land',
      elevationKm: Math.max(0, (relief - 0.36) * 6.2),
      waterDepthKm: 0,
      surfaceDataState: 'derived-observational'
    };
  }
  return {
    medium: 'ocean',
    elevationKm: 0,
    waterDepthKm: 0.35 + Math.max(0, 0.58 - relief) * 9.0,
    surfaceDataState: 'derived-observational-proxy-depth'
  };
}

function ancientSurface(epoch, lon, lat) {
  const land = polygonContains(lon, lat, epoch.land);
  const shelf = nearestZone(epoch.shallowZones, lon, lat);
  if (land) return { medium: 'land', elevationKm: 0.35, waterDepthKm: 0, surfaceDataState: 'reconstructed-proxy' };
  return {
    medium: 'ocean',
    elevationKm: 0,
    waterDepthKm: shelf ? 0.18 + shelf.distanceDeg / Math.max(1, shelf.radiusDeg) * 0.8 : 3.8,
    surfaceDataState: shelf ? 'regional-proxy' : 'global-categorical-proxy'
  };
}

export function targetAt({ epochId = 'cretaceous66', longitude = -86.8, latitude = 21.2 } = {}) {
  const epoch = epochById(epochId);
  const surface = epochId === 'modern' ? modernSurface(epoch, longitude, latitude) : ancientSurface(epoch, longitude, latitude);
  const shallow = nearestZone(epoch.shallowZones, longitude, latitude);
  const crystalline = nearestZone(epoch.crystallineZones, longitude, latitude);

  let className;
  let densityKgM3;
  let sedimentPotential;
  let sulfatePotential;
  let carbonatePotential;
  let organicPotential;
  let dataQuality;

  if (surface.medium === 'ocean') {
    className = shallow ? shallow.className : surface.waterDepthKm > 2 ? 'deep-ocean-basin' : 'continental-shelf';
    densityKgM3 = shallow ? 2450 : 2800;
    sedimentPotential = shallow ? 0.7 : 0.22;
    sulfatePotential = shallow?.sulfatePotential ?? (epochId === 'modern' ? 0.12 : 0.16);
    carbonatePotential = shallow?.carbonatePotential ?? 0.24;
    organicPotential = shallow?.organicPotential ?? 0.14;
    dataQuality = shallow ? (epochId === 'modern' ? 'regional-derived' : 'regional-proxy') : (epochId === 'modern' ? 'derived-observational' : 'global-proxy');
  } else if (crystalline) {
    className = 'crystalline-continental';
    densityKgM3 = 2850;
    sedimentPotential = 0.08;
    sulfatePotential = 0.05;
    carbonatePotential = 0.08;
    organicPotential = 0.04;
    dataQuality = epochId === 'modern' ? 'regional-proxy' : 'regional-proxy';
  } else {
    className = 'continental-mixed';
    densityKgM3 = 2700;
    sedimentPotential = 0.36;
    sulfatePotential = epochId === 'modern' ? 0.12 : 0.18;
    carbonatePotential = 0.28;
    organicPotential = 0.16;
    dataQuality = epochId === 'modern' ? 'categorical-proxy' : 'global-proxy';
  }

  return {
    epochId,
    longitude,
    latitude,
    ...surface,
    className,
    densityKgM3,
    sedimentPotential,
    sulfatePotential,
    carbonatePotential,
    organicPotential,
    dataQuality,
    sourceId: epoch.sourceId,
    uncertaintyNote: epochId === 'cretaceous66'
      ? '66 Ma target chemistry is categorical/proxy outside constrained regional classes.'
      : 'Present-day land/sea is data-derived; depth and chemistry remain educational proxies.'
  };
}

export function historicalTarget() {
  return targetAt({ epochId: 'cretaceous66', longitude: -86.8, latitude: 21.2 });
}
