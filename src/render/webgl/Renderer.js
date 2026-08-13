import { sphereGeometry, starCloud, effectCloud } from './geometry.js';
import { mat4Identity, mat4LookAt, mat4Multiply, mat4Perspective, mat4ScaleTranslate, add, cross, normalize, scale, lonLatToUnit, unitToLonLat, raySphere } from './matrix.js';
import { createProgram, createMesh, createPointCloud, createLineMesh, createTexture, updateTexture, uniform, destroyMesh } from './gl.js';
import { buildSurfacePixels, buildTsunamiPixels } from './textures.js';
import { SURFACE_VS, SURFACE_FS, ATMOSPHERE_VS, ATMOSPHERE_FS, POINT_VS, POINT_FS, IMPACTOR_VS, IMPACTOR_FS, LINE_VS, LINE_FS } from './shaders.js';

export const RENDER_BUDGETS = Object.freeze({
  stars: 2400,
  milkyWay: 1500,
  solarSprite: 1,
  ejecta: 520,
  plume: 360,
  vapor: 300,
  entryWake: 180,
  dust: 640,
  probes: 4,
  earthLatSegments: 56,
  earthLonSegments: 112
});

const IDENTITY = mat4Identity();
const UP = [0, 1, 0];
const SUN = [-0.7, 0.25, 0.55];

function targetBasis(n) {
  let east = cross(UP, n);
  if (Math.hypot(...east) < 0.01) east = [1, 0, 0];
  east = normalize(east);
  return { east, north: normalize(cross(n, east)) };
}

function trajectoryDirection(target, azimuthDeg = 135) {
  const { east, north } = targetBasis(target), a = azimuthDeg * Math.PI / 180;
  return normalize(add(scale(east, Math.sin(a)), scale(north, Math.cos(a))));
}

