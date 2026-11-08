import assert from "node:assert/strict";
import test from "node:test";
import { byDistance, glassRoute, rightRoute } from "../src/components/public-site/descent-motion";

test("distance sampling stays on the analytic curve between distance samples", () => {
  const path = byDistance((t) => ({ x: 1000 * t, y: 1000 * t * t }));
  for (const t of [0.123456, 0.345678, 0.765432, 0.987654]) {
    const p = path(t);
    assert.ok(Math.abs(p.y - p.x * p.x / 1000) < 0.00000001);
  }
});

test("the page waits until the flask arch is heading downward", () => {
  const body = { x: 102, y: 780.96 };
  const neck = { x: 102, y: 723.76 };
  const route = glassRoute(body, neck, { x: 34, y: 760 }, 390, 844, 68, false, false);
  for (let i = 0; i <= 1000; i++) {
    const p = route.departure(i / 1000);
    if (p.y < neck.y) break;
    assert.ok(Math.abs(p.x - neck.x) < 0.00001, JSON.stringify(p));
  }
  const end = route.departure(1);
  const before = route.departure(0.999);
  assert.ok(end.x < neck.x - 40, JSON.stringify(end));
  assert.ok(end.y - before.y > Math.abs(end.x - before.x) * 1.3);
  assert.deepEqual(route.departure(1), route.flight(0));
  assert.deepEqual(route.flight(1), route.entry(0));
  const outgoing = { x: end.x - before.x, y: end.y - before.y };
  const after = route.flight(0.00001);
  const incoming = { x: after.x - end.x, y: after.y - end.y };
  assert.ok((outgoing.x * incoming.x + outgoing.y * incoming.y) /
    (Math.hypot(outgoing.x, outgoing.y) * Math.hypot(incoming.x, incoming.y)) > 0.9999);
  const samples = Array.from({ length: 101 }, (_, i) => route.flight(i / 100));
  assert.ok(samples.every((p, i) => !i || p.y >= samples[i - 1].y));
  assert.ok(Math.max(...samples.map(p => p.x)) - Math.min(...samples.map(p => p.x)) > 15);
});

for (const [width, height, header, team, pilot] of [
  [1440, 1000, 76, { x: 1332, y: 967 }, { x: 1332, y: 802 }],
  [390, 844, 68, { x: 302, y: 815 }, { x: 356, y: 760 }],
] as const) {
  test(`team and pilot have horizontal tangents with one downward wave at ${width}px`, () => {
    const route = rightRoute(team, pilot, width, height, header);
    const start = route.departure(0);
    const leaving = route.departure(0.0001);
    const approaching = route.entry(0.9999);
    const end = route.entry(1);
    assert.ok(leaving.x > start.x);
    assert.ok(Math.abs(leaving.y - start.y) < (leaving.x - start.x) * 0.01);
    assert.ok(approaching.y < end.y);
    assert.ok(approaching.x > end.x);
    assert.ok(end.y - approaching.y < (approaching.x - end.x) * 0.01);
    assert.deepEqual(route.departure(1), route.flight(0));
    assert.deepEqual(route.flight(1), route.entry(0));
    for (const [outgoing, incoming] of [
      [route.departure, route.flight],
      [route.flight, route.entry],
    ]) {
      const before = outgoing(0.9999), join = outgoing(1), after = incoming(0.0001);
      const a = { x: join.x - before.x, y: join.y - before.y };
      const b = { x: after.x - join.x, y: after.y - join.y };
      const alignment = (a.x * b.x + a.y * b.y) /
        (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
      assert.ok(alignment > 0.99999, `Tangent changed at a phase boundary: ${alignment}`);
    }
    const reverse = rightRoute(team, pilot, width, height, header, true);
    assert.deepEqual(reverse.departure(0), end);
    assert.deepEqual(reverse.entry(1), start);
    let previous = start;
    for (const part of [route.departure, route.flight, route.entry]) {
      for (let i = 0; i <= 300; i++) {
        const p = part(i / 300);
        assert.ok(p.y >= previous.y - 0.000001, JSON.stringify({ previous, p }));
        previous = p;
      }
    }
    const axis = route.flight(1).x;
    const signs = Array.from({ length: 199 }, (_, i) => route.flight((i + 1) / 200).x - axis)
      .filter((x) => Math.abs(x) > 0.01).map(Math.sign);
    const wave = signs.slice(signs.indexOf(1));
    let turns = 0;
    for (let i = 1; i < wave.length; i++) if (wave[i] !== wave[i - 1]) turns++;
    assert.equal(turns, 1);
  });
}
