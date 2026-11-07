export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export function smoothRange(start: number, end: number, value: number) {
  const t = clamp01((value - start) / (end - start));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export const visits = Array.from({ length: 4 }, (_, index) => {
  const start = index * 0.185;
  return {
    index,
    start,
    arrived: start + (index === 0 ? 0.046 : 0.03),
    emerged: start + (index === 0 ? 0.073 : 0.048),
    parked: start + (index === 0 ? 0.105 : 0.07),
    textIn: start + (index === 0 ? 0.11 : 0.075),
    textOut: start + 0.16,
    departure: start + 0.167,
    end: start + 0.185,
    cameraX: (index + 1) * 24,
    planetX: (index + 1) * 24 + 4,
  };
});

export const finalCameraX = (visits.length + 1) * 24;
export const finale = {
  start: visits.at(-1)!.end,
  orbit: 0.82,
  settled: 0.925,
  sealed: 0.955,
  text: 0.965,
};
export const waypointStops = [
  0,
  ...visits.map((visit) => (visit.textIn + visit.textOut) / 2),
  0.995,
];

export function orbitAmount(progress: number) {
  const t = clamp01(
    (progress - finale.orbit) / (finale.settled - finale.orbit),
  );
  return t + t * t - t * t * t;
}

export function travelAmount(progress: number, index: number) {
  const visit = visits[index];
  const t = clamp01((progress - visit.start) / (visit.arrived - visit.start));
  // Launch immediately; subsequent legs ease out of their reading stop.
  return index === 0
    ? t + t * t - t * t * t
    : smoothRange(visit.start, visit.arrived, progress);
}

export function readingAmount(progress: number, index: number) {
  const visit = visits[index];
  return (
    smoothRange(visit.parked, visit.textIn + 0.004, progress) *
    (1 - smoothRange(visit.textOut, visit.departure, progress))
  );
}

export function voyageState(progress: number) {
  const p = clamp01(progress);
  for (const visit of visits) {
    if (p <= visit.end) {
      const previousX = visit.index * 24;
      const cameraX =
        previousX + (visit.cameraX - previousX) * travelAmount(p, visit.index);
      const phase =
        visit.index === 0 && p < 0.018
          ? "hero"
          : p < visit.arrived
            ? "travel"
            : p < visit.parked
              ? "arrival"
              : p < visit.departure
                ? "reading"
                : "departure";
      return {
        index: visit.index,
        phase,
        cameraX,
        light: readingAmount(p, visit.index),
      };
    }
  }
  return {
    index: -1,
    phase: "finale",
    cameraX:
      visits.length * 24 + 24 * smoothRange(finale.start, finale.orbit, p),
    light: 0,
  };
}