function compositionColor(composition = '') {
  const text = composition.toLowerCase();
  if (/iron|metal/.test(text)) return [0.24, 0.12, 0.07];
  if (/comet|ice/.test(text)) return [0.13, 0.14, 0.14];
  if (/rubble/.test(text)) return [0.18, 0.14, 0.10];
  return [0.16, 0.12, 0.09];
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true });
    if (!this.gl) throw new Error('WebGL2 is required for Planet Killer.');
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);

    this.programs = {
      surface: createProgram(gl, SURFACE_VS, SURFACE_FS),
      atmosphere: createProgram(gl, ATMOSPHERE_VS, ATMOSPHERE_FS),
      point: createProgram(gl, POINT_VS, POINT_FS),
      impactor: createProgram(gl, IMPACTOR_VS, IMPACTOR_FS),
      line: createProgram(gl, LINE_VS, LINE_FS)
    };
    const earthGeometry = sphereGeometry(RENDER_BUDGETS.earthLatSegments, RENDER_BUDGETS.earthLonSegments);
    this.meshes = {
      earth: createMesh(gl, earthGeometry),
      impactor: createMesh(gl, sphereGeometry(18, 28)),
      stars: createPointCloud(gl, starCloud(RENDER_BUDGETS.stars, 0x51a4, { radius: 28 })),
      milkyWay: createPointCloud(gl, starCloud(RENDER_BUDGETS.milkyWay, 0x8c31, { band: true, radius: 27 })),
      sun: createPointCloud(gl, new Float32Array([-11, 4.5, -19, 3.8])),
      ejecta: createPointCloud(gl, new Float32Array(RENDER_BUDGETS.ejecta * 4)),
      plume: createPointCloud(gl, new Float32Array(RENDER_BUDGETS.plume * 4)),
      vapor: createPointCloud(gl, new Float32Array(RENDER_BUDGETS.vapor * 4)),
      wake: createPointCloud(gl, new Float32Array(RENDER_BUDGETS.entryWake * 4)),
      dust: createPointCloud(gl, starCloud(RENDER_BUDGETS.dust, 0x99f2, { radius: 1.09 })),
      reticle: createLineMesh(gl, new Float32Array(96 * 3)),
      probes: createPointCloud(gl, new Float32Array(RENDER_BUDGETS.probes * 4))
    };
    this.effectVectors = {
      ejecta: effectCloud(RENDER_BUDGETS.ejecta, 0x1137),
      plume: effectCloud(RENDER_BUDGETS.plume, 0x2248),
      vapor: effectCloud(RENDER_BUDGETS.vapor, 0x3359),
      wake: effectCloud(RENDER_BUDGETS.entryWake, 0x446a)
    };
    this.camera = { yaw: -0.55, pitch: 0.24, distance: 3.15 };
    this.fovY = 42 * Math.PI / 180;
    this.epochId = null;
    this.scenario = null;
    this.result = null;
    this.visual = { time: -30, approach: 0, entryHeating: 0, contactFlash: 0, crater: 0, ejecta: 0, plume: 0, tsunami: 0, atmosphere: 0, darkness: 0 };
    this.target = lonLatToUnit(-86.8, 21.2);
    this.tsunamiField = null;
    this.probes = [];
    const blank = new Uint8Array([0, 0, 0, 255]);
    this.textures = { surface: createTexture(gl, 1, 1, blank), tsunami: createTexture(gl, 1, 1, blank) };
    this.setEpoch('cretaceous66');
    this._updateReticle();
    this.resize();
  }

  resize() {
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    this.gl.viewport(0, 0, width, height);
  }

  setEpoch(epochId) {
    if (this.epochId === epochId) return;
    this.epochId = epochId;
    const image = buildSurfacePixels(epochId);
    updateTexture(this.gl, this.textures.surface, image.width, image.height, image.pixels);
  }

  setEvaluation(evaluation) {
    this.scenario = evaluation?.scenario || this.scenario;
    this.result = evaluation?.result || this.result;
    if (this.scenario) {
      this.setEpoch(this.scenario.epochId);
      this.target = lonLatToUnit(this.scenario.target.longitude, this.scenario.target.latitude);
      this._updateReticle();
    }
    if (evaluation?.visual) this.setTime(evaluation.visual.time, evaluation.visual);
  }

  setTime(time, visual = null) {
    this.visual = visual ? { ...visual, time } : { ...this.visual, time };
    if (this.tsunamiField) this._updateTsunamiTexture();
  }

  setTsunamiField(field) { this.tsunamiField = field; this._updateTsunamiTexture(); }

  setProbes(probes = []) {
    this.probes = probes.slice(0, RENDER_BUDGETS.probes);
    const data = new Float32Array(RENDER_BUDGETS.probes * 4);
    this.probes.forEach((probe, index) => {
      const p = scale(lonLatToUnit(probe.longitude, probe.latitude), 1.025), j = index * 4;
      data[j] = p[0]; data[j + 1] = p[1]; data[j + 2] = p[2]; data[j + 3] = 1.25;
    });
    const gl = this.gl, mesh = this.meshes.probes; gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data); mesh.count = this.probes.length;
  }

  orbitBy(dx, dy) {
    this.camera.yaw += dx * 0.006;
    this.camera.pitch = Math.max(-1.35, Math.min(1.35, this.camera.pitch + dy * 0.006));
  }

  dollyBy(delta) { this.camera.distance = Math.max(1.35, Math.min(12, this.camera.distance * Math.exp(delta * 0.0012))); }
  getCamera() { return { ...this.camera }; }
  setCamera(camera) { this.camera = { ...this.camera, ...camera }; }

  setCameraPreset(name) {
    const ll = unitToLonLat(this.target), yaw = ll.longitude * Math.PI / 180, pitch = ll.latitude * Math.PI / 180;
    if (name === 'impact') this.camera = { yaw, pitch: pitch * 0.65, distance: 2.15 };
    else if (name === 'trajectory') this.camera = { yaw: yaw - 0.9, pitch: pitch * 0.35 + 0.18, distance: 3.4 };
    else if (name === 'chase') this.camera = { yaw: yaw + 0.45, pitch: pitch * 0.35 + 0.08, distance: 2.7 };
    else if (name === 'space') this.camera = { yaw: yaw - 0.35, pitch: 0.42, distance: 6.5 };
    else this.camera = { yaw: -0.55, pitch: 0.24, distance: 3.15 };
  }

  cameraEye() {
    const c = Math.cos(this.camera.pitch);
    return [this.camera.distance * c * Math.cos(this.camera.yaw), this.camera.distance * Math.sin(this.camera.pitch), this.camera.distance * c * Math.sin(this.camera.yaw)];
  }

  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / Math.max(1, rect.width) * 2 - 1;
    const y = 1 - (clientY - rect.top) / Math.max(1, rect.height) * 2;
    const eye = this.cameraEye(), forward = normalize(scale(eye, -1));
    let right = normalize(cross(forward, UP)); if (Math.hypot(...right) < 0.01) right = [1, 0, 0];
    const up = normalize(cross(right, forward)), tan = Math.tan(this.fovY / 2), aspect = rect.width / Math.max(1, rect.height);
    const direction = normalize(add(forward, add(scale(right, x * tan * aspect), scale(up, y * tan))));
    const hit = raySphere(eye, direction, 1);
    return hit ? unitToLonLat(hit) : null;
  }

  _viewProjection() {
    const eye = this.cameraEye();
    const projection = mat4Perspective(this.fovY, this.canvas.width / Math.max(1, this.canvas.height), 0.02, 80);
    return { eye, matrix: mat4Multiply(projection, mat4LookAt(eye, [0, 0, 0])) };
  }

  _updateReticle() {
    const { east, north } = targetBasis(this.target), points = new Float32Array(96 * 3);
    for (let i = 0; i < 96; i++) {
      const a = i / 96 * Math.PI * 2, p = add(scale(this.target, 1.014), add(scale(east, Math.cos(a) * 0.045), scale(north, Math.sin(a) * 0.045))), j = i * 3;
      points[j] = p[0]; points[j + 1] = p[1]; points[j + 2] = p[2];
    }
    const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.meshes.reticle.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, points);
  }

  _updateTsunamiTexture() {
    const image = buildTsunamiPixels(this.tsunamiField, Math.max(0, this.visual.time || 0));
    updateTexture(this.gl, this.textures.tsunami, image.width, image.height, image.pixels);
  }

  _impactorCenter() {
    const a = Math.max(0, Math.min(1, this.visual.approach || 0)), lateral = trajectoryDirection(this.target, this.scenario?.impactor?.azimuthDeg || 135);
    return add(scale(this.target, 1.035 + (1 - a) * 3.15), scale(lateral, (1 - a) * 0.82));
  }

  _updateCloud(mesh, vectors, origin, spread, height, phase) {
    const { east, north } = targetBasis(this.target), data = new Float32Array(vectors.length);
    for (let i = 0; i < vectors.length / 4; i++) {
      const j = i * 4, x = vectors[j], y = vectors[j + 1], z = vectors[j + 2], speed = vectors[j + 3];
      const p = add(origin, add(scale(east, x * spread * speed * phase), add(scale(north, z * spread * speed * phase), scale(this.target, Math.max(0, y) * height * speed * phase))));
      data[j] = p[0]; data[j + 1] = p[1]; data[j + 2] = p[2]; data[j + 3] = 0.55 + speed * 0.5;
    }
    const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  }

  _drawMesh(program, mesh, viewProj, model = IDENTITY) {
    const gl = this.gl; gl.useProgram(program); uniform(gl, program, 'uViewProj', viewProj); uniform(gl, program, 'uModel', model); gl.bindVertexArray(mesh.vao);
    if (mesh.indexed) gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0); else gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }

  _drawPoints(mesh, viewProj, color, size, intensity) {
    if (!(intensity > 0) || !mesh.count) return;
    const gl = this.gl, p = this.programs.point; gl.useProgram(p); uniform(gl, p, 'uViewProj', viewProj); uniform(gl, p, 'uColor', color); uniform(gl, p, 'uSize', size); uniform(gl, p, 'uIntensity', intensity); gl.bindVertexArray(mesh.vao); gl.drawArrays(gl.POINTS, 0, mesh.count);
  }

  render() {
    this.resize();
    const gl = this.gl, { eye, matrix: viewProj } = this._viewProjection(), v = this.visual;
    gl.clearColor(0.0015, 0.003, 0.007, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    this._drawPoints(this.meshes.stars, viewProj, [0.78, 0.84, 0.94], 2.0, 0.8);
    this._drawPoints(this.meshes.milkyWay, viewProj, [0.36, 0.42, 0.58], 2.4, 0.34);
    this._drawPoints(this.meshes.sun, viewProj, [1.0, 0.9, 0.67], 7.5, 0.85);
    gl.enable(gl.DEPTH_TEST); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const surface = this.programs.surface; gl.useProgram(surface); uniform(gl, surface, 'uViewProj', viewProj); uniform(gl, surface, 'uModel', IDENTITY); uniform(gl, surface, 'uTarget', this.target); uniform(gl, surface, 'uSun', SUN); uniform(gl, surface, 'uCamera', eye); uniform(gl, surface, 'uCrater', v.crater || 0); uniform(gl, surface, 'uFlash', (v.contactFlash || 0) * 0.7); uniform(gl, surface, 'uDarkness', v.darkness || 0); uniform(gl, surface, 'uTsunamiMix', v.tsunami || 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.textures.surface); gl.uniform1i(gl.getUniformLocation(surface, 'uSurface'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.textures.tsunami); gl.uniform1i(gl.getUniformLocation(surface, 'uTsunami'), 1);
    gl.bindVertexArray(this.meshes.earth.vao); gl.drawElements(gl.TRIANGLES, this.meshes.earth.count, gl.UNSIGNED_INT, 0);

    gl.enable(gl.BLEND); gl.depthMask(false); gl.cullFace(gl.FRONT);
    const atmosphere = this.programs.atmosphere; gl.useProgram(atmosphere); uniform(gl, atmosphere, 'uViewProj', viewProj); uniform(gl, atmosphere, 'uModel', mat4ScaleTranslate(1.035)); uniform(gl, atmosphere, 'uCamera', eye); uniform(gl, atmosphere, 'uDarkness', v.darkness || 0); uniform(gl, atmosphere, 'uFlash', (v.contactFlash || 0) * 0.35); gl.bindVertexArray(this.meshes.earth.vao); gl.drawElements(gl.TRIANGLES, this.meshes.earth.count, gl.UNSIGNED_INT, 0);
    gl.cullFace(gl.BACK); gl.depthMask(true);

    if ((v.time ?? -30) < 8) {
      const p = this.programs.impactor, center = this._impactorCenter(), diameter = this.scenario?.impactor?.diameterM || 12000;
      gl.useProgram(p); uniform(gl, p, 'uViewProj', viewProj); uniform(gl, p, 'uCenter', center); uniform(gl, p, 'uScale', Math.max(0.0055, Math.min(0.03, diameter / 12742000 * 4.2))); uniform(gl, p, 'uDeform', /rubble/i.test(this.scenario?.impactor?.composition || '') ? 0.22 : 0.12); uniform(gl, p, 'uColor', compositionColor(this.scenario?.impactor?.composition)); uniform(gl, p, 'uHeating', v.entryHeating || 0); gl.bindVertexArray(this.meshes.impactor.vao); gl.drawElements(gl.TRIANGLES, this.meshes.impactor.count, gl.UNSIGNED_INT, 0);
      if (v.entryHeating > 0) {
        this._updateCloud(this.meshes.wake, this.effectVectors.wake, center, 0.05, -0.13, Math.max(0.15, v.entryHeating));
        this._drawPoints(this.meshes.wake, viewProj, [1.0, 0.34, 0.08], 4.4, v.entryHeating * 0.65);
      }
    }

    const positiveTime = Math.max(0, v.time || 0), ejectaPhase = Math.min(1, positiveTime / 2600), plumePhase = Math.min(1, positiveTime / 1800);
    const origin = scale(this.target, 1.012);
    this._updateCloud(this.meshes.ejecta, this.effectVectors.ejecta, origin, 0.48, 0.78, ejectaPhase);
    this._updateCloud(this.meshes.plume, this.effectVectors.plume, origin, 0.22, 1.45, plumePhase);
    this._updateCloud(this.meshes.vapor, this.effectVectors.vapor, origin, 0.34, 0.9, plumePhase);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    this._drawPoints(this.meshes.ejecta, viewProj, [1.0, 0.31, 0.07], 3.4, (v.ejecta || 0) * 0.72);
    this._drawPoints(this.meshes.plume, viewProj, [0.72, 0.53, 0.38], 7.0, (v.plume || 0) * 0.46);
    this._drawPoints(this.meshes.vapor, viewProj, [0.73, 0.78, 0.82], 8.5, (v.plume || 0) * 0.22);
    this._drawPoints(this.meshes.dust, viewProj, [0.56, 0.48, 0.42], 2.5, Math.min(0.28, (v.atmosphere || 0) * 0.22 + (v.darkness || 0) * 0.12));
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    if ((v.time ?? -30) < 0) {
      const line = this.programs.line; gl.useProgram(line); uniform(gl, line, 'uViewProj', viewProj); uniform(gl, line, 'uModel', IDENTITY); uniform(gl, line, 'uColor', [0.32, 0.94, 1.0, 0.78]); gl.bindVertexArray(this.meshes.reticle.vao); gl.drawArrays(gl.LINE_LOOP, 0, this.meshes.reticle.count);
    }
    this._drawPoints(this.meshes.probes, viewProj, [0.45, 0.95, 1.0], 6.0, 0.9);
    gl.disable(gl.BLEND); gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    for (const program of Object.values(this.programs)) gl.deleteProgram(program);
    for (const mesh of Object.values(this.meshes)) destroyMesh(gl, mesh);
    for (const texture of Object.values(this.textures)) gl.deleteTexture(texture);
  }
}
