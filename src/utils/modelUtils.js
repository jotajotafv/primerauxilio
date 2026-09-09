import { Box3, Group, Vector3 } from 'three';

export function findNode(root, pattern) {
  let result;
  root.traverse(node => { if (!result && (typeof pattern === 'string' ? node.name === pattern : pattern.test(node.name))) result = node; });
  return result;
}

export function setVisible(root, pattern, visible) {
  root.traverse(node => { if (pattern.test(node.name)) node.visible = visible; });
}

export function visibleBounds(root) {
  root.updateMatrixWorld(true);
  const box = new Box3();
  root.traverseVisible(node => {
    if (!node.isMesh) return;
    if (node.isSkinnedMesh) node.computeBoundingBox();
    else if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    const local = node.isSkinnedMesh ? node.boundingBox : node.geometry.boundingBox;
    if (local) box.union(local.clone().applyMatrix4(node.matrixWorld));
  });
  return box;
}

export function prepareModel(scene, { size, axis = 'max', shadows = true } = {}) {
  const remove = [];
  scene.traverse(node => { if (/^studio_/i.test(node.name)) remove.push(node); });
  remove.forEach(node => node.removeFromParent());
  scene.traverse(node => {
    if (!node.isMesh) return;
    node.castShadow = shadows;
    node.receiveShadow = shadows;
  });
  const group = new Group();
  group.add(scene);
  let box = visibleBounds(group);
  const extent = box.getSize(new Vector3());
  const length = axis === 'max' ? Math.max(extent.x, extent.y, extent.z) : extent[axis];
  if (size && length > 0) scene.scale.multiplyScalar(size / length);
  box = visibleBounds(group);
  const center = box.getCenter(new Vector3());
  scene.position.add(new Vector3(-center.x, -box.min.y, -center.z));
  group.updateMatrixWorld(true);
  return group;
}

export function disposeInstance(root) {
  root.traverse(node => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach(material => material.dispose());
    // Cached source assets own geometries and textures; instance materials are independent.
    if (node.isSkinnedMesh) node.skeleton.dispose();
  });
  root.removeFromParent();
}
