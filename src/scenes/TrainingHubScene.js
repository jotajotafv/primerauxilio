import { Group } from 'three';
import { prepareModel, setVisible } from '../utils/modelUtils.js';
import { prepareInstructor } from '../utils/instructorUtils.js';

export class TrainingHubScene {
  constructor(assets) { this.assets = assets; this.root = new Group(); this.instances = []; }
  async build() {
    const results = await Promise.allSettled(['trainingRoom', 'instructor', 'stretcher'].map(async id => {
      const instance = await this.assets.instantiate(id);
      this.instances.push(instance);
      return instance;
    }));
    const [room, instructor, stretcher] = results.map(result => result.status === 'fulfilled' ? result.value : null);
    if (!room) { this.dispose(); throw new Error('La sala de entrenamiento no está disponible. Vuelve a intentarlo.'); }
    // Architectural cutaway: remove only the two camera-facing walls and ceiling at runtime.
    setVisible(room.root, /^ENV_(Ceiling|Room_Wall_B|Room_Wall_D)$/, false);
    this.root.add(room.root);
    if (instructor) {
      prepareInstructor(instructor.root);
      this.instructor = prepareModel(instructor.root, { size: 1.8, axis: 'y' });
      this.instructor.position.set(-0.35, 0.01, 0.1);
      this.instructor.rotation.y = 0.3;
      this.root.add(this.instructor);
    }
    if (stretcher) {
      const model = prepareModel(stretcher.root);
      model.position.set(-2.65, 0.01, 0.3);
      model.rotation.y = Math.PI / 2;
      this.root.add(model);
    }
    return this;
  }
  update(delta, elapsed, reduced) {
    this.instances.forEach(instance => instance.mixer?.update(delta));
    if (this.instructor && !reduced) this.instructor.rotation.y = 0.3 + Math.sin(elapsed * 0.65) * 0.009;
  }
  dispose() { this.instances.forEach(instance => instance.dispose()); this.root.removeFromParent(); }
}
