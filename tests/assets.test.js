import fs from 'node:fs';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSETS } from '../src/config/assets.js';

test('Los 20 GLB conservan sus nombres, contenido y referencias internas', () => {
  const report = JSON.parse(fs.readFileSync('docs/model-inspection.json', 'utf8'));
  assert.equal(Object.keys(ASSETS).length, 20);
  for (const [id, filename] of Object.entries(ASSETS)) {
    const bytes = fs.readFileSync(`public/models/${filename}`);
    assert.equal(bytes.subarray(0, 4).toString(), 'glTF');
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), report.find(asset => asset.id === id).sha256);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    assert.ok(json.scenes.length);
    assert.ok(!json.extensionsRequired?.includes('KHR_draco_mesh_compression'));
    assert.ok(!json.buffers.some(buffer => buffer.uri && !buffer.uri.startsWith('data:')));
  }
});
