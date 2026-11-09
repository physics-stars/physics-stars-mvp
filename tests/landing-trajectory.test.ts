import assert from "node:assert/strict";
import test from "node:test";
import { landingTrajectory } from "../src/components/public-site/landing-trajectory";

for (const [width, height, header] of [[1440, 900, 76], [390, 600, 68]] as const) {
  for (const side of ["left", "right"] as const) {
    test(`${width}px ${side} reference curve joins its receiver without a corner`, () => {
      const source = { x: side === "left" ? (width > 760 ? 186 : 102) : width - 42, y: side === "left" ? height - 65 : height * .6 };
      const neck = { x: source.x, y: source.y - 58 };
      const target = { x: side === "left" ? (width > 760 ? 108 : 42) : width - 44, y: height - 120 };
      const route = landingTrajectory(source, neck, target, width, height, header, side, height - header);
      const start = route.at(0).visible, end = route.at(route.length).visible;
      assert.ok(Math.hypot(start.x - source.x, start.y - source.y) < .001);
      assert.ok(Math.hypot(end.x - target.x, end.y - target.y) < .001);
      const near = route.at(route.length - .001).visible;
      assert.ok(Math.abs(near.y - end.y) < Math.abs(near.x - end.x) * .01);
      assert.equal(route.departureEnd, 140);
      assert.equal(route.flightEnd, 140 + height - header);
      assert.equal(route.at(164).camera, 24);
      for (const join of [route.departureEnd, route.flightEnd]) {
        const a = route.at(join - .001).point, b = route.at(join).point, c = route.at(join + .001).point;
        const dot = (b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y);
        assert.ok(dot / (Math.hypot(b.x-a.x,b.y-a.y)*Math.hypot(c.x-b.x,c.y-b.y)) > .999);
      }
    });
  }
}
