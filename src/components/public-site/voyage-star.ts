import * as THREE from "three";

/** A warm point of light, with an isotropic halo and a short attachment for its wake. */
export function createVoyageStar() {
  const group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(0.12, 16, 12);
  const material = new THREE.MeshBasicMaterial({
    color: 0xfff4ce,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geometry, material));
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,246,205,.95)");
  gradient.addColorStop(0.09, "rgba(255,229,128,.75)");
  gradient.addColorStop(0.24, "rgba(253,216,53,.30)");
  gradient.addColorStop(0.55, "rgba(253,216,53,.06)");
  gradient.addColorStop(1, "rgba(253,216,53,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const map = new THREE.CanvasTexture(canvas);
  const haloMaterial = new THREE.SpriteMaterial({
    map,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const halo = new THREE.Sprite(haloMaterial);
  halo.scale.setScalar(3.2);
  group.add(halo);
  return {
    group,
    tail: new THREE.Vector3(-0.15, 0, 0),
    setFocus(amount: number, overDiscs = false, dissolve = 0, visibility = 1) {
      halo.scale.setScalar((3.2 + amount * 1.1) * (1 + dissolve * 0.2));
      haloMaterial.opacity =
        (1 + amount * 0.35) * (1 + dissolve * 3) * visibility;
      material.opacity = visibility;
      haloMaterial.depthTest = !overDiscs;
      material.depthTest = !overDiscs;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      map.dispose();
      haloMaterial.dispose();
      group.clear();
    },
  };
}
