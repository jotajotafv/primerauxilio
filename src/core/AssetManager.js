import { LoadingManager, AnimationMixer, LoopOnce } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { assetUrl } from '../config/assets.js';
import { SETTINGS } from '../config/settings.js';
import { disposeInstance } from '../utils/modelUtils.js';

export class AssetManager {
  constructor(onProgress, onError) {
    this.cache = new Map();
    this.manager = new LoadingManager();
    this.manager.onProgress = (url, loaded, total) => onProgress(Math.round(loaded / total * 100));
    this.manager.onError = url => onError(`No se pudo cargar ${url.split('/').pop()}. Puedes volver a intentarlo.`);
    this.loader = new GLTFLoader(this.manager);
  }

  async load(id) {
    if (!this.cache.has(id)) {
      const promise = this.loader.loadAsync(assetUrl(id)).then(gltf => {
        if (SETTINGS.debug) console.info('[GLB]', id, gltf.scene.children, gltf.animations);
        return gltf;
      }).catch(error => {
        this.cache.delete(id);
        console.error(`[AssetManager] ${id}:`, error);
        throw error;
      });
      this.cache.set(id, promise);
    }
    return this.cache.get(id);
  }

  async instantiate(id) {
    const gltf = await this.load(id);
    const root = clone(gltf.scene);
    root.traverse(node => {
      if (!node.isMesh) return;
      node.material = Array.isArray(node.material) ? node.material.map(m => m.clone()) : node.material.clone();
    });
    const mixer = gltf.animations.length ? new AnimationMixer(root) : null;
    return {
      id, root, mixer, clips: gltf.animations,
      play: (pattern, { loop = false, speed = 1 } = {}) => {
        const clip = gltf.animations.find(clip => typeof pattern === 'string' ? clip.name === pattern : pattern.test(clip.name));
        if (!clip || !mixer) return null;
        const action = mixer.clipAction(clip);
        action.reset();
        action.timeScale = speed;
        if (!loop) { action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; }
        action.play();
        return action;
      },
      dispose: () => {
        if (mixer) { mixer.stopAllAction(); mixer.uncacheRoot(root); }
        disposeInstance(root);
      },
    };
  }

  async dispose() {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    for (const promise of this.cache.values()) {
      const gltf = await promise.catch(() => null);
      gltf?.scene.traverse(node => {
        if (!node.isMesh) return;
        geometries.add(node.geometry);
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          materials.add(material);
          Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
        }
      });
    }
    textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose());
    this.cache.clear();
  }
}
