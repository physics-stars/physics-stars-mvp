export type LightPoint = { x: number; y: number };
export type LightPath = (t: number) => LightPoint;
export type LightSide = "left" | "right";

/** One clamped cubic B-spline, including the exit and approach. Its curvature
 * stays continuous through every control point; it never joins little hooks. */
export function spline(controls: LightPoint[]): LightPath {
  const count = controls.length,
    degree = Math.min(3, count - 1);
  const knots = Array.from({ length: count + degree + 1 }, (_, i) =>
    i <= degree ? 0 : i >= count ? 1 : (i - degree) / (count - degree),
  );
  return byDistance((t) => {
    const u = clamp(t);
    if (u === 1) return { ...controls[count - 1] };
    let span = degree;
    while (span < count - 1 && knots[span + 1] <= u) span++;
    const d = Array.from({ length: degree + 1 }, (_, i) => ({
      ...controls[span - degree + i],
    }));
    for (let r = 1; r <= degree; r++)
      for (let j = degree; j >= r; j--) {
        const i = span - degree + j,
          q = (u - knots[i]) / (knots[i + degree - r + 1] - knots[i] || 1);
        d[j] = { x: mix(d[j - 1].x, d[j].x, q), y: mix(d[j - 1].y, d[j].y, q) };
      }
    return d[degree];
  });
}

export function splitRoute(
  path: LightPath,
  departure: number,
  arrival: number,
  reverse = false,
) {
  const pieces = [
    (t: number) => path(t * departure),
    (t: number) => path(mix(departure, arrival, t)),
    (t: number) => path(mix(arrival, 1, t)),
  ];
  return reverse
    ? {
        departure: (t: number) => pieces[2](1 - t),
        flight: (t: number) => pieces[1](1 - t),
        entry: (t: number) => pieces[0](1 - t),
      }
    : { departure: pieces[0], flight: pieces[1], entry: pieces[2] };
}

/** Keep the halo in the content gutter, using the real bar even when it is
 * below the viewport. A temporary waiting point must never set this lane. */
export function glassLane(neckX: number, barX: number, width: number, mobile = width <= 760) {
  if (mobile) return 18;
  const inset = Math.min(40, Math.max(28, width * 0.025));
  const space = Math.max(20, neckX - 16);
  return Math.max(inset, Math.min(neckX - Math.min(140, space * 0.95), barX - 40));
}

/** The page is already at its reading end. Approach from above the bar,
 * finishing horizontally without crossing the photos or CTA. */
export function barEntry(waiting: LightPoint, target: LightPoint): LightPath {
  const handle = Math.abs(waiting.x - target.x);
  const sign = waiting.x <= target.x ? -1 : 1;
  const rise = Math.min(48, Math.max(24, handle), Math.max(0, target.y - waiting.y));
  const corner = { x: waiting.x, y: target.y - rise };
  const turn = byDistance(quintic(
    corner,
    { x: waiting.x, y: corner.y + rise / 3 },
    { x: waiting.x, y: corner.y + rise * 2 / 3 },
    { x: target.x + sign * handle * 2 / 3, y: target.y },
    { x: target.x + sign * handle / 3, y: target.y },
    target,
  ));
  const vertical = Math.max(0, corner.y - waiting.y);
  const split = vertical / (vertical + pathLength(turn) || 1);
  return byDistance(t => t < split
    ? { x: waiting.x, y: mix(waiting.y, corner.y, t / split) }
    : turn((t - split) / (1 - split || 1)));
}

/** Native scrolling owns a tall section. Begin at or after the bridge ends,
 * and finish only when the real bar can be seen, with a horizontal tangent. */
