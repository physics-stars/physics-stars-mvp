import { ease, type LightPath, type LightPoint } from "./descent-motion";

export type TrailCursor = {
  key: string;
  value: number;
  origin: number;
  min: number;
  max: number;
  at: LightPath;
  hold?: boolean;
};

/** Interpolate on the curve itself, never between old frame positions. */
export class CurveTrail {
  private key = "";
  private previous = 0;
  private origin = 0;
  private direction = 0;
  private movedAt = -Infinity;

  reset() {
    this.key = "";
    this.direction = 0;
    this.movedAt = -Infinity;
  }

  update(cursor: TrailCursor | null, time: number) {
    if (!cursor) {
      this.reset();
      return { d: "", opacity: 0, points: [] as LightPoint[] };
    }
    if (this.key !== cursor.key) {
      this.key = cursor.key;
      this.previous = cursor.origin;
      this.origin = cursor.origin;
      this.direction = 0;
    }
    const delta = cursor.value - this.previous;
    if (Math.abs(delta) > 0.001) {
      const direction = Math.sign(delta);
      if (direction !== this.direction) this.origin = this.previous;
      this.direction = direction;
      this.previous = cursor.value;
      this.movedAt = time;
    }
    const opacity = cursor.hold ? 1 : 1 - ease((time - this.movedAt - 120) / 500);
    if (!this.direction || opacity <= 0) return { d: "", opacity: 0, points: [] as LightPoint[] };
    const points = [cursor.at(cursor.value)];
    const limit = Math.max(cursor.min, Math.min(cursor.max, this.origin));
    let value = cursor.value, length = 0;
    const step = Math.max(0.01, (cursor.max - cursor.min) / 128);
    for (let i = 0; i < 512 && Math.abs(value - limit) > 0.001 && length < 180; i++) {
      let amount = Math.min(step, Math.abs(value - limit));
      let next = value - this.direction * amount;
      let p = cursor.at(next);
      const last = points[points.length - 1];
      // Keep geometric samples close even when one scroll jumps a whole slide.
      while (Math.hypot(p.x - last.x, p.y - last.y) > 4 && amount > 0.001) {
        amount /= 2;
        next = value - this.direction * amount;
        p = cursor.at(next);
      }
      length += Math.hypot(p.x - last.x, p.y - last.y);
      points.push(p);
      value = next;
    }
    points.reverse();
    const epsilon = Math.max(0.0001, (cursor.max - cursor.min) * 0.00001);
    const before = cursor.at(Math.max(cursor.min, cursor.value - epsilon));
    const after = cursor.at(Math.min(cursor.max, cursor.value + epsilon));
    const tangent = {
      x: (after.x - before.x) * this.direction,
      y: (after.y - before.y) * this.direction,
    };
    return { d: smoothTrail(points, tangent), opacity, points };
  }
}

export function smoothTrail(points: LightPoint[], tangent: LightPoint) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i];
    const c = points[i + 1], next = points[Math.min(points.length - 1, i + 2)];
    const c1 = { x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 };
    let c2 = { x: c.x - (next.x - b.x) / 6, y: c.y - (next.y - b.y) / 6 };
    if (i === points.length - 2) {
      const length = Math.hypot(c.x - b.x, c.y - b.y) / 3;
      const speed = Math.hypot(tangent.x, tangent.y) || 1;
      c2 = { x: c.x - tangent.x / speed * length, y: c.y - tangent.y / speed * length };
    }
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${c.x} ${c.y}`;
  }
  return d;
}
