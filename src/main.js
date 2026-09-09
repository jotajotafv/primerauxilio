import './styles/global.css';
import './styles/components.css';
import { App } from './core/App.js';
import { SETTINGS } from './config/settings.js';

const app = new App(document.querySelector('#app'));
app.start();
if (SETTINGS.debug) window.firstAidDebug = app;
if (import.meta.hot) import.meta.hot.dispose(() => { delete window.firstAidDebug; app.dispose(); });