export function barApproach(
  target: LightPoint,
  waiting: LightPoint,
  sectionStart: number,
  height: number,
  finishAt?: number,
) {
  const end = Math.max(sectionStart, target.y - height + 2, finishAt ?? -Infinity);
  const start = Math.max(sectionStart, finishAt === undefined ? target.y - height - 100 : end - 102);
  const from = { x: waiting.x, y: start + waiting.y };
  const sign = waiting.x <= target.x ? -1 : 1;
  const handle = Math.min(40, Math.abs(waiting.x - target.x) * 0.65);
  const drop = Math.min(60, Math.max(0, target.y - from.y) / 3);
  const path = byDistance(quintic(
    from,
    { x: from.x, y: from.y + drop },
    { x: from.x, y: from.y + drop * 2 },
    { x: target.x + sign * handle, y: target.y },
    { x: target.x + sign * handle / 2, y: target.y },
    target,
  ));
  return {
    start,
    end,
    at: (y: number) => end === start ? target : path(clamp((y - start) / (end - start))),
  };
}

export function glassRoute(
  body: LightPoint,
  neck: LightPoint,
  end: LightPoint,
  width: number,
  height: number,
  header: number,
  reverse = false,
  receives = true,
  pageDistance = height - header,
  waiting = { x: glassLane(neck.x, end.x, width), y: height - 84 },
  mobile = width <= 760,
) {
  const lane = glassLane(neck.x, end.x, width, mobile);
  const destination = receives ? end : waiting;
  const target = { x: destination.x, y: destination.y + pageDistance };
  const space = Math.max(20, neck.x - 16);
  const radius = (neck.x - lane) / 2;
  const rise = Math.min(radius, (neck.y - header - 30) * 0.35);
  const entryHandle = Math.max(0, Math.min(40, (target.x - lane) * 0.8));
  const leadScale = Math.min(1, Math.max(0, target.y - neck.y - rise * 2.2) / 320);
  // One C2 spline owns the entire external gesture. Scroll phases only sample
  // it; there are no separate arch/lead/wave curves to flatten at their joins.
  const stem = Math.max(0, body.y - neck.y);
  const controls = [
    body,
    { x: neck.x, y: body.y - stem / 3 },
    { x: neck.x, y: neck.y + stem / 3 },
    neck,
    { x: neck.x, y: neck.y - rise * 0.3 },
    { x: neck.x - radius * 0.15, y: neck.y - rise * 0.65 },
    { x: neck.x - radius * 0.6, y: neck.y - rise * 1.1 },
    { x: neck.x - radius * 1.4, y: neck.y - rise * 1.1 },
    { x: lane + radius * 0.15, y: neck.y - rise * 0.65 },
    { x: lane, y: neck.y - rise * 0.1 },
    { x: lane, y: neck.y + rise * 0.7 },
    { x: lane, y: neck.y + rise * 2.2 },
    { x: lane, y: target.y - 240 * leadScale },
    { x: receives ? lane : target.x, y: target.y - 120 * leadScale },
    ...(receives ? [
      { x: lane, y: target.y - 60 * leadScale },
      { x: target.x - entryHandle, y: target.y },
      { x: target.x - entryHandle / 2, y: target.y },
    ] : [
      { x: target.x, y: target.y - 80 * leadScale },
      { x: target.x, y: target.y - 40 * leadScale },
    ]),
    target,
  ];
  const base = spline(controls);
  const clearance = Math.min(space * 0.55, (body.y - neck.y) * 0.8);
  function turnAt(path: LightPath) {
    for (let i = 1; i < 500; i++) {
      const t = i / 1000, p = path(t);
      const before = path(t - 0.0001), after = path(t + 0.0001);
      if (p.x < neck.x - clearance && after.y - before.y > Math.abs(after.x - before.x) * 1.4)
        return t;
    }
    return 0.15;
  }
  const released = turnAt(base);
  const completed = receives ? 1 - Math.min(0.2, 60 / pathLength(base)) : 1;
  const waveAt = (t: number) => {
    const u = clamp((t - released) / (completed - released));
    return flowingWave(u);
  };
  // The mobile gutter also has to fit the halo beside portraits, not just text.
  const edge = mobile ? 10 : 24;
  let amplitude = mobile ? 6.5 : 32;
  for (let i = 1; i < 512; i++) {
    const t = i / 512, p = base(t), wave = waveAt(t);
    if (wave < 0) amplitude = Math.min(amplitude, (p.x - edge) / -wave);
    if (wave > 0) amplitude = Math.min(amplitude, (width - edge - p.x) / wave);
  }
  const path = byDistance(t => {
    const p = base(t);
    return { x: p.x + Math.max(0, amplitude) * waveAt(t), y: p.y };
  });
  const departure = turnAt(path);
  const arrival = receives ? 1 - Math.min(0.2, 50 / pathLength(path)) : 1;
  const pieces = splitRoute(path, departure, arrival);
  let mouth = 0;
  for (let i = 1; i <= 512; i++) {
    const t = i / 512;
    if (pieces.departure(t).y <= neck.y) { mouth = t; break; }
  }
  return reverse ? {
    departure: (t: number) => pieces.entry(1 - t),
    flight: (t: number) => pieces.flight(1 - t),
    entry: (t: number) => pieces.departure(1 - t),
    trailStart: mouth,
  } : { ...pieces, trailStart: mouth };
}

