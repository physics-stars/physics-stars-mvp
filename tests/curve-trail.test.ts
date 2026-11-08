import assert from "node:assert/strict";
import test from "node:test";
import { CurveTrail, type TrailCursor } from "../src/components/public-site/curve-trail";

const at = (value: number) => ({ x: 100 + 30 * Math.sin(value / 100), y: value });
const cursor = (value: number): TrailCursor => ({ key: "curve", value, origin: 0, min: 0, max: 1000, at });

test("a large scroll jump still draws a smooth curve ending at the light", () => {
  const trail = new CurveTrail();
  trail.update(cursor(10), 0);
  const trace = trail.update(cursor(700), 16);
  assert.match(trace.d, /^M .* C /);
  assert.ok(!trace.d.includes(" L "));
  assert.deepEqual(trace.points.at(-1), at(700));
  assert.ok(trace.points.length > 20);
  assert.ok(trace.points.every((p) => Math.abs(p.x - (100 + 30 * Math.sin(p.y / 100))) < 0.000001));
  for (let i = 1; i < trace.points.length; i++)
    assert.ok(Math.hypot(trace.points[i].x - trace.points[i - 1].x, trace.points[i].y - trace.points[i - 1].y) <= 4.001);
});

test("reversing scroll removes the old tail and follows the return curve", () => {
  const trail = new CurveTrail();
  trail.update(cursor(700), 0);
  const trace = trail.update(cursor(660), 16);
  assert.deepEqual(trace.points.at(-1), at(660));
  assert.ok(trace.points.every((p) => p.y >= 660 && p.y <= 700));
});

test("camera scrolling translates the whole tail without joining old viewport positions", () => {
  const trail = new CurveTrail();
  trail.update(cursor(500), 0);
  const camera = 350;
  const trace = trail.update({ ...cursor(620), at: (value) => {
    const p = at(value);
    return { x: p.x, y: p.y - camera };
  } }, 16);
  assert.deepEqual(trace.points.at(-1), { x: at(620).x, y: 270 });
  assert.ok(trace.points.every((p) => p.y <= 270));
});

test("docking clears the tail and an idle curve fades instead of extending", () => {
  const trail = new CurveTrail();
  trail.update(cursor(300), 0);
  assert.equal(trail.update(cursor(300), 700).opacity, 0);
  assert.equal(trail.update(null, 701).d, "");
});
