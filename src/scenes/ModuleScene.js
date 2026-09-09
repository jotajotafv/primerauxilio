import { Group, Vector3, MathUtils, Mesh, RingGeometry, MeshBasicMaterial, DoubleSide } from 'three';
import { prepareModel, findNode, setVisible, visibleBounds } from '../utils/modelUtils.js';
import { prepareInstructor } from '../utils/instructorUtils.js';

export class ModuleScene {
  constructor(assets, module, variant = 0) {
    this.assets = assets; this.module = module; this.variant = variant;
    this.root = new Group(); this.instances = []; this.equipment = new Map(); this.moves = []; this.originals = new Map();
  }
  async build() {
    const { module, variant } = this;
    const id = variant ? ({ bleeding: 'bleedingLeg', fractures: 'fracturedLeg' }[module.id] || module.model) : module.model;
    const ids = [id, ...module.tools, ...(module.id === 'heimlich' ? ['patient'] : []), 'instructor'];
    const results = await Promise.allSettled(ids.map(async asset => {
      const instance = await this.assets.instantiate(asset);
      this.instances.push(instance);
      return instance;
    }));
    const failed = results.find(r => r.status === 'rejected');
    if (failed) { this.dispose(); throw new Error('No se pudo preparar este módulo. Vuelve a intentarlo o elige otro.'); }
    this.mainInstance = results[0].value;
    const source = this.mainInstance.root;
    setVisible(source, /^(Rig_Normal|Leg_Normal)$/, false);
    if (id === 'fracturedArm') { this.mainInstance.play('Pose_Rest__Fractured'); this.mainInstance.mixer.update(0.1); }
    this.main = prepareModel(source, { size: module.id === 'kit' ? 1.5 : 2.05 });
    this.main.position.y = 0.025;
    this.root.add(this.main);
    if (module.id === 'cpr' || (module.id === 'bleeding' && variant === 0) || module.id === 'burns') this.main.rotation.y = -Math.PI / 2;
    for (let index = 0; index < module.tools.length; index++) {
      const asset = module.tools[index], instance = results[index + 1].value;
      if (asset === 'gauze') setVisible(instance.root, /^Gauze_Applied$/, false);
      const model = prepareModel(instance.root, { size: asset === 'splint' ? 0.65 : 0.32 });
      const columns = module.tools.length > 4 ? 4 : module.tools.length;
      const col = index % columns, row = Math.floor(index / columns);
      model.position.set((col - (columns - 1) / 2) * 0.68, 0.025, 1.1 + row * 0.65);
      this.equipment.set(asset, model); this.root.add(model);
    }
    if (module.id === 'heimlich') {
      const patient = this.instances.find(instance => instance.id === 'patient');
      patient.play('POSE_Choking_Heimlich'); patient.mixer.update(0.01);
      this.patient = prepareModel(patient.root, { size: 1.55, axis: 'y' });
      this.patient.position.set(-1.25, 0.025, 0);
      this.root.add(this.patient);
    }
    const instructor = this.instances.find(instance => instance.id === 'instructor');
    prepareInstructor(instructor.root);
    this.instructor = prepareModel(instructor.root, { size: 1.25, axis: 'y' });
    this.instructor.position.set(module.id === 'heimlich' ? 1.15 : -1.6, 0.025, -0.6);
    this.instructor.rotation.y = module.id === 'heimlich' ? -0.25 : 0.3;
    this.root.add(this.instructor);
    this.root.updateMatrixWorld(true);
    this.root.traverse(node => this.originals.set(node, { position: node.position.clone(), rotation: node.rotation.clone(), scale: node.scale.clone(), visible: node.visible }));
    this.chest = findNode(source, 'CPR_Chest');
    this.lid = findNode(source, 'FirstAidKit_Lid');
    this.wound = findNode(source, /^(Wound_Arm|Wound_Leg|Burn_HandForearm|Arm_Fractured|Leg_Fractured)$/);
    this.guide = findNode(source, 'Heimlich_Hand_Placement_Guide');
    this.marker = new Mesh(new RingGeometry(0.095, 0.105, 48), new MeshBasicMaterial({ color: 0x1688a5, side: DoubleSide, transparent: true, opacity: 0.85, depthTest: false }));
    this.marker.visible = false; this.marker.renderOrder = 3; this.root.add(this.marker);
    return this;
  }
  items() {
    const items = [...this.equipment].map(([id, object]) => ({ id, object }));
    if (this.chest) items.push({ id: 'chest', object: this.chest });
    if (this.wound) items.push({ id: 'wound', object: this.wound });
    if (this.lid) items.push({ id: 'lid', object: this.lid });
    if (this.guide) items.push({ id: 'hands', object: this.guide });
    if (this.module.id === 'heimlich') items.push({ id: 'airway', object: findNode(this.main, 'Heimlich_Airway') });
    if (this.module.id === 'intro') items.push({ id: 'response', object: this.main });
    return items;
  }
  reset() {
    this.moves = []; this.pulse = 0; this.cooling = false;
    this.instances.forEach(instance => instance.mixer?.stopAllAction());
    this.originals.forEach((original, node) => {
      node.position.copy(original.position); node.rotation.copy(original.rotation); node.scale.copy(original.scale); node.visible = original.visible;
    });
    if (this.patient) { const patient = this.instances.find(i => i.id === 'patient'); patient.play('POSE_Choking_Heimlich'); }
    this.marker.visible = false;
  }
  highlight(id) {
    this.highlightId = id;
    let object = this.equipment.get(id) || this.items().find(item => item.id === id)?.object;
    if (this.module.id === 'intro' && ['response', 'breathing'].includes(id)) object = this.main;
    if (id === 'water' || id === 'pressure') object = this.wound;
    this.marker.visible = Boolean(object);
    if (!object) return;
    const center = visibleBounds(object).getCenter(new Vector3());
    if (this.module.id === 'intro') center.y += id === 'response' ? 0.52 : 0.1;
    if (id === 'chest') center.y += 0.18;
    if (this.module.id === 'bleeding' && id === 'pressure') center.copy(this.anchor(/^Anchor_DirectPressure$/));
    this.marker.position.copy(center);
    this.marker.material.color.set(id === 'water' ? 0x1688a5 : 0x227f9b);
  }
  move(object, position, scale) {
    this.moves = this.moves.filter(move => move.object !== object);
    this.moves.push({ object, start: object.position.clone(), end: position, startScale: object.scale.clone(), endScale: scale ? new Vector3().setScalar(scale) : object.scale.clone(), time: 0 });
  }
  anchor(pattern) {
    const node = findNode(this.main, pattern);
    if (node) return node.getWorldPosition(new Vector3());
    return visibleBounds(this.wound || this.main).getCenter(new Vector3());
  }
  apply(effect) {
    if (effect === 'compress') {
      this.mainInstance.play('CPR_Compression_Cycle', { speed: 1.8 }); this.pulse = 1;
    }
    if (effect === 'lid') {
      this.mainInstance.play('FirstAidKit_Open_Latch_L');
      this.mainInstance.play('FirstAidKit_Open_Latch_R');
      this.mainInstance.play('FirstAidKit_Open_Lid');
    }
    if (effect === 'airway') setVisible(this.main, /^Heimlich_(Exterior_Cover|Face_Cover)$/, false);
    if (effect === 'hands' || effect === 'thrust') {
      if (this.guide) this.guide.visible = true;
      this.pulse = effect === 'thrust' ? 1 : 0;
    }
    if (effect === 'water') this.cooling = true;
    if (effect === 'cover') this.cooling = false;
    if (effect === 'medicalGloves') {
      const gloves = this.equipment.get('medicalGloves');
      if (gloves) this.move(gloves, new Vector3(-1.1, 0.025, 0.3));
    }
    if (effect === 'gauze') {
      const model = this.equipment.get('gauze');
      const target = this.anchor(/^Anchor_Gauze$/);
      target.y += 0.025;
      this.move(model, target);
    }
    if (effect === 'pressure') this.pulse = 1;
    if (effect === 'splint') {
      const splint = this.equipment.get('splint');
      const box = visibleBounds(this.main), size = box.getSize(new Vector3());
      const target = box.getCenter(new Vector3());
      target.x += size.x * 0.65;
      splint.rotation.z = Math.PI / 2;
      this.move(splint, target, 1.7);
    }
    if (effect === 'bandage' || effect === 'medicalTape') {
      const object = this.equipment.get(effect);
      if (object) {
        const target = this.module.id === 'bleeding' ? this.anchor(/^Anchor_Bandage(_Calf)?$/) : visibleBounds(this.main).getCenter(new Vector3());
        target.z += 0.13; target.x += effect === 'medicalTape' ? 0.18 : 0;
        this.move(object, target);
      }
    }
  }
  focus(id) { return this.equipment.get(id) || this.items().find(i => i.id === id)?.object || this.main; }
  update(delta, elapsed, reduced) {
    this.instances.forEach(instance => instance.mixer?.update(delta));
    for (let index = this.moves.length - 1; index >= 0; index--) {
      const move = this.moves[index];
      move.time = Math.min(1, move.time + delta * (reduced ? 100 : 1.7));
      const alpha = MathUtils.smoothstep(move.time, 0, 1);
      move.object.position.lerpVectors(move.start, move.end, alpha);
      move.object.scale.lerpVectors(move.startScale, move.endScale, alpha);
      if (move.time === 1) this.moves.splice(index, 1);
    }
    this.pulse = Math.max(0, (this.pulse || 0) - delta * 2.5);
    if (this.guide && this.originals.has(this.guide) && !reduced) this.guide.position.z = this.originals.get(this.guide).position.z - this.pulse * 0.008;
    if (this.marker.visible) {
      this.marker.scale.setScalar(this.cooling && !reduced ? 1.4 + Math.sin(elapsed * 2) * 0.35 : 1);
      this.marker.material.opacity = this.cooling ? 0.5 : 0.85;
    }
    if (!reduced) {
      this.instructor.rotation.y = this.originals.get(this.instructor).rotation.y + Math.sin(elapsed * 0.65) * 0.008;
      this.instructor.scale.y = 1 + Math.sin(elapsed * 1.6) * 0.001;
    }
  }
  dispose() {
    this.instances.forEach(instance => instance.dispose()); this.instances = []; this.moves = [];
    this.marker?.geometry.dispose(); this.marker?.material.dispose(); this.root.removeFromParent();
  }
}
