import { PerspectiveCamera, Vector3, MathUtils } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { visibleBounds } from '../utils/modelUtils.js';

export class CameraManager {
  constructor() {
    this.camera = new PerspectiveCamera(38, 1, 0.02, 100);
    this.camera.position.set(8, 7, 10);
    this.target = new Vector3();
    this.fromPosition = new Vector3(); this.toPosition = new Vector3();
    this.fromTarget = new Vector3(); this.toTarget = new Vector3();
    this.progress = 1;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  attach(canvas) {
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enabled = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.minPolarAngle = 0.3;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minAzimuthAngle = -Math.PI / 2;
    this.controls.maxAzimuthAngle = Math.PI / 2;
  }
  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.subject) this.frame(this.subject, this.mode);
  }
  frame(subject, mode = 'module') {
    this.subject = subject; this.mode = mode;
    const box = visibleBounds(subject);
    if (box.isEmpty()) return;
    const center = box.getCenter(new Vector3()), size = box.getSize(new Vector3());
    const radius = Math.max(size.length() / 2, 0.2);
    const vertical = this.camera.fov * Math.PI / 360;
    const horizontal = Math.atan(Math.tan(vertical) * this.camera.aspect);
    const distance = Math.max(mode === 'closeup' ? 3.2 : 0, radius / Math.sin(Math.min(vertical, horizontal)) * 1.13);
    const direction = mode === 'room' ? new Vector3(0.9, 0.72, 1) : mode === 'practice' ? new Vector3(0.35, 0.9, 1) : new Vector3(0.3, 0.38, 1);
    this.go(center.clone().add(direction.normalize().multiplyScalar(distance)), center);
    this.controls.minDistance = distance * 0.65;
    this.controls.maxDistance = distance * 1.5;
  }
  go(position, target) {
    this.controls.enabled = false;
    this.fromPosition.copy(this.camera.position); this.fromTarget.copy(this.controls.target);
    this.toPosition.copy(position); this.toTarget.copy(target);
    this.progress = this.reducedMotion.matches ? 1 : 0;
    if (this.progress === 1) { this.camera.position.copy(position); this.controls.target.copy(target); this.controls.update(); }
  }
  toggleOrbit() { this.controls.enabled = !this.controls.enabled; return this.controls.enabled; }
  update(delta) {
    if (this.progress < 1) {
      this.progress = Math.min(1, this.progress + delta / 0.85);
      const alpha = MathUtils.smoothstep(this.progress, 0, 1);
      this.camera.position.lerpVectors(this.fromPosition, this.toPosition, alpha);
      this.controls.target.lerpVectors(this.fromTarget, this.toTarget, alpha);
    }
    this.controls.update();
  }
  dispose() { this.controls.dispose(); }
}
