import * as THREE from "three";
import { finale, visits, clamp01 } from "./voyage-timeline";
type Node = {
  at: number;
  point: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  jerk: THREE.Vector3;
  parked: boolean;
  parkDirection?: THREE.Vector3;
};
type Segment = { start: number; end: number; controls: THREE.Vector3[] };
/** Design curvature in the actual camera plane first, then unproject at its C2 depth.
 * Natural cubic derivatives distribute the turn instead of flattening every knot. */
export function createVoyageOrbit(
  narrow: boolean,
  orbitStart: THREE.Vector3,
  orbitVelocity: THREE.Vector3,
  worldStep = 24,
  parkPoints?: readonly THREE.Vector3[],
  initialPoint?: THREE.Vector3,
) {
  const cameraZ = narrow ? 11 : 16;
  function smooth(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function cameraXAt(p: number) {
    let base = 0;
    for (const visit of visits)
      if (p <= visit.end) {
        base =
          visit.index * worldStep +
          worldStep *
            smooth(clamp01((p - visit.start) / (visit.arrived - visit.start)));
        return base + (narrow ? 4 : 0);
      }
    const t = clamp01((p - finale.start) / (finale.orbit - finale.start));
    return (
      visits.length * worldStep +
      worldStep * smooth(t) +
      (narrow ? 4 * (1 - smooth(t)) : 0)
    );
  }
  function cameraVelocityAt(p: number) {
    for (const visit of visits)
      if (p <= visit.end) {
        if (p >= visit.arrived) return 0;
        const h = visit.arrived - visit.start,
          t = clamp01((p - visit.start) / h);
        return (worldStep * 30 * t * t * (t - 1) * (t - 1)) / h;
      }
    const h = finale.orbit - finale.start,
      t = clamp01((p - finale.start) / h);
    return (
      ((worldStep - (narrow ? 4 : 0)) * 30 * t * t * (t - 1) * (t - 1)) / h
    );
  }
  const nodes: Node[] = [];
  function add(at: number, x: number, y: number, z: number, parked = false) {
    const d = cameraZ - z;
    const node: Node = {
      at,
      point: new THREE.Vector3((x - cameraXAt(at)) / d, y / d, z),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      jerk: new THREE.Vector3(),
      parked,
    };
    nodes.push(node);
    return node;
  }
  const hero =
    initialPoint ?? new THREE.Vector3(narrow ? 4 : 4.2, narrow ? 0.9 : 1, 1.6);
  const heroNode = add(0, hero.x, hero.y, hero.z);
  for (const visit of visits) {
    const x = (visit.index + 1) * worldStep + 4,
      back = visit.arrived + (visit.emerged - visit.arrived) * 0.43;
    const turnTime = visit.start + (visit.arrived - visit.start) * 0.25,
      turnDistance = cameraZ + 0.3;
    const arrivalDepth = cameraZ + 3.65,
      arrivalX = (x - 0.9 - cameraXAt(visit.arrived)) / arrivalDepth,
      arrivalY = 0.8 / arrivalDepth;
    const firstArc = (fraction: number) => {
      const q = heroNode.point
        .clone()
        .lerp(new THREE.Vector3(arrivalX, arrivalY, 0), fraction);
      q.y += Math.sin(fraction * Math.PI) * 0.035;
      return q;
    };
    const turn =
      visit.index === 0
        ? firstArc(0.25)
        : new THREE.Vector3(narrow ? -0.08 : -0.24, narrow ? -0.22 : 0.21, 0);
    add(
      turnTime,
      cameraXAt(turnTime) + turn.x * turnDistance,
      turn.y * turnDistance,
      -0.3,
    );
    const preentry = visit.start + (visit.arrived - visit.start) * 0.65,
      preDepth = cameraZ + 3;
    const pre =
      visit.index === 0
        ? firstArc(0.65)
        : new THREE.Vector3(narrow ? -0.21 : -0.15, narrow ? 0.12 : 0.15, 0);
    add(preentry, cameraXAt(preentry) + pre.x * preDepth, pre.y * preDepth, -3);
    add(visit.arrived, x - 0.9, 0.8, -3.65);
    add(back, x - 0.15, 0.4, -4.25);
    const radius = narrow ? 1.65 : 1.7,
      diagonal = ((1.08 * radius) / (cameraZ + 2)) * Math.SQRT1_2,
      planetX = (x - cameraXAt(visit.emerged)) / (cameraZ + 2),
      emergeDepth = cameraZ + 2.8;
    add(
      visit.emerged,
      cameraXAt(visit.emerged) + (planetX + diagonal) * emergeDepth,
      -diagonal * emergeDepth,
      -2.8,
    );
    const target =
      parkPoints?.[visit.index] ??
      new THREE.Vector3(x - (narrow ? 2.1 : 2.65), narrow ? 2 : 2.6, 3.2);
    const emerged = nodes[nodes.length - 1],
      targetDepth = cameraZ - target.z,
      targetX = (target.x - cameraXAt(visit.parked)) / targetDepth,
      targetY = target.y / targetDepth;
    const turnX =
        Math.max(emerged.point.x, targetX) +
        (narrow ? 0.015 : 0.07 + Math.abs(targetX - emerged.point.x) * 0.2),
      turnY = emerged.point.y + (targetY - emerged.point.y) * 0.45,
      turnDepth = cameraZ - 2;
    const swing = add(
      visit.emerged + (visit.parked - visit.emerged) * 0.42,
      cameraXAt(visit.parked) + turnX * turnDepth,
      turnY * turnDepth,
      2,
    );
    const parked = add(visit.parked, target.x, target.y, target.z, true);
    add(visit.departure, target.x, target.y, target.z, true);
    const exitDirection = parked.point.clone().sub(swing.point);
    exitDirection.z = 0;
    exitDirection.normalize();
    const exitPoint = parked.point
        .clone()
        .addScaledVector(exitDirection, 0.085),
      exitDepth = cameraZ - 1.15;
    add(
      visit.end,
      cameraXAt(visit.end) + exitPoint.x * exitDepth,
      exitPoint.y * exitDepth,
      1.15,
    );
  }
  const opening = finale.start + (finale.orbit - finale.start) * 0.3;
  add(
    opening,
    cameraXAt(opening) + (narrow ? 0.13 : 0.26) * (cameraZ - 1.8),
    (narrow ? -0.2 : -0.12) * (cameraZ - 1.8),
    1.8,
  );
  const prelogo = finale.start + (finale.orbit - finale.start) * 0.66;
  add(
    prelogo,
    cameraXAt(prelogo) + (narrow ? -0.02 : 0.02) * (cameraZ - 0.8),
    (narrow ? -0.2 : -0.16) * (cameraZ - 0.8),
    0.8,
  );
  const last = add(finale.orbit, orbitStart.x, orbitStart.y, orbitStart.z),
    lastDepth = cameraZ - last.point.z;
  last.velocity.set(
    (orbitVelocity.x + last.point.x * orbitVelocity.z) / lastDepth,
    (orbitVelocity.y + last.point.y * orbitVelocity.z) / lastDepth,
    orbitVelocity.z,
  );
  const defaultDirection = new THREE.Vector3(-1, 0.42, 0).normalize();
  function solveRun(start: number, end: number) {
    const count = end - start + 1,
      lower = new Float64Array(count),
      diagonal = new Float64Array(count),
      upper = new Float64Array(count),
      rhs = Array.from({ length: count }, () => new THREE.Vector3()),
      second = Array.from({ length: count }, () => new THREE.Vector3());
    const firstH = nodes[start + 1].at - nodes[start].at,
      lastH = nodes[end].at - nodes[end - 1].at;
    const initialVelocity =
        start === 0
          ? new THREE.Vector3()
              .subVectors(nodes[start + 1].point, nodes[start].point)
              .multiplyScalar(0.65 / firstH)
          : new THREE.Vector3(),
      finalVelocity =
        end === nodes.length - 1 ? last.velocity.clone() : new THREE.Vector3();
    diagonal[0] = 2 * firstH;
    upper[0] = firstH;
    rhs[0]
      .subVectors(nodes[start + 1].point, nodes[start].point)
      .divideScalar(firstH)
      .sub(initialVelocity)
      .multiplyScalar(6);
    for (let local = 1; local < count - 1; local++) {
      const index = start + local,
        h0 = nodes[index].at - nodes[index - 1].at,
        h1 = nodes[index + 1].at - nodes[index].at;
      lower[local] = h0;
      diagonal[local] = 2 * (h0 + h1);
      upper[local] = h1;
      rhs[local]
        .subVectors(nodes[index + 1].point, nodes[index].point)
        .divideScalar(h1)
        .sub(
          new THREE.Vector3()
            .subVectors(nodes[index].point, nodes[index - 1].point)
            .divideScalar(h0),
        )
        .multiplyScalar(6);
    }
    lower[count - 1] = lastH;
    diagonal[count - 1] = 2 * lastH;
    rhs[count - 1]
      .copy(finalVelocity)
      .sub(
        new THREE.Vector3()
          .subVectors(nodes[end].point, nodes[end - 1].point)
          .divideScalar(lastH),
      )
      .multiplyScalar(6);
    for (let i = 1; i < count; i++) {
      const factor = lower[i] / diagonal[i - 1];
      diagonal[i] -= factor * upper[i - 1];
      rhs[i].addScaledVector(rhs[i - 1], -factor);
    }
    second[count - 1].copy(rhs[count - 1]).divideScalar(diagonal[count - 1]);
    for (let i = count - 2; i >= 0; i--)
      second[i]
        .copy(rhs[i])
        .addScaledVector(second[i + 1], -upper[i])
        .divideScalar(diagonal[i]);
    for (let local = 0; local < count; local++) {
      const index = start + local,
        node = nodes[index];
      node.acceleration.copy(second[local]);
      if (index === end) node.velocity.copy(finalVelocity);
      else {
        const h = nodes[index + 1].at - node.at;
        node.velocity
          .subVectors(nodes[index + 1].point, node.point)
          .divideScalar(h)
          .addScaledVector(second[local], -h / 3)
          .addScaledVector(second[local + 1], -h / 6);
      }
      if (local === 0)
        node.jerk.subVectors(second[1], second[0]).divideScalar(firstH);
      else if (local === count - 1)
        node.jerk
          .subVectors(second[local], second[local - 1])
          .divideScalar(lastH);
      else
        node.jerk
          .subVectors(second[local + 1], second[local - 1])
          .divideScalar(nodes[index + 1].at - nodes[index - 1].at);
    }
    if (nodes[start].parked) {
      nodes[start].velocity.set(0, 0, 0);
      nodes[start].acceleration.set(0, 0, 0);
    }
    if (nodes[end].parked) {
      nodes[end].parkDirection = second[count - 1].clone().negate();
      nodes[end].parkDirection.z = 0;
      nodes[end].parkDirection.normalize();
      nodes[end].velocity.set(0, 0, 0);
      nodes[end].acceleration.set(0, 0, 0);
    }
    if (end === nodes.length - 1) nodes[end].acceleration.set(0, 0, 0);
  }
  let runStart = 0;
  while (runStart < nodes.length - 1) {
    let end = runStart + 1;
    while (end < nodes.length - 1 && !nodes[end].parked) end++;
    solveRun(runStart, end);
    runStart = end + 1;
  }
  // Depth is independently monotone and reaches its nearest point only at reading.
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.acceleration.z = 0;
    node.jerk.z = 0;
    if (i === 0 || i === nodes.length - 1 || node.parked) {
      node.velocity.z = i === nodes.length - 1 ? orbitVelocity.z : 0;
      continue;
    }
    const h0 = node.at - nodes[i - 1].at,
      h1 = nodes[i + 1].at - node.at,
      a = (node.point.z - nodes[i - 1].point.z) / h0,
      b = (nodes[i + 1].point.z - node.point.z) / h1;
    node.velocity.z =
      a * b > 0
        ? Math.sign(a) *
          Math.min(
            Math.abs((h0 + h1) / (h0 / a + h1 / b)),
            0.9 * Math.abs(a),
            0.9 * Math.abs(b),
          )
        : 0;
  }
  for (let i = 0; i < nodes.length; i++)
    if (nodes[i].parked) {
      const node = nodes[i],
        incoming =
          node.parkDirection ?? nodes[i - 1]?.parkDirection ?? defaultDirection;
      node.parkDirection = incoming.clone();
      const h = nodes[i - 1]?.parked
        ? nodes[i + 1].at - node.at
        : node.at - nodes[i - 1].at;
      node.jerk.copy(incoming).multiplyScalar(0.7 / Math.pow(h, 3));
      node.jerk.z = 0;
    }
  const segments: Segment[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const first = nodes[i],
      end = nodes[i + 1],
      h = end.at - first.at,
      p = Array.from({ length: 8 }, () => new THREE.Vector3());
    p[0].copy(first.point);
    p[7].copy(end.point);
    p[1].copy(p[0]).addScaledVector(first.velocity, h / 7);
    p[2]
      .copy(p[1])
      .multiplyScalar(2)
      .sub(p[0])
      .addScaledVector(first.acceleration, (h * h) / 42);
    p[3]
      .copy(p[2])
      .multiplyScalar(3)
      .addScaledVector(p[1], -3)
      .add(p[0])
      .addScaledVector(first.jerk, (h * h * h) / 210);
    p[6].copy(p[7]).addScaledVector(end.velocity, -h / 7);
    p[5]
      .copy(p[6])
      .multiplyScalar(2)
      .sub(p[7])
      .addScaledVector(end.acceleration, (h * h) / 42);
    p[4]
      .copy(p[7])
      .addScaledVector(p[6], -3)
      .addScaledVector(p[5], 3)
      .addScaledVector(end.jerk, (-h * h * h) / 210);
    if (first.parked && end.parked)
      p.forEach((point) => point.copy(first.point));
    segments.push({ start: first.at, end: end.at, controls: p });
  }
  const work = Array.from({ length: 8 }, () => new THREE.Vector3()),
    coordinate = new THREE.Vector3();
  function segmentAt(p: number) {
    let i = 0;
    while (i < segments.length - 1 && p > segments[i].end) i++;
    return segments[i];
  }
  function evaluate(p: number, out: THREE.Vector3, derivative = false) {
    const segment = segmentAt(p),
      count = derivative ? 7 : 8,
      h = segment.end - segment.start,
      t = clamp01((p - segment.start) / h);
    for (let i = 0; i < count; i++) {
      if (derivative)
        work[i]
          .subVectors(segment.controls[i + 1], segment.controls[i])
          .multiplyScalar(7 / h);
      else work[i].copy(segment.controls[i]);
    }
    for (let level = count - 1; level > 0; level--)
      for (let i = 0; i < level; i++) work[i].lerp(work[i + 1], t);
    return out.copy(work[0]);
  }
  function velocityAt(p: number, out: THREE.Vector3) {
    evaluate(p, coordinate);
    evaluate(p, out, true);
    const d = cameraZ - coordinate.z,
      vz = out.z;
    return out.set(
      cameraVelocityAt(p) + out.x * d - coordinate.x * vz,
      out.y * d - coordinate.y * vz,
      vz,
    );
  }
  return {
    positionAt(p: number, out: THREE.Vector3) {
      evaluate(p, out);
      const d = cameraZ - out.z;
      return out.set(cameraXAt(p) + out.x * d, out.y * d, out.z);
    },
    velocityAt,
    projectedAt(p: number, out: THREE.Vector3) {
      return evaluate(p, out);
    },
    tangentAt(p: number, out: THREE.Vector3) {
      velocityAt(p, out);
      if (out.lengthSq() < 1e-12) {
        const visit = visits.find(
            (v) => p >= v.parked - 0.00001 && p <= v.departure + 0.00001,
          ),
          node = visit ? nodes.find((n) => n.at === visit.parked) : undefined;
        out.copy(node?.parkDirection ?? defaultDirection);
      }
      return out;
    },
    parkTangent(out: THREE.Vector3) {
      return out.copy(defaultDirection);
    },
    readingTangent(index: number, out: THREE.Vector3) {
      const stop = nodes.find((node) => node.at === visits[index].parked);
      return out.copy(stop?.parkDirection ?? defaultDirection).normalize();
    },
    boundaries: nodes.map((node) => ({
      at: node.at,
      position: new THREE.Vector3(
        cameraXAt(node.at) + node.point.x * (cameraZ - node.point.z),
        node.point.y * (cameraZ - node.point.z),
        node.point.z,
      ),
      velocity: node.velocity.clone(),
      acceleration: node.acceleration.clone(),
      parked: !!node.parked,
    })),
  };
}
