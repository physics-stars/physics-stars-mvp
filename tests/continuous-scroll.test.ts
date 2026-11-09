import assert from "node:assert/strict";
import test from "node:test";
import { scrollInputTarget, followVoyage, gravityTarget, maximumInputLag, nearestCenter, planetReadingCenter,
  finalReadingSpeed, finalTextOffset, finalTextOpacity, PlanetGravity, planetGravityDelay, planetGravityDuration,
  planetTextOffset, planetTextOpacity, slideGravityDelay, slideScrollSpeed, TouchMomentum, voyageProgressAt, voyageScrollDistance, voyageScrollLength,
  voyageSpeedLimit } from "../src/components/public-site/continuous-scroll";
import { barIllumination, createDescentTimeline, type DescentGeometry } from "../src/components/public-site/continuous-descent";
import { finale, visits, waypointStops } from "../src/components/public-site/voyage-timeline";
import { followScroll } from "../src/components/public-site/descent-controller";

test("scroll sensitivity and a bounded lead prevent a large gesture from creating a long queue", () => {
  const lead = slideScrollSpeed * maximumInputLag;
  assert.equal(scrollInputTarget(100, 100, 100, 0, 5000, lead), 140);
  assert.equal(scrollInputTarget(100, 140, 100000, 0, 5000, lead), 100 + lead);
  assert.equal(scrollInputTarget(110, 145, -20, 0, 5000, lead), 102);
  let actual = 100;
  const requested = scrollInputTarget(actual, actual, 100000, 0, 5000, lead);
  for (let i = 0; i < 20; i++) actual = followScroll(actual, requested, 16, slideScrollSpeed);
  assert.ok(Math.abs(actual - (100 + lead)) < 0.15);
});

test("planet gravity requires the full rendered planet, including during travel, and excludes the logo", () => {
  for (const [index, visit] of visits.entries()) {
    const center = (visit.textIn + 0.004 + visit.textOut) / 2;
    assert.equal(planetReadingCenter(visit.parked, center), null);
    assert.equal(planetReadingCenter(visit.parked, center, -1), null);
    assert.equal(planetReadingCenter(visit.arrived - 0.001, center, index), center);
    assert.equal(planetReadingCenter(visit.departure + 0.001, center, index), center);
    assert.equal(planetReadingCenter(visit.parked, visit.textOut, index), center);
    assert.ok(center > visit.textIn && center < visit.textOut);
  }
  assert.equal(planetReadingCenter(0.98, 0.98, 3), null);
});

test("planet attraction waits for quiet and follows a slow S curve without an input queue", () => {
  const gravity = new PlanetGravity(), center = 0.137;
  assert.equal(gravity.target(0.05, 0.05, center, 16, planetGravityDelay - 1), 0.05);
  let actual = 0.05;
  const deltas: number[] = [];
  for (let time = 0; time < planetGravityDuration; time += 16) {
    const next = gravity.target(actual, actual, center, 16, planetGravityDelay + time);
    assert.ok(next >= actual && next <= center);
    deltas.push(next - actual); actual = next;
  }
  assert.ok(deltas[0] < deltas[Math.floor(deltas.length / 2)] / 20);
  assert.ok(deltas.at(-1)! < deltas[Math.floor(deltas.length / 2)] / 20);
  assert.ok(Math.abs(actual - center) < 0.000001);
  assert.equal(gravity.target(0.12, 0.125, center, 16, 0), 0.125);
  assert.equal(gravity.target(0.12, 0.125, null, 16, 1000), 0.125);
});

test("only the reading space after logo formation is doubled and the mapping is reversible", () => {
  assert.ok(Math.abs(voyageScrollLength - 1.045) < 0.0000001);
  assert.ok(Math.abs(voyageScrollDistance(1) - voyageScrollDistance(finale.sealed) - 2 * (1 - finale.sealed)) < 0.0000001);
  for (const p of [0, 0.1, 0.5, finale.sealed, 0.97, 1, 1.05]) {
    assert.ok(Math.abs(voyageProgressAt(voyageScrollDistance(p)) - p) < 0.0000001);
    if (p <= finale.sealed) assert.equal(voyageScrollDistance(p), p);
  }
});

