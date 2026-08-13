// Deliberately coarse 66 Ma paleogeographic proxy derived from the spatial relationships
// described by Cao et al. (2017)/EarthByte. It is NOT the distributed EarthByte dataset.
// This remains a documented limitation until a licensed transformed reconstruction is integrated.
export const cretaceous66Epoch = {
  id: 'cretaceous66',
  label: '66 million years ago',
  reconstructionState: 'reconstructed-proxy',
  sourceId: 'CAO2017-DERIVED-LOWRES-PROXY-0.1',
  land: [
    [[-165,70],[-140,68],[-126,52],[-120,35],[-108,27],[-98,31],[-94,52],[-112,68]],
    [[-92,68],[-72,62],[-60,50],[-66,30],[-84,25],[-94,36]],
    [[-82,8],[-70,4],[-60,-12],[-52,-32],[-62,-52],[-77,-45],[-84,-20]],
    [[-15,35],[5,50],[35,65],[70,72],[105,62],[140,54],[165,40],[142,26],[115,18],[92,12],[74,24],[50,38],[28,34],[8,40]],
    [[-12,29],[10,28],[30,16],[37,-9],[28,-28],[8,-33],[-6,-18],[-12,3]],
    [[62,-22],[78,-18],[82,-5],[70,4],[58,-6]],
    [[98,-22],[140,-18],[150,-38],[120,-46],[100,-35]],
    [[-45,72],[-23,82],[-48,84],[-66,77]],
    [[-180,-67],[180,-67],[180,-90],[-180,-90]]
  ],
  shallowZones: [
    { center: [-86, 20], radiusDeg: 11, className: 'carbonate-evaporite-shelf', sulfatePotential: 0.95, carbonatePotential: 0.95, organicPotential: 0.62, historical: true },
    { center: [-98, 44], radiusDeg: 11, className: 'western-interior-seaway', sulfatePotential: 0.42, carbonatePotential: 0.58, organicPotential: 0.44 },
    { center: [8, 31], radiusDeg: 10, className: 'tethyan-shelf', sulfatePotential: 0.48, carbonatePotential: 0.8, organicPotential: 0.47 }
  ],
  crystallineZones: [
    { center: [-130, 55], radiusDeg: 16 },
    { center: [27, -22], radiusDeg: 15 },
    { center: [85, 52], radiusDeg: 18 }
  ]
};
