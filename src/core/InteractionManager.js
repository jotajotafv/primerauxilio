import { Raycaster, Vector2, Color } from 'three';

const COLORS = { hover: 0x40c4d8, selected: 0x175c8c, correct: 0x22a67a, incorrect: 0xd94a4a };
export class InteractionManager {
  constructor(canvas, camera, onSelect) {
    this.canvas = canvas; this.camera = camera; this.onSelect = onSelect;
    this.raycaster = new Raycaster(); this.pointer = new Vector2(); this.items = []; this.originals = new Map();
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    canvas.addEventListener('pointermove', event => this.hover(this.pick(event)), options);
    canvas.addEventListener('pointerleave', () => this.hover(null), options);
    canvas.addEventListener('pointerdown', event => { this.down = [event.clientX, event.clientY]; }, options);
    canvas.addEventListener('pointerup', event => {
      if (!this.down || Math.hypot(event.clientX - this.down[0], event.clientY - this.down[1]) > 8) return;
      const item = this.pick(event);
      if (item && !item.disabled) this.onSelect(item.id);
      this.down = null;
    }, options);
  }
  set(items) { this.clear(); this.items = items.filter(item => item.object); }
  pick(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.items.filter(i => !i.disabled).map(i => i.object), true);
    for (const hit of hits) {
      let current = hit.object, visible = true;
      while (current) { if (!current.visible) visible = false; current = current.parent; }
      if (!visible) continue;
      const item = this.items.find(i => { let node = hit.object; while (node) { if (node === i.object) return true; node = node.parent; } return false; });
      if (item) return item;
    }
    return null;
  }
  state(item, state = 'normal') {
    item.disabled = state === 'disabled';
    item.object.traverse(node => {
      if (!node.isMesh) return;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (!this.originals.has(material)) this.originals.set(material, { emissive: material.emissive?.clone(), intensity: material.emissiveIntensity, opacity: material.opacity, transparent: material.transparent });
        const original = this.originals.get(material);
        if (material.emissive && original.emissive) {
          material.emissive.copy(original.emissive);
          material.emissiveIntensity = original.intensity;
          if (COLORS[state]) { material.emissive.lerp(new Color(COLORS[state]), 0.25); material.emissiveIntensity = 0.4; }
        }
      }
    });
  }
  hover(item) {
    if (this.hovered === item) return;
    if (this.hovered) this.state(this.hovered);
    this.hovered = item;
    if (item) this.state(item, 'hover');
    this.canvas.style.cursor = item ? 'pointer' : '';
  }
  clear() {
    this.hover(null);
    for (const [material, original] of this.originals) {
      if (original.emissive) material.emissive.copy(original.emissive);
      material.emissiveIntensity = original.intensity; material.opacity = original.opacity; material.transparent = original.transparent;
    }
    this.originals.clear(); this.items = [];
  }
  dispose() { this.clear(); this.abort.abort(); }
}
