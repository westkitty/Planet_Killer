export function pointInPolygon(lon, lat, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonContains(lon, lat, polygons) {
  return polygons.some((polygon) => pointInPolygon(lon, lat, polygon));
}

/**
 * Epoch-aware land classification: land polygons minus any water-cut polygons.
 * Water cuts model well-established marine features (the Western Interior
 * Seaway) that the coarse continental outlines do not indent. Both lookups are
 * categorical only — no bathymetry of any kind.
 */
export function epochLandAt(epoch, lon, lat) {
  if (!epoch) return false;
  const land = epoch.landResolver ? epoch.landResolver(lat, lon) : polygonContains(lon, lat, epoch.land);
  if (!land) return false;
  if (epoch.waterCuts?.length) {
    for (const cut of epoch.waterCuts) {
      if (pointInPolygon(lon, lat, cut)) return false;
    }
  }
  return true;
}
