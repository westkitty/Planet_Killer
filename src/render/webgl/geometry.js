export function seededRandom(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export function sphereGeometry(latSegments = 48, lonSegments = 96) {
  const positions = [], normals = [], uvs = [], indices = [];
  for (let y = 0; y <= latSegments; y++) {
    const v = y / latSegments, phi = v * Math.PI;
    for (let x = 0; x <= lonSegments; x++) {
      const u = x / lonSegments, theta = u * Math.PI * 2;
      const sx = Math.sin(phi) * Math.cos(theta), sy = Math.cos(phi), sz = Math.sin(phi) * Math.sin(theta);
      positions.push(sx, sy, sz); normals.push(sx, sy, sz); uvs.push(u, 1 - v);
    }
  }
  // Counter-clockwise when seen from outside the sphere, so gl.cullFace(BACK)
  // removes the far hemisphere. The previous order was reversed, which left the
  // renderer drawing the inside of the far side.
  for (let y = 0; y < latSegments; y++) for (let x = 0; x < lonSegments; x++) {
    const a = y * (lonSegments + 1) + x, b = a + lonSegments + 1;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), uvs: new Float32Array(uvs), indices: new Uint32Array(indices) };
}

export function ringGeometry(segments = 96) {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const a = i / segments * Math.PI * 2;
    points.push(Math.cos(a), 0, Math.sin(a));
  }
  return new Float32Array(points);
}

export function starCloud(count, seed, { band = false, radius = 24 } = {}) {
  const random = seededRandom(seed), data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    let y, angle;
    if (band) {
      angle = random() * Math.PI * 2;
      const latitude = (random() - 0.5) * 0.38 + Math.sin(angle * 2.2) * 0.05;
      y = Math.sin(latitude);
    } else {
      y = random() * 2 - 1;
      angle = random() * Math.PI * 2;
    }
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const j = i * 4;
    data[j] = r * Math.cos(angle) * radius;
    data[j + 1] = y * radius;
    data[j + 2] = r * Math.sin(angle) * radius;
    data[j + 3] = 0.45 + random() * 0.9;
  }
  return data;
}

export function effectCloud(count, seed) {
  const random = seededRandom(seed), data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const a = random() * Math.PI * 2, tilt = random() * Math.PI * 0.5, speed = 0.35 + random() * 1.4;
    const j = i * 4;
    data[j] = Math.cos(a) * Math.sin(tilt);
    data[j + 1] = Math.cos(tilt);
    data[j + 2] = Math.sin(a) * Math.sin(tilt);
    data[j + 3] = speed;
  }
  return data;
}