test("text drifts monotonically through its reading interval and gravity selects its movement's midpoint", () => {
  visits.forEach((visit, index) => {
    const start = visit.textIn + 0.004, end = visit.textOut;
    const center = planetReadingCenter((start + end) / 2, (start + end) / 2, index)!;
    assert.equal(planetTextOffset(visit.parked, index), 8);
    assert.equal(planetTextOffset(visit.departure, index), 0);
    assert.ok(planetTextOffset(start, index) < 8 && planetTextOffset(end, index) > 0);
    assert.ok(Math.abs(planetTextOffset(center, index) - 4) < 0.000001);
    assert.equal(planetTextOffset(visit.departure + 0.01, index), 0);
    const entering = planetTextOffset((visit.parked + start) / 2, index);
    const leaving = planetTextOffset((end + visit.departure) / 2, index);
    assert.ok(entering < 7.1 && entering > 6.5, "The rise must already be visible during the entrance fade");
    assert.ok(leaving < 1.1 && leaving > 0.5, "The rise must continue during the exit fade");
    let previous = 9;
    for (let i = 0; i <= 100; i++) {
      const offset = planetTextOffset(start + (end - start) * i / 100, index);
      assert.ok(offset < previous || i === 0);
      previous = offset;
    }
  });
});

test("planet fades follow their original timing while the final text fades in and remains visible", () => {
  visits.forEach((visit, index) => {
    const readable = visit.textIn + 0.004;
    assert.equal(planetTextOpacity(visit.parked, index), 0);
    assert.ok(Math.abs(planetTextOpacity(visit.parked + (readable - visit.parked) / 4, index) - 0.25) < 0.000001);
    assert.ok(Math.abs(planetTextOpacity((visit.parked + readable) / 2, index) - 0.5) < 0.000001);
    assert.equal(planetTextOpacity(readable, index), 1);
    assert.equal(planetTextOpacity(visit.textOut, index), 1);
    assert.ok(Math.abs(planetTextOpacity((visit.textOut + visit.departure) / 2, index) - 0.5) < 0.000001);
    assert.equal(planetTextOpacity(visit.departure, index), 0);
    assert.equal(planetTextOpacity(visit.departure + 0.01, index), 0);
  });
  assert.equal(finalTextOpacity(finale.sealed), 0);
  assert.ok(Math.abs(finalTextOpacity(finale.sealed + 0.004) - 0.5) < 0.000001);
  assert.equal(finalTextOpacity(waypointStops.at(-1)!), 1);
  assert.equal(finalTextOpacity(0.996), 1);
  assert.equal(finalTextOpacity(1), 1);
  assert.equal(finalTextOpacity(1.1), 1);
});

test("the final text has a readable interval and only rises to its original baseline", () => {
  assert.ok((1 - finale.sealed) / finalReadingSpeed > 1);
  assert.ok((1 - waypointStops.at(-1)!) / finalReadingSpeed >= 0.5);
  assert.equal(finalTextOffset(finale.sealed), 4);
  assert.equal(finalTextOffset(1), 0);
  assert.equal(finalTextOffset(1.1), 0);
  assert.ok(finalTextOffset(finale.sealed + 0.004) < 3.5);
  assert.ok(finalTextOffset(0.996) > 0.4);
});

test("small gravity corrections ease toward the target without snapping the remaining distance", () => {
  const planet = followVoyage(0.137 - 0.00002, 0.137, 0, 16);
  assert.ok(planet.position > 0.137 - 0.00002 && planet.position < 0.137);
  const slide = followScroll(100, 100.2, 16, slideScrollSpeed);
  assert.ok(slide > 100 && slide < 100.2);
  const onset = gravityTarget(100, 100, 150, 16, slideGravityDelay + 16, 64);
  const moving = gravityTarget(100, 100, 150, 16, slideGravityDelay + 320, 64);
  assert.ok(onset > 100 && onset - 100 < (moving - 100) / 100);
});

test("gravity yields to current input and a long coasting queue, then approaches from either side", () => {
  assert.equal(gravityTarget(100, 110, 150, 16, 30, 64), 110);
  assert.equal(gravityTarget(100, 200, 150, 16, 500, 64), 200);
  assert.equal(gravityTarget(100, 110, null, 16, 500, 64), 110);
  assert.equal(gravityTarget(100, 110, 150, 16, slideGravityDelay - 1, 64), 110);
  const before = gravityTarget(100, 100, 150, 16, 500, 64);
  const after = gravityTarget(200, 200, 150, 16, 500, 64);
  assert.ok(before > 100 && before < 150);
  assert.ok(after < 200 && after > 150);
  assert.ok(Math.abs((before - 100) - (200 - after)) < 0.000001);
  assert.equal(nearestCenter(165, [100, 200, 300]), 200);
  const normalized = gravityTarget(0.146, 0.146, 0.137, 16, 500, 0.012);
  assert.ok(normalized > 0.137 && normalized < 0.146);
});

