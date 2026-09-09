import { MODULES, EQUIPMENT, SOURCES } from '../config/modules.js';
import { icon } from './icons.js';

export class UIManager {
  constructor(root, state, onAction) {
    this.root = root; this.state = state; this.onAction = onAction;
    root.innerHTML = `
      <header class="app-header">
        <a class="brand" href="#landing" aria-label="First Aid, inicio"><span class="brand-symbol">${icon('plus')}</span><span>FIRST AID<small>3D EXPERIENCE</small></span></a>
        <nav class="header-nav" aria-label="Navegación principal"><a href="#hub">${icon('home')}<span>Sala de entrenamiento</span></a><button data-action="sources">${icon('info')}<span>Acerca de</span></button></nav>
        <span class="header-label">APRENDE. PRACTICA. ACTÚA.</span>
      </header>
      <main id="main-content" class="workspace" tabindex="-1">
        <section class="panel" id="panel" aria-label="Guía de entrenamiento"></section>
        <section class="viewer" id="viewer" aria-label="Experiencia tridimensional">
          <div class="view-heading"><div><span class="eyebrow" id="scene-kicker">ENTORNO DE APRENDIZAJE</span><h2 id="scene-title">Tu sala de entrenamiento</h2></div><span class="view-badge">${icon('scan')} 3D INTERACTIVO</span></div>
          <div class="scene-annotation" id="annotation" hidden></div>
          <div class="rhythm-hud" id="rhythm" hidden aria-live="off"></div>
          <aside class="equipment-detail" id="equipment-detail" hidden></aside>
          <div class="viewer-bottom"><aside class="instructor-note"><span class="instructor-mark">${icon('plus')}</span><div><span class="eyebrow">TU INSTRUCTOR</span><p id="instructor-text">Aquí empieza tu preparación. Avanza a tu ritmo.</p></div></aside>
            <div class="view-controls" aria-label="Controles de cámara"><button data-action="orbit" aria-label="Activar exploración de cámara" aria-pressed="false" title="Explorar vista">${icon('orbit')}</button><button data-action="camera-reset" aria-label="Restablecer cámara" title="Restablecer cámara">${icon('scan')}</button></div>
          </div>
          <div class="scene-loader" id="scene-loader" hidden><span class="eyebrow">PREPARANDO EXPERIENCIA</span><strong id="loading-label">Preparando entorno 3D</strong><progress max="100" value="0" aria-label="Progreso de carga"></progress><span id="loading-value">0%</span></div>
        </section>
      </main>
      <footer class="app-footer"><span>${icon('info')} Contenido educativo. No sustituye formación certificada ni atención médica profesional.</span><button data-action="sources">Fuentes y alcance ${icon('arrow')}</button></footer>
      <div class="toast" id="toast" role="status" hidden></div>
      <dialog id="app-dialog" aria-labelledby="dialog-title"></dialog>
      <div class="initial-loader" id="initial-loader"><div class="loader-brand">${icon('plus')}<h1>FIRST AID<small>3D EXPERIENCE</small></h1><p>Preparando entorno 3D</p><progress max="100" value="0" aria-label="Carga inicial"></progress><span class="initial-value">0%</span></div></div>`;
    this.panel = root.querySelector('#panel'); this.viewer = root.querySelector('#viewer'); this.dialog = root.querySelector('dialog');
    this.abort = new AbortController();
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (button && !button.disabled) onAction(button.dataset.action, button.dataset.value);
    }, { signal: this.abort.signal });
    this.dialog.addEventListener('click', event => { if (event.target === this.dialog) this.dialog.close(); }, { signal: this.abort.signal });
  }
  loading(show, initial = false) {
    this.root.querySelector('#scene-loader').hidden = !show;
    this.viewer.setAttribute('aria-busy', String(show));
    if (show) this.progress(0);
    if (!initial) this.root.querySelector('#initial-loader')?.remove();
  }
  progress(value) {
    this.root.querySelectorAll('progress').forEach(progress => { progress.value = value; });
    this.root.querySelectorAll('#loading-value, .initial-value').forEach(label => { label.textContent = `${value}%`; });
  }
  ready() { this.loading(false); }
  context(kicker, title, note) {
    this.root.querySelector('#scene-kicker').textContent = kicker;
    this.root.querySelector('#scene-title').textContent = title;
    this.root.querySelector('#instructor-text').textContent = note;
    this.root.querySelector('#annotation').hidden = true;
    this.root.querySelector('#rhythm').hidden = true;
    this.root.querySelector('#equipment-detail').hidden = true;
    const orbit = this.root.querySelector('[data-action="orbit"]');
    orbit.setAttribute('aria-pressed', 'false');
  }
  landing() {
    this.root.querySelector('.workspace').className = 'workspace is-landing';
    this.context('ESPACIO DE APRENDIZAJE · 01', 'Tu sala de entrenamiento', 'No necesitas experiencia previa. Empezaremos por lo esencial.');
    this.panel.innerHTML = `<div class="landing-copy"><span class="eyebrow section-tag"><i></i> PREPÁRATE PARA AYUDAR</span><h1>FIRST AID<span>3D EXPERIENCE</span></h1><p class="landing-motto">Aprende. Practica.<br><em>Actúa.</em></p><p class="landing-description">Comprende los procedimientos esenciales de primeros auxilios mediante demostraciones y práctica en 3D.</p><a class="button primary start-button" href="#hub">COMENZAR ENTRENAMIENTO ${icon('arrow')}</a><div class="entry-meta"><span>${icon('clock')} A tu ritmo</span><span>${icon('scan')} Interactivo en 3D</span></div></div><div class="landing-index"><span><strong>07</strong> módulos guiados</span><span class="entry-rule"></span><span>Una habilidad que<br>puede marcar la diferencia.</span></div>`;
  }
  hub() {
    this.root.querySelector('.workspace').className = 'workspace is-hub';
    this.context('SALA DE ENTRENAMIENTO', 'Un espacio para aprender a actuar', 'Empieza por Introducción o elige el procedimiento que quieras practicar.');
    const completed = MODULES.filter(m => this.state.get(m.id).status === 'completed').length;
    this.panel.innerHTML = `<div class="panel-heading"><span class="eyebrow">TU RECORRIDO</span><h1>Entrenamiento</h1><p>Elige un módulo para comenzar.</p></div><div class="overall-progress"><span>Tu progreso <strong>${completed} de 7</strong></span><div class="progress-track"><span style="width:${completed / 7 * 100}%"></span></div></div><nav class="module-list" aria-label="Módulos de entrenamiento">${MODULES.map(m => {
      const progress = this.state.get(m.id), done = progress.status === 'completed', percent = this.state.percent(m);
      return `<a href="#module/${m.id}" class="module-row ${done ? 'completed' : ''}"><span class="module-number">${m.number}</span><span class="module-icon">${icon(m.icon)}</span><span class="module-row-copy"><strong>${m.name}</strong><span>${m.description}</span><small>${done ? 'Completado' : progress.status === 'started' ? 'En progreso' : 'Disponible'} <b>·</b> ${m.duration}${!done && percent ? ` · ${percent}%` : ''}</small></span>${icon(done ? 'check' : 'arrow')}</a>`;
    }).join('')}</nav><div class="panel-bottom"><span>${this.state.available ? 'Progreso guardado en este dispositivo' : 'Progreso disponible solo en esta sesión'}</span><button class="text-button" data-action="reset-progress">Reiniciar progreso</button></div>`;
  }
  module(session) {
    const { module: m, phase, stepIndex, variant, acknowledged } = session;
    this.root.querySelector('.workspace').className = 'workspace is-module';
    const step = m.steps[stepIndex];
    this.context(`MÓDULO ${m.number} · ${m.category}`, m.name + (m.variants ? ` · ${m.variants[variant]}` : ''), phase === 'explanation' ? 'Primero observa la demostración. Después podrás practicar cada paso.' : phase === 'demo' ? 'Observa la escena y avanza cuando estés listo.' : phase === 'complete' ? 'Lleva lo aprendido a una formación práctica supervisada.' : 'Ahora es tu turno. Selecciona la zona o el material indicado.');
    const variants = m.variants ? `<div class="variant-switch" role="group" aria-label="Escenario">${m.variants.map((v, i) => `<button data-action="variant" data-value="${i}" aria-pressed="${variant === i}">${v}${this.state.get(`${m.id}:${i}`).status === 'completed' ? ` ${icon('check')}` : ''}</button>`).join('')}</div>` : '';
    const header = `<a class="back-link" href="#hub">${icon('back')} Sala de entrenamiento</a><div class="module-heading"><span class="eyebrow">MÓDULO ${m.number} <span> / 07</span></span><h1>${m.name}</h1>${variants}</div><ol class="phase-indicator" aria-label="Fases"><li class="${phase === 'explanation' ? 'active' : ''}">01 <span>Comprende</span></li><li class="${phase === 'demo' || phase === 'demo-end' ? 'active' : ''}">02 <span>Observa</span></li><li class="${phase === 'practice' || phase === 'complete' ? 'active' : ''}">03 <span>Practica</span></li></ol>`;
    let content;
    if (phase === 'explanation') content = `<div class="lesson-intro"><span class="large-module-icon">${icon(m.icon)}</span><h2>${m.objective}</h2><p>${m.description}</p><div class="lesson-meta"><span>${icon('clock')} ${m.duration} aprox.</span><span>${m.steps.length} pasos</span></div><div class="scope-note">Escenario educativo de primeros auxilios en adultos.</div><button class="button primary" data-action="start-demo">Ver demostración ${icon('play')}</button></div>`;
    else if (phase === 'demo-end') content = `<div class="result-panel"><span class="large-module-icon">${icon('check')}</span><span class="eyebrow">DEMOSTRACIÓN FINALIZADA</span><h2>Ahora, ponlo en práctica.</h2><p>Repite la secuencia utilizando los objetos de la escena o los controles del panel.</p><button class="button primary" data-action="start-practice">Comenzar práctica ${icon('arrow')}</button><button class="button secondary" data-action="start-demo">Volver a observar</button></div>`;
    else if (phase === 'complete') {
      const other = m.variants && this.state.get(`${m.id}:${1 - variant}`).status !== 'completed';
      content = `<div class="result-panel"><span class="completion-symbol">${icon('check')}</span><span class="eyebrow">PRÁCTICA FINALIZADA</span><h2>${other ? 'Escenario completado.' : 'Un paso más para estar preparado.'}</h2><p>${m.takeaway}</p>${m.id === 'cpr' ? `<div class="result-stat"><strong>${session.rhythm.count}</strong><span>pulsaciones registradas<br>Práctica de secuencia y ritmo</span></div><button class="button secondary" data-action="rescue">Ver ventilaciones opcionales</button>` : ''}${other ? `<button class="button primary" data-action="variant" data-value="${1 - variant}">Practicar ${m.variants[1 - variant].toLowerCase()} ${icon('arrow')}</button>` : `<a href="#hub" class="button primary">Volver a la sala ${icon('arrow')}</a>`}<button class="text-button" data-action="start-practice">Repetir práctica</button></div>`;
    } else {
      content = `<div class="step-header"><span class="eyebrow">${phase === 'demo' ? 'DEMOSTRACIÓN' : 'PRÁCTICA GUIADA'}</span><span>${String(stepIndex + 1).padStart(2, '0')} / ${String(m.steps.length).padStart(2, '0')}</span></div><ol class="step-track">${m.steps.map((s, i) => `<li class="${i === stepIndex ? 'current' : i < stepIndex ? 'done' : ''}"><span>${i < stepIndex ? icon('check') : i + 1}</span><span>${s.title}</span></li>`).join('')}</ol><div class="instruction"><h2>${step.title}</h2><p>${step.text}</p>${m.id === 'kit' && stepIndex === 1 ? this.equipmentList(session) : ''}<div id="step-feedback" class="step-feedback ${acknowledged ? 'correct' : ''}" role="status">${acknowledged ? `${icon('check')} Paso registrado. Puedes continuar.` : ' '}</div>${phase === 'demo' ? `<button class="button primary" data-action="demo-next">${stepIndex === m.steps.length - 1 ? 'Pasar a la práctica' : 'Siguiente paso'} ${icon('arrow')}</button>` : m.id === 'kit' && stepIndex === 1 ? `<button class="button primary" data-action="next-step" ${session.visited.size < 7 ? 'disabled' : ''}>Finalizar exploración ${icon('check')}</button>` : `<button class="button ${acknowledged ? 'secondary' : 'primary'}" data-action="interact" data-value="${step.target}" ${acknowledged ? 'disabled' : ''}>${step.action} ${icon(step.effect === 'compress' ? 'pulse' : 'arrow')}</button>${step.effect === 'compress' ? '<span class="keyboard-hint">Clic en el pecho, botón o tecla Espacio · 30 pulsaciones</span>' : '<span class="keyboard-hint">Usa este botón o selecciona el objeto en 3D.</span>'}${acknowledged ? `<button class="button primary next-step" data-action="next-step">${stepIndex === m.steps.length - 1 ? 'Finalizar práctica' : 'Continuar'} ${icon('arrow')}</button>` : ''}`}</div>`;
    }
    this.panel.innerHTML = `${header}${content}<div class="module-source"><button data-action="module-sources">${icon('info')} Fuentes y consideraciones</button></div>`;
    if (phase === 'practice' && step.effect === 'compress') this.rhythm(session.rhythm);
    if (phase === 'practice' && m.id === 'kit' && session.selected) this.equipment(session.selected);
  }
  equipmentList(session) {
    return `<div class="equipment-list">${Object.entries(EQUIPMENT).map(([id, item]) => `<button data-action="interact" data-value="${id}" class="${session.selected === id ? 'selected' : ''}">${item.name}${session.visited.has(id) ? icon('check') : icon('arrow')}</button>`).join('')}</div><span class="keyboard-hint">${session.visited.size} de 7 objetos explorados</span>`;
  }
  equipment(id) {
    const item = EQUIPMENT[id], panel = this.root.querySelector('#equipment-detail');
    panel.hidden = false; panel.innerHTML = `<span class="eyebrow">MATERIAL DEL BOTIQUÍN</span><h3>${item.name}</h3><p>${item.purpose}</p><small>${item.example}</small>`;
  }
  rhythm(result) {
    const hud = this.root.querySelector('#rhythm'); hud.hidden = false;
    hud.innerHTML = `<div><strong>${String(result.count || 0).padStart(2, '0')}</strong><span> / 30 pulsaciones</span></div><div class="rhythm-rate"><strong>${result.rate ?? '—'}</strong><span>por minuto</span></div><span class="rhythm-status ${result.status === 'Buen ritmo' ? 'good' : ''}">${result.status || 'Encuentra el ritmo'}<small>Referencia: 100–120 / min</small></span>`;
  }
  annotation(text, type = '') {
    const element = this.root.querySelector('#annotation'); element.textContent = text; element.className = `scene-annotation ${type}`; element.hidden = !text;
  }
  feedback(text, correct = false) {
    const element = this.root.querySelector('#step-feedback');
    if (element) { element.textContent = text; element.className = `step-feedback ${correct ? 'correct' : 'attention'}`; }
  }
  toast(text) {
    const element = this.root.querySelector('#toast'); element.textContent = text; element.hidden = false;
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { element.hidden = true; }, 5000);
  }
  error(message, fatal = false) {
    this.ready();
    this.panel.innerHTML = `<div class="error-panel">${icon('info')}<span class="eyebrow">VISTA NO DISPONIBLE</span><h1>No pudimos preparar la escena.</h1><p id="error-description"></p><button class="button primary" data-action="${fatal ? 'reload' : 'retry'}">Volver a intentar ${icon('reset')}</button><a class="button secondary" href="#hub">Volver a la sala</a></div>`;
    this.panel.querySelector('#error-description').textContent = message;
  }
  sources(module) {
    const sources = module ? module.sources.map(index => SOURCES[index]) : SOURCES;
    this.openDialog(`<span class="eyebrow">ALCANCE EDUCATIVO</span><h2 id="dialog-title">${module ? module.name : 'Aprender para estar preparado'}</h2><p>Esta experiencia es educativa y no sustituye formación certificada ni atención médica profesional. Las interacciones son representaciones de secuencia; no evalúan habilidades clínicas.</p>${module ? `<p class="scope-note">${module.takeaway}</p>` : '<p>Escenarios generales para adultos. En una emergencia real, contacta los servicios locales y sigue al operador. Los números de emergencia de las fuentes británicas deben adaptarse a tu país.</p>'}<h3>Fuentes de consulta</h3><ul class="source-list">${sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ${icon('arrow')}</a></li>`).join('')}</ul><small>Contenido revisado el 9 de septiembre de 2026. No constituye certificación ni aval de las entidades citadas.</small>`);
  }
  openDialog(content) {
    this.dialog.innerHTML = `<button class="dialog-close" data-action="close-dialog" aria-label="Cerrar">${icon('close')}</button>${content}`;
    this.dialog.showModal();
  }
  dispose() { this.abort.abort(); clearTimeout(this.toastTimer); }
}
