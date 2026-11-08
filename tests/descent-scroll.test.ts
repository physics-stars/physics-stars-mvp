import assert from "node:assert/strict";
import test from "node:test";
import { bridgeFrame, bridgeLength, bridgeStop } from "../src/components/public-site/descent-scroll";

const bridge = { start: 1000, end: 1800, exit: 140, entry: 100 };

test("initial scroll moves the light before moving the page", () => {
  assert.deepEqual(bridgeFrame(bridge, 70), { y: 1000, phase: "departure", amount: 0.5 });
  assert.equal(bridgeStop(bridge, 70), 0);
  assert.deepEqual(bridgeFrame(bridge, 0), { y: 1000, phase: "departure", amount: 0 });
});

test("page scroll starts exactly after the exit, without replayed distance", () => {
  assert.deepEqual(bridgeFrame(bridge, 180), { y: 1040, phase: "flight", amount: 0.05 });
  assert.deepEqual(bridgeFrame(bridge, 540), { y: 1400, phase: "flight", amount: 0.5 });
});

test("the reverse exit at the other end also holds the page in place", () => {
  assert.equal(bridgeLength(bridge), 1040);
  assert.deepEqual(bridgeFrame(bridge, 990), { y: 1800, phase: "entry", amount: 0.5 });
  assert.equal(bridgeStop(bridge, 990), 1040);
});

test("the same scroll progress always produces the same point, in either direction", () => {
  const before = bridgeFrame(bridge, 320);
  bridgeFrame(bridge, 900);
  assert.deepEqual(bridgeFrame(bridge, 320), before);
  bridgeFrame(bridge, 0);
  assert.deepEqual(bridgeFrame(bridge, 320), before);
});

test("offscreen containers have no invisible exit or entry to wait for", () => {
  const hidden = { start: 1000, end: 1800, exit: 0, entry: 0 };
  assert.deepEqual(bridgeFrame(hidden, 40), { y: 1040, phase: "flight", amount: 0.05 });
  assert.equal(bridgeLength(hidden), 800);
});

test("the magnet follows the visible majority, independently of direction", () => {
  assert.equal(bridgeStop(bridge, 539), 0);
  assert.equal(bridgeStop(bridge, 541), 1040);
});

test("real viewport visibility decides even when the light playhead differs", () => {
  assert.equal(bridgeStop(bridge, 900, 1200), 0);
  assert.equal(bridgeStop(bridge, 200, 1600), 1040);
});

test("an exact half keeps the section of origin until the majority changes", () => {
  assert.equal(bridgeStop({ ...bridge, origin: 0 }, 540, 1400), 0);
  assert.equal(bridgeStop({ ...bridge, origin: 1 }, 540, 1400), 1040);
  assert.equal(bridgeStop({ ...bridge, origin: 1 }, 540, 1399), 0);
  assert.equal(bridgeStop({ ...bridge, origin: 0 }, 540, 1401), 1040);
});