test("a queue beyond the logo crosses its end at speed instead of braking to zero", () => {
  let actual = 0.998, velocity = 0.26, crossed = false;
  for (let i = 0; i < 10; i++) {
    const next = followVoyage(actual, 1.2, velocity, 16);
    assert.ok(next.position >= actual && next.position - actual <= 0.26 * 0.016 + 0.000001);
    actual = next.position; velocity = next.velocity;
    if (next.unbounded >= 1) { crossed = true; assert.ok(velocity > 0.02); break; }
  }
  assert.equal(crossed, true);
});

test("planet texts retain their original scroll interval without an artificial slow reading cap", () => {
  for (const visit of visits) {
    let duration = 0;
    for (let p = visit.textIn + 0.004; p < visit.textOut; p += 0.0001) {
      const speed = voyageSpeedLimit(p);
      assert.ok(speed > 0 && speed <= 0.337);
      duration += 0.0001 / speed;
    }
    assert.ok(duration > 0 && duration < 0.5, String(duration));
    assert.ok(voyageSpeedLimit((visit.textIn + visit.textOut) / 2) > 0.2);
  }
});

const section = (start: number, end: number, x: number, y: number) => ({ start, end,
  left: { x, y }, right: { x: 1280 - x, y }, neck: { x, y: y - 70 } });
const geometry: DescentGeometry = { width: 1280, height: 720, header: 76, logoEnd: 4612, footerTop: 7207,
  sections: [section(5256, 5256, 174, 5925), section(5900, 5900, 100, 6320), section(6547, 6547, 900, 7170)] };

test("the saved curves have continuous camera positions through extended illuminated zones", () => {
  const timeline = createDescentTimeline(geometry);
  let page = geometry.logoEnd;
  for (let p = 0; p <= timeline.length; p += 0.5) {
    const state = timeline.at(p);
    assert.ok(state.page >= page - 0.001);
    page = state.page;
  }
  assert.ok(Math.abs(timeline.at(timeline.length).page - geometry.sections[2].end) < 0.001);
  const resident = timeline.segments.find(s => s.kind === "resident" && s.index === 1)!;
  assert.ok(resident.pageStart < geometry.sections[1].end);
  assert.ok(resident.pageEnd > geometry.sections[1].end);
  for (const offset of [-40, 0, 40]) {
    const axis = timeline.positionAtPage(geometry.sections[1].end + offset);
    assert.equal(timeline.at(axis).segment.kind, "resident");
    assert.equal(timeline.at(axis).segment.index, 1);
  }
});

test("camera movement and gravity centers are independent of light departure and entry phases", () => {
  const timeline = createDescentTimeline(geometry);
  for (const segment of timeline.segments.filter(s => s.journey)) {
    const departing = timeline.at(segment.from + 10);
    assert.equal(departing.frame?.phase, "departure");
    assert.ok(departing.page > segment.pageStart);
    const entering = timeline.at(segment.to - 10);
    assert.equal(entering.frame?.phase, "entry");
    assert.ok(entering.page < segment.pageEnd);
    assert.equal(timeline.at(segment.to - 5).page - entering.page, 5);
  }
  geometry.sections.forEach((section, i) =>
    assert.equal(timeline.centers[i + 1], (section.start + section.end) / 2 - geometry.logoEnd));
});

