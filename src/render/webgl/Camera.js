// User-owned camera state, extracted from the renderer so the state machine is
// deterministic and testable without a GPU. The renderer feeds it input and
// reads positions; nothing in here allocates, renders, or reads the DOM.
//
// Invariants (see docs/VISUAL_QA.md, interaction review):
//  - pitch stays inside ±1.35 rad so the user can never flip through the pole
//  - distance stays inside 1.35–14 so the planet cannot be lost or clipped
//  - glide eases toward the goal; a fresh manual input cancels the glide at once

import { normalize } from './matrix.js';

export const CAMERA_LIMITS = Object.freeze({
  pitchMin: -1.35,
  pitchMax: 1.35,
  distanceMin: 1.35,
  distanceMax: 14,
  orbitScale: 0.006,
  dollyScale: 0.0012,
  glideRate: 4.6,
  shakeDecay: 1.9,
  shakeAmplitude: 0.028,
  targetInFrameDot: 0.35
});

export class Camera {
  constructor(initial = {}) {
    const limits = CAMERA_LIMITS;
    this.fovY = initial.fovY ?? (40 * Math.PI / 180);
    this.yaw = initial.yaw ?? -0.55;
    this.pitch = clampPitch(initial.pitch ?? 0.24);
    this.distance = clampDistance(initial.distance ?? 3.9);
    this.goal = { yaw: this.yaw, pitch: this.pitch, distance: this.distance };
    this.glide = 0;
    this.shake = 0;
    this.reducedMotion = false;
  }

  orbitBy(dx, dy) {
    this.glide = 0;
    this.yaw += dx * CAMERA_LIMITS.orbitScale;
    this.pitch = clampPitch(this.pitch + dy * CAMERA_LIMITS.orbitScale);
    this.goal = { yaw: this.yaw, pitch: this.pitch, distance: this.distance };
    return this;
  }

  dollyBy(delta) {
    this.glide = 0;
    this.distance = clampDistance(this.distance * Math.exp(delta * CAMERA_LIMITS.dollyScale));
    this.goal = { ...this.goal, distance: this.distance };
    return this;
  }

  getCamera() {
    return { yaw: this.goal.yaw, pitch: this.goal.pitch, distance: this.goal.distance };
  }

  /** Set a goal framing. `glide: false` (or reduced motion) snaps instantly. */
  setCamera(camera, { glide = true } = {}) {
    this.goal = {
      yaw: camera.yaw ?? this.goal.yaw,
      pitch: clampPitch(camera.pitch ?? this.goal.pitch),
      distance: clampDistance(camera.distance ?? this.goal.distance)
    };
    if (glide && !this.reducedMotion) this.glide = 1;
    else { this.yaw = this.goal.yaw; this.pitch = this.goal.pitch; this.distance = this.goal.distance; this.glide = 0; }
    return this;
  }

  setReducedMotion(value) { this.reducedMotion = Boolean(value); }

  /** Advance the eased camera and the impact shake. Called once per frame. */
  stepCamera(dt) {
    if (this.glide > 0) {
      const k = 1 - Math.exp(-dt * CAMERA_LIMITS.glideRate);
      let delta = this.goal.yaw - this.yaw;
      delta -= Math.round(delta / (Math.PI * 2)) * Math.PI * 2;
      this.yaw += delta * k;
      this.pitch += (this.goal.pitch - this.pitch) * k;
      this.distance += (this.goal.distance - this.distance) * k;
      if (Math.abs(delta) < 1e-4 && Math.abs(this.goal.pitch - this.pitch) < 1e-4 && Math.abs(this.goal.distance - this.distance) < 1e-4) {
        this.yaw = this.goal.yaw; this.pitch = this.goal.pitch; this.distance = this.goal.distance;
        this.glide = 0;
      }
    }
    this.shake = Math.max(0, this.shake - dt * CAMERA_LIMITS.shakeDecay);
  }

  /** A short, decaying handheld kick at contact. Suppressed under reduced motion. */
  punch(strength = 1) {
    if (!this.reducedMotion) this.shake = Math.max(this.shake, Math.min(1, strength));
  }

  eye(modelTime = 0) {
    const c = Math.cos(this.pitch);
    const eye = [
      this.distance * c * Math.cos(this.yaw),
      this.distance * Math.sin(this.pitch),
      this.distance * c * Math.sin(this.yaw)
    ];
    if (this.shake > 0) {
      const s = this.shake * this.shake * CAMERA_LIMITS.shakeAmplitude, t = modelTime || 0;
      eye[0] += Math.sin(t * 91.7 + 1.3) * s;
      eye[1] += Math.sin(t * 73.1 + 2.9) * s;
      eye[2] += Math.sin(t * 111.3 + 0.7) * s;
    }
    return eye;
  }

  /**
   * On portrait frames the horizontal field of view is the constraint. Pull
   * back far enough that the planet reads as an object with air around it.
   */
  fitDistance(base, aspect) {
    if (!(aspect > 0) || aspect >= 1) return base;
    const halfFovX = Math.atan(Math.tan(this.fovY / 2) * aspect);
    return Math.max(base, Math.min(11, 1 / Math.sin(Math.max(0.08, halfFovX * 0.62))));
  }

  /** True when the impact site is on the near face and clear of the limb. */
  targetInFrame(target) {
    const eye = this.eye();
    const length = Math.hypot(...eye) || 1;
    return (eye[0] * target[0] + eye[1] * target[1] + eye[2] * target[2]) / length > CAMERA_LIMITS.targetInFrameDot;
  }

  /**
   * Camera framings are expressed relative to the impact target so the impact
   * is always composed, never hunted for. `fit` must resolve portrait fit.
   */
  preset(name, target, fit) {
    const [lon, lat] = unitToLonLatDeg(target);
    const yaw = lon * Math.PI / 180, pitch = lat * Math.PI / 180;
    if (name === 'impact') return { yaw, pitch, distance: fit(2.35) };
    if (name === 'trajectory') return { yaw: yaw - 0.92, pitch: pitch * 0.5 + 0.16, distance: fit(3.6) };
    if (name === 'chase') return { yaw: yaw + 0.48, pitch: pitch * 0.6 + 0.06, distance: fit(2.85) };
    if (name === 'space') return { yaw: yaw - 0.38, pitch: 0.44, distance: fit(7.2) };
    return { yaw: yaw - 0.34, pitch: pitch * 0.55 + 0.12, distance: fit(3.9) };
  }
}

function clampPitch(pitch) {
  return Math.max(CAMERA_LIMITS.pitchMin, Math.min(CAMERA_LIMITS.pitchMax, pitch));
}

function clampDistance(distance) {
  return Math.max(CAMERA_LIMITS.distanceMin, Math.min(CAMERA_LIMITS.distanceMax, distance));
}

function unitToLonLatDeg(v) {
  const n = normalize(v);
  return [Math.atan2(n[2], n[0]) * 180 / Math.PI, Math.asin(Math.max(-1, Math.min(1, n[1]))) * 180 / Math.PI];
}
