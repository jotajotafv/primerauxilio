import { SETTINGS } from '../config/settings.js';

export class StateManager {
  constructor(storage) {
    this.available = true; this.data = {};
    try {
      this.storage = storage ?? globalThis.localStorage;
      const saved = JSON.parse(this.storage.getItem(SETTINGS.storageKey) || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        for (const [id, value] of Object.entries(saved)) if (value && ['started', 'completed'].includes(value.status)) this.data[id] = { status: value.status, step: Number.isInteger(value.step) && value.step >= 0 ? value.step : 0 };
      }
    } catch { this.available = false; }
  }
  get(id) { return this.data[id] || { status: 'available', step: 0 }; }
  percent(module) {
    const ids = module.variants ? module.variants.map((_, index) => `${module.id}:${index}`) : [module.id];
    return Math.round(ids.reduce((sum, id) => sum + Math.min(this.get(id).step / module.steps.length, 1), 0) / ids.length * 100);
  }
  update(id, step, completed = false) {
    const previous = this.get(id);
    this.data[id] = { status: completed || previous.status === 'completed' ? 'completed' : 'started', step: Math.max(previous.step, step) };
    this.save();
  }
  save() { try { this.storage.setItem(SETTINGS.storageKey, JSON.stringify(this.data)); } catch { this.available = false; } }
  reset() { this.data = {}; this.save(); }
}
