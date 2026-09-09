export class AudioManager {
  constructor() { this.muted = true; this.tracks = new Map(); }
  register(id, url) { this.tracks.set(id, new Audio(url)); }
  async play(id) {
    if (this.muted || !this.tracks.has(id)) return;
    try { await this.tracks.get(id).play(); } catch (error) { console.warn('[AudioManager] Reproducción no disponible:', error.message); }
  }
  setMuted(muted) { this.muted = muted; this.tracks.forEach(track => { track.muted = muted; }); }
  dispose() { this.tracks.forEach(track => { track.pause(); track.removeAttribute('src'); track.load(); }); this.tracks.clear(); }
}
