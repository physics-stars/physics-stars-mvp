import { byDistance, clamp, mix, paced, pathLength, quintic, spline, splitRoute, type LightPath, type LightPoint, type LightSide } from "./descent-motion";
import { bridgeFrame, bridgeLength } from "./descent-scroll";

// Geometry from c473e92, the saved version before the public redesign.
function savedGlassRoute(
  body: LightPoint,
  neck: LightPoint,
  end: LightPoint,
  width: number,
  height: number,
  header: number,
  reverse = false,
  receives = true,
  pageDistance = height - header,
) {
  const target = { x: end.x, y: end.y + pageDistance };
  const space = Math.max(20, neck.x - 16);
  const lane = Math.max(18, Math.min(neck.x - Math.min(140, space * 0.95), target.x - 40));
  const radius = (neck.x - lane) / 2;
  const rise = Math.min(radius, (neck.y - header - 30) * 0.35);
  const approachLane = Math.max(12, lane - Math.min(16, (target.x - lane) * 0.25));
  const approachSway = Math.min(width <= 760 ? 12 : 20, Math.max(0, target.x - lane) * 0.4);
  const entryHandle = Math.max(0, Math.min(64, (target.x - approachLane) * 0.8));
  const leadScale = Math.min(1, Math.max(0, target.y - neck.y - rise * 2.2) / 320);
  // One C2 spline owns the entire external gesture. Scroll phases only sample
  // it; there are no separate arch/lead/wave curves to flatten at their joins.
  const controls = [
    neck,
    { x: neck.x, y: neck.y - rise * 0.3 },
    { x: neck.x - radius * 0.15, y: neck.y - rise * 0.65 },
    { x: neck.x - radius * 0.6, y: neck.y - rise * 1.1 },
    { x: neck.x - radius * 1.4, y: neck.y - rise * 1.1 },
    { x: lane + radius * 0.15, y: neck.y - rise * 0.65 },
    { x: lane, y: neck.y - rise * 0.1 },
    { x: lane, y: neck.y + rise * 0.7 },
    { x: lane, y: neck.y + rise * 2.2 },
    // Restore a broad rightward sway before the final left arc.
    { x: receives ? lane + approachSway : lane, y: target.y - 240 * leadScale },
    { x: receives ? approachLane : target.x, y: target.y - 150 * leadScale },
    ...(receives ? [
      // A broad outer arc rolls gradually into the horizontal bar.
      { x: approachLane, y: target.y - 80 * leadScale },
      { x: target.x - entryHandle, y: target.y },
      { x: target.x - entryHandle / 2, y: target.y },
    ] : [
      { x: target.x, y: target.y - 80 * leadScale },
      { x: target.x, y: target.y - 40 * leadScale },
    ]),
    target,
  ];
  const base = spline(controls);
  const clearance = Math.max(Math.min(space * 0.55, (body.y - neck.y) * 0.8), header === 68 ? neck.x - 24 : 0);
  function turnAt(path: LightPath) {
    for (let i = 1; i < (header === 68 ? 900 : 500); i++) {
      const t = i / 1000, p = path(t);
      const before = path(t - 0.0001), after = path(t + 0.0001);
      if (p.x < neck.x - clearance && after.y - before.y > Math.abs(after.x - before.x) * 1.4)
        return t;
    }
    return 0.15;
  }
  const released = turnAt(base);
  const baseLength = pathLength(base);
  const completed = receives ? 1 - Math.min(0.2, 60 / baseLength) : 1;
  const approachStart = 1 - Math.min(0.4, 280 / baseLength);
  const approachEnd = 1 - Math.min(0.18, 120 / baseLength);
  const waveAt = (t: number) => {
    const u = clamp((t - released) / (completed - released));
    const taper = receives ? 1 - smoothPosition(clamp((t - approachStart) / (approachEnd - approachStart))) : 1;
    // Finish the wave before the final approach so it remains one clean turn.
    const balance = 0.75 + 0.25 * smoothPosition(u);
    return Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * u) ** 2 * balance * taper;
  };
  // Shallower waves and a longer blend avoid a tight bend before arrival.
  let amplitude = width <= 760 ? 14 : 20;
  for (let i = 1; i < 512; i++) {
    const t = i / 512, p = base(t), wave = waveAt(t);
    if (wave < 0) amplitude = Math.min(amplitude, (p.x - 12) / -wave);
    if (wave > 0) amplitude = Math.min(amplitude, (width - 12 - p.x) / wave);
  }
  const path = byDistance(t => {
    const p = base(t);
    return { x: p.x + Math.max(0, amplitude) * waveAt(t), y: p.y };
  });
  const departure = turnAt(path);
  const arrival = receives ? 1 - Math.min(0.2, 50 / pathLength(path)) : 1;
  const pieces = splitRoute(path, departure, arrival);
  const stem = Math.max(0, body.y - neck.y);
  const mouth = stem / (stem + pathLength(path) * departure);
  const launch = (t: number) => t < mouth
    ? { x: neck.x, y: mix(body.y, neck.y, t / mouth) }
    : pieces.departure((t - mouth) / (1 - mouth));
  return reverse ? {
    departure: (t: number) => pieces.entry(1 - t),
    flight: (t: number) => pieces.flight(1 - t),
    entry: (t: number) => launch(1 - t),
    trailStart: mouth,
  } : { ...pieces, departure: launch, trailStart: mouth };
}

