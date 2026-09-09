import { findNode } from './modelUtils.js';

export function prepareInstructor(root) {
  // Limited local rotations on verified bones soften the supplied open-arm rest pose.
  const left = findNode(root, 'upper_arm.L');
  const right = findNode(root, 'upper_arm.R');
  if (left?.isBone && right?.isBone) { left.rotation.z -= 0.34; right.rotation.z += 0.34; }
  root.updateMatrixWorld(true);
}
