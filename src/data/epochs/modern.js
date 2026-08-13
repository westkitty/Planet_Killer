import { modernLandAt } from './modernLandMask.js';
import { modernReliefAt } from './modernRelief.js';
// Present-day surface uses compact local GSHHG 2.3.6 land/sea and ETOPO1-derived visual fields.
// The simple polygons below remain only as a defensive fallback.
export const modernEpoch = {
  id: 'modern',
  label: 'Present day',
  reconstructionState: 'derived-observational',
  sourceId: 'GSHHG-2.3.6+ETOPO1-COMPACT-DERIVED-0.4',
  spatialSource: 'GSHHG 2.3.6 land/sea mask via basemap-data 2.0.0',
  visualSource: 'ETOPO1 compact luminance derivative via basemap-data 2.0.0',
  landResolver: modernLandAt,
  reliefResolver: modernReliefAt,
  land: [
    [[-168,72],[-145,70],[-126,55],[-124,38],[-115,25],[-100,18],[-82,24],[-65,44],[-55,60],[-80,72],[-120,74]],
    [[-82,12],[-72,8],[-65,-4],[-53,-15],[-48,-30],[-58,-52],[-73,-54],[-81,-20]],
    [[-18,36],[5,44],[35,70],[80,72],[120,58],[160,62],[178,48],[145,35],[120,20],[105,6],[80,8],[60,28],[40,35],[28,30],[15,38]],
    [[-18,35],[12,36],[35,30],[51,12],[42,-12],[30,-34],[18,-35],[6,-23],[-7,4]],
    [[112,-10],[154,-10],[153,-39],[130,-44],[113,-30]],
    [[-52,60],[-20,82],[-45,84],[-70,74]],
    [[43,-12],[51,-15],[49,-26],[44,-25]],
    [[-180,-64],[180,-64],[180,-90],[-180,-90]]
  ],
  shallowZones: [
    { center: [-90, 27], radiusDeg: 9, className: 'carbonate-sedimentary-shelf', sulfatePotential: 0.72, carbonatePotential: 0.88, organicPotential: 0.55 },
    { center: [115, -15], radiusDeg: 12, className: 'continental-shelf', sulfatePotential: 0.28, carbonatePotential: 0.55, organicPotential: 0.38 }
  ],
  crystallineZones: [
    { center: [-105, 52], radiusDeg: 18 },
    { center: [25, -24], radiusDeg: 17 },
    { center: [95, 55], radiusDeg: 22 }
  ]
};
