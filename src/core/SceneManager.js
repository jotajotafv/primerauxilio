import { Scene, Color, HemisphereLight, DirectionalLight, Mesh, CircleGeometry, MeshStandardMaterial, Box3Helper } from 'three';
import { TrainingHubScene } from '../scenes/TrainingHubScene.js';
import { ModuleScene } from '../scenes/ModuleScene.js';
import { SETTINGS } from '../config/settings.js';
import { visibleBounds } from '../utils/modelUtils.js';

export class SceneManager {
  constructor(assets, camera, interaction) {
    this.assets = assets; this.camera = camera; this.interaction = interaction; this.version = 0;
    this.scene = new Scene(); this.scene.background = new Color('#e8eef2');
    this.scene.add(new HemisphereLight(0xe7f4ff, 0x76889b, 1.8));
    this.key = new DirectionalLight(0xfff6ec, 2.8);
    this.key.position.set(3, 9, 5); this.key.castShadow = true;
    this.key.shadow.mapSize.setScalar(SETTINGS.shadowMapSize);
    Object.assign(this.key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.1, far: 30 });
    this.key.shadow.normalBias = 0.025; this.key.shadow.bias = -0.00015;
    this.scene.add(this.key);
    const fill = new DirectionalLight(0xd4f7ff, 0.9); fill.position.set(-5, 4, -3); this.scene.add(fill);
    this.stage = new Mesh(new CircleGeometry(3.2, 64), new MeshStandardMaterial({ color: '#dce5eb', roughness: 0.94 }));
    this.stage.rotation.x = -Math.PI / 2; this.stage.position.y = 0.01; this.stage.receiveShadow = true; this.stage.visible = false;
    this.scene.add(this.stage);
  }
  async showHub() {
    const version = ++this.version;
    if (!this.hub) {
      this.hubPromise ??= new TrainingHubScene(this.assets).build().catch(error => { this.hubPromise = null; throw error; });
      this.hub = await this.hubPromise;
    }
    if (this.disposed) { this.hub.dispose(); return false; }
    if (version !== this.version) return false;
    this.activate(this.hub, 'room');
    return true;
  }
  async showModule(module, variant) {
    const version = ++this.version;
    const next = await new ModuleScene(this.assets, module, variant).build();
    if (version !== this.version) { next.dispose(); return false; }
    this.activate(next, module.id === 'cpr' || module.id === 'burns' || (module.id === 'bleeding' && !variant) || module.id === 'kit' ? 'practice' : 'module');
    return true;
  }
  activate(next, mode) {
    this.interaction.clear();
    if (this.current && this.current !== next) {
      this.current.root.removeFromParent();
      if (this.current !== this.hub) this.current.dispose();
    }
    this.current = next; this.scene.add(next.root);
    this.stage.visible = next !== this.hub;
    this.camera.frame(next.root, mode); this.overviewMode = mode;
    this.interaction.set(next.items?.() || []);
    if (this.debugBox) { this.scene.remove(this.debugBox); this.debugBox.geometry.dispose(); this.debugBox.material.dispose(); }
    if (SETTINGS.debug) { this.debugBox = new Box3Helper(visibleBounds(next.root), 0x40c4d8); this.scene.add(this.debugBox); }
  }
  homeCamera() { this.camera.frame(this.current.root, this.overviewMode); }
  update(delta, elapsed) {
    this.current?.update(delta, elapsed, this.camera.reducedMotion.matches);
    this.current?.marker?.quaternion.copy(this.camera.camera.quaternion);
  }
  dispose() {
    this.disposed = true;
    this.version++;
    this.interaction.clear();
    if (this.current !== this.hub) this.current?.dispose();
    this.hub?.dispose(); this.stage.geometry.dispose(); this.stage.material.dispose(); this.key.shadow.map?.dispose();
    this.debugBox?.geometry.dispose(); this.debugBox?.material.dispose();
  }
}
