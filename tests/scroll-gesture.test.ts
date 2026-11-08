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

test("only a quiet gesture or its final small inertia tail yields to gravity", () => {
  const gesture = new ScrollGesture();
  gesture.read(40, 0);
  gesture.read(20, 20);
  assert.equal(gesture.settling(30), false);
  gesture.read(2, 40);
  assert.equal(gesture.settling(50), true);
  gesture.read(-2, 60);
  assert.equal(gesture.settling(70), false);
  assert.equal(gesture.settling(160), true);
});

test("the logo absorbs inertia but a renewed impulse can resume without waiting for silence", () => {
  const gesture = new ScrollGesture();
  gesture.absorbInertia(1000);
  for (const [delta, time] of [[-40, 1020], [-20, 1040], [-10, 1060], [-1, 1080]])
    assert.equal(gesture.read(delta, time), false);
  assert.equal(gesture.read(-30, 1100), true);
});

test("the logo accepts a reversal, a steady new direction and a fresh touch", () => {
  const gesture = new ScrollGesture();
  gesture.absorbInertia(1000);
  assert.equal(gesture.read(-20, 1020), false);
  assert.equal(gesture.read(5, 1040), true);
  assert.equal(gesture.read(5, 1060), true);
  assert.equal(gesture.read(-5, 1080, true), true);
});
