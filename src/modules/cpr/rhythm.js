import { SETTINGS } from '../../config/settings.js';

export class RhythmTracker {
  constructor() { this.reset(); }
  reset() { this.count = 0; this.last = null; this.intervals = []; this.good = 0; }
  press(time) {
    if (this.last !== null && time - this.last < 180) return null;
    let rate = null, status = 'Comienza a marcar el ritmo';
    if (this.last !== null) {
      const interval = time - this.last;
      this.intervals.push(interval);
      const recent = this.intervals.slice(-4);
      rate = Math.round(60000 / (recent.reduce((a, b) => a + b, 0) / recent.length));
      status = rate < SETTINGS.cpr.minRate ? 'Demasiado lento' : rate > SETTINGS.cpr.maxRate ? 'Demasiado rápido' : 'Buen ritmo';
      if (status === 'Buen ritmo') this.good++;
    }
    this.last = time; this.count++;
    return { count: this.count, rate, status, good: this.good };
  }
}
