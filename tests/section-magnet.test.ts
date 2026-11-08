import assert from "node:assert/strict";
import test from "node:test";
import { sectionTransition } from "../src/components/public-site/section-magnet";

const sections = [
  { top: 80, bottom: 800 },
  { top: 800, bottom: 2400 },
  { top: 2400, bottom: 4000 },
  { top: 4000, bottom: 4720 },
];
const transition = (y: number) => sectionTransition(y, sections, 800, 80);

test("every reading position in a tall section remains free", () => {
  for (let y = 720; y <= 1600; y += 10) assert.equal(transition(y), null);
  for (let y = 2320; y <= 3200; y += 10) assert.equal(transition(y), null);
});

test("a transition starts at the last reading screen of a tall section", () => {
  assert.equal(transition(1700)?.start, 1600);
  assert.equal(transition(1700)?.end, 2320);
});

test("visibility progress does not depend on the direction of arrival", () => {
  assert.ok(transition(1961)!.amount > 0.5);
  assert.ok(transition(1959)!.amount < 0.5);
  assert.ok(transition(1961)!.amount > 0.5);
});

test("the intro boundary uses the same visibility progress", () => {
  assert.equal(transition(150)?.start, 0);
  assert.equal(transition(550)?.end, 720);
});

test("transition progress depends on position, never gesture history", () => {
  const sample = (y: number) => sectionTransition(y, sections, 800, 80)?.amount;
  assert.equal(sample(1780), 0.25);
  assert.equal(sample(2140), 0.75);
  assert.equal(sample(1780), 0.25);
  assert.equal(sample(1600), undefined);
  assert.equal(sample(2320), undefined);
});

test("fractional section edges tolerate browser pixel rounding", () => {
  const fractional = [{ top: 80, bottom: 2400.75 }, { top: 2400.75, bottom: 4000 }];
  assert.equal(sectionTransition(1601, fractional, 800, 80), null);
  assert.equal(sectionTransition(2320, fractional, 800, 80), null);
});
