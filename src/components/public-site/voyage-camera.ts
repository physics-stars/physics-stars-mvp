import { finale, smoothRange, visits } from "./voyage-timeline";

function cameraLeg(p: number, narrow: boolean, step: number) {
  const offset = (index: number) => (narrow ? 4 : index % 2 === 1 ? 8 : 0);
  const last = visits.at(-1)!;
  if (p >= last.departure)
    return {
      start: last.departure,
      end: Math.min(finale.orbit, last.departure + 0.042),
      from: visits.length * step + offset(visits.length - 1),
      to: (visits.length + 1) * step,
    };
  let index = 0;
  for (let i = 1; i < visits.length; i++)
    if (p >= visits[i - 1].departure) index = i;
  const visit = visits[index];
  return {
    start: index ? visits[index - 1].departure : visit.start,
    end: visit.arrived,
    from: index * step + (index ? offset(index - 1) : narrow ? 4 : 0),
    to: (index + 1) * step + offset(index),
  };
}

export function voyageCameraX(p: number, narrow: boolean, step: number) {
  const leg = cameraLeg(p, narrow, step);
  return leg.from + (leg.to - leg.from) * smoothRange(leg.start, leg.end, p);
}

export function voyageCameraVelocity(p: number, narrow: boolean, step: number) {
  const leg = cameraLeg(p, narrow, step);
  if (p <= leg.start || p >= leg.end) return 0;
  const h = leg.end - leg.start,
    t = (p - leg.start) / h;
  return ((leg.to - leg.from) * 30 * t * t * (1 - t) * (1 - t)) / h;
}