export function rightRoute(
  team: LightPoint,
  pilot: LightPoint,
  width: number,
  height: number,
  header: number,
  reverse = false,
  receives = true,
  pageDistance = height - header,
  mobile = width <= 760,
) {
  // Page coordinates: the target belongs to the next section. Using its
  // resting viewport Y made a downward trip turn upward in the middle.
  const end = { x: pilot.x, y: pilot.y + pageDistance };
  const gap = Math.max(1, end.y - team.y);
  const outer = Math.max(team.x, pilot.x);
  const room = Math.max(4, width - 12 - outer);
  const lane = receives ? rightLane(team.x, pilot.x, width, mobile) : pilot.x;
  const drop = Math.max(16, Math.min(46, Math.abs(lane - team.x) * 0.8, gap * 0.2));
  const rise = receives ? Math.min(64, gap * 0.2) : 0;
  const leaving = { x: lane, y: team.y + drop };
  const entering = { x: receives ? lane : end.x, y: end.y - rise };
  const launch = byDistance(quintic(
    team,
    { x: mix(team.x, lane, 1 / 3), y: team.y },
    { x: mix(team.x, lane, 2 / 3), y: team.y },
    { x: lane, y: mix(team.y, leaving.y, 1 / 3) },
    { x: lane, y: mix(team.y, leaving.y, 2 / 3) },
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
  const amplitude = mobile ? 6.5 : Math.min(26, room * 0.5);
  const wave = byDistance((t) => ({
    x: mix(leaving.x, entering.x, smoothPosition(t)) +
      amplitude * flowingWave(t),
    y: mix(leaving.y, entering.y, t),
  }));
  const bendLength = pathLength(launch) * (1 - split);
  const bend = bendLength / (bendLength + pathLength(wave));
  const flight = (t: number) => t < bend
    ? launch(mix(split, 1, t / bend))
    : wave((t - bend) / (1 - bend));
  const entry = receives ? byDistance(quintic(
    entering,
    { x: entering.x, y: mix(entering.y, end.y, 1 / 3) },
    { x: entering.x, y: mix(entering.y, end.y, 2 / 3) },
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

export function rightLane(teamX: number, pilotX: number, width: number, mobile = width <= 760) {
  return mobile ? width - 18 : Math.min(width - 32, Math.max(teamX, pilotX) + 44);
}

const smoothPosition = (t: number) => t * t * t * (10 + t * (-15 + 6 * t));

/** Keep the wave present along the entire flight. Only the short endpoint
 * blends taper it, preserving a vertical tangent and zero endpoint curvature. */
function flowingWave(t: number) {
  return Math.sin(2 * Math.PI * t) * smoothPosition(clamp(t / 0.055)) *
    smoothPosition(clamp((1 - t) / 0.055));
}

/** One full, tapered sinusoid over the arc. The end position and tangent are
 * unchanged; fitting its amplitude avoids clipping or clamping the curve. */
export function oneWave(
  path: LightPath,
  width: number,
  height: number,
  header: number,
  ceiling = header + 28,
  released = 0,
  completed = 1,
): LightPath {
  const amplitude = Math.min(width <= 760 ? 20 : 34, pathLength(path) * 0.075);
  function offset(t: number) {
    const a = path(Math.max(0, t - 0.001)),
      b = path(Math.min(1, t + 0.001)),
      speed = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const u = clamp((t - released) / (completed - released));
    const wave =
      Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * u) ** 2 * amplitude;
    return {
      x: (-(b.y - a.y) / speed) * wave,
      y: ((b.x - a.x) / speed) * wave,
    };
  }
  function fitting(sign: number) {
    let scale = 1;
    for (let i = 1; i < 256; i++) {
      const t = i / 256,
        p = path(t),
        d = offset(t),
        dx = d.x * sign,
        dy = d.y * sign;
      if (dx < 0) scale = Math.min(scale, (p.x - 12) / -dx);
      if (dx > 0) scale = Math.min(scale, (width - 12 - p.x) / dx);
      if (dy < 0) scale = Math.min(scale, (p.y - ceiling) / -dy);
      if (dy > 0) scale = Math.min(scale, (height - 22 - p.y) / dy);
    }
    return clamp(scale) * 0.95;
  }
  const positive = fitting(1),
    negative = fitting(-1),
    scale = positive >= negative ? positive : -negative;
  return byDistance((t) => {
    const p = path(t),
      d = offset(t);
    return { x: p.x + d.x * scale, y: p.y + d.y * scale };
  });
}

/** One launch followed by constant physical speed, in either direction.
 * Scroll phases never restart acceleration or brake at curve boundaries. */
export function coastRoute(
  parts: { departure: LightPath; flight: LightPath; entry: LightPath },
  durations: [number, number, number],
  launch = 0.045,
) {
  const paths = [parts.departure, parts.flight, parts.entry];
  const lengths = paths.map((path, i) =>
      durations[i] > 0 ? pathLength(path) : 0,
    ),
    length = lengths.reduce((a, b) => a + b, 0) || 1;
  const first = lengths[0] / length,
    second = (lengths[0] + lengths[1]) / length;
  const integral = (u: number) => u * u * u - (u * u * u * u) / 2;
  const area = 1 - launch / 2;
  function clock(t: number) {
    if (t < launch) return (launch * integral(t / launch)) / area;
    return (t - launch / 2) / area;
  }
  function inverse(q: number) {
    if (q <= 0) return 0;
    if (q >= 1) return 1;
    let lo = 0,
      hi = 1;
    for (let i = 0; i < 28; i++) {
      const m = (lo + hi) / 2;
      if (clock(m) < q) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  }
  const t1 = inverse(first),
    t2 = inverse(second);
  const total = Math.max(
    durations.reduce((a, b) => a + b, 0),
    durations[1] / Math.max(0.01, t2 - t1),
  );
  function at(t: number) {
    const q = clock(clamp(t));
    if (q < first && lengths[0]) return paths[0](q / first);
    if (q < second && lengths[1])
      return paths[1]((q - first) / (second - first));
    if (lengths[2]) return paths[2]((q - second) / (1 - second));
    return lengths[1] ? paths[1](1) : paths[0](1);
  }
  return {
    departure: (q: number) => at(t1 * q),
    flight: (q: number) => at(mix(t1, t2, q)),
    entry: (q: number) => at(mix(t2, 1, q)),
    departMs: total * t1,
    scrollMs: total * (t2 - t1),
    enterMs: total * (1 - t2),
  };
}

export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const ease = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function pathLength(path: LightPath) {
  let distance = 0,
    previous = path(0);
  for (let i = 1; i <= 96; i++) {
    const p = path(i / 96);
    distance += Math.hypot(p.x - previous.x, p.y - previous.y);
    previous = p;
  }
  return distance;
}

/** Hermite timing shares a physical speed across joins, without stopping at
 * the boundary between cruising and entering a container. Speeds are px/ms. */
export function paced(
  path: LightPath,
  duration: number,
  startSpeed: number,
  endSpeed: number,
): LightPath {
  const length = pathLength(path);
  if (length < 0.01 || duration === 0) return path;
  const m0 = Math.min(2, (startSpeed * duration) / length);
  const m1 = Math.min(2, (endSpeed * duration) / length);
  return (t) => {
    const q = clamp(t);
    return path(
      clamp(
        m0 * q +
          (10 - 6 * m0 - 4 * m1) * q ** 3 +
          (-15 + 8 * m0 + 7 * m1) * q ** 4 +
          (6 - 3 * m0 - 3 * m1) * q ** 5,
      ),
    );
  };
}

function heading(path: LightPath, end: boolean): LightPoint {
  const a = path(end ? 0.998 : 0),
    b = path(end ? 1 : 0.002);
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
}

/** Match both local tangents. The light stays in viewport coordinates while
 * the page moves, so scroll cannot pull the source upward. */
export function connectingPath(
  a: LightPoint,
  b: LightPoint,
  outgoing: LightPath,
  incoming: LightPath,
  width: number,
  height: number,
  header: number,
): LightPath {
  const first = heading(outgoing, true),
    last = heading(incoming, false);
  const handle = Math.min(
    90,
    Math.max(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.32),
  );
  function control(p: LightPoint, v: LightPoint, sign: number) {
    let size = handle;
    const dx = v.x * sign,
      dy = v.y * sign;
    if (dx < 0) size = Math.min(size, (p.x - 8) / (-dx * 2));
    if (dx > 0) size = Math.min(size, (width - 8 - p.x) / (dx * 2));
    if (dy < 0) size = Math.min(size, (p.y - header - 30) / (-dy * 2));
    if (dy > 0) size = Math.min(size, (height - 28 - p.y) / (dy * 2));
    size = Math.max(0, size);
    return [
      { x: p.x + dx * size, y: p.y + dy * size },
      { x: p.x + dx * size * 2, y: p.y + dy * size * 2 },
    ];
  }
  const [c1, c2] = control(a, first, 1),
    [c4, c3] = control(b, last, -1);
  return byDistance(quintic(a, c1, c2, c3, c4, b));
}

/** Collinear, equally spaced endpoint handles give zero endpoint curvature. */
export function quintic(
  a: LightPoint,
  b: LightPoint,
  c: LightPoint,
  d: LightPoint,
  e: LightPoint,
  f: LightPoint,
): LightPath {
  return (t) => {
    const v = clamp(t),
      u = 1 - v;
    return {
      x:
        u ** 5 * a.x +
        5 * u ** 4 * v * b.x +
        10 * u ** 3 * v * v * c.x +
        10 * u * u * v ** 3 * d.x +
        5 * u * v ** 4 * e.x +
        v ** 5 * f.x,
      y:
        u ** 5 * a.y +
        5 * u ** 4 * v * b.y +
        10 * u ** 3 * v * v * c.y +
        10 * u * u * v ** 3 * d.y +
        5 * u * v ** 4 * e.y +
        v ** 5 * f.y,
    };
  };
}

export function cubic(
  a: LightPoint,
  b: LightPoint,
  c: LightPoint,
  d: LightPoint,
): LightPath {
  return (t) => {
    const u = 1 - clamp(t),
      v = 1 - u;
    return {
      x:
        u ** 3 * a.x + 3 * u * u * v * b.x + 3 * u * v * v * c.x + v ** 3 * d.x,
      y:
        u ** 3 * a.y + 3 * u * u * v * b.y + 3 * u * v * v * c.y + v ** 3 * d.y,
    };
  };
}

/** Distance sampling keeps a curved flight from rushing through its middle. */
export function byDistance(path: LightPath): LightPath {
  const count = 256;
  const points = Array.from({ length: count + 1 }, (_, i) => path(i / count));
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(
      lengths[i - 1] +
        Math.hypot(
          points[i].x - points[i - 1].x,
          points[i].y - points[i - 1].y,
        ),
    );
  return (t) => {
    const distance = clamp(t) * lengths[count];
    let low = 1,
      high = count;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (lengths[middle] < distance) low = middle + 1;
      else high = middle;
    }
    const i = low;
    const q = (distance - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
    return path((i - 1 + q) / count);
  };
}

export function flightPath(
  a: LightPoint,
  b: LightPoint,
  side: LightSide,
  width: number,
  header: number,
  bend = 260,
): LightPath {
  const lane = side === "left" ? 22 : width - 22;
  const rise = Math.max(header + 80, Math.min(a.y, b.y) - bend);
  return byDistance(
    cubic(a, { x: lane, y: rise }, { x: lane, y: rise + 28 }, b),
  );
}
