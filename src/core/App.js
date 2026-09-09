import { AssetManager } from './AssetManager.js';
import { RendererManager } from './RendererManager.js';
import { CameraManager } from './CameraManager.js';
import { InteractionManager } from './InteractionManager.js';
import { SceneManager } from './SceneManager.js';
import { StateManager } from './StateManager.js';
import { AudioManager } from './AudioManager.js';
import { UIManager } from '../ui/UIManager.js';
import { getModule, EQUIPMENT } from '../config/modules.js';
import { RhythmTracker } from '../modules/cpr/rhythm.js';
import { SETTINGS } from '../config/settings.js';

export class App {
  constructor(root) {
    this.state = new StateManager(); this.audio = new AudioManager(); this.routeVersion = 0; this.elapsed = 0;
    this.ui = new UIManager(root, this.state, (action, value) => this.action(action, value));
    this.assets = new AssetManager(value => this.ui.progress(value), message => this.ui.toast(message));
    this.camera = new CameraManager();
    this.abort = new AbortController();
    if (SETTINGS.debug) {
      this.debugPanel = document.createElement('pre'); this.debugPanel.className = 'debug-panel'; this.ui.viewer.append(this.debugPanel);
    }
  }
  async start() {
    try {
      this.renderer = new RendererManager(this.ui.viewer, (w, h) => this.camera.resize(w, h), message => this.ui.error(message, true));
      this.camera.attach(this.renderer.renderer.domElement);
      this.interaction = new InteractionManager(this.renderer.renderer.domElement, this.camera.camera, id => this.interact(id));
      this.scenes = new SceneManager(this.assets, this.camera, this.interaction);
      window.addEventListener('hashchange', () => this.route(), { signal: this.abort.signal });
      window.addEventListener('keydown', event => {
        if (event.code !== 'Space' || event.repeat || this.ui.dialog.open || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(event.target.tagName)) return;
        if (this.session?.phase === 'practice' && this.currentStep?.effect === 'compress' && !this.loading) { event.preventDefault(); this.interact('chest'); }
      }, { signal: this.abort.signal });
      this.tick = this.tick.bind(this); this.frame = requestAnimationFrame(this.tick);
      await this.route(true);
    } catch (error) { console.error('[App]', error); this.ui.error('Este dispositivo no pudo iniciar WebGL. Prueba un navegador actualizado con aceleración gráfica.', true); }
  }
  get currentStep() { return this.session?.module.steps[this.session.stepIndex]; }
  async route(initial = false, variant = 0) {
    const version = ++this.routeVersion;
    const hash = location.hash.slice(1), id = hash.startsWith('module/') ? hash.split('/')[1] : null;
    const module = getModule(id);
    this.loading = true; this.session = null; this.ui.loading(true, initial);
    try {
      if (module) {
        this.state.update(module.id, 0);
        const session = { module, variant, phase: 'explanation', stepIndex: 0, acknowledged: false, visited: new Set(), rhythm: new RhythmTracker() };
        this.ui.module(session);
        const shown = await this.scenes.showModule(module, variant);
        if (version !== this.routeVersion || !shown) return;
        this.session = session;
      } else {
        if (hash === 'hub') this.ui.hub(); else this.ui.landing();
        const shown = await this.scenes.showHub();
        if (version !== this.routeVersion || !shown) return;
      }
      this.loading = false; this.ui.ready();
      this.ui.panel.scrollTop = 0;
      if (!initial) {
        const heading = this.ui.panel.querySelector('h1');
        heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true });
      }
    } catch (error) {
      if (version !== this.routeVersion) return;
      this.loading = false; console.error('[SceneManager]', error); this.ui.error(error.message);
    }
  }
  action(action, value) {
    if (action === 'sources') return this.ui.sources();
    if (action === 'module-sources') return this.ui.sources(this.session?.module);
    if (action === 'close-dialog') return this.ui.dialog.close();
    if (action === 'reload') return location.reload();
    if (action === 'retry') return this.route();
    if (action === 'reset-progress') return this.ui.openDialog('<span class="eyebrow">PROGRESO LOCAL</span><h2 id="dialog-title">¿Reiniciar tu recorrido?</h2><p>Se eliminará el progreso de los siete módulos en este dispositivo.</p><div class="dialog-actions"><button class="button secondary" data-action="close-dialog">Conservar progreso</button><button class="button primary" data-action="confirm-reset">Reiniciar progreso</button></div>');
    if (action === 'confirm-reset') { this.state.reset(); this.ui.dialog.close(); this.ui.hub(); return; }
    if (this.loading || !this.scenes?.current) return;
    if (action === 'camera-reset') { this.scenes.homeCamera(); this.ui.root.querySelector('[data-action="orbit"]').setAttribute('aria-pressed', 'false'); return; }
    if (action === 'orbit') {
      const enabled = this.camera.toggleOrbit(); this.ui.root.querySelector('[data-action="orbit"]').setAttribute('aria-pressed', String(enabled));
      return this.ui.toast(enabled ? 'Arrastra para girar. Usa la rueda o dos dedos para acercar.' : 'Cámara dirigida activada.');
    }
    if (!this.session) return;
    if (action === 'variant') return this.route(false, Number(value) === 1 ? 1 : 0);
    if (action === 'start-demo' || action === 'start-practice') {
      Object.assign(this.session, { phase: action === 'start-demo' ? 'demo' : 'practice', stepIndex: 0, acknowledged: false, visited: new Set(), selected: null });
      this.session.rhythm.reset(); this.scenes.current.reset(); this.scenes.homeCamera(); this.ui.module(this.session);
      this.prepareStep();
      if (this.session.phase === 'demo') this.demonstrate();
      return;
    }
    if (action === 'demo-next') {
      if (this.session.phase !== 'demo') return;
      if (this.session.stepIndex === this.session.module.steps.length - 1) this.session.phase = 'demo-end';
      else this.session.stepIndex++;
      this.ui.module(this.session);
      this.prepareStep();
      if (this.session.phase === 'demo') this.demonstrate();
    }
    if (action === 'interact') this.interact(value);
    if (action === 'next-step') this.nextStep();
    if (action === 'rescue') {
      this.camera.frame(this.scenes.current.focus('cprMask'), 'closeup');
      this.ui.openDialog('<span class="eyebrow">DEMOSTRACIÓN EDUCATIVA OPCIONAL</span><h2 id="dialog-title">Ventilaciones de rescate</h2><p>Si tienes formación y puedes hacerlo: alterna 30 compresiones con 2 ventilaciones. Abre la vía aérea, sella correctamente e insufla solo hasta que el pecho comience a elevarse. Evita interrupciones prolongadas.</p><p>Si no puedes dar ventilaciones, continúa las compresiones y sigue al operador. Usa el DEA en cuanto esté disponible.</p><p class="scope-note">La mascarilla se muestra como referencia del material. El sellado y la técnica requieren enseñanza presencial.</p>');
    }
  }
  demonstrate() {
    this.scenes.current.apply(this.currentStep.effect);
    this.annotate();
    if (this.currentStep.effect === 'compress') this.demoPulseAt = this.elapsed + 0.55;
  }
  prepareStep() {
    this.interaction.set(this.scenes.current.items());
    const active = ['practice', 'demo'].includes(this.session.phase);
    this.scenes.current.highlight(active ? this.currentStep.target : null);
    if (!active) return;
    if (this.currentStep.effect === 'compress') this.camera.frame(this.scenes.current.main, 'practice');
    else if (this.currentStep.target === 'help') this.camera.frame(this.scenes.current.instructor, 'closeup');
    else this.scenes.homeCamera();
    if (this.session.phase === 'demo') {
      const item = this.interaction.items.find(item => item.id === this.currentStep.target);
      if (item) this.interaction.state(item, 'selected');
    }
  }
  annotate() {
    const effect = this.currentStep.effect;
    const labels = { water: 'Agua corriente fresca · 20 minutos reales', cover: 'Cobertura limpia, suelta y no adherente', backblows: 'Hasta 5 golpes entre los omóplatos · comprobar cada vez', thrust: 'Hacia dentro y arriba · hasta 5 compresiones', locate: 'Mitad inferior del esternón', pressure: 'Mantén presión directa y continua', splint: 'Soporte esquemático · sin forzar la extremidad', bandage: 'Sujeción esquemática · vigila la circulación' };
    this.ui.annotation(labels[effect] || '', effect === 'water' ? 'water' : '');
  }
  interact(id) {
    if (this.loading || !this.session) return;
    const session = this.session, step = this.currentStep;
    if (session.phase !== 'practice') return this.ui.toast('Observa primero la demostración y entra en la práctica para interactuar.');
    if (session.module.id === 'kit' && session.stepIndex === 1 && EQUIPMENT[id]) {
      session.visited.add(id); session.selected = id;
      this.ui.module(session); this.ui.equipment(id);
      this.scenes.current.highlight(null);
      this.camera.frame(this.scenes.current.focus(id), 'closeup');
      return;
    }
    if (session.acknowledged) return;
    if (id !== step.target) {
      this.ui.feedback(session.module.id === 'burns' && id === 'coldPack' ? 'La compresa fría no se aplica a una quemadura. Utiliza agua corriente fresca.' : `En este paso: ${step.action.toLowerCase()}.`);
      const item = this.interaction.items.find(item => item.id === id); if (item) this.interaction.state(item, 'incorrect');
      return;
    }
    if (step.effect === 'compress') {
      const result = session.rhythm.press(performance.now());
      if (!result) return;
      this.scenes.current.apply('compress'); this.ui.rhythm(result);
      if (result.count < SETTINGS.cpr.practiceCount) {
        this.ui.feedback(result.status, result.status === 'Buen ritmo'); return;
      }
    } else this.scenes.current.apply(step.effect);
    session.acknowledged = true;
    this.ui.module(session); this.annotate();
    const item = this.interaction.items.find(item => item.id === id);
    if (item) this.interaction.state(item, 'correct');
    if (step.effect === 'compress') this.ui.rhythm({ count: session.rhythm.count, status: 'Serie de práctica registrada' });
    this.ui.panel.querySelector('[data-action="next-step"]')?.focus({ preventScroll: true });
  }
  nextStep() {
    const session = this.session;
    if (session.phase !== 'practice' || !(session.acknowledged || session.module.id === 'kit' && session.visited.size === 7)) return;
    const total = session.module.steps.length;
    this.state.update(session.module.id, session.stepIndex + 1);
    if (session.module.variants) this.state.update(`${session.module.id}:${session.variant}`, session.stepIndex + 1);
    if (session.stepIndex === total - 1) {
      session.phase = 'complete';
      if (session.module.variants) {
        this.state.update(`${session.module.id}:${session.variant}`, total, true);
        if (this.state.get(`${session.module.id}:${1 - session.variant}`).status === 'completed') this.state.update(session.module.id, total, true);
      } else this.state.update(session.module.id, total, true);
      this.scenes.homeCamera();
    } else { session.stepIndex++; session.acknowledged = false; }
    this.ui.module(session);
    this.prepareStep();
    const heading = this.ui.panel.querySelector('.instruction h2, .result-panel h2');
    heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true });
  }
  tick(time) {
    const frameDelta = this.lastTime ? (time - this.lastTime) / 1000 : 0;
    const delta = Math.min(frameDelta, 0.05); this.lastTime = time;
    if (!document.hidden) {
      this.elapsed += delta; this.camera.update(delta); this.scenes.update(delta, this.elapsed);
      if (this.session?.phase === 'demo' && this.currentStep?.effect === 'compress' && this.elapsed >= this.demoPulseAt) {
        this.scenes.current.apply('compress'); this.demoPulseAt = this.elapsed + 60 / 110;
      }
      this.renderer.render(this.scenes.scene, this.camera.camera);
      if (this.debugPanel && this.elapsed >= (this.nextDebugTime || 0)) {
        this.nextDebugTime = this.elapsed + 0.5;
        const info = this.renderer.renderer.info, position = this.camera.camera.position;
        this.debugPanel.textContent = `FPS aprox.: ${Math.round(1 / Math.max(frameDelta, 0.001))}\nDraw calls: ${info.render.calls} · Triángulos: ${info.render.triangles}\nGeometrías: ${info.memory.geometries} · Texturas: ${info.memory.textures}\nCámara: ${position.toArray().map(n => n.toFixed(2)).join(', ')}\nSelección: ${this.interaction.hovered?.object.name || '—'}`;
      }
    }
    this.frame = requestAnimationFrame(this.tick);
  }
  dispose() {
    this.routeVersion++;
    cancelAnimationFrame(this.frame); this.abort.abort(); this.ui.dispose(); this.scenes?.dispose();
    this.interaction?.dispose(); this.camera.controls && this.camera.dispose(); this.renderer?.dispose(); this.audio.dispose(); this.assets.dispose();
  }
}
