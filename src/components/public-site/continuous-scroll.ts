import { clamp01, finale, smoothRange, visits } from "./voyage-timeline";

export const scrollSensitivity = 0.4;
export const maximumInputLag = 90;
export const maximumVoyageInputLag = 180;
export const slideScrollSpeed = 1.2;
export const slideGravityDelay = 350;
export const planetGravityDelay = 550;
export const planetGravityDuration = 2400;
export const finalReadingRatio = 1.2;
const averagePlanetReadingSpan = visits.reduce((span, visit) =>
  span + visit.departure - visit.parked, 0) / visits.length;
export const finalReadingScale = averagePlanetReadingSpan * finalReadingRatio / (1 - finale.sealed);

function planetVisitSpeed(progress: number, visit: (typeof visits)[number]) {
  const reading = smoothRange(visit.parked, visit.parked + 0.01, progress) *
    (1 - smoothRange(visit.textOut, visit.departure, progress));
  return 0.06 + 0.27 * reading;
}

// Match both gesture distance and duration under continuous strong input.
const averagePlanetReadingDuration = visits.reduce((duration, visit) => {
  const step = (visit.departure - visit.parked) / 100;
  for (let i = 0; i < 100; i++) duration += step / planetVisitSpeed(visit.parked + (i + 0.5) * step, visit);
  return duration;
}, 0) / visits.length;
export const finalReadingSpeed = (1 - finale.sealed) / (averagePlanetReadingDuration * finalReadingRatio);
export const voyageFlightScale = 0.35;
const heroReadingEnd = 0.018;
const voyageFlights = [
  ...visits.map((visit, index) => [index === 0 ? heroReadingEnd : visits[index - 1].departure, visit.parked]),
  [visits.at(-1)!.departure, finale.sealed],
];
const scrollSegments = [
  { from: 0, to: heroReadingEnd, scale: 1 },
  ...visits.flatMap((visit, index) => [
    { from: voyageFlights[index][0], to: visit.parked, scale: voyageFlightScale },
    { from: visit.parked, to: visit.departure, scale: 1 },
  ]),
  { from: visits.at(-1)!.departure, to: finale.sealed, scale: voyageFlightScale },
  { from: finale.sealed, to: 1, scale: finalReadingScale },
];
export const voyageScrollLength = scrollSegments.reduce((length, segment) =>
  length + (segment.to - segment.from) * segment.scale, 0);

/** Compress flights and logo formation only. All text, including its entrance
 * and exit fades, keeps its original physical scroll distance. */
export function voyageScrollDistance(progress: number) {
  if (progress <= 0) return progress;
  let distance = 0;
  for (const segment of scrollSegments) {
    distance += (Math.min(progress, segment.to) - segment.from) * segment.scale;
    if (progress <= segment.to) return distance;
  }
  return distance + progress - 1;
}
export function voyageProgressAt(distance: number) {
  if (distance <= 0) return distance;
  let remaining = distance;
  for (const segment of scrollSegments) {
    const length = (segment.to - segment.from) * segment.scale;
    if (remaining <= length) return segment.from + remaining / segment.scale;
    remaining -= length;
  }
  return 1 + remaining;
}

export function voyageInputLead(progress: number) {
  const reading = scrollSegments.some(segment => segment.scale !== voyageFlightScale &&
    progress >= segment.from && progress <= segment.to);
  const lag = reading ? maximumInputLag : maximumVoyageInputLag;
  return voyageScrollDistance(progress + voyageSpeedLimit(progress) * lag / 1000) - voyageScrollDistance(progress);
}

/** Smaller gestures, with only a short response window ahead of the visible
 * position. Fast input is compressed here, never stored to play seconds later. */
export function scrollInputTarget(actual: number, requested: number, delta: number,
  min: number, max: number, maximumLead: number) {
  const gap = requested - actual;
  const base = gap * delta < 0 ? actual : requested;
  return Math.max(min, actual - maximumLead,
    Math.min(max, actual + maximumLead, base + delta * scrollSensitivity));
}

export function nearestCenter(value: number, centers: readonly number[]) {
  return centers.reduce<number | null>((best, center) =>
    best === null || Math.abs(center - value) < Math.abs(best - value) ? center : best, null);
}

/** Gravity changes a resting destination gently; it never consumes input or
 * pulls a long, still-travelling impulse back to a section it has passed. */
export function gravityTarget(actual: number, requested: number, center: number | null,
  elapsed: number, quietFor: number, captureDistance: number) {
  if (center === null || quietFor < slideGravityDelay || Math.abs(requested - actual) > captureDistance)
    return requested;
  const gap = center - requested;
  const epsilon = Math.min(0.01, captureDistance / 10000);
  const attraction = smoothRange(slideGravityDelay, slideGravityDelay + 320, quietFor);
  return Math.abs(gap) < epsilon ? center
    : requested + gap * -Math.expm1(-Math.min(32, elapsed) * attraction / 420);
}

export function planetReadingCenter(actual: number, requested: number, visiblePlanet: number | null = null) {
  if (visiblePlanet === null || !Number.isInteger(visiblePlanet) || actual >= finale.sealed || requested >= finale.sealed)
    return null;
  const visit = visits[visiblePlanet];
  if (!visit) return null;
  return (visit.textIn + 0.004 + visit.textOut) / 2;
}