test("mobile return leaves the team line sooner while preserving reception and the camera coordinate", () => {
  for (const [width, height, teamStart, teamEnd, teamY] of [
    [390, 844, 7610, 7610, 8239],
    [320, 568, 5794, 6065, 6446],
  ]) {
    const mobile: DescentGeometry = { width, height, header: 68, logoEnd: teamStart - 1800, footerTop: teamY + 833,
      sections: [
        { start: teamStart - 1200, end: teamStart - 800,
          left: { x: 160, y: teamStart - 400 }, right: { x: 160, y: teamStart - 400 }, neck: { x: 160, y: teamStart - 470 } },
        { start: teamStart, end: teamEnd,
          left: { x: 30, y: teamY }, right: { x: width - 30, y: teamY }, neck: { x: width / 2, y: teamY - 70 } },
        { start: teamEnd + 776, end: teamEnd + 900,
          left: { x: 30, y: teamY + 800 }, right: { x: width - 30, y: teamY + 800 }, neck: { x: width / 2, y: teamY + 730 } },
      ] };
    const forward = createDescentTimeline(mobile), returning = createDescentTimeline(mobile, true);
    const reception = forward.segments.find(s => s.kind === "charge" && s.index === 1)!;
    const exit = returning.segments.find(s => s.kind === "charge" && s.index === 1)!;
    assert.ok(exit.pageStart > reception.pageStart + 40);
    assert.ok(exit.pageStart - reception.pageStart <= 96);
    assert.equal(exit.pageEnd - exit.pageStart, reception.pageEnd - reception.pageStart);
    assert.equal(forward.at(forward.positionAtPage(teamEnd)).segment.kind, "resident");
    assert.equal(returning.at(returning.positionAtPage(teamEnd)).segment.kind, "resident");
    assert.equal(returning.length, forward.length);
    assert.deepEqual(returning.centers, forward.centers);
    for (let p = 0; p <= forward.length; p += 17) {
      assert.ok(Math.abs(forward.at(p).page - returning.at(p).page) < 0.001);
    }
  }
  const desktop = createDescentTimeline(geometry), desktopReturn = createDescentTimeline(geometry, true);
  assert.deepEqual(desktopReturn.segments.map(s => [s.kind, s.pageStart, s.pageEnd]),
    desktop.segments.map(s => [s.kind, s.pageStart, s.pageEnd]));
});

test("slide gravity only acts between slides and never inside a tall reading range", () => {
  const tall = { ...geometry, sections: geometry.sections.map((s, i) => i === 0 ? { ...s, end: s.start + 400 } : s) };
  const timeline = createDescentTimeline(tall);
  const top = timeline.positionAtPage(tall.sections[0].start);
  const bottom = timeline.positionAtPage(tall.sections[0].end);
  assert.ok(timeline.centers.includes(top) && timeline.centers.includes(bottom));
  assert.ok(!timeline.centers.includes((top + bottom) / 2));
  assert.equal(nearestCenter(top + 40, timeline.centers), top);
  assert.equal(nearestCenter(bottom - 40, timeline.centers), bottom);
  assert.equal(timeline.gravityCenter(top + 40), null);
  assert.equal(timeline.gravityCenter((top + bottom) / 2), null);
  assert.equal(timeline.gravityCenter(bottom - 40), null);
  assert.equal(timeline.gravityCenter(top), null);
  assert.equal(timeline.gravityCenter(bottom), null);
  assert.equal(timeline.gravityCenter(top - 40), top);
  assert.equal(timeline.gravityCenter(bottom + 40), bottom);
});

test("the contact line finishes lighting before the purple footer becomes visible", () => {
  for (const gap of [33, 37, 65]) {
    const g = { ...geometry, footerTop: geometry.sections[2].right.y + gap };
    const timeline = createDescentTimeline(g);
    const charge = timeline.segments.find(s => s.kind === "charge" && s.index === 2)!;
    assert.ok(charge.pageStart > g.sections[2].right.y - g.height);
    assert.ok(charge.pageEnd < g.footerTop - g.height);
    const state = timeline.at(timeline.positionAtPage(g.footerTop - g.height));
    assert.equal(state.segment.kind, "resident");
    assert.equal(state.segment.index, 2);
  }
});

test("touch release carries recent velocity and does not replay a finger held still", () => {
  const touch = new TouchMomentum();
  touch.start(0); touch.move(60, 16); touch.move(80, 32);
  const release = touch.release(40);
  assert.ok(release > 20 && release <= 100);
  touch.start(100); touch.move(-60, 116);
  assert.ok(touch.release(120) < 0);
  touch.start(200); touch.move(80, 216);
  assert.equal(touch.release(400), 0);
});

test("bar charge and discharge remain monotone and reversible along the light sweep", () => {
  const timeline = createDescentTimeline(geometry);
  for (const segment of timeline.segments.filter(s => s.kind === "charge" || s.kind === "discharge")) {
    for (const ratio of [0, 0.1, 0.3, 0.5, 0.8, 1]) {
      const local = (segment.to - segment.from) * ratio;
      const frame = barIllumination(segment, local);
      assert.ok(frame.power >= 0 && frame.power <= 1);
      assert.equal(frame.side, segment.side);
      const later = barIllumination(segment, Math.min(segment.to - segment.from, local + 1));
      if (segment.kind === "charge") assert.ok(later.power >= frame.power);
      else assert.ok(later.power <= frame.power);
    }
  }
});
