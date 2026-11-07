import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const planetNames = ["Earth", "Moon", "Saturn", "Neptune"] as const;
export type SolarPlanets = {
  groups: [THREE.Group, THREE.Group, THREE.Group, THREE.Group];
  dispose: () => void;
};

type EarthPixels = { data: Uint8ClampedArray; width: number; height: number };
type LandPoint = { u: number; v: number; field: number };
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (a: number, b: number, value: number) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

async function earthPixels(): Promise<EarthPixels | null> {
  try {
    const image = new Image();
    image.src = "/space/earth.webp";
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.height = 0;
    return { data: pixels.data, width: pixels.width, height: pixels.height };
  } catch {
    return null;
  }
}

/** Geographic data is used only to find coastlines, never as a colour texture. */
function landField(map: EarthPixels, u: number, v: number) {
  let value = 0;
  for (const [dx, dy] of [
    [0, 0],
    [-1.5, -1.5],
    [1.5, 1.5],
  ]) {
    const x = Math.floor(
      (((u * map.width + dx) % map.width) + map.width) % map.width,
    );
    const y = Math.max(
      0,
      Math.min(map.height - 1, Math.floor(v * (map.height - 1) + dy)),
    );
    const index = (y * map.width + x) * 4;
    const r = map.data[index],
      g = map.data[index + 1],
      b = map.data[index + 2];
    value += Math.max(r * 1.14 - b, g * 1.05 - b) / 70;
  }
  return value / 3;
}

// The Americas face the reader; longitude zero remains geographically consistent.
function globePoint(u: number, v: number, radius: number) {
  const longitude = (u - 0.5) * Math.PI * 2 + THREE.MathUtils.degToRad(80);
  const latitude = (0.5 - v) * Math.PI;
  const latitudeRadius = Math.cos(latitude) * radius;
  return new THREE.Vector3(
    Math.sin(longitude) * latitudeRadius,
    Math.sin(latitude) * radius,
    Math.cos(longitude) * latitudeRadius,
  );
}

function terrainColor(u: number, v: number) {
  const latitude = (0.5 - v) * 180;
  const longitude = (u - 0.5) * 360;
  const box = (west: number, east: number, south: number, north: number) =>
    smooth(west, west + 10, longitude) *
    (1 - smooth(east - 10, east, longitude)) *
    smooth(south, south + 8, latitude) *
    (1 - smooth(north - 8, north, latitude));
  const dry = Math.max(
    box(-22, 62, 8, 39),
    box(110, 157, -41, -10),
    box(-125, -98, 17, 44) * 0.6,
  );
  const color = new THREE.Color(0x719b55).lerp(
    new THREE.Color(0xc5af77),
    dry * 0.92,
  );
  color.lerp(new THREE.Color(0xd9e4d6), smooth(59, 77, Math.abs(latitude)));
  return color;
}

/** Clip land triangles at the coastline, then build actual raised coastal walls. */
function makeContinents(map: EarthPixels) {
  const columns = 144,
    rows = 72;
  const grid: LandPoint[] = [];
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= columns; x++) {
      const u = x / columns,
        v = y / rows;
      grid.push({ u, v, field: landField(map, u, v) });
    }
  }
  const topPositions: number[] = [],
    colors: number[] = [],
    wallPositions: number[] = [];
  const pushTop = (point: LandPoint) => {
    const normal = globePoint(point.u, point.v, 1);
    const height = 1.03;
    topPositions.push(normal.x * height, normal.y * height, normal.z * height);
    const color = terrainColor(point.u, point.v);
    colors.push(color.r, color.g, color.b);
  };
  function buildTriangle(triangle: LandPoint[]) {
    const polygon: LandPoint[] = [],
      coast: LandPoint[] = [];
    for (let edge = 0; edge < 3; edge++) {
      const a = triangle[edge],
        b = triangle[(edge + 1) % 3];
      if (a.field >= 0) polygon.push(a);
      if (a.field >= 0 !== b.field >= 0) {
        const t = a.field / (a.field - b.field);
        const crossing = {
          u: a.u + (b.u - a.u) * t,
          v: a.v + (b.v - a.v) * t,
          field: 0,
        };
        polygon.push(crossing);
        coast.push(crossing);
      }
    }
    for (let index = 1; index < polygon.length - 1; index++) {
      pushTop(polygon[0]);
      pushTop(polygon[index]);
      pushTop(polygon[index + 1]);
    }
    if (coast.length === 2) {
      const [a, b] = coast;
      const topA = globePoint(a.u, a.v, 1.03);
      const topB = globePoint(b.u, b.v, 1.03);
      const baseA = globePoint(a.u, a.v, 0.998),
        baseB = globePoint(b.u, b.v, 0.998);
      for (const point of [topA, baseA, topB, topB, baseA, baseB])
        wallPositions.push(point.x, point.y, point.z);
    }
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const a = grid[y * (columns + 1) + x],
        b = grid[y * (columns + 1) + x + 1];
      const c = grid[(y + 1) * (columns + 1) + x + 1],
        d = grid[(y + 1) * (columns + 1) + x];
      buildTriangle([a, c, b]);
      buildTriangle([a, d, c]);
    }
  }
  const tops = new THREE.BufferGeometry();
  tops.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(topPositions, 3),
  );
  tops.computeVertexNormals();
  tops.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const walls = new THREE.BufferGeometry();
  walls.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(wallPositions, 3),
  );
  walls.computeVertexNormals();
  return { tops, walls };
}

