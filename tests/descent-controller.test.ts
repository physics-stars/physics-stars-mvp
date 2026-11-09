import assert from "node:assert/strict";
import test from "node:test";
import { followScroll, scrollTarget } from "../src/components/public-site/descent-controller";

test("a multi-screen wheel delta stops at the first reading boundary", () => {
  assert.equal(scrollTarget(120, 8000, 0, 750), 750);
  assert.equal(scrollTarget(620, -8000, 0, 750), 0);
});

test("a fling advances monotonically, with a bounded step, and reaches its stop", () => {
  let actual = 0;
  for (let i = 0; i < 200; i++) {
    const next = followScroll(actual, 750, 16);
    assert.ok(next >= actual && next <= 750);
    assert.ok(next - actual <= 26.4 + 0.0001);
    actual = next;
  }
  assert.equal(actual, 750);
});

test("reversing a request does not replay the old forward queue", () => {
  const current = 240;
  const reversed = scrollTarget(current, -120, 0, 750);
  assert.ok(followScroll(current, reversed, 16) < current);
});
