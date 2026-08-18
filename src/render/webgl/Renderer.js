import { sphereGeometry, starCloud, effectCloud } from './geometry.js';
import { mat4Identity, mat4LookAt, mat4Multiply, mat4Perspective, mat4ScaleTranslate, add, cross, normalize, scale, lonLatToUnit, unitToLonLat, raySphere } from './matrix.js';
import { createProgram, createMesh, createPointCloud, createLineMesh, createTexture, updateTexture, writeTexture, uniform, destroyMesh } from './gl.js';
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
const RETICLE_ARCS = 4, RETICLE_ARC_STEPS = 13, RETICLE_POINTS = RETICLE_ARCS * (RETICLE_ARC_STEPS * 2 + 2);
const UP = [0, 1, 0];
const SUN_SEPARATION = 46 * Math.PI / 180;   // incidence at the target: raking, not flat
const SUN_ROLL = 146 * Math.PI / 180;        // key light sits up and camera-left

function targetBasis(n) {
  let east = cross(UP, n);
  if (Math.hypot(...east) < 0.01) east = [1, 0, 0];
  east = normalize(east);
  return { east, north: normalize(cross(n, east)) };
}

/**
 * Light the subject. The sun is placed relative to the impact target rather than
 * fixed in world space, so wherever the viewer puts the impact it lands on a lit
 * face with the terminator running out toward the limb.
 */
