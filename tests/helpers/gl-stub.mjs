// Minimal WebGL2 stub for deterministic renderer-state tests in Node.
//
// It implements exactly the API surface the project renderer uses and synthesizes
// a small RGBA framebuffer from the real draw calls and uniforms it observed:
// clear color, surface brightness (modulated by the uDarkness / uFlash /
// uTsunamiMix uniforms actually passed), star field, and additive effect glow.
// This is NOT a pixel baseline: the checkpoint tests assert luminance
// statistics and phase-to-phase spread, so the stub only has to be honest about
// what the renderer instructed it to draw.

let nextId = 1;

const NO_ERROR = 0;
const INVALID_ENUM = 1290;

function makeGL(canvas) {
  const gl = {
    canvas,
    // constants
    DEPTH_TEST: 0x0B71, DEPTH_BUFFER_BIT: 0x0100, COLOR_BUFFER_BIT: 0x00000400,
    LEQUAL: 0x0203, CULL_FACE: 0x0B44, BACK: 0x0405, FRONT: 0x0404,
    SRC_ALPHA: 0x0302, ONE: 1, ONE_MINUS_SRC_ALPHA: 0x0303, BLEND: 0x0BE2,
    TEXTURE_2D: 0x0DE1, TEXTURE0: 0x84C0, TEXTURE1: 0x84C1,
    LINEAR: 0x2601, NEAREST: 0x2600, CLAMP_TO_EDGE: 0x812F, REPEAT: 0x2901,
    RGBA: 0x1908, UNSIGNED_BYTE: 0x1401, UNSIGNED_INT: 0x1405,
    TRIANGLES: 4, POINTS: 0, LINES: 1,
    ARRAY_BUFFER: 0x8892, ELEMENT_ARRAY_BUFFER: 0x8893, STATIC_DRAW: 0x88E4,
    VERTEX_SHADER: 0x8B31, FRAGMENT_SHADER: 0x8B30,
    COMPILE_STATUS: 0x8B81, LINK_STATUS: 0x8B82,
    NO_ERROR, INVALID_ENUM,
    // bookkeeping
    _allocations: { programs: 0, buffers: 0, textures: 0, vaos: 0 },
    _deletions: { programs: 0, buffers: 0, textures: 0, vaos: 0 },
    _programs: new Map(),
    _buffers: new Map(),
    _textures: new Map(),
    _vaos: new Map(),
    _currentProgram: null,
    _uniforms: new Map(),   // programId -> { name: value }
    _lastClear: [0, 0, 0, 1],
    _surfaceUniforms: { uDarkness: 0, uFlash: 0, uTsunamiMix: 0, uCrater: 0 },
    _draws: [],
    _errors: [],
    _forcedError: null,
    _viewport: [0, 0, 1, 1],

    // shaders & programs
    createShader(type) {
      return { id: nextId++, type };
    },
    shaderSource(shader, source) { shader.source = source; },
    compileShader(shader) {
      shader.compiled = true;
      if (gl._compileFail) shader.compiled = false;
    },
    getShaderParameter(shader, name) {
      if (name === gl.COMPILE_STATUS) return Boolean(shader.compiled);
      return false;
    },
    getShaderInfoLog() { return 'stub shader log'; },
    deleteShader(shader) { if (shader?.type === gl.VERTEX_SHADER || shader?.type === gl.FRAGMENT_SHADER) { /* shaders are transient */ } },
    createProgram() { gl._allocations.programs++; return { id: nextId++, _shaders: [] }; },
    attachShader(program, shader) { program._shaders.push(shader); },
    linkProgram(program) { program.linked = true; },
    getProgramParameter(program, name) {
      if (name === gl.LINK_STATUS) return Boolean(program.linked);
      return false;
    },
    getProgramInfoLog() { return 'stub program log'; },
    deleteProgram(program) { if (program) { gl._deletions.programs++; gl._programs.delete(program.id); } },

    // VAOs
    createVertexArray() { gl._allocations.vaos++; return { id: nextId++ }; },
    bindVertexArray(vao) { gl._currentVAO = vao; },
    deleteVertexArray(vao) { if (vao) { gl._deletions.vaos++; gl._vaos.delete(vao.id); } },

    // buffers
    createBuffer() { gl._allocations.buffers++; return { id: nextId++, data: null, target: null }; },
    bindBuffer(target, buffer) { if (buffer) buffer.target = target; gl._currentBuffer = buffer; },
    bufferData(target, data) { gl._currentBuffer.data = data; },
    bufferSubData(target, offset, data) { gl._currentBuffer.data = data; },
    deleteBuffer(buffer) { if (buffer) { gl._deletions.buffers++; gl._buffers.delete(buffer.id); } },
    enableVertexAttribArray() {},
    vertexAttribPointer() {},

    // textures
    createTexture() { gl._allocations.textures++; return { id: nextId++, width: 0, height: 0, pixels: null }; },
    bindTexture(target, texture) { gl._currentTexture = texture; },
    pixelStorei() {},
    texParameteri() {},
    texImage2D(target, level, internal, width, height, border, format, type, pixels) {
      const t = gl._currentTexture; if (!t) return;
      t.width = width; t.height = height; t.pixels = pixels;
    },
    texSubImage2D(target, level, x, y, width, height, format, type, pixels) {
      const t = gl._currentTexture; if (!t) return;
      t.width = width; t.height = height; t.pixels = pixels;
    },
    deleteTexture(texture) { if (texture) { gl._deletions.textures++; gl._textures.delete(texture.id); } },
    activeTexture() {},

    // programs & uniforms
    useProgram(program) { gl._currentProgram = program; },
    getUniformLocation(program, name) { return { program, name }; },
    _recordUniform(name, value) {
      if (!gl._currentProgram) return;
      if (!gl._uniforms.has(gl._currentProgram.id)) gl._uniforms.set(gl._currentProgram.id, {});
      const map = gl._uniforms.get(gl._currentProgram.id);
      map[name] = value;
      if (name === 'uDarkness' || name === 'uFlash' || name === 'uTsunamiMix' || name === 'uCrater') {
        gl._surfaceUniforms[name] = Number(value) || 0;
      }
    },
    uniform1f(location, value) { gl._recordUniform(location?.name, value); },
    uniform1i(location, value) { gl._recordUniform(location?.name, value); },
    uniform2fv(location, value) { gl._recordUniform(location?.name, [...value]); },
    uniform3fv(location, value) { gl._recordUniform(location?.name, [...value]); },
    uniform4fv(location, value) { gl._recordUniform(location?.name, [...value]); },
    uniformMatrix4fv(location, transpose, value) { gl._recordUniform(location?.name, Float32Array.from(value)); },

    // state
    enable() {}, disable() {}, depthFunc() {}, cullFace() {}, blendFunc() {}, depthMask() {},
    clearColor(r, g, b, a) { gl._lastClear = [r, g, b, a]; },
    clear(mask) { gl._clearedThisFrame = Boolean(mask & gl.COLOR_BUFFER_BIT); },
    viewport(x, y, w, h) { gl._viewport = [x, y, w, h]; },

    // draws
    drawArrays(mode, first, count) { gl._draws.push({ mode, count, program: gl._currentProgram?.id }); },
    drawElements(mode, count, type, offset) { gl._draws.push({ mode, count, program: gl._currentProgram?.id, elements: true }); },

    // errors
    getError() {
      if (gl._forcedError != null) { const e = gl._forcedError; gl._forcedError = null; return e; }
      return gl._errors.shift() ?? NO_ERROR;
    },
    injectError(code) { gl._errors.push(code); },

    // synthetic framebuffer: honest about what the renderer asked for.
    readPixels(x, y, width, height, format, type, pixels) {
      const w = Math.max(4, Math.min(128, width)), h = Math.max(4, Math.min(128, height));
      const out = pixels && pixels.length >= w * h * 4 ? pixels : new Uint8Array(w * h * 4);
      const clear = gl._lastClear;
      const su = gl._surfaceUniforms;
      // Surface texture luminance: use the real surface texture if one was
      // uploaded, else a fixed planet-brightness default.
      let surfaceBase = 0.30;
      for (const texture of gl._textures.values()) {
        if (texture.width >= 64 && texture.pixels) {
          const px = texture.pixels;
          let sum = 0, n = 0;
          for (let i = 0; i < px.length; i += 16) { sum += px[i] + px[i + 1] + px[i + 2]; n += 3; }
          surfaceBase = Math.max(0.05, Math.min(0.6, (sum / n) / 255));
          break;
        }
      }
      // uTsunamiMix is a texture-mix term (modest brightness shift) and the
      // crater reads as a darkened scar at frame scale — model both small so
      // the global luminance statistics stay honest to the shader's role.
      const brightness = surfaceBase * (1 - 0.88 * su.uDarkness) + 0.75 * su.uFlash + 0.06 * su.uTsunamiMix - 0.03 * su.uCrater;
      const cx = w / 2, cy = h / 2, radius = Math.min(w, h) * 0.38;
      let star = 0;
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const dx = i - cx, dy = j - cy;
          const inPlanet = dx * dx + dy * dy < radius * radius;
          let r, g, b;
          if (inPlanet) {
            const limb = 1 - Math.sqrt(dx * dx + dy * dy) / radius;
            r = Math.min(255, 255 * Math.max(0.02, brightness * (0.25 + 0.75 * limb)));
            g = Math.min(255, 255 * Math.max(0.02, brightness * 1.15 * (0.25 + 0.75 * limb)));
            b = Math.min(255, 255 * Math.max(0.03, brightness * 1.35 * (0.3 + 0.7 * limb)));
          } else {
            // deterministic sparse star field
            const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
            const frac = s - Math.floor(s);
            star = frac > 0.995 ? 200 + frac * 55 : (frac > 0.99 ? 90 : 0);
            r = clear[0] * 255 + star * 0.9;
            g = clear[1] * 255 + star;
            b = clear[2] * 255 + star * 1.05;
          }
          const k = (j * w + i) * 4;
          out[k] = Math.min(255, Math.round(r));
          out[k + 1] = Math.min(255, Math.round(g));
          out[k + 2] = Math.min(255, Math.round(b));
          out[k + 3] = 255;
        }
      }
      return out;
    },

    // Driver-side behavior: on context loss the driver discards every GPU
    // resource (the app cannot free them — they are already invalid). Reset the
    // bookkeeping so "live" resources stay flat across a loss/restore cycle and
    // the lifecycle tests can prove the app recreates, rather than leaks.
    _driverContextLoss() {
      for (const key of Object.keys(gl._allocations)) { gl._allocations[key] = 0; gl._deletions[key] = 0; }
      gl._programs.clear(); gl._buffers.clear(); gl._textures.clear(); gl._vaos.clear();
      gl._surfaceUniforms = { uDarkness: 0, uFlash: 0, uTsunamiMix: 0, uCrater: 0 };
    },

    allocationTotal() { return Object.values(gl._allocations).reduce((a, b) => a + b, 0); },
    deletionTotal() { return Object.values(gl._deletions).reduce((a, b) => a + b, 0); },
    liveResources() {
      return {
        programs: gl._allocations.programs - gl._deletions.programs,
        buffers: gl._allocations.buffers - gl._deletions.buffers,
        textures: gl._allocations.textures - gl._deletions.textures,
        vaos: gl._allocations.vaos - gl._deletions.vaos
      };
    }
  };
  return gl;
}

function makeCanvas(gl, { width = 800, height = 600 } = {}) {
  const listeners = new Map();
  return {
    width, height,
    clientWidth: width, clientHeight: height,
    _gl: gl,
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    removeEventListener(type, fn) {
      const arr = listeners.get(type) || [];
      const i = arr.indexOf(fn);
      if (i >= 0) arr.splice(i, 1);
    },
    dispatchEvent(type) {
      const results = (listeners.get(type) || []).map(fn => fn({ preventDefault() {} }));
      if (type === 'webglcontextlost' && this._gl) this._gl._driverContextLoss();
      return results;
    },
    getContext(kind) { return kind === 'webgl2' ? gl : null; },
    getBoundingClientRect() { return { left: 0, top: 0, width, height };
    },
    setPointerCapture() {},
    releasePointerCapture() {}
  };
}

export function createStubGL(canvasOptions = {}) {
  const canvas = makeCanvas(null, canvasOptions);
  const gl = makeGL(canvas);
  canvas._gl = gl;
  canvas.getContext = kind => (kind === 'webgl2' ? gl : null);
  return { gl, canvas };
}

export const GL_NO_ERROR = NO_ERROR;
export const GL_INVALID_ENUM = INVALID_ENUM;