/** Bevel-like polygonal chunks form sculpted clouds, rather than soft cotton puffs. */
function makeClouds() {
  const pieces: THREE.BufferGeometry[] = [];
  const puff = new THREE.DodecahedronGeometry(1, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const clusters = [
    [0.2, 0.29, 0.19],
    [0.26, 0.38, 0.12],
    [0.34, 0.57, 0.11],
    [0.18, 0.65, 0.16],
    [0.11, 0.46, 0.14],
    [0.4, 0.22, 0.16],
    [0.48, 0.4, 0.13],
    [0.52, 0.68, 0.16],
    [0.61, 0.29, 0.17],
    [0.66, 0.56, 0.12],
    [0.73, 0.38, 0.14],
    [0.82, 0.67, 0.17],
    [0.87, 0.28, 0.15],
    [0.94, 0.47, 0.13],
    [0.33, 0.76, 0.12],
  ];
  for (let cluster = 0; cluster < clusters.length; cluster++) {
    const [u, v, width] = clusters[cluster];
    const normal = globePoint(u, v, 1);
    const tangentRotation = new THREE.Quaternion().setFromUnitVectors(
      up,
      normal,
    );
    for (let index = 0; index < 4; index++) {
      const offset = new THREE.Vector3(
        (index - 1.5) * width * 0.46,
        0,
        Math.sin(index * 1.9 + cluster) * 0.025,
      );
      offset
        .applyQuaternion(tangentRotation)
        .addScaledVector(normal, 1.074 + (index % 2) * 0.008);
      const scale = new THREE.Vector3(
        width * (0.48 + 0.08 * Math.cos(index)),
        0.027 + (index % 2) * 0.014,
        width * 0.38,
      );
      const matrix = new THREE.Matrix4().compose(
        offset,
        tangentRotation,
        scale,
      );
      pieces.push(puff.clone().applyMatrix4(matrix));
    }
  }
  puff.dispose();
  const merged = mergeGeometries(pieces, false);
  for (const piece of pieces) piece.dispose();
  return merged;
}

function makeMoon() {
  const geometry = new THREE.IcosahedronGeometry(1, 8);
  const positions = geometry.getAttribute("position");
  const craterSpecs = [
    [0.23, 0.34, 0.17, 0.056],
    [0.34, 0.5, 0.21, 0.072],
    [0.18, 0.58, 0.145, 0.055],
    [0.3, 0.72, 0.16, 0.06],
    [0.37, 0.27, 0.105, 0.043],
    [0.13, 0.4, 0.09, 0.038],
    [0.4, 0.65, 0.1, 0.043],
    [0.28, 0.45, 0.065, 0.032],
    [0.43, 0.39, 0.105, 0.044],
    [0.58, 0.34, 0.16, 0.055],
    [0.67, 0.61, 0.2, 0.068],
    [0.79, 0.43, 0.13, 0.05],
    [0.88, 0.66, 0.16, 0.057],
    [0.57, 0.75, 0.1, 0.04],
  ];
  const craters = craterSpecs.map(([u, v, radius, depth]) => ({
    center: globePoint(u, v, 1),
    radius,
    depth,
  }));
  const profile = (t: number, depth: number) => {
    if (t < 0.62) return -depth * (0.94 - (0.1 * t) / 0.62);
    if (t < 0.99) return -depth * 0.84 * (1 - (t - 0.62) / 0.37);
    if (t < 1.09) return (depth * 0.42 * (t - 0.99)) / 0.1;
    if (t < 1.23) return depth * 0.42 * (1 - (t - 1.09) / 0.14);
    return 0;
  };
  const direction = new THREE.Vector3();
  for (let index = 0; index < positions.count; index++) {
    direction.fromBufferAttribute(positions, index).normalize();
    let elevation = 0;
    for (const crater of craters) {
      const distance = Math.sqrt(
        Math.max(0, 2 - 2 * direction.dot(crater.center)),
      );
      if (distance < crater.radius * 1.23)
        elevation += profile(distance / crater.radius, crater.depth);
    }
    positions.setXYZ(
      index,
      direction.x * (1 + elevation),
      direction.y * (1 + elevation),
      direction.z * (1 + elevation),
    );
  }
  geometry.computeVertexNormals();

  // Twelve-sided raised rims make the boundaries readable at the voyage's scale.
  const rimPositions: number[] = [];
  for (const crater of craters) {
    const axis =
      Math.abs(crater.center.y) > 0.9
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 1, 0);
    const tangent = axis.cross(crater.center).normalize();
    const bitangent = crater.center.clone().cross(tangent).normalize();
    const rimPoint = (angle: number, extent: number) => {
      const direction = crater.center
        .clone()
        .addScaledVector(tangent, Math.cos(angle) * crater.radius * extent)
        .addScaledVector(bitangent, Math.sin(angle) * crater.radius * extent)
        .normalize();
      return direction.multiplyScalar(1.003 + profile(extent, crater.depth));
    };
    const extents = [0.78, 0.99, 1.09, 1.23];
    for (let band = 0; band < extents.length - 1; band++) {
      for (let segment = 0; segment < 12; segment++) {
        const a = (segment / 12) * Math.PI * 2,
          b = ((segment + 1) / 12) * Math.PI * 2;
        const p0 = rimPoint(a, extents[band]),
          p1 = rimPoint(b, extents[band]);
        const p2 = rimPoint(b, extents[band + 1]),
          p3 = rimPoint(a, extents[band + 1]);
        for (const point of [p0, p2, p1, p0, p3, p2])
          rimPositions.push(point.x, point.y, point.z);
      }
    }
  }
  const rims = new THREE.BufferGeometry();
  rims.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(rimPositions, 3),
  );
  rims.computeVertexNormals();
  // Keep attributes aligned before merging the base and its sculpted crater rims.
  geometry.deleteAttribute("uv");
  const merged = mergeGeometries([geometry, rims], false);
  if (!merged) {
    rims.dispose();
    return geometry;
  }
  geometry.dispose();
  rims.dispose();
  return merged;
}

