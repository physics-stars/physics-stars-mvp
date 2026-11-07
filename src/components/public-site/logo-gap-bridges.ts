import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

/** Only fills missing spans. No replacement ellipse is ever rendered. */
export function createLogoGapBridges(
  parsed: ReturnType<SVGLoader["parse"]>,
  scale: number,
  center: number,
) {
  const group = new THREE.Group();
  group.name = "Missing orbital SVG spans";
  group.visible = false;
  const geometries: THREE.BufferGeometry[] = [],
    materials: THREE.Material[] = [];
  const crossings: { object: THREE.Mesh; point: THREE.Vector3 }[] = [];
  function add(geometry: THREE.BufferGeometry, color: number, z: number) {
    geometry.translate(-center, -center, z);
    geometry.scale(scale, -scale, scale);
    const material = new THREE.MeshBasicMaterial({
      color,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const object = new THREE.Mesh(geometry, material);
    group.add(object);
    geometries.push(geometry);
    materials.push(material);
    return object;
  }
  for (const d of [
    "M175.94,203.13 Q202.3,197.2 230.33,193.74 L241.76,208.39 Q210.5,211.1 180.69,218.69 Z",
    "M313.90,460.03 Q338,460.7 362.77,459.97 L365.17,476.03 Q347,476.6 328.52,476.39 Z",
  ]) {
    const path = new SVGLoader().parse(
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`,
    ).paths[0];
    for (const shape of path.toShapes())
      add(new THREE.ShapeGeometry(shape, 24), 0xf0f6f6, 2.6);
  }
  // One continuous missing left span connects the original large purple arcs.
  // Small isolated fragments are omitted from the 3D source in logo-geometry.
  const purple = new SVGLoader().parse(
    `<svg xmlns="http://www.w3.org/2000/svg"><path d="M247.40,186.96 C197,269 158,366 146.80,454.70 L162.70,458.70 C175,361 214,262 267.28,185.50 Z"/></svg>`,
  ).paths[0];
  for (const shape of purple.toShapes())
    add(new THREE.ShapeGeometry(shape, 40), 0x7c46b6, 2);
  for (const crossing of [
    {
      x: 131,
      y: 224,
      color: 0xf0f6f6,
      z: 2.6,
      d: "M126.70,217.50 L131.15,215.96 L137.91,230.64 L133.50,232.07 Z",
    },
    {
      x: 382,
      y: 520,
      color: 0x7c46b6,
      z: 2,
      d: "M379.25,507.85 L389.90,520.34 L384.70,527.19 L374.46,514.25 Z",
    },
  ]) {
    const path = new SVGLoader().parse(
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="${crossing.d}"/></svg>`,
    ).paths[0];
    for (const shape of path.toShapes())
      crossings.push({
        object: add(
          new THREE.ShapeGeometry(shape, 12),
          crossing.color,
          crossing.z,
        ),
        point: new THREE.Vector3(
          (crossing.x - center) * scale,
          -(crossing.y - center) * scale,
          0,
        ),
      });
  }
  return {
    group,
    crossings,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      group.clear();
    },
  };
}
