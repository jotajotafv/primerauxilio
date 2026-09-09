import { WebGLRenderer, SRGBColorSpace, ACESFilmicToneMapping, PCFSoftShadowMap } from 'three';
import { SETTINGS } from '../config/settings.js';

export class RendererManager {
  constructor(container, onResize, onError) {
    this.container = container;
    this.renderer = new WebGLRenderer({ antialias: window.devicePixelRatio < 2, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, SETTINGS.maxPixelRatio));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    const canvas = this.renderer.domElement;
    canvas.setAttribute('aria-label', 'Escena 3D interactiva. Las mismas acciones están disponibles en los controles del panel.');
    canvas.setAttribute('role', 'img');
    container.prepend(canvas);
    this.onLost = event => { event.preventDefault(); onError('Se ha interrumpido la vista 3D. Recarga para recuperarla.'); };
    canvas.addEventListener('webglcontextlost', this.onLost);
    this.observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      this.renderer.setSize(width, height);
      onResize(width, height);
    });
    this.observer.observe(container);
  }
  render(scene, camera) { this.renderer.render(scene, camera); }
  dispose() {
    this.observer.disconnect();
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onLost);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
