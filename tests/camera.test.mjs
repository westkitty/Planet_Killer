import test from 'node:test';
import assert from 'node:assert/strict';
import { Camera, CAMERA_LIMITS } from '../src/render/webgl/Camera.js';
import { lonLatToUnit, unitToLonLat } from '../src/render/webgl/matrix.js';

test('orbit stays inside pitch limits', () => {
  const camera = new Camera();
  for (let i = 0; i < 500; i++) camera.orbitBy(0, 100);
  assert.ok(camera.pitch <= CAMERA_LIMITS.pitchMax + 1e-9);
  for (let i = 0; i < 500; i++) camera.orbitBy(0, -100);
  assert.ok(camera.pitch >= CAMERA_LIMITS.pitchMin - 1e-9);
});

test('dolly stays inside distance limits', () => {
  const camera = new Camera();
  for (let i = 0; i < 500; i++) camera.dollyBy(1000);
  assert.ok(camera.distance <= CAMERA_LIMITS.distanceMax + 1e-9);
  for (let i = 0; i < 500; i++) camera.dollyBy(-1000);
  assert.ok(camera.distance >= CAMERA_LIMITS.distanceMin - 1e-9);
});

test('orbit and dolly are deterministic and commutative in yaw/pitch', () => {
  const a = new Camera({ yaw: 0.3, pitch: -0.2, distance: 4 });
  const b = new Camera({ yaw: 0.3, pitch: -0.2, distance: 4 });
  a.orbitBy(40, 12).dollyBy(80);
  b.orbitBy(40, 12).dollyBy(80);
  assert.deepEqual(a.getCamera(), b.getCamera());
});

test('manual input cancels the glide (camera snaps to goal)', () => {
  const camera = new Camera({ yaw: 0, pitch: 0, distance: 3.9 });
  camera.setCamera({ yaw: 1.2, pitch: 0.4, distance: 5.5 });
  assert.ok(camera.glide > 0, 'setCamera glides by default');
  camera.orbitBy(10, 0);
  assert.equal(camera.glide, 0, 'manual orbit cancels glide');
  assert.equal(camera.yaw, camera.goal.yaw);
});

test('glide converges to the goal with a fixed dt schedule', () => {
  const camera = new Camera({ yaw: 0, pitch: 0, distance: 3.9 });
  camera.setCamera({ yaw: 1.0, pitch: 0.3, distance: 6 });
  const a = new Camera({ yaw: 0, pitch: 0, distance: 3.9 });
  a.setCamera({ yaw: 1.0, pitch: 0.3, distance: 6 });
  for (let i = 0; i < 240; i++) { camera.stepCamera(1 / 60); a.stepCamera(1 / 60); }
  assert.ok(Math.abs(camera.yaw - 1.0) < 1e-3);
  assert.deepEqual(camera.getCamera(), a.getCamera(), 'fixed schedule is deterministic');
});

test('reduced motion snaps camera and suppresses punch', () => {
  const camera = new Camera({ yaw: 0, pitch: 0, distance: 3.9 });
  camera.setReducedMotion(true);
  camera.setCamera({ yaw: 0.9, pitch: 0.2, distance: 5 });
  assert.equal(camera.glide, 0);
  assert.equal(camera.yaw, camera.goal.yaw);
  camera.punch(1);
  assert.equal(camera.shake, 0, 'reduced motion suppresses the contact kick');
});

test('punch decays deterministically', () => {
  const camera = new Camera();
  camera.punch(1);
  const after1 = camera.shake;
  camera.stepCamera(0.5);
  assert.ok(camera.shake < after1);
  for (let i = 0; i < 40; i++) camera.stepCamera(0.1);
  assert.equal(camera.shake, 0);
});

test('camera eye is finite and respects distance', () => {
  const camera = new Camera({ yaw: 0.5, pitch: 0.2, distance: 4 });
  const eye = camera.eye(123.456);
  assert.ok(eye.every(Number.isFinite));
  assert.ok(Math.abs(Math.hypot(...eye) - 4) < 1e-9, 'no shake: eye sits on the distance shell');
});

test('shake offsets stay bounded by the amplitude', () => {
  const camera = new Camera({ distance: 4 });
  camera.punch(1);
  const eye = camera.eye(777);
  const plain = new Camera({ distance: 4 });
  const plainEye = plain.eye(777);
  const delta = Math.hypot(eye[0] - plainEye[0], eye[1] - plainEye[1], eye[2] - plainEye[2]);
  assert.ok(delta <= 3 * CAMERA_LIMITS.shakeAmplitude + 1e-9);
});

test('target-relative presets are deterministic and aim near the target', () => {
  const target = lonLatToUnit(-86.8, 21.2);
  const fit = base => base;
  for (const name of ['globe', 'impact', 'trajectory', 'chase', 'space']) {
    const p1 = new Camera().preset(name, target, fit);
    const p2 = new Camera().preset(name, target, fit);
    assert.deepEqual(p1, p2, `${name} preset deterministic`);
    for (const v of Object.values(p1)) assert.ok(Number.isFinite(v), `${name} preset finite`);
    assert.ok(p1.distance >= 2.3 && p1.distance <= 7.2, `${name} distance in framing range`);
  }
});

test('portrait fit pulls back; landscape fit is identity', () => {
  const camera = new Camera();
  assert.equal(camera.fitDistance(3.9, 1.6), 3.9, 'landscape aspect unchanged');
  assert.ok(camera.fitDistance(3.9, 0.46) > 3.9, 'portrait aspect pulls back');
  assert.ok(camera.fitDistance(3.9, 0.46) <= 11, 'portrait fit bounded');
});

test('targetInFrame agrees with the target direction and camera state', () => {
  const target = lonLatToUnit(-86.8, 21.2);
  const camera = new Camera();
  const yaw = unitToLonLat(target).longitude * Math.PI / 180;
  camera.setCamera({ yaw, pitch: unitToLonLat(target).latitude * Math.PI / 180, distance: 3.9 }, { glide: false });
  assert.equal(camera.targetInFrame(target), true);
  camera.setCamera({ yaw: yaw + Math.PI, pitch: 0, distance: 3.9 }, { glide: false });
  assert.equal(camera.targetInFrame(target), false, 'opposite side of the planet is out of frame');
});

test('yaw wraps continuously (no pole discontinuity in glide math)', () => {
  const camera = new Camera({ yaw: Math.PI - 0.01 });
  camera.setCamera({ yaw: -Math.PI + 0.01, pitch: 0, distance: 3.9 }, { glide: false });
  assert.equal(camera.getCamera().yaw, -Math.PI + 0.01);
  const a = new Camera({ yaw: Math.PI - 0.01, pitch: 0, distance: 3.9 });
  a.setCamera({ yaw: -Math.PI + 0.01, pitch: 0, distance: 3.9 });
  a.stepCamera(0.1);
  // Should take the short way around: yaw should decrease from ~π toward -π,
  // not spin the long way through 0.
  assert.ok(a.yaw > Math.PI - 0.1 || a.yaw < -Math.PI + 0.1, `short-path glide, got ${a.yaw}`);
});
