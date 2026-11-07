import * as THREE from "three";
import { clamp01 } from "./voyage-timeline";

export type FlightShape = {
  point(t: number, out: THREE.Vector3): THREE.Vector3;
  tangent(t: number, out: THREE.Vector3): THREE.Vector3;
  speed(t: number): number;
};

export function cubicFlight(points: readonly THREE.Vector3[]): FlightShape {
  const [a, b, c, d] = points;
  const ab = b.clone().sub(a),
    bc = c.clone().sub(b),
    cd = d.clone().sub(c);
  const differential = new THREE.Vector3();
  return {
    point(t, out) {
      const v = 1 - t;
      return out
        .copy(a)
        .multiplyScalar(v ** 3)
        .addScaledVector(b, 3 * v * v * t)
        .addScaledVector(c, 3 * v * t * t)
        .addScaledVector(d, t ** 3);
    },
    tangent(t, out) {
      const v = 1 - t;
      return out
        .copy(ab)
        .multiplyScalar(v * v)
        .addScaledVector(bc, 2 * v * t)
        .addScaledVector(cd, t * t)
        .normalize();
    },
    speed(t) {
      const v = 1 - t;
      return (
        differential
          .copy(ab)
          .multiplyScalar(v * v)
          .addScaledVector(bc, 2 * v * t)
          .addScaledVector(cd, t * t)
          .length() * 3
      );
    },
  };
}

function measure(shape: FlightShape) {
  const lengths = [0],
    a = new THREE.Vector3(),
    b = new THREE.Vector3();
  shape.point(0, a);
  for (let i = 1; i <= 512; i++) {
    shape.point(i / 512, b);
    lengths.push(lengths.at(-1)! + a.distanceTo(b));
    a.copy(b);
  }
  return { shape, lengths, length: lengths.at(-1)! };
}

function parameterAt(part: ReturnType<typeof measure>, distance: number) {
  let low = 0,
    high = 512;
  while (high - low > 1) {
    const middle = (low + high) >>> 1;
    if (part.lengths[middle] < distance) low = middle;
    else high = middle;
  }
  const span = part.lengths[high] - part.lengths[low];
  if (!span) return low / 512;
  const t = clamp01((distance - part.lengths[low]) / span),
    t2 = t * t,
    t3 = t2 * t;
  const u0 = low / 512,
    u1 = high / 512;
  const m0 = Math.min(3 / 512, span / Math.max(1e-10, part.shape.speed(u0)));
  const m1 = Math.min(3 / 512, span / Math.max(1e-10, part.shape.speed(u1)));
  // The inverse derivative is continuous at table boundaries and curve joins.
  return (
    (2 * t3 - 3 * t2 + 1) * u0 +
    (t3 - 2 * t2 + t) * m0 +
    (-2 * t3 + 3 * t2) * u1 +
    (t3 - t2) * m1
  );
}

/** Shared distance speeds cross geometry joins without restarting an acceleration ramp. */
export function smoothFlight(
  parts: { shape: FlightShape; start: number; end: number }[],
  startSpeed: number,
  endSpeed: number,
) {
  const measured = parts.map((part) => ({ ...part, ...measure(part.shape) }));
  const slopes = measured.map((part) => part.length / (part.end - part.start));
  const speeds = [startSpeed];
  for (let i = 1; i < measured.length; i++) {
    const before = measured[i - 1].end - measured[i - 1].start;
    const after = measured[i].end - measured[i].start;
    const w0 = 2 * after + before,
      w1 = after + 2 * before;
    speeds.push(
      Math.min(
        (w0 + w1) / (w0 / slopes[i - 1] + w1 / slopes[i]),
        2 * Math.min(slopes[i - 1], slopes[i]),
      ),
    );
  }
  speeds.push(endSpeed);
  const profiles = measured.map((_, i) => {
    const m0 = speeds[i] / slopes[i],
      m1 = speeds[i + 1] / slopes[i];
    const c3 = 10 - 6 * m0 - 4 * m1,
      c4 = -15 + 8 * m0 + 7 * m1,
      c5 = 6 - 3 * m0 - 3 * m1;
    let positive = true;
    for (let j = 0; j <= 80; j++) {
      const t = j / 80;
      if (m0 + 3 * c3 * t ** 2 + 4 * c4 * t ** 3 + 5 * c5 * t ** 4 < -1e-8)
        positive = false;
    }
    return { m0, m1, c3, c4, c5, positive };
  });
  return {
    sample(p: number, out: THREE.Vector3, velocity?: THREE.Vector3) {
      let i = 0;
      while (i < measured.length - 1 && p > measured[i].end) i++;
      const part = measured[i],
        h = part.end - part.start,
        t = clamp01((p - part.start) / h);
      const { m0, m1, c3, c4, c5, positive } = profiles[i];
      let fraction: number, rate: number;
      if (positive) {
        fraction = m0 * t + c3 * t ** 3 + c4 * t ** 4 + c5 * t ** 5;
        rate = m0 + 3 * c3 * t ** 2 + 4 * c4 * t ** 3 + 5 * c5 * t ** 4;
      } else {
        // Keep an unusually short stop approach monotone even when its incoming
        // speed is too high for a quintic distance interpolation.
        const power = Math.max(3, Math.ceil(m0 + m1)),
          d = power + 1,
          rest = 1 - (m0 + m1) / d;
        fraction =
          (m0 * (1 - (1 - t) ** d)) / d +
          (m1 * t ** d) / d +
          rest * (t - Math.sin(2 * Math.PI * t) / (2 * Math.PI));
        rate =
          m0 * (1 - t) ** power +
          m1 * t ** power +
          rest * (1 - Math.cos(2 * Math.PI * t));
      }
      fraction = clamp01(fraction);
      const speed = rate * slopes[i];
      const distance = fraction * part.length;
      const u = parameterAt(part, distance);
      part.shape.point(u, out);
      if (velocity)
        part.shape.tangent(u, velocity).multiplyScalar(Math.max(0, speed));
      return out;
    },
  };
}
