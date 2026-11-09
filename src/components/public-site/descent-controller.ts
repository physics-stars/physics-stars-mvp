export const scrollHandoffEvent = "landing-scroll-handoff";
export type ScrollHandoff = { delta: number; input?: Event; quietSince?: number; inertiaVelocity?: number };

/** Input is bounded by the next reading stop. No remainder belongs to a
 * later slide, even when a wheel event contains several viewport heights. */
export function scrollTarget(current: number, delta: number, min: number, max: number) {
  return Math.max(min, Math.min(max, current + delta));
}

/** One RAF follows the requested position with a speed cap. Reversing the
 * request cancels its old queue; native scroll never races another writer. */
export function followScroll(current: number, target: number, elapsed: number, maximumSpeed = 1.65, speedMultiplier = 1) {
  const gap = target - current;
  if (Math.abs(gap) < 0.001) return target;
  const dt = Math.max(0, Math.min(32, elapsed));
  const step = Math.min(Math.abs(gap) * (1 - Math.exp(-dt * speedMultiplier / 45)), dt * maximumSpeed);
  return current + Math.sign(gap) * step;
}