function savedRightRoute(
  team: LightPoint,
  pilot: LightPoint,
  width: number,
  height: number,
  header: number,
  reverse = false,
  receives = true,
  pageDistance = height - header,
) {
  // Page coordinates: the target belongs to the next section. Using its
  // resting viewport Y made a downward trip turn upward in the middle.
  const end = { x: pilot.x, y: pilot.y + pageDistance };
  const gap = Math.max(1, end.y - team.y);
  const outer = Math.max(team.x, pilot.x);
  const room = Math.max(4, width - 12 - outer);
  const lane = outer + room * 0.66;
  const drop = Math.max(24, Math.min(70, room * 0.8, gap * 0.2));
  const rise = receives ? Math.min(64, gap * 0.2) : 0;
  const leaving = { x: lane, y: team.y + drop };
  const entering = { x: receives ? lane : end.x, y: end.y - rise };
  const amplitude = Math.min(24, room * 0.23);
  const inwardSway = Math.min(13, room * 0.2);
  const leftSway = inwardSway * 0.8, rightSway = amplitude * 0.65;
  const waveSpan = Math.max(1, entering.y - leaving.y);
  const launchLean = drop * 2 * Math.PI * leftSway / waveSpan;
  const entryLean = rise * 2 * Math.PI * rightSway / waveSpan;
  const launch = byDistance(quintic(
    team,
    { x: mix(team.x, lane, 0.45), y: team.y },
    { x: mix(team.x, lane, 0.9), y: team.y },
    { x: lane + launchLean * 2 / 3, y: mix(team.y, leaving.y, 1 / 3) },
    { x: lane + launchLean / 3, y: mix(team.y, leaving.y, 2 / 3) },
    leaving,
  ));
  // Continue the same broad turn as the page starts moving. Squeezing the
  // whole turn into the few pixels below the bar produced a sharp elbow.
  let low = 0, high = 1;
  for (let i = 0; i < 28; i++) {
    const mid = (low + high) / 2;
    if (launch(mid).y <= height - 12) low = mid;
    else high = mid;
  }
  const split = Math.max(0.05, low);
  const departure = (t: number) => launch(t * split);
  const wave = byDistance((t) => ({
    x: mix(leaving.x, entering.x, smoothPosition(t)) +
      // One broad S spreads both bends across the whole descent. Its tangent
      // continues through the launch and arrival instead of flattening out.
      -mix(leftSway, rightSway, smoothPosition(t)) * Math.sin(2 * Math.PI * t),
    y: mix(leaving.y, entering.y, t),
  }));
  const bendLength = pathLength(launch) * (1 - split);
  const bend = bendLength / (bendLength + pathLength(wave));
  const flight = (t: number) => t < bend
    ? launch(mix(split, 1, t / bend))
    : wave((t - bend) / (1 - bend));
  const entry = receives ? byDistance(quintic(
    entering,
    { x: entering.x - entryLean / 3, y: mix(entering.y, end.y, 1 / 3) },
    { x: entering.x - entryLean * 2 / 3, y: mix(entering.y, end.y, 2 / 3) },
    { x: mix(end.x, entering.x, 2 / 3), y: end.y },
    { x: mix(end.x, entering.x, 1 / 3), y: end.y },
    end,
  )) : () => end;
  return reverse ? {
    departure: (t: number) => entry(1 - t),
    flight: (t: number) => flight(1 - t),
    entry: (t: number) => departure(1 - t),
  } : { departure, flight, entry };
}


const smoothPosition = (t: number) => t * t * t * (10 + t * (-15 + 6 * t));

/** Preserve the saved scroll coordinate: 140 px for departure, one pixel
 * per page pixel in flight, and 100 px for entry. No layout-based speed. */
export function landingTrajectory(source: LightPoint, neck: LightPoint, target: LightPoint,
  width: number, height: number, header: number, side: LightSide, pageDistance: number) {
  const parts: { departure: LightPath; flight: LightPath; entry: LightPath; trailStart?: number } = side === "left"
    ? savedGlassRoute(source, neck, target, width, height, header, false, true, pageDistance)
    : savedRightRoute(source, target, width, height, header, false, true, pageDistance);
  const scroll = { start: 0, end: pageDistance, exit: 140, entry: 100 };
  const length = bridgeLength(scroll);
  let timedParts = parts;
  if (side === "right") {
    const rates = [pathLength(parts.departure) / scroll.exit,
      pathLength(parts.flight) / Math.max(1, pageDistance), pathLength(parts.entry) / scroll.entry];
    const sharedSpeed = (a: number, b: number) => a + b > 0 ? 2 * a * b / (a + b) : 0;
    const leaving = sharedSpeed(rates[0], rates[1]), arriving = sharedSpeed(rates[1], rates[2]);
    timedParts = {
      ...parts,
      departure: paced(parts.departure, scroll.exit, 0, leaving),
      flight: paced(parts.flight, pageDistance, leaving, arriving),
      entry: paced(parts.entry, scroll.entry, arriving, rates[2]),
    };
  }
  function at(distance: number) {
    const frame = bridgeFrame(scroll, clamp(distance / length) * length);
    const point = frame.phase === "departure" ? timedParts.departure(frame.amount)
      : frame.phase === "flight" ? timedParts.flight(frame.amount) : timedParts.entry(frame.amount);
    return { phase: frame.phase, amount: frame.amount, camera: frame.y, point,
      visible: { x: point.x, y: point.y - frame.y } };
  }
  return { length, departureEnd: 140, flightEnd: 140 + pageDistance,
    trailStart: (parts.trailStart ?? 0) * 140,
    at, distanceAtPage: (page: number) => 140 + Math.max(0, Math.min(pageDistance, page)), speed: 1.65 };
}

export type LandingTrajectory = ReturnType<typeof landingTrajectory>;