function sunDirection(target) {
  const { east, north } = targetBasis(target);
  const c = Math.cos(SUN_SEPARATION), s = Math.sin(SUN_SEPARATION);
  return normalize(add(scale(target, c), add(scale(east, s * Math.cos(SUN_ROLL)), scale(north, s * Math.sin(SUN_ROLL)))));
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
      reticle: createLineMesh(gl, new Float32Array(RETICLE_POINTS * 3)),
      probes: createPointCloud(gl, new Float32Array(RENDER_BUDGETS.probes * 4))
    };
    this.effectVectors = {
      ejecta: effectCloud(RENDER_BUDGETS.ejecta, 0x1137),
      plume: effectCloud(RENDER_BUDGETS.plume, 0x2248),
      vapor: effectCloud(RENDER_BUDGETS.vapor, 0x3359),
      wake: effectCloud(RENDER_BUDGETS.entryWake, 0x446a)
    };
    this.camera = { yaw: -0.55, pitch: 0.24, distance: 3.9 };   // replaced by the globe framing once the target exists
    this.cameraGoal = { ...this.camera };
    this.cameraGlide = 0;
    this.shake = 0;
    this.reducedMotion = false;
    this.fovY = 40 * Math.PI / 180;
    this.epochId = null;
    this.scenario = null;
    this.result = null;
    this.visual = { time: -30, approach: 0, entryHeating: 0, contactFlash: 0, crater: 0, ejecta: 0, plume: 0, tsunami: 0, atmosphere: 0, darkness: 0 };
    this.target = lonLatToUnit(-86.8, 21.2);
    this.tsunamiField = null;
    this._tsunamiPixels = null;
    this._tsunamiTextureSize = null;
    this.probes = [];
    const blank = new Uint8Array([0, 0, 0, 255]);
    this.textures = { surface: createTexture(gl, 1, 1, blank), tsunami: createTexture(gl, 1, 1, blank) };
    this.setEpoch('cretaceous66');
    this._updateReticle();
    this.resize();                                  // sizes the canvas so fitDistance can read the frame
    this.camera = this.cameraPreset('globe');
    this.cameraGoal = { ...this.camera };
  }

  resize() {
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    this.gl.viewport(0, 0, width, height);
    // Re-fit only when the frame changes orientation, so a deliberate zoom is
    // never overridden by an incidental resize.
    const portrait = this.canvas.clientWidth < this.canvas.clientHeight;
    if (this.portrait !== undefined && this.portrait !== portrait) {
      const fitted = this.fitDistance(3.9);
      this.camera.distance = fitted;
      this.cameraGoal.distance = fitted;
    }
    this.portrait = portrait;
  }

  /**
   * On portrait frames the vertical field of view is not the constraint — the
   * width is. Pull back far enough that the planet reads as an object with air
   * around it instead of a wall of blue.
   */
  fitDistance(base) {
    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    if (!(aspect > 0) || aspect >= 1) return base;
    const halfFovX = Math.atan(Math.tan(this.fovY / 2) * aspect);
    return Math.max(base, Math.min(11, 1 / Math.sin(Math.max(0.08, halfFovX * 0.62))));
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

  /** Angular radius used to draw the crater. Legibility exaggeration over true scale; labelled as an illustration in Science. */
  craterAngularRadius() {
    const km = Number(this.result?.crater?.finalDiameterKm) || 0;
    return Math.max(0.022, Math.min(0.17, km / 2 / 6371 * 4.5));
  }

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
    this.cameraGlide = 0;
    this.camera.yaw += dx * 0.006;
    this.camera.pitch = Math.max(-1.35, Math.min(1.35, this.camera.pitch + dy * 0.006));
    this.cameraGoal = { ...this.camera };
  }

  dollyBy(delta) {
    this.cameraGlide = 0;
    this.camera.distance = Math.max(1.35, Math.min(14, this.camera.distance * Math.exp(delta * 0.0012)));
    this.cameraGoal = { ...this.camera };
  }

  getCamera() { return { ...this.cameraGoal }; }

  setCamera(camera, { glide = true } = {}) {
    this.cameraGoal = { ...this.cameraGoal, ...camera };
    if (glide && !this.reducedMotion) this.cameraGlide = 1;
    else { this.camera = { ...this.cameraGoal }; this.cameraGlide = 0; }
  }

  setReducedMotion(value) { this.reducedMotion = Boolean(value); }

  /** True when the impact site is on the near face and clear of the limb. */
  targetInFrame() {
    const eye = this.cameraEye(), length = Math.hypot(...eye) || 1;
    return (eye[0] * this.target[0] + eye[1] * this.target[1] + eye[2] * this.target[2]) / length > 0.35;
  }

  /** Camera framings are expressed relative to the target so the impact is always composed, never hunted for. */
  cameraPreset(name) {
    const ll = unitToLonLat(this.target), yaw = ll.longitude * Math.PI / 180, pitch = ll.latitude * Math.PI / 180;
    if (name === 'impact') return { yaw, pitch, distance: this.fitDistance(2.35) };
    if (name === 'trajectory') return { yaw: yaw - 0.92, pitch: pitch * 0.5 + 0.16, distance: this.fitDistance(3.6) };
    if (name === 'chase') return { yaw: yaw + 0.48, pitch: pitch * 0.6 + 0.06, distance: this.fitDistance(2.85) };
    if (name === 'space') return { yaw: yaw - 0.38, pitch: 0.44, distance: this.fitDistance(7.2) };
    return { yaw: yaw - 0.34, pitch: pitch * 0.55 + 0.12, distance: this.fitDistance(3.9) };
  }

  setCameraPreset(name, options) { this.setCamera(this.cameraPreset(name), options); }

  /** Advance the eased camera and the impact shake. Called once per frame. */
  stepCamera(dt) {
    if (this.cameraGlide > 0) {
      const k = 1 - Math.exp(-dt * 4.6);
      let delta = this.cameraGoal.yaw - this.camera.yaw;
      delta -= Math.round(delta / (Math.PI * 2)) * Math.PI * 2;
      this.camera.yaw += delta * k;
      this.camera.pitch += (this.cameraGoal.pitch - this.camera.pitch) * k;
      this.camera.distance += (this.cameraGoal.distance - this.camera.distance) * k;
      if (Math.abs(delta) < 1e-4 && Math.abs(this.cameraGoal.pitch - this.camera.pitch) < 1e-4 && Math.abs(this.cameraGoal.distance - this.camera.distance) < 1e-4) {
        this.camera = { ...this.cameraGoal };
        this.cameraGlide = 0;
      }
    }
    this.shake = Math.max(0, this.shake - dt * 1.9);
  }

  /** A short, decaying handheld kick at contact. Suppressed under reduced motion. */
  punch(strength = 1) { if (!this.reducedMotion) this.shake = Math.max(this.shake, Math.min(1, strength)); }

  cameraEye() {
    const c = Math.cos(this.camera.pitch);
    const eye = [this.camera.distance * c * Math.cos(this.camera.yaw), this.camera.distance * Math.sin(this.camera.pitch), this.camera.distance * c * Math.sin(this.camera.yaw)];
    if (this.shake > 0) {
      const s = this.shake * this.shake * 0.028, t = this.visual.time || 0;
      eye[0] += Math.sin(t * 91.7 + 1.3) * s;
      eye[1] += Math.sin(t * 73.1 + 2.9) * s;
      eye[2] += Math.sin(t * 111.3 + 0.7) * s;
    }
    return eye;
  }

  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / Math.max(1, rect.width) * 2 - 1;
    const y = 1 - (clientY - rect.top) / Math.max(1, rect.height) * 2;
    const eye = this.cameraEye(), forward = normalize(scale(eye, -1));
    let right = normalize(cross(forward, UP)); if (Math.hypot(...right) < 0.01) right = [1, 0, 0];
    const up = normalize(cross(right, forward)), tan = Math.tan(this.fovY / 2), aspect = rect.width / Math.max(1, rect.height);
    const offset = this.frameOffset();
    const direction = normalize(add(forward, add(scale(right, (x - offset.x) * tan * aspect), scale(up, (y - offset.y) * tan))));
    const hit = raySphere(eye, direction, 1);
    return hit ? unitToLonLat(hit) : null;
  }

  frameOffset() {
    const wide = this.canvas.clientWidth >= 900 && this.canvas.clientWidth > this.canvas.clientHeight;
    return wide ? { x: 0.15, y: 0.06 } : { x: 0, y: 0.40 };
  }

  _viewProjection() {
    const eye = this.cameraEye();
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const projection = mat4Perspective(this.fovY, aspect, 0.02, 80);
    const offset = this.frameOffset();
    projection[8] = -offset.x;
    projection[9] = -offset.y;
    return { eye, matrix: mat4Multiply(projection, mat4LookAt(eye, [0, 0, 0])) };
  }

  /**
   * An aiming mark rather than a plain circle: four arc segments with gaps, each
   * closed by a short radial tick pointing at the target. Drawn as GL_LINES.
   */
  _updateReticle() {
    const { east, north } = targetBasis(this.target);
    const points = new Float32Array(RETICLE_POINTS * 3);
    const radius = 0.048, tick = 0.016;
    let cursor = 0;
    const push = (angle, r) => {
      const p = add(scale(this.target, 1.014), add(scale(east, Math.cos(angle) * r), scale(north, Math.sin(angle) * r)));
      points[cursor++] = p[0]; points[cursor++] = p[1]; points[cursor++] = p[2];
    };
    for (let arc = 0; arc < RETICLE_ARCS; arc++) {
      const start = arc / RETICLE_ARCS * Math.PI * 2 + 0.22, sweep = Math.PI * 2 / RETICLE_ARCS - 0.44;
      for (let step = 0; step < RETICLE_ARC_STEPS; step++) {
        push(start + sweep * (step / RETICLE_ARC_STEPS), radius);
        push(start + sweep * ((step + 1) / RETICLE_ARC_STEPS), radius);
      }
      const gap = start + sweep + 0.22;
      push(gap, radius + tick);
      push(gap, radius - tick * 0.35);
    }
    const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.meshes.reticle.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, points);
  }

  _updateTsunamiTexture() {
    const image = buildTsunamiPixels(this.tsunamiField, Math.max(0, this.visual.time || 0), this._tsunamiPixels);
    this._tsunamiPixels = image.pixels;
    const size = `${image.width}x${image.height}`;
    if (this._tsunamiTextureSize === size) writeTexture(this.gl, this.textures.tsunami, image.width, image.height, image.pixels);
    else { updateTexture(this.gl, this.textures.tsunami, image.width, image.height, image.pixels); this._tsunamiTextureSize = size; }
  }

  /**
   * Approach path. The body hangs at the edge of frame and then rushes the last
   * stretch: anticipation first, arrival second. The previous path started behind
   * the camera, so nothing was ever visible during the approach chapter.
   */
  _impactorCenter() {
    const a = Math.max(0, Math.min(1, this.visual.approach || 0));
    const lateral = trajectoryDirection(this.target, this.scenario?.impactor?.azimuthDeg || 135);
    const eased = Math.pow(1 - a, 1.8);
    return add(scale(this.target, 1.035 + eased * 1.4), scale(lateral, eased * 0.55));
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

  _drawPoints(mesh, viewProj, color, size, intensity, soft = 1) {
    if (!(intensity > 0) || !mesh.count) return;
    const gl = this.gl, p = this.programs.point; gl.useProgram(p); uniform(gl, p, 'uViewProj', viewProj); uniform(gl, p, 'uColor', color); uniform(gl, p, 'uSize', size); uniform(gl, p, 'uIntensity', intensity); uniform(gl, p, 'uSoft', soft); gl.bindVertexArray(mesh.vao); gl.drawArrays(gl.POINTS, 0, mesh.count);
  }

  render() {
    this.resize();
    const gl = this.gl, { eye, matrix: viewProj } = this._viewProjection(), v = this.visual;
    const sun = sunDirection(this.target);
    const dust = Math.max(0, Math.min(1, v.dust ?? v.atmosphere ?? 0));
    const thermal = Math.max(0, Math.min(1, v.reentryGlow || 0));
    gl.clearColor(0.004, 0.007, 0.012, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Deep field first, additively, with depth writes off: space sits behind everything.
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    this._drawPoints(this.meshes.milkyWay, viewProj, [0.46, 0.52, 0.72], 3.6, 0.42, 1);
    this._drawPoints(this.meshes.stars, viewProj, [0.88, 0.92, 1.0], 2.9, 1.0, 0.3);
    this._drawPoints(this.meshes.sun, viewProj, [1.0, 0.93, 0.74], 9.0, 1.0, 1);
    gl.enable(gl.DEPTH_TEST); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const { east } = targetBasis(this.target);
    const surface = this.programs.surface; gl.useProgram(surface);
    uniform(gl, surface, 'uViewProj', viewProj); uniform(gl, surface, 'uModel', IDENTITY);
    uniform(gl, surface, 'uTarget', this.target); uniform(gl, surface, 'uTargetEast', east);
    uniform(gl, surface, 'uSun', sun); uniform(gl, surface, 'uCamera', eye);
    uniform(gl, surface, 'uCrater', v.crater || 0);
    uniform(gl, surface, 'uCraterRadius', this.craterAngularRadius());
    uniform(gl, surface, 'uRimHeat', v.rimHeat || 0);
    uniform(gl, surface, 'uFlash', (v.contactFlash || 0) * 0.85);
    uniform(gl, surface, 'uFireball', v.fireball || 0);
    uniform(gl, surface, 'uThermal', thermal);
    uniform(gl, surface, 'uDarkness', v.darkness || 0);
    uniform(gl, surface, 'uDust', dust);
    uniform(gl, surface, 'uTsunamiMix', v.tsunami || 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.textures.surface); gl.uniform1i(gl.getUniformLocation(surface, 'uSurface'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.textures.tsunami); gl.uniform1i(gl.getUniformLocation(surface, 'uTsunami'), 1);
    gl.bindVertexArray(this.meshes.earth.vao); gl.drawElements(gl.TRIANGLES, this.meshes.earth.count, gl.UNSIGNED_INT, 0);

    gl.enable(gl.BLEND); gl.depthMask(false); gl.cullFace(gl.FRONT);
    const atmosphere = this.programs.atmosphere; gl.useProgram(atmosphere);
    uniform(gl, atmosphere, 'uViewProj', viewProj); uniform(gl, atmosphere, 'uModel', mat4ScaleTranslate(1.045));
    uniform(gl, atmosphere, 'uCamera', eye); uniform(gl, atmosphere, 'uSun', sun);
    uniform(gl, atmosphere, 'uDarkness', v.darkness || 0); uniform(gl, atmosphere, 'uDust', dust);
    uniform(gl, atmosphere, 'uFlash', (v.contactFlash || 0) * 0.45); uniform(gl, atmosphere, 'uThermal', thermal * 0.7);
    gl.bindVertexArray(this.meshes.earth.vao); gl.drawElements(gl.TRIANGLES, this.meshes.earth.count, gl.UNSIGNED_INT, 0);
    gl.cullFace(gl.BACK); gl.depthMask(true);

    if ((v.time ?? -30) < 0.12) {
      const p = this.programs.impactor, center = this._impactorCenter(), diameter = this.scenario?.impactor?.diameterM || 12000;
      gl.useProgram(p); uniform(gl, p, 'uViewProj', viewProj); uniform(gl, p, 'uCenter', center); uniform(gl, p, 'uScale', Math.max(0.010, Math.min(0.042, diameter / 12742000 * 5.6))); uniform(gl, p, 'uDeform', /rubble/i.test(this.scenario?.impactor?.composition || '') ? 0.22 : 0.12); uniform(gl, p, 'uColor', compositionColor(this.scenario?.impactor?.composition)); uniform(gl, p, 'uHeating', v.entryHeating || 0); gl.bindVertexArray(this.meshes.impactor.vao); gl.drawElements(gl.TRIANGLES, this.meshes.impactor.count, gl.UNSIGNED_INT, 0);
      if (v.entryHeating > 0) {
        this._updateCloud(this.meshes.wake, this.effectVectors.wake, center, 0.042, 0.42, Math.max(0.2, v.entryHeating));
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        this._drawPoints(this.meshes.wake, viewProj, [1.0, 0.44, 0.12], 11.0, v.entryHeating * 0.34, 1);
        this._drawPoints(this.meshes.wake, viewProj, [1.0, 0.82, 0.52], 4.5, v.entryHeating * 0.95, 0.4);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
    }

    const positiveTime = Math.max(0, v.time || 0), ejectaPhase = Math.min(1, positiveTime / 2600), plumePhase = Math.min(1, positiveTime / 1800);
    const origin = scale(this.target, 1.012);
    this._updateCloud(this.meshes.ejecta, this.effectVectors.ejecta, origin, 0.30, 0.34, ejectaPhase);
    this._updateCloud(this.meshes.plume, this.effectVectors.plume, origin, 0.16, 0.62, plumePhase);
    this._updateCloud(this.meshes.vapor, this.effectVectors.vapor, origin, 0.24, 0.44, plumePhase);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    this._drawPoints(this.meshes.ejecta, viewProj, [1.0, 0.36, 0.09], 4.2, (v.ejecta || 0) * 0.95, 1);
    this._drawPoints(this.meshes.plume, viewProj, [0.80, 0.58, 0.42], 9.0, (v.plume || 0) * 0.62, 1);
    this._drawPoints(this.meshes.vapor, viewProj, [0.66, 0.62, 0.58], 12.0, (v.plume || 0) * 0.24, 1);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this._drawPoints(this.meshes.dust, viewProj, [0.34, 0.29, 0.25], 3.0, dust * 0.34, 1);

    if ((v.time ?? -30) < 0) {
      const line = this.programs.line, pulse = 0.5 + 0.5 * Math.sin((v.time || 0) * 3.4);
      gl.useProgram(line); uniform(gl, line, 'uViewProj', viewProj); uniform(gl, line, 'uModel', IDENTITY);
      uniform(gl, line, 'uColor', [1.0, 0.46, 0.18, 0.55 + 0.45 * pulse]);
      gl.bindVertexArray(this.meshes.reticle.vao); gl.drawArrays(gl.LINES, 0, this.meshes.reticle.count);
    }
    this._drawPoints(this.meshes.probes, viewProj, [0.52, 0.96, 1.0], 6.5, 0.95, 1);
    gl.disable(gl.BLEND); gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    for (const program of Object.values(this.programs)) gl.deleteProgram(program);
    for (const mesh of Object.values(this.meshes)) destroyMesh(gl, mesh);
    for (const texture of Object.values(this.textures)) gl.deleteTexture(texture);
  }
}
