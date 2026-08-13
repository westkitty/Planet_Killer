export function mat4Identity() {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}

export function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return out;
}

export function mat4Perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,0,0,0,
    0,f,0,0,
    0,0,(far + near) * nf,-1,
    0,0,2 * far * near * nf,0
  ]);
}

export function mat4LookAt(eye, center, up = [0,1,0]) {
  const z = normalize(subtract(eye, center));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([
    x[0],y[0],z[0],0,
    x[1],y[1],z[1],0,
    x[2],y[2],z[2],0,
    -dot(x, eye),-dot(y, eye),-dot(z, eye),1
  ]);
}

export function mat4ScaleTranslate(scale, translate = [0,0,0]) {
  return new Float32Array([
    scale,0,0,0,
    0,scale,0,0,
    0,0,scale,0,
    translate[0],translate[1],translate[2],1
  ]);
}

export function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
export function subtract(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
export function scale(v,s){return [v[0]*s,v[1]*s,v[2]*s];}
export function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
export function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
export function length(v){return Math.hypot(v[0],v[1],v[2]);}
export function normalize(v){const n=length(v)||1;return [v[0]/n,v[1]/n,v[2]/n];}

export function lonLatToUnit(longitude, latitude) {
  const lon = longitude * Math.PI / 180, lat = latitude * Math.PI / 180, c = Math.cos(lat);
  return [c * Math.cos(lon), Math.sin(lat), c * Math.sin(lon)];
}

export function unitToLonLat(v) {
  const n = normalize(v);
  return { longitude: Math.atan2(n[2], n[0]) * 180 / Math.PI, latitude: Math.asin(Math.max(-1, Math.min(1, n[1]))) * 180 / Math.PI };
}

export function raySphere(origin, direction, radius = 1) {
  const b = dot(origin, direction), c = dot(origin, origin) - radius * radius, d = b * b - c;
  if (d < 0) return null;
  const root = Math.sqrt(d), t0 = -b - root, t1 = -b + root, t = t0 > 0 ? t0 : t1 > 0 ? t1 : null;
  return t == null ? null : add(origin, scale(direction, t));
}
