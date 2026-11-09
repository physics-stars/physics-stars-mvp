import assert from "node:assert/strict";
import test from "node:test";
import {
  barApproach,
  barEntry,
  glassLane,
  glassRoute,
  byDistance,
  rightRoute,
  type LightPath,
} from "../src/components/public-site/descent-motion";

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const layouts = [
  { width: 1440, height: 900, header: 76, neckX: 186, barX: 108 },
  { width: 1280, height: 600, header: 76, neckX: 174, barX: 96 },
  { width: 844, height: 390, header: 76, neckX: 141, barX: 63 },
  { width: 390, height: 844, header: 68, neckX: 102, barX: 56 },
  { width: 320, height: 740, header: 68, neckX: 102, barX: 56 },
];

for (const layout of layouts) {
  for (const below of [-32, 4, 24, 90, 300]) {
    test(`${layout.width}×${layout.height}, bar ${below}px from viewport bottom`, () => {
      const { width, height, header, neckX, barX } = layout;
      const body = { x: neckX, y: height - 66.5 };
      const neck = { x: neckX, y: body.y - 57.2 };
      const bar = { x: barX, y: height + below };
      const receives = below <= -2;
      const span = height - header;
      const route = glassRoute(body, neck, bar, width, height, header, false, receives, span);

      assert.ok(distance(route.departure(0), body) < 0.001);
      assert.ok(distance(route.departure(1), route.flight(0)) < 0.001);
      assert.ok(distance(route.flight(1), route.entry(0)) < 0.001);
      const reverse = glassRoute(body, neck, bar, width, height, header, true, receives, span);
      assert.ok(distance(reverse.departure(0), route.entry(1)) < 0.001);
      assert.ok(distance(reverse.entry(1), body) < 0.001);
      for (const t of [0, 0.2, 0.5, 0.8, 1])
        assert.ok(distance(reverse.flight(t), route.flight(1 - t)) < 0.001);
      const external: LightPath = t => t <= 0.5
        ? route.flight(t * 2)
        : route.entry((t - 0.5) * 2);
      let previous = external(0);
      for (let i = 1; i <= 400; i++) {
        const p = external(i / 400);
        assert.ok(p.x >= (width <= 760 ? 10 : 24) - 0.01, `Halo hits left edge at x=${p.x}`);
        assert.ok(p.y >= previous.y - 0.01, "Descent reverses vertically in a short viewport");
        previous = p;
      }

      if (receives) {
        assert.ok(distance(route.entry(1), { x: bar.x, y: bar.y + span }) < 0.001);
      } else {
        const waiting = { x: glassLane(neck.x, bar.x, width), y: height - 84 };
        const sectionStart = 2000;
        const target = { x: bar.x, y: sectionStart + bar.y };
        const approach = barApproach(target, waiting, sectionStart, height);
        assert.ok(approach.start >= sectionStart, "Approach starts before bridge ends");
        const parked = route.entry(1);
        assert.ok(distance({ x: parked.x, y: parked.y - span }, waiting) < 0.001);
        const from = approach.at(approach.start);
        assert.ok(distance({ x: from.x, y: from.y - approach.start }, waiting) < 0.001);
        assert.ok(distance(approach.at(approach.end), target) < 0.001);
        const near = approach.at(approach.end - 0.001);
        assert.ok(target.x > near.x, "Bar is entered from its left");
        assert.ok(Math.abs(target.y - near.y) < Math.abs(target.x - near.x) * 0.05,
          "Bar entry is not horizontal");
        // The native reading range reaches beyond the bar by its bottom padding.
        assert.ok(approach.end < sectionStart + below + 28);
      }
    });
  }
}

test("A visible bar reached by direct navigation needs no extra scroll", () => {
  const target = { x: 108, y: 2000 + 735 };
  const approach = barApproach(target, { x: 46, y: 684 }, 2000, 768);
  assert.equal(approach.start, 2000);
  assert.equal(approach.end, 2000);
  assert.deepEqual(approach.at(2000), target);
});

test("Right-hand bars also receive a horizontal arrival", () => {
  const target = { x: 280, y: 2900 };
  const approach = barApproach(target, { x: 356, y: 760 }, 2000, 844);
  const near = approach.at(approach.end - 0.001);
  assert.ok(near.x > target.x);
  assert.ok(Math.abs(target.y - near.y) < Math.abs(target.x - near.x) * 0.05);
});

for (const below of [4, 24, 90, 300]) {
  test(`mobile bar finishes at the reading end when initially ${below}px below screen`, () => {
    const sectionStart = 2000, height = 844;
    const target = { x: 112, y: sectionStart + height + below };
    const waiting = { x: 40, y: height - 84 };
    const readingEnd = sectionStart + below + 29;
    const approach = barApproach(target, waiting, sectionStart, height, readingEnd);
    assert.equal(approach.end, readingEnd);
    assert.ok(approach.start >= sectionStart);
    assert.deepEqual(approach.at(readingEnd), target);
    const start = approach.at(approach.start);
    assert.ok(distance({ x: start.x, y: start.y - approach.start }, waiting) < 0.001);
    const before = approach.at(readingEnd - 0.001);
    assert.ok(target.x > before.x);
    assert.ok(Math.abs(target.y - before.y) < Math.abs(target.x - before.x) * 0.05);
  });
}

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
    assert.ok(Math.abs(p.x - neck.x) < 0.15, JSON.stringify(p));
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
  assert.ok(Math.max(...samples.map(p => p.x)) - Math.min(...samples.map(p => p.x)) > 1);
});

for (const side of ["left", "right"] as const) {
  test(`the ${side} waiting light enters horizontally above the photos or CTA`, () => {
    const waiting = { x: side === "left" ? 14 : 361, y: 420 };
    const target = { x: side === "left" ? 38 : 335, y: 516 };
    const path = barEntry(waiting, target);
    assert.deepEqual(path(0), waiting);
    assert.deepEqual(path(1), target);
    const near = path(0.9999);
    assert.ok(Math.abs(near.y - target.y) < Math.abs(near.x - target.x) * 0.01);
    for (let i = 0; i <= 100; i++) {
      const p = path(i / 100);
      assert.ok(p.y <= target.y);
      if (Math.abs(p.x - waiting.x) > 0.01)
        assert.ok(p.y >= target.y - 24, "Turn leaves its gutter beside body text");
    }
  });
}

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
