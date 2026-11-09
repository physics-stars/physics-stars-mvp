import { clamp01, finale, smoothRange, visits } from "./voyage-timeline";

export const scrollSensitivity = 0.4;
export const maximumInputLag = 90;
export const slideScrollSpeed = 1.2;
export const slideGravityDelay = 350;
export const finalReadingSpeed = 0.04;
export const planetGravityDelay = 550;
export const planetGravityDuration = 2400;
export const finalReadingScale = 2;
export const voyageScrollLength = finale.sealed + finalReadingScale * (1 - finale.sealed);

/** Add space only after the logo has formed; earlier flight coordinates stay
 * identical, including on resize and direct navigation. */
export function voyageScrollDistance(progress: number) {
  if (progress <= finale.sealed) return progress;
  if (progress <= 1) return finale.sealed + (progress - finale.sealed) * finalReadingScale;
  return voyageScrollLength + progress - 1;
}
export function voyageProgressAt(distance: number) {
  if (distance <= finale.sealed) return distance;
  if (distance <= voyageScrollLength) return finale.sealed + (distance - finale.sealed) / finalReadingScale;
  return 1 + distance - voyageScrollLength;
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
  reset() { this.center = null; this.elapsed = 0; }
  target(actual: number, requested: number, center: number | null, elapsed: number, quietFor: number) {
    if (center === null || quietFor < planetGravityDelay) { this.reset(); return requested; }
    if (this.center !== center) {
      this.center = center; this.from = requested; this.elapsed = 0;
    }
    this.elapsed = Math.min(planetGravityDuration, this.elapsed + Math.max(0, Math.min(32, elapsed)));
    const desired = this.from + (center - this.from) * smoothRange(0, planetGravityDuration, this.elapsed);
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

/** Preserve the flight cap and the original shorter reading rhythm. */
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
  if (visit) {
    const reading = smoothRange(visit.parked, visit.parked + 0.01, p) *
      (1 - smoothRange(visit.textOut, visit.departure, p));
    return flight + 0.27 * reading;
  }
  const approach = flight + 0.2 * smoothRange(finale.settled, finale.sealed, p);
  return approach + (finalReadingSpeed - approach) * smoothRange(finale.sealed - 0.006, finale.sealed, p);
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
