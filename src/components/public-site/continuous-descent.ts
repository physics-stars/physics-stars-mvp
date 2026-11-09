import { landingTrajectory, type LandingTrajectory } from "./landing-trajectory";
import type { LightPoint, LightSide } from "./descent-motion";
import { nearestCenter } from "./continuous-scroll";

export type ReadingSection = {
  start: number;
  end: number;
  left: LightPoint;
  right: LightPoint;
  neck: LightPoint;
};
export type DescentGeometry = {
  width: number;
  height: number;
  header: number;
  logoEnd: number;
  footerTop: number;
  sections: ReadingSection[];
};
export type DescentSegment = {
  kind: "approach" | "resident" | "journey" | "charge" | "discharge";
  index: number;
  from: number;
  to: number;
  pageStart: number;
  pageEnd: number;
  journey?: LandingTrajectory;
  side?: LightSide;
};

/** Camera and gravity use physical page distance. The light samples the saved
 * curve independently, including while its departure and entry are animating. */
export function createDescentTimeline(g: DescentGeometry, returning = false) {
  const [first, team, pilot] = g.sections;
  const margin = Math.min(96, (g.height - g.header) * 0.14);
  const firstDeparture = Math.max(first.end,
    Math.min(first.end + margin, first.left.y - g.header - 48));
  const oldTeamArrival = Math.max(team.start, Math.min(team.end, team.left.y - g.height + 120));
  const forwardTeamArrival = Math.max(firstDeparture + 1, oldTeamArrival - margin, team.left.y - g.height + 48);
  const teamDeparture = Math.max(forwardTeamArrival,
    Math.min(team.end + margin, team.right.y - g.header - 48));
  const teamSweep = Math.min(48, (teamDeparture - forwardTeamArrival) / 4);
  // On the upward trip, leave before the line reaches the bottom edge. Keep
  // the downward reception and the fully lit reading pose unchanged.
  const teamArrival = returning && g.width <= 760
    ? Math.max(forwardTeamArrival, Math.min(forwardTeamArrival + margin,
      team.end - teamSweep, teamDeparture - 2 * teamSweep))
    : forwardTeamArrival;
  // Finish the contact sweep before the purple footer enters the viewport.
  const pilotReady = Math.min(pilot.end, g.footerTop - g.height - 4);
  // Leave room for the arrival curve and halo in both viewport layouts.
  const pilotInset = g.width > 760 ? 192 : 144;
  const pilotEntryEnd = Math.max(pilot.right.y - g.height + 8, pilotReady - 48);
  const pilotArrival = Math.max(teamDeparture + 1,
    Math.min(pilotReady, pilotEntryEnd, pilot.right.y - g.height + pilotInset));
  const segments: DescentSegment[] = [];
  let length = 0;
  function add(kind: DescentSegment["kind"], index: number, pageStart: number, pageEnd: number,
    journey?: LandingTrajectory) {
    const span = Math.max(0, pageEnd - pageStart);
    segments.push({ kind, index, pageStart, pageEnd, journey, from: length, to: length + span });
    length += span;
  }
  function route(index: number, start: number, end: number) {
    const side = index === 1 ? "left" : "right";
    const source = g.sections[index - 1][side];
    const receiver = g.sections[index][side];
    const neck = g.sections[index - 1].neck;
    const path = landingTrajectory(
      { x: source.x, y: source.y - start },
      { x: neck.x, y: neck.y - start },
      { x: receiver.x, y: receiver.y - end },
      g.width, g.height, g.header, side, end - start,
    );
    add("journey", index, start, end, path);
  }
  add("approach", 0, g.logoEnd, first.start);
  add("resident", 0, first.start, firstDeparture);
  route(1, firstDeparture, teamArrival);
  add("charge", 1, teamArrival, teamArrival + teamSweep);
  segments.at(-1)!.side = "left";
  add("resident", 1, teamArrival + teamSweep, teamDeparture - teamSweep);
  add("discharge", 1, teamDeparture - teamSweep, teamDeparture);
  segments.at(-1)!.side = "right";
  route(2, teamDeparture, pilotArrival);
  const pilotSweep = Math.max(0, Math.min(48, pilotReady - pilotArrival));
  add("charge", 2, pilotArrival, pilotArrival + pilotSweep);
  segments.at(-1)!.side = "right";
  add("resident", 2, pilotArrival + pilotSweep, pilot.end);

  function at(position: number) {
    const value = Math.max(0, Math.min(length, position));
    const segment = segments.find(s => value < s.to - 0.0001) ?? segments.at(-1)!;
    const local = Math.max(0, Math.min(segment.to - segment.from, value - segment.from));
    const distance = segment.journey ? local / Math.max(1, segment.to - segment.from) * segment.journey.length : local;
    const frame = segment.journey?.at(distance);
    return { segment, local, distance, frame, page: segment.pageStart + local };
  }
  function positionAtPage(page: number) {
    return Math.max(0, Math.min(length, page - g.logoEnd));
  }
  const centers = [0, ...g.sections.flatMap(s => s.end - s.start > 1
    ? [positionAtPage(s.start), positionAtPage(s.end)]
    : [positionAtPage(s.start)])];
  function gravityCenter(position: number) {
    if (position < 0 || position > length) return null;
    const page = g.logoEnd + position;
    if (g.sections.some(s => page >= s.start - 1 && page <= s.end + 1)) return null;
    return nearestCenter(position, centers);
  }
  return { length, segments, centers, gravityCenter, at, positionAtPage };
}

export type DescentTimeline = ReturnType<typeof createDescentTimeline>;

/** Only the illuminated line sweeps along the bar; the traveller is hidden
 * until the sweep ends and it leaves along the saved route. */
export function barIllumination(segment: DescentSegment, local: number) {
  const ratio = Math.max(0, Math.min(1, local / Math.max(0.001, segment.to - segment.from)));
  const power = segment.kind === "discharge" ? 1 - ratio : ratio;
  const side = segment.side ?? "left";
  return { power, side };
}
