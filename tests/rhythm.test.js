import test from 'node:test';
import assert from 'node:assert/strict';
import { RhythmTracker } from '../src/modules/cpr/rhythm.js';

test('RCP reconoce ritmo correcto, lento y rápido sin contar rebotes', () => {
  const tracker = new RhythmTracker();
  assert.equal(tracker.press(0).count, 1);
  assert.equal(tracker.press(50), null);
  assert.equal(tracker.press(550).status, 'Buen ritmo');
  assert.equal(tracker.press(1100).rate, 109);
  tracker.reset(); tracker.press(0);
  assert.equal(tracker.press(900).status, 'Demasiado lento');
  tracker.reset(); tracker.press(0);
  assert.equal(tracker.press(300).status, 'Demasiado rápido');
  assert.equal(tracker.press(10000).status, 'Demasiado lento');
});