function bandedSphere(kind: "saturn" | "neptune") {
  const geometry = new THREE.IcosahedronGeometry(1, 4);
  const positions = geometry.getAttribute("position"),
    colors: number[] = [];
  for (let index = 0; index < positions.count; index++) {
    const y = positions.getY(index);
    const longitude = Math.atan2(positions.getZ(index), positions.getX(index));
    const latitude =
      y + 0.018 * (1 - y * y) * Math.sin(longitude * 3 + y * 2);
    const band =
      kind === "saturn"
        ? 0.35 + 0.55 * smooth(-0.6, 0.05, y) - 0.25 * smooth(0.3, 0.7, y)
        : 0.44 +
          0.12 * smooth(-0.7, 0.7, latitude) +
          0.3 * Math.sin(latitude * 12 + 0.4) +
          0.08 * Math.sin(latitude * 25 - 0.7);
    const color =
      kind === "saturn"
        ? new THREE.Color(0xc9ae7d).lerp(new THREE.Color(0xeddbb3), clamp(band))
        : new THREE.Color(0x184a9e).lerp(
            new THREE.Color(0x78b9e6),
            clamp(band),
          );
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function saturnRings() {
  const pieces: THREE.BufferGeometry[] = [];
  const bands: Array<[number, number, number]> = [
    [1.24, 1.38, 0xb7ad99],
    [1.395, 1.635, 0xcec5b0],
    [1.655, 1.82, 0xbdb49e],
  ];
  for (const [inner, outer, hex] of bands) {
    const segments = 36;
    const shape = new THREE.Shape();
    shape.moveTo(outer, 0);
    for (let segment = 1; segment <= segments; segment++) {
      const angle = (segment / segments) * Math.PI * 2;
      shape.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    }
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(inner, 0);
    for (let segment = 1; segment <= segments; segment++) {
      const angle = (-segment / segments) * Math.PI * 2;
      hole.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    }
    hole.closePath();
    shape.holes.push(hole);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.026,
      steps: 1,
      bevelEnabled: true,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      bevelSegments: 1,
      curveSegments: 1,
    });
    geometry.translate(0, 0, -0.013);
    const color = new THREE.Color(hex),
      colors: number[] = [];
    for (
      let index = 0;
      index < geometry.getAttribute("position").count;
      index++
    )
      colors.push(color.r, color.g, color.b);
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    pieces.push(geometry);
  }
  const geometry = mergeGeometries(pieces, false);
  for (const piece of pieces) piece.dispose();
  return geometry;
}

