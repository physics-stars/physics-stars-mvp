import * as THREE from "three";
import { createLogoGapBridges } from "./logo-gap-bridges";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type PhysicsLogoGeometry = {
  group: THREE.Group;
  star: THREE.Group;
  purple: THREE.Group;
  white: THREE.Group;
  yellow: THREE.Group;
  starAnchor: THREE.Vector3;
  starTail: THREE.Vector3;
  yellowOrbit: THREE.Curve<THREE.Vector3>;
  setFlatten(t: number): void;
  setYellowReveal(t: number): void;
  setTravelShape(t: number): void;
  getStarTail(t: number, out: THREE.Vector3): THREE.Vector3;
  setClosedRings(reveal: number): void;
  setOrbitTailLength(length: number): void;
  dispose(): void;
};

const LOGO_SIZE = 666.87;
const WORLD_SCALE = 4.8 / LOGO_SIZE;
const LOGO_CENTER = LOGO_SIZE / 2;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Exact SVG paths with a paper-thin extrusion; no substitute star or orbital loops. */
export async function createPhysicsLogo(): Promise<PhysicsLogoGeometry> {
  const response = await fetch("/logo.svg");
  if (!response.ok) throw new Error("Unable to load the Physics Stars logo.");
  const parsed = new SVGLoader().parse(await response.text());
  const starPath = parsed.paths.find((path, index) => {
    const d =
      (path.userData?.node as SVGElement | undefined)?.getAttribute("d") ?? "";
    return /^M137\.24[,\s]+391\.2/.test(d.trim()) || index === 4;
  });
  if (!starPath)
    throw new Error("The original Physics Stars star path is missing.");
  const starShapes = starPath.toShapes();
  if (!starShapes.length)
    throw new Error("The original Physics Stars star has no shape.");

  // Area-weighted centroid of the actual triangulated silhouette, in SVG coordinates.
  const centroidGeometry = new THREE.ShapeGeometry(starShapes, 28);
  const centroidPositions = centroidGeometry.getAttribute("position");
  const centroidIndex = centroidGeometry.getIndex();
  const count = centroidIndex?.count ?? centroidPositions.count;
  let areaSum = 0,
    centroidX = 0,
    centroidY = 0;
  for (let index = 0; index < count; index += 3) {
    const a = centroidIndex ? centroidIndex.getX(index) : index;
    const b = centroidIndex ? centroidIndex.getX(index + 1) : index + 1;
    const c = centroidIndex ? centroidIndex.getX(index + 2) : index + 2;
    const ax = centroidPositions.getX(a),
      ay = centroidPositions.getY(a);
    const bx = centroidPositions.getX(b),
      by = centroidPositions.getY(b);
    const cx = centroidPositions.getX(c),
      cy = centroidPositions.getY(c);
    const area = Math.abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
    areaSum += area;
    centroidX += ((ax + bx + cx) / 3) * area;
    centroidY += ((ay + by + cy) / 3) * area;
  }
  centroidGeometry.dispose();
  if (areaSum < 0.001)
    throw new Error("The Physics Stars star silhouette is empty.");
  centroidX /= areaSum;
  centroidY /= areaSum;
  const starAnchor = new THREE.Vector3(
    (centroidX - LOGO_CENTER) * WORLD_SCALE,
    -(centroidY - LOGO_CENTER) * WORLD_SCALE,
    0,
  );
  // Attach the wake to the longest original tip, measured from the silhouette's centroid.
  const starTail = new THREE.Vector3();
  for (const shape of starShapes)
    for (const point of shape.getPoints(80)) {
      const x = (point.x - centroidX) * WORLD_SCALE,
        y = -(point.y - centroidY) * WORLD_SCALE;
      if (x * x + y * y > starTail.lengthSq()) starTail.set(x, y, 0.006);
    }

  const group = new THREE.Group();
  group.name = "Physics Stars exact logo";
  const star = new THREE.Group();
  star.name = "Original star and highlight";
  star.position.copy(starAnchor);
  const purple = new THREE.Group();
  purple.name = "Original purple orbit";
  const white = new THREE.Group();
  white.name = "Original white orbit";
  const yellow = new THREE.Group();
  yellow.name = "Original yellow orbit";
  group.add(yellow, star, purple, white);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const bodies: THREE.Mesh[] = [];
  const morphs: {
    geometry: THREE.BufferGeometry;
    original: Float32Array;
    compact: Float32Array;
    colorOriginal?: Float32Array;
    colorCompact?: Float32Array;
  }[] = [];
  const yellowMaterials: (
    | THREE.MeshBasicMaterial
    | THREE.MeshStandardMaterial
  )[] = [];
  const yellowReveal = { value: 0 };
  const configureLogoShader = (
    material: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial,
    revealYellow: boolean,
  ) => {
    material.onBeforeCompile = (shader) => {
      // Keep SVG coordinates on one projected plane. Retain the tiny Z offsets
      // for paint order without enlarging or shifting rings through perspective.
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 logoPlane = projectionMatrix * modelViewMatrix * vec4(transformed.xy, 0.0, 1.0);
        gl_Position.xy = logoPlane.xy * (gl_Position.w / logoPlane.w);`,
      );
      if (!revealYellow) return;
      shader.uniforms.yellowReveal = yellowReveal;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nattribute float orbitPhase; varying float logoOrbitPhase;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nlogoOrbitPhase = orbitPhase;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying float logoOrbitPhase; uniform float yellowReveal;",
        )
        .replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>
        if (yellowReveal < .9999 && logoOrbitPhase > yellowReveal) discard;
      `,
        );
    };
    material.customProgramCacheKey = () =>
      `physics-logo-svg-plane-v1-${revealYellow ? "yellow-reveal" : "solid"}`;
  };
  type Batch = {
    parent: THREE.Group;
    color: number;
    depth: number;
    front: THREE.BufferGeometry[];
    side: THREE.BufferGeometry[];
    isYellow?: boolean;
  };
  const starBatch: Batch = {
    parent: star,
    color: 0xfdd835,
    depth: 4,
    front: [],
    side: [],
  };
  const purpleBatch: Batch = {
    parent: purple,
    color: 0x7c46b6,
    depth: 2,
    front: [],
    side: [],
  };
  const whiteBatch: Batch = {
    parent: white,
    color: 0xf0f6f6,
    depth: 2,
    front: [],
    side: [],
  };
  const yellowBatch: Batch = {
    parent: yellow,
    color: 0xfdd835,
    depth: 2,
    front: [],
    side: [],
    isYellow: true,
  };
  const highlightBatch: Batch = {
    parent: star,
    color: 0xffe780,
    depth: 0,
    front: [],
    side: [],
  };
  const tipRadius = Math.max(0.001, Math.hypot(starTail.x, starTail.y));
  function compactPoint(
    x: number,
    y: number,
    z: number,
    side: boolean,
    highlight: boolean,
    out: THREE.Vector3,
  ) {
    const radius = Math.hypot(x, y),
      normalised = radius / tipRadius;
    // Keep the original four-tip angular structure while evening out the long tip.
    const radialScale = 0.84 + 0.22 * (1 - Math.min(1, normalised));
    const roof = 0.12 + 0.23 * (1 - Math.min(1, normalised));
    let depth = roof + (highlight ? 0.012 : 0);
    if (side) {
      const frontZ = 4 * 0.2 * WORLD_SCALE;
      const backWeight = clamp((frontZ - z) / (4 * WORLD_SCALE));
      depth = THREE.MathUtils.lerp(
        roof - 0.001,
        -roof * 0.6 - 0.08,
        backWeight,
      );
    }
    return out.set(x * radialScale, y * radialScale, depth);
  }
  function registerMorph(
    geometry: THREE.BufferGeometry,
    side: boolean,
    highlight: boolean,
  ) {
    const position = geometry.getAttribute("position");
    const original = new Float32Array(position.array),
      compact = new Float32Array(original.length);
    const point = new THREE.Vector3();
    for (let index = 0; index < position.count; index++) {
      compactPoint(
        position.getX(index),
        position.getY(index),
        position.getZ(index),
        side,
        highlight,
        point,
      );
      compact[index * 3] = point.x;
      compact[index * 3 + 1] = point.y;
      compact[index * 3 + 2] = point.z;
    }
    let colorOriginal: Float32Array | undefined,
      colorCompact: Float32Array | undefined;
    if (!side) {
      colorOriginal = new Float32Array(position.count * 3).fill(1);
      colorCompact = new Float32Array(position.count * 3);
      const a = new THREE.Vector3(),
        b = new THREE.Vector3(),
        c = new THREE.Vector3(),
        normal = new THREE.Vector3();
      const light = new THREE.Vector3(-0.4, 0.7, 1).normalize();
      for (let index = 0; index < position.count; index += 3) {
        a.fromArray(compact, index * 3);
        b.fromArray(compact, (index + 1) * 3);
        c.fromArray(compact, (index + 2) * 3);
        normal.crossVectors(b.sub(a), c.sub(a)).normalize();
        const value = highlight
          ? 1
          : 0.82 + Math.max(0, normal.dot(light)) * 0.23;
        for (let vertex = 0; vertex < 3; vertex++)
          for (let channel = 0; channel < 3; channel++)
            colorCompact[(index + vertex) * 3 + channel] = value;
      }
      geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colorOriginal.slice(), 3),
      );
    }
    morphs.push({ geometry, original, compact, colorOriginal, colorCompact });
  }

  function transform(
    geometry: THREE.BufferGeometry,
    originX: number,
    originY: number,
    z: number,
  ) {
    geometry.translate(-originX, -originY, z);
    geometry.scale(WORLD_SCALE, -WORLD_SCALE, WORLD_SCALE);
    // SVG's mirrored Y axis reverses winding. Correct it so Standard normals stay lit.
    const indices = geometry.getIndex();
    if (indices) {
      for (let i = 0; i < indices.count; i += 3) {
        const b = indices.getX(i + 1);
        indices.setX(i + 1, indices.getX(i + 2));
        indices.setX(i + 2, b);
      }
    } else {
      const positions = geometry.getAttribute("position");
      for (const attribute of Object.values(geometry.attributes)) {
        const values = attribute.array;
        for (let i = 0; i < positions.count; i += 3)
          for (let component = 0; component < attribute.itemSize; component++) {
            const b = (i + 1) * attribute.itemSize + component,
              c = (i + 2) * attribute.itemSize + component;
            const saved = values[b];
            values[b] = values[c];
            values[c] = saved;
          }
      }
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  parsed.paths.forEach((path, index) => {
    if ([7, 8, 9].includes(index)) return;
    const style = path.userData?.style as { fill?: string } | undefined;
    const node = path.userData?.node as SVGElement | undefined;
    const palette: Record<string, string> = {
      "cls-1": "#fdd835",
      "cls-2": "#7c46b6",
      "cls-3": "#f0f6f6",
      "cls-4": "#ffe780",
    };
    const fill =
      palette[node?.getAttribute("class") ?? ""] ?? style?.fill?.toLowerCase();
    const d = node?.getAttribute("d")?.trim() ?? "";
    const isStar = path === starPath;
    const isHighlight =
      /^M296\.4[,\s]+309\.83/.test(d) || fill === "#ffe780" || index === 16;
    const batch = isStar
      ? starBatch
      : isHighlight
        ? highlightBatch
        : fill === "#7c46b6"
          ? purpleBatch
          : fill === "#f0f6f6"
            ? whiteBatch
            : fill === "#fdd835"
              ? yellowBatch
              : undefined;
    if (!batch) return;
    const originX = batch.parent === star ? centroidX : LOGO_CENTER;
    const originY = batch.parent === star ? centroidY : LOGO_CENTER;
    // Preserve original SVG paint order at intersections with a sub-pixel depth offset.
    const z = index * 0.2;
    for (const shape of path.toShapes()) {
      batch.front.push(
        transform(
          new THREE.ShapeGeometry(shape, 28),
          originX,
          originY,
          z + 0.04,
        ),
      );
      if (batch.depth) {
        const body = new THREE.ExtrudeGeometry(shape, {
          depth: batch.depth,
          steps: 1,
          bevelEnabled: false,
          curveSegments: 20,
        });
        batch.side.push(transform(body, originX, originY, z - batch.depth));
      }
    }
  });

  function combine(parts: THREE.BufferGeometry[]) {
    if (!parts.length) return undefined;
    const combined = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    if (!combined)
      throw new Error(
        "Unable to assemble the original Physics Stars logo paths.",
      );
    geometries.add(combined);
    return combined;
  }
  for (const batch of [
    yellowBatch,
    starBatch,
    purpleBatch,
    whiteBatch,
    highlightBatch,
  ]) {
    let frontGeometry = combine(batch.front);
    const sideGeometry = combine(batch.side);
    if (batch.parent === star) {
      if (frontGeometry?.index) {
        const unindexed = frontGeometry.toNonIndexed();
        geometries.delete(frontGeometry);
        frontGeometry.dispose();
        frontGeometry = unindexed;
        geometries.add(frontGeometry);
      }
      if (frontGeometry)
        registerMorph(frontGeometry, false, batch === highlightBatch);
      if (sideGeometry) registerMorph(sideGeometry, true, false);
    }
    if (sideGeometry) {
      const sideMaterial = new THREE.MeshStandardMaterial({
        color: batch.color,
        metalness: 0.05,
        roughness: 0.55,
        side: THREE.DoubleSide,
        transparent: Boolean(batch.isYellow),
      });
      const body = new THREE.Mesh(sideGeometry, sideMaterial);
      batch.parent.add(body);
      bodies.push(body);
      materials.add(sideMaterial);
      if (batch.isYellow) yellowMaterials.push(sideMaterial);
      configureLogoShader(sideMaterial, Boolean(batch.isYellow));
    }
    if (frontGeometry) {
      const frontMaterial = new THREE.MeshBasicMaterial({
        color: batch.color,
        toneMapped: false,
        side: THREE.DoubleSide,
        transparent: Boolean(batch.isYellow),
        vertexColors: batch.parent === star,
      });
      const front = new THREE.Mesh(frontGeometry, frontMaterial);
      batch.parent.add(front);
      materials.add(frontMaterial);
      if (batch.isYellow) yellowMaterials.push(frontMaterial);
      configureLogoShader(frontMaterial, Boolean(batch.isYellow));
    }
  }

  // All three visible orbits are the original SVG outlines. The pilot curve below
  // only controls motion and reveal; it never introduces a substitute contour.
  const orbitPoints: THREE.Vector3[] = [];
  const angle = (50 * Math.PI) / 180;
  const pilotAnchor = starAnchor.clone().add(starTail);
  const orbitalContours: THREE.Vector2[][] = [];
  parsed.paths.forEach((path, index) => {
    if (![0, 1, 2, 3, 5].includes(index)) return;
    path
      .toShapes()
      .forEach((shape) => orbitalContours.push(shape.getPoints(36)));
  });
  // Intersect rays with the actual filled outlines. Each near/far pair is the two
  // edges of a visible stroke; their midpoint is its real medial trajectory.
  function actualStrokePoint(phase: number): THREE.Vector3 | undefined {
    const long = Math.cos(phase) * 340,
      short = Math.sin(phase) * 110;
    const rx = long * Math.cos(angle) - short * Math.sin(angle),
      ry = long * Math.sin(angle) + short * Math.cos(angle);
    const radius = Math.hypot(rx, ry),
      dx = rx / radius,
      dy = ry / radius;
    let selected = 0,
      best = Infinity;
    for (const contour of orbitalContours) {
      const hits: number[] = [];
      for (let index = 0; index < contour.length; index++) {
        const a = contour[index],
          b = contour[(index + 1) % contour.length],
          ex = b.x - a.x,
          ey = b.y - a.y;
        const denominator = dx * ey - dy * ex;
        if (Math.abs(denominator) < 1e-9) continue;
        const ax = a.x - LOGO_CENTER,
          ay = a.y - LOGO_CENTER;
        const distance = (ax * ey - ay * ex) / denominator,
          edge = (ax * dy - ay * dx) / denominator;
        if (distance > 0 && edge >= 0 && edge < 1) hits.push(distance);
      }
      hits.sort((a, b) => a - b);
      for (let index = 0; index + 1 < hits.length; index += 2) {
        const middle = (hits[index] + hits[index + 1]) / 2,
          error = Math.abs(middle - radius);
        if (error < best) {
          best = error;
          selected = middle;
        }
      }
    }
    if (!Number.isFinite(best)) return;
    return new THREE.Vector3(
      dx * selected * WORLD_SCALE,
      -dy * selected * WORLD_SCALE,
      pilotAnchor.z,
    );
  }
  const seamDistance = 0.035;
  const svgPoint = (x: number, y: number) =>
    new THREE.Vector3(
      (x - LOGO_CENTER) * WORLD_SCALE,
      -(y - LOGO_CENTER) * WORLD_SCALE,
      0.006,
    );
  const strokeStart = svgPoint(147, 253),
    strokeEnd = svgPoint(364, 495);
  function phaseOf(x: number, y: number) {
    const dx = x - LOGO_CENTER,
      dy = y - LOGO_CENTER;
    return Math.atan2(
      (-Math.sin(angle) * dx + Math.cos(angle) * dy) / 110,
      (Math.cos(angle) * dx + Math.sin(angle) * dy) / 340,
    );
  }
  const startPhase = phaseOf(147, 253);
  let endPhase = phaseOf(364, 495);
  while (endPhase <= startPhase) endPhase += Math.PI * 2;
  const medial: THREE.Vector3[] = [];
  for (let index = 0; index <= 512; index++) {
    const point = actualStrokePoint(
      startPhase + ((endPhase - startPhase) * index) / 512,
    );
    if (point) medial.push(point);
  }
  const startTangent = (
    medial.find((point) => point.distanceTo(strokeStart) > 0.05) ??
    svgPoint(143, 244)
  )
    .clone()
    .sub(strokeStart)
    .normalize();
  const seamTangent = starAnchor.clone().sub(strokeEnd).normalize();
  pilotAnchor.copy(starAnchor).addScaledVector(seamTangent, -0.12);
  orbitPoints.push(
    strokeStart.clone(),
    strokeStart.clone().addScaledVector(startTangent, seamDistance),
    strokeStart.clone().addScaledVector(startTangent, seamDistance * 2),
    strokeStart.clone().addScaledVector(startTangent, seamDistance * 3),
  );
  for (const point of medial)
    if (
      point.distanceTo(strokeStart) > 0.12 &&
      point.distanceTo(strokeEnd) > 0.04
    )
      orbitPoints.push(point);
  orbitPoints.push(strokeEnd.clone());
  const hiddenEnd = pilotAnchor
    .clone()
    .addScaledVector(seamTangent, -seamDistance * 3);
  for (let index = 1; index < 24; index++)
    orbitPoints.push(strokeEnd.clone().lerp(hiddenEnd, index / 24));
  orbitPoints.push(
    hiddenEnd,
    pilotAnchor.clone().addScaledVector(seamTangent, -seamDistance * 2),
    pilotAnchor.clone().addScaledVector(seamTangent, -seamDistance),
    pilotAnchor.clone(),
  );
  // The source has interrupted ribbons and very uneven point spacing. Feeding
  // every ray intersection into a spline retained tiny lateral ripples, despite
  // continuous derivatives. Uniform distance samples give the pilot an even
  // control polygon; its visible ribbon remains the unchanged original SVG.
  const sourcePoints = orbitPoints.map((point) => point.clone());
  const distances = [0];
  for (let index = 1; index < sourcePoints.length; index++)
    distances.push(
      distances[index - 1] +
        sourcePoints[index].distanceTo(sourcePoints[index - 1]),
    );
  const length = distances.at(-1)!;
  const intervals = Math.max(96, Math.ceil(length / 0.095));
  const spacing = length / intervals;
  orbitPoints.length = 0;
  let sourceIndex = 1;
  for (let index = 0; index <= intervals; index++) {
    const distance = index * spacing;
    while (
      sourceIndex < distances.length - 1 &&
      distances[sourceIndex] < distance
    )
      sourceIndex++;
    const start = distances[sourceIndex - 1],
      span = distances[sourceIndex] - start;
    orbitPoints.push(
      sourcePoints[sourceIndex - 1]
        .clone()
        .lerp(sourcePoints[sourceIndex], span ? (distance - start) / span : 0),
    );
  }
  // Linear endpoint neighborhoods retain the entry tangent and stationary
  // landing exactly, while a much smaller C4 spline filters source-edge noise.
  for (let index = 0; index <= 3; index++) {
    orbitPoints[index]
      .copy(strokeStart)
      .addScaledVector(startTangent, spacing * index);
    orbitPoints[orbitPoints.length - 1 - index]
      .copy(pilotAnchor)
      .addScaledVector(seamTangent, -spacing * index);
  }
  class ExactStrokeOrbit extends THREE.Curve<THREE.Vector3> {
    constructor(readonly points: THREE.Vector3[]) {
      super();
    }
    private virtual = new THREE.Vector3();
    private point(index: number) {
      if (index < 0)
        return this.virtual
          .copy(this.points[0])
          .addScaledVector(startTangent, index * spacing);
      if (index >= this.points.length)
        return this.virtual
          .copy(this.points[this.points.length - 1])
          .addScaledVector(
            seamTangent,
            (index - this.points.length + 1) * spacing,
          );
      return this.points[index];
    }
    private weight(x: number, derivative = false) {
      const coefficients = [1, -6, 15, -20, 15, -6, 1];
      let total = 0;
      for (let index = 0; index < 7; index++) {
        const remainder = x - index;
        if (remainder > 0)
          total +=
            coefficients[index] * Math.pow(remainder, derivative ? 4 : 5);
      }
      return total / (derivative ? 24 : 120);
    }
    override getPoint(t: number, out = new THREE.Vector3()) {
      const count = this.points.length,
        scaled = clamp(t) * (count - 1),
        index = Math.floor(scaled),
        u = scaled - index;
      out.set(0, 0, 0);
      for (let offset = -2; offset <= 3; offset++)
        out.addScaledVector(
          this.point(index + offset),
          this.weight(u + 3 - offset),
        );
      return out;
    }
    override getTangent(t: number, optionalTarget = new THREE.Vector3()) {
      if (t < 1e-10) return optionalTarget.copy(startTangent);
      if (t > 1 - 1e-10) return optionalTarget.copy(seamTangent);
      const count = this.points.length,
        scaled = clamp(t) * (count - 1),
        index = Math.floor(scaled),
        u = scaled - index;
      optionalTarget.set(0, 0, 0);
      for (let offset = -2; offset <= 3; offset++)
        optionalTarget.addScaledVector(
          this.point(index + offset),
          this.weight(u + 3 - offset, true),
        );
      return optionalTarget.normalize();
    }
  }
  const yellowOrbit = new ExactStrokeOrbit(orbitPoints);
  yellowOrbit.arcLengthDivisions = 3200;
  // Bake the same arc-length parameter into the ORIGINAL yellow SVG vertices.
  // Rendering therefore reveals real outlines, never an ellipse-shaped substitute.
  function bakeRevealPhases() {
    const revealSamples = yellowOrbit.getSpacedPoints(768);
    for (const object of yellow.children) {
      const mesh = object as THREE.Mesh,
        geometry = mesh.geometry,
        position = geometry.getAttribute("position"),
        phases = new Float32Array(position.count);
      for (let vertex = 0; vertex < position.count; vertex++) {
        const x = position.getX(vertex),
          y = position.getY(vertex);
        let closest = Infinity,
          phase = 0;
        for (let index = 0; index < revealSamples.length - 1; index++) {
          const a = revealSamples[index],
            b = revealSamples[index + 1],
            dx = b.x - a.x,
            dy = b.y - a.y;
          const along = clamp(
            ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1),
          );
          const distance =
            (x - a.x - along * dx) ** 2 + (y - a.y - along * dy) ** 2;
          if (distance < closest) {
            closest = distance;
            phase = (index + along) / (revealSamples.length - 1);
          }
        }
        phases[vertex] = phase;
      }
      geometry.setAttribute("orbitPhase", new THREE.BufferAttribute(phases, 1));
    }
  }
  bakeRevealPhases();
  const gapBridges = createLogoGapBridges(parsed, WORLD_SCALE, LOGO_CENTER);
  gapBridges.group.traverse((object) => {
    if (
      object instanceof THREE.Mesh &&
      object.material instanceof THREE.MeshBasicMaterial
    )
      configureLogoShader(object.material, false);
  });
  group.add(gapBridges.group);
  let crossingPhases: number[] = [];
  function refreshCrossingPhases() {
    const samples = yellowOrbit.getSpacedPoints(768);
    crossingPhases = gapBridges.crossings.map(({ point }) => {
      let phase = 0,
        best = Infinity;
      for (let index = 0; index < samples.length - 1; index++) {
        const a = samples[index],
          b = samples[index + 1],
          dx = b.x - a.x,
          dy = b.y - a.y;
        const along = clamp(
          ((point.x - a.x) * dx + (point.y - a.y) * dy) /
            (dx * dx + dy * dy || 1),
        );
        const distance =
          (point.x - a.x - along * dx) ** 2 + (point.y - a.y - along * dy) ** 2;
        if (distance < best) {
          best = distance;
          phase = (index + along) / (samples.length - 1);
        }
      }
      return phase;
    });
  }
  function revealCrossings(value: number) {
    gapBridges.crossings.forEach(({ object }, index) => {
      object.visible = value < crossingPhases[index];
    });
  }
  refreshCrossingPhases();
  let lastShape = -1;
  function setTravelShape(t: number) {
    const value = clamp(t);
    if (Math.abs(value - lastShape) < 0.00001) return;
    lastShape = value;
    for (const morph of morphs) {
      const position = morph.geometry.getAttribute("position");
      for (let index = 0; index < morph.original.length; index++)
        position.array[index] =
          morph.compact[index] +
          (morph.original[index] - morph.compact[index]) * value;
      position.needsUpdate = true;
      if (morph.colorCompact && morph.colorOriginal) {
        const color = morph.geometry.getAttribute("color");
        for (let index = 0; index < morph.colorOriginal.length; index++)
          color.array[index] =
            morph.colorCompact[index] + (1 - morph.colorCompact[index]) * value;
        color.needsUpdate = true;
      }
      morph.geometry.computeVertexNormals();
      morph.geometry.computeBoundingSphere();
    }
  }
  setTravelShape(0);

  return {
    group,
    star,
    purple,
    white,
    yellow,
    starAnchor,
    starTail,
    yellowOrbit,
    setFlatten(t: number) {
      const value = clamp(t);
      bodies.forEach((body) => {
        body.scale.z = Math.max(0.0001, 1 - value);
        body.visible = value < 0.9999;
      });
    },
    setYellowReveal(t: number) {
      const value = clamp(t);
      yellow.visible = value > 0.0001;
      yellowReveal.value = value;
      revealCrossings(value);
      yellowMaterials.forEach((material) => {
        material.opacity = 1;
      });
    },
    setTravelShape,
    getStarTail(t: number, out: THREE.Vector3) {
      const value = clamp(t);
      compactPoint(starTail.x, starTail.y, starTail.z, false, false, out);
      return out.lerp(starTail, value);
    },
    setClosedRings(reveal: number) {
      // Retained method name for scene compatibility. No replacement ellipses:
      // purple and white remain pixel-aligned with their original SVG paths.
      purple.visible = true;
      white.visible = true;
      gapBridges.group.visible = reveal >= 0;
      if (reveal >= 0) {
        const value = clamp(reveal);
        yellow.visible = value > 0.0001;
        yellowReveal.value = value;
        revealCrossings(value);
      } else yellow.visible = yellowReveal.value > 0.0001;
    },
    setOrbitTailLength(length: number) {
      const target = Math.max(0, length);
      if (Math.abs(pilotAnchor.distanceTo(starAnchor) - target) < 0.00001)
        return;
      pilotAnchor.copy(starAnchor).addScaledVector(seamTangent, -target);
      for (let index = 0; index <= 3; index++)
        orbitPoints[orbitPoints.length - 1 - index]
          .copy(pilotAnchor)
          .addScaledVector(seamTangent, -spacing * index);
      yellowOrbit.updateArcLengths();
      bakeRevealPhases();
      refreshCrossingPhases();
    },
    dispose() {
      gapBridges.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      group.clear();
    },
  };
}
