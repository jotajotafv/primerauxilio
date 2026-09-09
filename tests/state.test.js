import test from 'node:test';
import assert from 'node:assert/strict';
import { StateManager } from '../src/core/StateManager.js';

const memory = () => ({ value: null, getItem() { return this.value; }, setItem(key, value) { this.value = value; } });
test('El progreso persiste sin retroceder al repetir un módulo', () => {
  const storage = memory(), state = new StateManager(storage);
  state.update('intro', 2); state.update('intro', 5, true); state.update('intro', 0);
  assert.deepEqual(new StateManager(storage).get('intro'), { status: 'completed', step: 5 });
  state.reset(); assert.equal(new StateManager(storage).get('intro').status, 'available');
});
test('El almacenamiento corrupto o bloqueado no rompe el entrenamiento', () => {
  const storage = memory(); storage.value = '{broken';
  const state = new StateManager(storage); state.update('cpr', 1);
  assert.equal(state.get('cpr').step, 1);
  const blocked = new StateManager({ getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } });
  blocked.update('kit', 1, true);
  assert.equal(blocked.get('kit').status, 'completed'); assert.equal(blocked.available, false);
});

test('El porcentaje de extremidades incluye los dos escenarios', () => {
  const state = new StateManager(memory());
  const module = { id: 'fractures', variants: ['Brazo', 'Pierna'], steps: [1, 2, 3, 4] };
  state.update('fractures:0', 4, true);
  assert.equal(state.percent(module), 50);
  state.update('fractures:1', 2);
  assert.equal(state.percent(module), 75);
  state.update('fractures:1', 4, true);
  assert.equal(state.percent(module), 100);
});
