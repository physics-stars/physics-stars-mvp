import * as THREE from "three";

type Sample = (progress: number, out: THREE.Vector3) => THREE.Vector3;

/** A bounded record of positions actually travelled, retained while the light rests. */
export function createVoyageWake(screenSpace = false) {
  const measure = (a: THREE.Vector3, b: THREE.Vector3) =>
    screenSpace ? Math.hypot(a.x - b.x, a.y - b.y) : a.distanceTo(b);
  const points: THREE.Vector3[] = [];
  const current = new THREE.Vector3(),
    sample = new THREE.Vector3();
  let previous: number | null = null,
    direction = 1,
    length = 0,
    revision = 0;
  function clear() {
    points.length = 0;
    length = 0;
    previous = null;
  }
  function append(point: THREE.Vector3) {
    const last = points.at(-1);
    if (last) {
      const distance = measure(last, point);
      if (distance < (screenSpace ? 0.0001 : 0.002)) {
        if (screenSpace) last.z = point.z;
        return;
      }
      length += distance;
    }
    points.push(point.clone());
  }
  return {
    clear,
    advance(progress: number, at: Sample, maximum: number) {
      at(progress, current);
      if (previous === null) {
        append(current);
        previous = progress;
        return;
      }
      const delta = progress - previous;
      const sign = Math.abs(delta) > 0.0000001 ? Math.sign(delta) : direction;
      if (sign !== direction) {
        direction = sign;
        revision++;
        points.length = 0;
        length = 0;
        append(current);
        previous = progress;
        return;
      }
      if (Math.abs(delta) < 0.0000001) {
        if (
          (points.at(-1) ? measure(points.at(-1)!, current) : 0) >
          maximum * 2
        ) {
          points.length = 0;
          length = 0;
          append(current);
        }
        previous = progress;
        return;
      }
      const steps = Math.min(
        32,
        Math.max(1, Math.ceil(Math.abs(delta) / 0.00025)),
      );
      for (let index = 1; index <= steps; index++) {
        at(previous + (delta * index) / steps, sample);
        append(sample);
      }
      previous = progress;
      while (length > maximum && points.length > 1) {
        const segment = measure(points[0], points[1]),
          excess = length - maximum;
        if (excess >= segment) {
          points.shift();
          length -= segment;
        } else {
          points[0].lerp(points[1], excess / segment);
          length = maximum;
        }
      }
      while (points.length > 600) {
        length -= measure(points[0], points[1]);
        points.shift();
      }
    },
    write(positions: Float32Array, alphas: Float32Array) {
      let segment = 0,
        travelled = 0;
      for (let index = 0; index < alphas.length; index++) {
        const fraction = index / (alphas.length - 1),
          distance = fraction * length;
        while (
          segment < points.length - 2 &&
          travelled + measure(points[segment], points[segment + 1]) < distance
        ) {
          travelled += measure(points[segment], points[segment + 1]);
          segment++;
        }
        const start = points[segment] ?? current,
          end = points[segment + 1] ?? start;
        const span = measure(start, end),
          t = span
            ? Math.max(0, Math.min(1, (distance - travelled) / span))
            : 0;
        sample.lerpVectors(start, end, t).toArray(positions, index * 3);
        alphas[index] = length > 0.00001 ? fraction * fraction : 0;
      }
    },
    get length() {
      return length;
    },
    get revision() {
      return revision;
    },
    get direction() {
      return direction;
    },
  };
}
