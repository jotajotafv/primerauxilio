import fs from 'node:fs';
import crypto from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3, Texture } from 'three';
import { ASSETS } from '../src/config/assets.js';

const loader = new GLTFLoader();
// Bounds inspection is headless; the browser validates embedded image decoding.
loader.register(() => ({ name: 'HEADLESS_TEXTURE_INSPECTION', loadTexture: () => Promise.resolve(new Texture()) }));
const report = [];
for (const [id, filename] of Object.entries(ASSETS)) {
  const data = fs.readFileSync(new URL(`../public/models/${filename}`, import.meta.url));
  const json = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
  const gltf = await loader.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
  const nodes = [];
  const studioNodes = [];
  gltf.scene.traverse(node => { if (/^studio_/i.test(node.name)) studioNodes.push(node); });
  studioNodes.forEach(node => node.removeFromParent());
  gltf.scene.traverse(node => {
    if (!node.isBone) {
      const box = new Box3().setFromObject(node);
      nodes.push({ name: node.name, type: node.type, min: box.min.toArray(), max: box.max.toArray() });
    }
  });
  const box = new Box3().setFromObject(gltf.scene);
  const entry = { id, filename, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex'), extensions: json.extensionsUsed ?? [], skins: json.skins?.length ?? 0, roots: gltf.scene.children.map(n => n.name), size: box.getSize(new Vector3()).toArray(), min: box.min.toArray(), max: box.max.toArray(), animations: gltf.animations.map(a => ({ name: a.name, duration: a.duration, tracks: a.tracks.map(t=>t.name) })), materials: (json.materials ?? []).map(m=>({name:m.name,alphaMode:m.alphaMode})), nodes };
  report.push(entry);
  console.log(`${id}: ${entry.size.map(n=>n.toFixed(2)).join(' × ')}; ${entry.animations.map(a=>a.name).join(', ') || 'sin animación'}`);
}
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/model-inspection.json', JSON.stringify(report, null, 2));