/** A delayed S-shaped attraction. Input cancels it immediately; its destination
 * stays close to the visible scene rather than becoming a long playback queue. */
export class PlanetGravity {
  private center: number | null = null;
  private from = 0;
  private elapsed = 0;
  get destination() { return this.center; }
  reset() { this.center = null; this.elapsed = 0; }
  target(actual: number, requested: number, center: number | null, elapsed: number, quietFor: number) {
    if (quietFor < planetGravityDelay) { this.reset(); return requested; }
    // Once captured, a visibility measurement cannot restart the attraction.
    const destination = center ?? this.center;
    if (destination === null) return requested;
    if (this.center !== destination) {
      this.center = destination; this.from = actual; this.elapsed = 0;
    }
    this.elapsed = Math.min(planetGravityDuration, this.elapsed + Math.max(0, Math.min(32, elapsed)));
    const desired = this.from + (destination - this.from) * smoothRange(0, planetGravityDuration, this.elapsed);
    return Math.max(actual - 0.01, Math.min(actual + 0.01, desired));
  }
}

/** Overlapping C2 curves reserve some rise for each fade, with a continuous
 * drift underneath. Neither becoming opaque nor fading out pauses the rise. */
function readingTextOffset(progress: number, start: number, readable: number,
  fadeOut: number, end: number, height: number) {
  const span = end - start;
  const t = clamp01((progress - start) / span);
  const midpoint = ((readable + fadeOut) / 2 - start) / span;
  const skew = (0.5 - midpoint) / (midpoint * (1 - midpoint));
  const drift = smoothRange(0, 1, t + skew * t * (1 - t));
  return height * (0.25 * (1 - smoothRange(start, readable, progress)) +
    0.5 * (1 - drift) + 0.25 * (1 - smoothRange(fadeOut, end, progress)));
}

export function planetTextOffset(progress: number, index: number) {
  const visit = visits[index];
  return readingTextOffset(progress, visit.parked, visit.textIn + 0.004, visit.textOut, visit.departure, 8);
}

export function planetTextOpacity(progress: number, index: number) {
  const visit = visits[index];
  const fadeIn = clamp01((progress - visit.parked) / (visit.textIn + 0.004 - visit.parked));
  const fadeOut = clamp01((progress - visit.textOut) / (visit.departure - visit.textOut));
  return fadeIn * (1 - fadeOut);
}

export function finalTextOpacity(progress: number) {
  return smoothRange(finale.sealed, finale.sealed + 0.008, progress);
}

export function finalTextOffset(progress: number) {
  return readingTextOffset(progress, finale.sealed, finale.sealed + 0.008, 0.992, 1, 4);
}

/** Quicker flights need fewer gestures; reading keeps its existing speed. */
const longerFlights = [
  [0, visits[0].parked],
  [visits[1].departure, visits[2].parked],
  [visits[2].departure, visits[3].parked],
  [visits.at(-1)!.departure, finale.settled],
];
export function voyageSpeedLimit(p: number) {
  const cruising = Math.max(...longerFlights.map(([a, b]) =>
    smoothRange(a, a + 0.012, p) * (1 - smoothRange(b - 0.012, b, p))));
  const flight = 0.06 + 0.006 * cruising;
  const visit = visits.find(v => p >= v.parked && p <= v.departure);
  if (visit) return planetVisitSpeed(p, visit);
  const approach = flight + 0.2 * smoothRange(finale.settled, finale.sealed, p);
  const original = approach + (finalReadingSpeed - approach) * smoothRange(finale.sealed - 0.006, finale.sealed, p);
  const boost = Math.max(...voyageFlights.map(([a, b]) =>
    smoothRange(a, a + 0.006, p) * (1 - smoothRange(b - 0.006, b, p))));
  return original * (1 + boost);
}

/** Follow the full queued destination even beyond the voyage. Clamping the
 * spring's destination to 1 would brake before passing the remaining inertia
 * to the next section. Only the displayed position is clamped. */
export function followVoyage(current: number, requested: number, velocity: number, elapsed: number) {
  const seconds = Math.max(0, Math.min(32, elapsed)) / 1000;
  const delta = requested - current;
  const raw = current + delta * -Math.expm1(-seconds / 0.045);
  const maximum = voyageSpeedLimit(current);
  const unbounded = current + Math.max(-maximum * seconds, Math.min(maximum * seconds, raw - current));
  return { position: Math.max(0, Math.min(1, unbounded)), unbounded,
    velocity: seconds ? (unbounded - current) / seconds : velocity };
}

/** Touchmove is controlled, so carry its release velocity into the same queue
 * rather than asking the browser to start a second native momentum writer. */
export class TouchMomentum {
  private at = 0;
  private velocity = 0;
  start(now: number) { this.at = now; this.velocity = 0; }
  move(delta: number, now: number) {
    const dt = Math.max(8, now - this.at);
    this.velocity = this.velocity * 0.35 + delta / dt * 0.65;
    this.at = now;
  }
  release(now: number) {
    const distance = now - this.at < 60 ? this.velocity * 45 : 0;
    this.velocity = 0;
    return Math.max(-100, Math.min(100, distance));
  }
}