/** Four sculpted, game-like worlds. The Earth image supplies geography only. */
export async function createSolarPlanets(): Promise<SolarPlanets> {
  const map = await earthPixels();
  const earth = new THREE.Group(),
    moon = new THREE.Group(),
    saturn = new THREE.Group(),
    neptune = new THREE.Group();
  const groups: SolarPlanets["groups"] = [earth, moon, saturn, neptune];
  groups.forEach((group, index) => {
    group.name = planetNames[index];
    group.userData.planet = planetNames[index];
  });
  const standard = (parameters: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial({
      roughness: 0.82,
      metalness: 0.01,
      emissiveIntensity: 0.09,
      ...parameters,
    });

  const ocean = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 4),
    standard({ color: 0x3286c9, emissive: 0x3286c9, flatShading: true }),
  );
  ocean.name = "Earth ocean";
  earth.add(ocean);
  if (map) {
    const continents = makeContinents(map);
    const land = new THREE.Mesh(
      continents.tops,
      standard({
        vertexColors: true,
        emissive: 0x607a49,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
    );
    const coasts = new THREE.Mesh(
      continents.walls,
      standard({ color: 0x537a40, emissive: 0x537a40, side: THREE.DoubleSide }),
    );
    land.name = "Raised continents";
    coasts.name = "Coastal relief";
    earth.add(land, coasts);
  }
  const cloudGeometry = makeClouds();
  if (cloudGeometry) {
    const clouds = new THREE.Mesh(
      cloudGeometry,
      standard({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.15,
        roughness: 1,
        flatShading: true,
      }),
    );
    clouds.name = "Volumetric cloud clusters";
    earth.add(clouds);
  }

  const moonSurface = new THREE.Mesh(
    makeMoon(),
    standard({
      color: 0xb3b7bb,
      emissive: 0xaeb3b9,
      roughness: 1,
      flatShading: true,
      side: THREE.DoubleSide,
    }),
  );
  moonSurface.name = "Sculpted lunar craters";
  moon.add(moonSurface);

  const saturnSurface = new THREE.Mesh(
    bandedSphere("saturn"),
    standard({ vertexColors: true, emissive: 0xc6ac79, flatShading: true }),
  );
  saturnSurface.scale.y = 0.92;
  saturn.add(saturnSurface);
  const ringGeometry = saturnRings();
  if (ringGeometry) {
    const ring = new THREE.Mesh(
      ringGeometry,
      standard({
        vertexColors: true,
        emissive: 0x8f8879,
        emissiveIntensity: 0.06,
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = Math.PI / 2 - 0.37;
    const plane = new THREE.Group();
    plane.rotation.z = 0.34;
    plane.add(ring);
    saturn.add(plane);
  }
  const neptuneSurface = new THREE.Mesh(
    bandedSphere("neptune"),
    standard({ vertexColors: true, emissive: 0x2b68b9, flatShading: true }),
  );
  neptune.add(neptuneSurface);

  let disposed = false;
  return {
    groups,
    dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      for (const group of groups)
        group.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            materials.add(material);
        });
      for (const material of materials) material.dispose();
      for (const geometry of geometries) geometry.dispose();
    },
  };
}
