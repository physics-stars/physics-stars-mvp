import assert from "node:assert/strict";
import test from "node:test";
import { Vector3 } from "three";
import { voyageComposition } from "../src/components/public-site/voyage-layout";
import { createVoyageMotion } from "../src/components/public-site/voyage-motion";

test("portrait phones and tablets stack, while low landscape windows keep two columns", () => {
  for (const [w, h] of [[320, 500], [390, 776], [768, 948]])
    assert.equal(voyageComposition(w, h).stacked, true);
  for (const [w, h] of [[1440, 924], [1366, 692], [1024, 524], [844, 314], [667, 307]])
    assert.equal(voyageComposition(w, h).stacked, false);
  assert.equal(voyageComposition(1024, 524).short, true);
  assert.equal(voyageComposition(1366, 692).short, false);
});

test("the portrait scene leaves room for the full copy and caps its height on tall phones", () => {
  for (const [w, h, copy] of [[320, 500, 220], [390, 776, 250], [768, 948, 300], [320, 1300, 260]]) {
    const layout = voyageComposition(w, h, copy);
    assert.ok(layout.copyTop + copy <= h - 70);
    assert.ok(layout.sceneHeight <= w * 1.1);
  }
});

test("portrait orientation follows the projected curve even when camera velocity dominates", () => {
  const motion = createVoyageMotion(true, new Vector3(242, 0.45, 0), new Vector3(20, 30, 0), 48,
    undefined, undefined, { halfWidth: 0.35, halfHeight: 0.384 });
  for (const p of [0.03, 0.07, 0.2, 0.39, 0.57, 0.76]) {
    const before = motion.projectedAt(p - 0.000001, new Vector3());
    const after = motion.projectedAt(p + 0.000001, new Vector3());
    const actual = after.sub(before).setZ(0).normalize();
    const heading = motion.projectedTangentAt(p, new Vector3()).normalize();
    assert.ok(actual.dot(heading) > 0.99999);
  }
});

test("the approved desktop trajectory retains its positions from the backup commit", () => {
  const motion = createVoyageMotion(false, new Vector3(242, 2.1, 0), new Vector3(20, 30, 0), 48);
  const samples = [
    [0.01, [5.052191654424673, 1.5659621177404952, -1.317353804162686]],
    [0.04, [54.54368610190741, 0.08163969485470561, 0.10999909939564939]],
    [0.085, [45.47294277287373, 3.388595846650124, 2.594088958862335]],
    [0.39, [140.78995701749113, 4.327680611299363, -0.9415550956457389]],
    [0.575, [195.8266260420197, 2.3892741324163604, -2.0604825117647385]],
    [0.8, [241.50146515492088, 1.3181773922051148, 0.014319652972444044]],
    [0.819, [241.9800152054061, 2.0699804123670096, 5.435116665168999e-7]],
  ] as const;
  for (const [p, expected] of samples)
    assert.ok(motion.positionAt(p, new Vector3()).distanceTo(new Vector3(...expected)) < 1e-10);
});
