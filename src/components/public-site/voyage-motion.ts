import * as THREE from "three";
import { clamp01, finale, visits } from "./voyage-timeline";
import { voyageCameraVelocity, voyageCameraX } from "./voyage-camera";

type Pace = {
  length: number;
  velocity: number;
  flight: number;
  amount: number;
};

/** One camera-plane gesture, with arc-length pacing and no orbital waypoints.
 * Reading pauses change only its clock: the same C2 curve continues afterwards. */
export function createVoyageMotion(
  narrow: boolean,
  orbitStart: THREE.Vector3,
  orbitVelocity: THREE.Vector3,
  worldStep = 24,
  parkPoints?: readonly THREE.Vector3[],
  initialPoint?: THREE.Vector3,
) {
  const cameraZ = narrow ? 11 : 16;
  const viewX = (p: number) => voyageCameraX(p, narrow, worldStep);
  const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
  function project(point: THREE.Vector3, p: number) {
    const depth = cameraZ - point.z;
    return v((point.x - viewX(p)) / depth, point.y / depth, point.z);
  }
  const hero = project(initialPoint ?? v(narrow ? 2 : -1, 2, 1.6), 0);
  const fallbackX = narrow
    ? [-0.15, 0.17, -0.16, 0.11]
    : [-0.28, 0.11, -0.27, 0.23];
  const parks = visits.map((visit, index) => {
    const q = parkPoints?.[index]
      ? project(parkPoints[index], visit.parked)
      : v(fallbackX[index], narrow ? -0.18 : 0.15, 3.2);
    return q;
  });
  const end = project(orbitStart, finale.orbit),
    endDepth = cameraZ - end.z;
  const endVelocity = v(
    (orbitVelocity.x -
      voyageCameraVelocity(finale.orbit, narrow, worldStep) +
      end.x * orbitVelocity.z) /
      endDepth,
    (orbitVelocity.y + end.y * orbitVelocity.z) / endDepth,
  );
  const endSpeed = endVelocity.length(),
    endDirection = endVelocity.clone().normalize();
  const [p0, p1, p2, p3] = parks;
  const directions = [
    v(0.8, -0.6),
    v(0, 1),
    v(0, -1),
    (narrow ? v(-0.8, 0.6) : v(-0.9, -0.43)).normalize(),
  ];
  const handles = [
    Math.min(0.035, Math.hypot(hero.x - p0.x, hero.y - p0.y) * 0.3),
    0.065,
    0.05,
    0.065,
  ];
  const normals = [
    v(0.6, 0.8),
    v(-1, 0),
    v(1, 0),
    (narrow ? v(0.6, 0.8) : v(-0.43, 0.9)).normalize(),
  ];
  function blend(a: THREE.Vector3, b: THREE.Vector3, t: number, dy = 0, z = 0) {
    const point = a.clone().lerp(b, t);
    point.y += dy;
    point.z = z;
    return point;
  }
  const lowerRoom = Math.max(
    0.035,
    Math.min(0.095, Math.min(p0.y, p1.y, p2.y, p3.y) + 0.34),
  );
  // Only the opening has an extra revolution. Offsetting the reading knots
  // keeps every later gesture and its timing independent of this first loop.
  const openingOffset = 3;
  const controls = [
    hero.clone(),
    v(narrow ? -0.08 : 0.14, narrow ? 0.12 : 0.1),
    v(narrow ? 0.04 : 0.3, narrow ? -0.09 : -0.08),
    v(narrow ? 0.24 : 0.46, -0.14),
    v(narrow ? 0.28 : 0.5, narrow ? 0.12 : 0.15),
    v(narrow ? -0.16 : 0, narrow ? 0.16 : 0.28),
    p0.clone().addScaledVector(directions[0], narrow ? -0.12 : -0.14),
    p0.clone(),
    p0.clone(),
    p0.clone(),
    blend(p0, p1, 0.32, -(narrow ? lowerRoom * 0.68 : 0.1), -1.4),
    blend(p0, p1, 0.82, -(narrow ? lowerRoom : 0.07), -3.2),
    p1.clone(),
    p1.clone(),
    p1.clone(),
    blend(p1, p2, 0.3, narrow ? 0.22 : 0.125, -0.8),
    blend(p1, p2, 0.82, narrow ? 0.13 : 0.07, -3.5),
    p2.clone(),
    p2.clone(),
    p2.clone(),
    blend(p2, p3, 0.26, -(narrow ? lowerRoom * 0.72 : 0.08), -2.5),
    narrow
      ? p3.clone().addScaledVector(directions[3], -handles[3] * 1.8)
      : blend(p2, p3, 0.9, 0.1, -0.8).add(v(0.025, 0)),
    p3.clone(),
    p3.clone(),
    p3.clone(),
    end.clone().addScaledVector(endDirection, -0.17).add(v(0.015, 0.005)),
    end.clone().addScaledVector(endDirection, -0.075),
    end.clone(),
  ];
  controls[0].z = hero.z;
  controls[1].z = -2.4;
  controls[2].z = -4.4;
  controls[3].z = -1;
  controls[4].z = 1.4;
  controls[5].z = 2.4;
  controls[6].z = 2.8;
  controls[18 + openingOffset].z = 1.2;
  for (let index = 0; index < 4; index++) {
    const center = 5 + index * 5 + openingOffset,
      point = parks[index],
      direction = directions[index],
      normal = normals[index];
    const curvature = [0.009 * (handles[0] / 0.035) ** 2, 0.014, 0.011, 0.014][
      index
    ];
    controls[center - 1]
      .copy(point)
      .addScaledVector(direction, -handles[index])
      .addScaledVector(normal, curvature);
    controls[center].copy(point).addScaledVector(normal, -curvature * 0.5);
    controls[center + 1]
      .copy(point)
      .addScaledVector(direction, handles[index])
      .addScaledVector(normal, curvature);
    for (let offset = -1; offset <= 1; offset++)
      controls[center + offset].z = point.z;
  }
  controls[22 + openingOffset].z = orbitStart.z;
  controls[23 + openingOffset].z =
    orbitStart.z - (0.075 * orbitVelocity.z) / Math.max(endSpeed, 0.0001);
  controls[24 + openingOffset].z = orbitStart.z;

  const degree = 3,
    spans = controls.length - degree;
  const knots = [
    0,
    0,
    0,
    0,
    ...Array.from({ length: spans - 1 }, (_, i) => (i + 1) / spans),
    1,
    1,
    1,
    1,
  ];
  function derivativeControls(
    points: readonly THREE.Vector3[],
    order: number,
    vector: readonly number[],
  ) {
    return points.slice(0, -1).map((point, index) =>
      points[index + 1]
        .clone()
        .sub(point)
        .multiplyScalar(
          order / (vector[index + order + 1] - vector[index + 1]),
        ),
    );
  }
  const first = derivativeControls(controls, degree, knots),
    firstKnots = knots.slice(1, -1);
  const second = derivativeControls(first, degree - 1, firstKnots),
    secondKnots = firstKnots.slice(1, -1);
  const scratch = Array.from({ length: 4 }, () => new THREE.Vector3());
  function spline(u: number, out: THREE.Vector3, order = 0) {
    const points = order === 0 ? controls : order === 1 ? first : second;
    const vector = order === 0 ? knots : order === 1 ? firstKnots : secondKnots;
    const d = degree - order,
      n = points.length - 1;
    let k = d;
    if (u >= 1) k = n;
    else while (k < n && u >= vector[k + 1]) k++;
    for (let j = 0; j <= d; j++) scratch[j].copy(points[k - d + j]);
    for (let r = 1; r <= d; r++)
      for (let j = d; j >= r; j--) {
        const index = j + k - d,
          width = vector[j + 1 + k - r] - vector[index];
        scratch[j].lerpVectors(
          scratch[j - 1],
          scratch[j],
          width ? (u - vector[index]) / width : 0,
        );
      }
    return out.copy(scratch[d]);
  }

  // Dense geometric arc length, with a smooth inverse; the user feels the
  // gesture at an even pace rather than its control-point spacing.
  const samples = spans * 96;
  const lengths = new Float64Array(samples + 1),
    speeds = new Float64Array(samples + 1);
  const samplePoint = new THREE.Vector3(),
    previousPoint = spline(0, new THREE.Vector3());
  for (let i = 0; i <= samples; i++) {
    spline(i / samples, samplePoint);
    if (i)
      lengths[i] =
        lengths[i - 1] +
        Math.hypot(
          samplePoint.x - previousPoint.x,
          samplePoint.y - previousPoint.y,
        );
    previousPoint.copy(samplePoint);
    spline(i / samples, samplePoint, 1);
    speeds[i] = Math.max(0.0001, Math.hypot(samplePoint.x, samplePoint.y));
  }
  const totalLength = lengths[samples],
    stations = [4, 9, 14, 19].map(
      (knot) => lengths[(knot + openingOffset) * 96],
    );
  function parameterAt(distance: number) {
    const s = Math.max(0, Math.min(totalLength, distance));
    let lo = 0,
      hi = samples;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >>> 1;
      if (lengths[mid] <= s) lo = mid;
      else hi = mid;
    }
    const h = lengths[hi] - lengths[lo],
      t = h ? (s - lengths[lo]) / h : 0;
    const a = lo / samples,
      b = hi / samples,
      maxSlope = (2.8 * (b - a)) / Math.max(h, 0.000001);
    const m0 = Math.min(1 / speeds[lo], maxSlope),
      m1 = Math.min(1 / speeds[hi], maxSlope);
    return (
      (2 * t ** 3 - 3 * t * t + 1) * a +
      (t ** 3 - 2 * t * t + t) * h * m0 +
      (-2 * t ** 3 + 3 * t * t) * b +
      (t ** 3 - t * t) * h * m1
    );
  }
  function integrate(t: number) {
    return t ** 6 - 3 * t ** 5 + 2.5 * t ** 4;
  }
  function smooth(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function pacing(p: number): Pace {
    for (const visit of visits)
      if (p >= visit.parked && p <= visit.departure)
        return {
          length: stations[visit.index],
          velocity: 0,
          flight: visit.index,
          amount: 1,
        };
    let flight = visits.findIndex((visit) => p < visit.parked);
    if (flight < 0) flight = visits.length;
    const start = flight ? visits[flight - 1].departure : 0;
    const finish =
      flight < visits.length ? visits[flight].parked : finale.orbit;
    const a = flight ? stations[flight - 1] : 0,
      b = flight < visits.length ? stations[flight] : totalLength;
    const h = finish - start,
      distance = b - a,
      t = clamp01((p - start) / h);
    const rampStart = flight ? 0.1 : 0,
      rampEnd = flight < visits.length ? 0.1 : 0.18;
    const ending =
      flight < visits.length ? 0 : (endSpeed * h) / Math.max(distance, 0.00001);
    const cruise = Math.max(
      0.05,
      (1 - (rampEnd * ending) / 2) / (1 - (rampStart + rampEnd) / 2),
    );
    let fraction: number, velocity: number;
    if (rampStart && t < rampStart) {
      const local = t / rampStart;
      fraction = cruise * rampStart * integrate(local);
      velocity = cruise * smooth(local);
    } else if (t > 1 - rampEnd) {
      const local = (t - 1 + rampEnd) / rampEnd;
      fraction =
        cruise * (1 - rampEnd - rampStart / 2) +
        cruise * rampEnd * local +
        (ending - cruise) * rampEnd * integrate(local);
      velocity = cruise + (ending - cruise) * smooth(local);
    } else {
      fraction = cruise * (t - rampStart / 2);
      velocity = cruise;
    }
    return {
      length: a + distance * fraction,
      velocity: (distance * velocity) / h,
      flight,
      amount: t,
    };
  }
  const coordinate = new THREE.Vector3(),
    tangent = new THREE.Vector3();
  function projected(p: number, out: THREE.Vector3) {
    const clock = pacing(p),
      u = parameterAt(clock.length);
    return spline(u, out);
  }
  function depthAt(p: number) {
    const clock = pacing(p),
      q = projected(p, coordinate);
    let z = q.z;
    // Occlusion changes depth only, leaving the complete drawn gesture intact.
    if (clock.velocity > 0 && clock.flight < visits.length) {
      const planetX = (clock.flight + 1) * worldStep + 4;
      const cx = (planetX - viewX(p)) / (cameraZ + 2),
        radius = (narrow ? 1.65 : 1.7) / (cameraZ + 2);
      const distance = Math.hypot(q.x - cx, q.y);
      const proximity = 1 - smooth(clamp01((distance / radius - 1.05) / 0.6));
      const fade =
        smooth(clamp01(clock.amount / 0.12)) *
        smooth(clamp01((1 - clock.amount) / 0.12));
      z += (-4.4 - z) * proximity * fade;
    }
    return z;
  }
  function positionAt(p: number, out: THREE.Vector3) {
    projected(p, out);
    const z = depthAt(p),
      depth = cameraZ - z;
    return out.set(viewX(p) + out.x * depth, out.y * depth, z);
  }
  function velocityAt(p: number, out: THREE.Vector3) {
    const clock = pacing(p),
      u = parameterAt(clock.length);
    spline(u, coordinate);
    spline(u, tangent, 1);
    const factor =
      clock.velocity / Math.max(0.0001, Math.hypot(tangent.x, tangent.y));
    const z = depthAt(p),
      epsilon = 0.000001;
    const vz =
      p >= finale.orbit
        ? orbitVelocity.z
        : clock.velocity
          ? (depthAt(p + epsilon) - depthAt(Math.max(0, p - epsilon))) /
            (p ? 2 * epsilon : epsilon)
          : 0;
    projected(p, coordinate);
    const depth = cameraZ - z;
    return out.set(
      voyageCameraVelocity(p, narrow, worldStep) +
        tangent.x * factor * depth -
        coordinate.x * vz,
      tangent.y * factor * depth - coordinate.y * vz,
      vz,
    );
  }
  return {
    positionAt,
    velocityAt,
    projectedAt(p: number, out: THREE.Vector3) {
      projected(p, out);
      out.z = depthAt(p);
      return out;
    },
    tangentAt(p: number, out: THREE.Vector3) {
      const clock = pacing(p);
      if (clock.velocity > 0.0001) return velocityAt(p, out);
      spline(parameterAt(clock.length), out, 1);
      return out;
    },
    parkTangent(out: THREE.Vector3) {
      return spline((4 + openingOffset) / spans, out, 1);
    },
    readingTangent(index: number, out: THREE.Vector3) {
      return spline((4 + index * 5 + openingOffset) / spans, out, 1);
    },
    logoBankAt: 0.79,
    rhythmAt(p: number) {
      return pacing(p).velocity;
    },
    boundaries: [
      0,
      ...visits.flatMap((visit) => [visit.parked, visit.departure]),
      finale.orbit,
    ].map((at) => ({
      at,
      position: positionAt(at, new THREE.Vector3()),
      velocity: velocityAt(at, new THREE.Vector3()),
      acceleration: new THREE.Vector3(),
      parked: visits.some(
        (visit) => at === visit.parked || at === visit.departure,
      ),
    })),
  };
}
