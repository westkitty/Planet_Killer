import { sampleTsunami } from './tsunami.js';

const EARTH_RADIUS_KM = 6371;

export function greatCircleKm(aLon, aLat, bLon, bLat) {
  const r = Math.PI / 180;
  const p1 = aLat * r, p2 = bLat * r;
  const dp = (bLat - aLat) * r, dl = (bLon - aLon) * r;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function probeResult({ longitude, latitude, source, result, tsunamiField = null }) {
  const distanceKm = greatCircleKm(source.longitude, source.latitude, longitude, latitude);
  const blastSeconds = distanceKm * 1000 / 340;
  const seismicSeconds = distanceKm * 1000 / 6000;
  const ejectaSeconds = 120 + distanceKm * 1000 / 2600;
  const thermalSeconds = distanceKm * 1000 / 299792458;
  const blastSeverity = distanceKm <= result.regional.blast100kPaKm ? 'extreme' : distanceKm <= result.regional.blast20kPaKm ? 'severe' : distanceKm <= result.regional.blast20kPaKm * 2.4 ? 'moderate' : 'low';
  const thermalSeverity = distanceKm <= result.regional.thermalSevereKm ? 'severe' : distanceKm <= result.regional.thermalSevereKm * 1.8 ? 'moderate' : 'low';
  const tsunami = tsunamiField ? sampleTsunami(tsunamiField, longitude, latitude) : null;
  return {
    longitude,
    latitude,
    distanceKm,
    arrivals: {
      thermalSeconds,
      seismicSeconds,
      blastSeconds,
      ejectaSeconds,
      tsunamiSeconds: Number.isFinite(tsunami?.arrivalSeconds) ? tsunami.arrivalSeconds : null
    },
    severity: {
      blast: blastSeverity,
      thermal: thermalSeverity,
      seismic: distanceKm < 1200 ? 'extreme' : distanceKm < 4000 ? 'strong' : 'regional',
      tsunami: tsunami?.ocean ? tsunami.amplitude : null,
      climate: result.ecology.category
    },
    uncertainty: 'Arrival/severity values are reduced-order educational estimates.'
  };
}
