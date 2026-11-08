import assert from "node:assert/strict";
import test from "node:test";
import { ScrollGesture } from "../src/components/public-site/scroll-gesture";

test("an inertia tail never unlocks by accumulating ignored scroll", () => {
  const gesture = new ScrollGesture();
  gesture.read(100, 0);
  assert.equal(gesture.read(90, 20), false);
  for (let i = 2; i < 100; i++)
    assert.equal(gesture.read(90, i * 20), false);
  assert.equal(gesture.read(5, 2200), true);
});

test("a gradual decay stays ignored through the end of an animation", () => {
  const gesture = new ScrollGesture();
  let amount = 100;
  gesture.read(amount, 0);
  for (let i = 1; i <= 150; i++) {
    amount *= 0.98;
    assert.equal(gesture.read(amount, i * 20), false);
  }
  assert.equal(gesture.read(40, 3020), true);
});

test("continued steady input can resume without a break between events", () => {
  const gesture = new ScrollGesture();
  for (let i = 0; i < 100; i++)
    assert.equal(gesture.read(10, i * 20), true);
});

test("a reversal and a new touch or key press act on their own input", () => {
  const gesture = new ScrollGesture();
  gesture.read(100, 0);
  assert.equal(gesture.read(80, 20), false);
  assert.equal(gesture.read(-5, 40), true);
  assert.equal(gesture.read(-3, 60, false), false);
  assert.equal(gesture.read(-1, 80, true), true);
  assert.equal(gesture.read(-1, 100, false), true);
});

test("zero input cannot unlock or reset a decaying gesture", () => {
  const gesture = new ScrollGesture();
  gesture.read(100, 0);
  gesture.read(90, 20);
  assert.equal(gesture.read(0, 40, true), false);
  assert.equal(gesture.read(90, 60), false);
});
