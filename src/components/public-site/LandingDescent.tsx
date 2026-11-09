"use client";

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  clamp,
  ease,
  mix,
  glassLane,
  rightLane,
  type LightPath,
  type LightPoint,
  type LightSide,
} from "./descent-motion";
import styles from "./landing.module.css";
import { vesselBodyPath } from "./GlassVessel";
import { sectionTransition } from "./section-magnet";
import {
  bridgeFrame as legacyBridgeFrame,
  bridgeLength as legacyBridgeLength,
  type ScrollBridge,
} from "./descent-scroll";
import { CurveTrail, type TrailCursor } from "./curve-trail";
import { ScrollGesture } from "./scroll-gesture";
import { followScroll, scrollTarget } from "./descent-controller";
import { landingTrajectory, type LandingTrajectory } from "./landing-trajectory";

type Index = 0 | 1 | 2;
type BarIndex = 1 | 2;
const subscribeClient = () => () => {};
/** A single animation frame controls the light, reading scroll and magnet.
 * Team arrival permits downward reading up to its section boundary. */
export function LandingDescent({ children }: { children: ReactNode }) {
  const clientReady = useSyncExternalStore(
    subscribeClient,
    () => true,
    () => false,
  );
  const root = useRef<HTMLDivElement>(null),
    scene = useRef<SVGSVGElement>(null);
  const star = useRef<SVGGElement>(null),
    aura = useRef<SVGCircleElement>(null),
    flashAura = useRef<SVGCircleElement>(null),
    trail = useRef<SVGPathElement>(null),
    gradient = useRef<SVGLinearGradientElement>(null);
  const vesselTrailMask = useRef<SVGPathElement>(null);
  const haloId = useId(),
    coreId = useId(),
    trailId = useId(),
    trailMaskId = useId();
  useEffect(() => {
    if (!clientReady || !root.current || !scene.current) return;
    const container = root.current!,
      svg = scene.current!;
    const sections = Array.from(
      container.querySelectorAll<HTMLElement>("[data-snap-section]"),
    );
    const vessel = container.querySelector<HTMLElement>(
      "[data-descent-vessel]",
    )!;
    const bars = Array.from(
      container.querySelectorAll<HTMLElement>("[data-descent-bar]"),
    );
    const panel = container.querySelector<HTMLElement>("[data-descent-panel]")!;
    const members = Array.from(
      container.querySelectorAll<HTMLElement>("[data-descent-member]"),
    );
    const voyage = document.getElementById("idea");
    if (sections.length !== 3 || !vessel || bars.length !== 2) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      settleTimer = 0;
    let touching = false,
      animated = false,
      docked = false;
    let point: LightPoint = { x: 0, y: 0 },
      alpha = 0;
    let touchY: number | null = null;
    let freshInput = false;
    const curveTrail = new CurveTrail();
    const gesture = new ScrollGesture();
    let trailCursor: TrailCursor | null = null;
    const powers = [0, 0, 0];
    const barStates = [
      { power: 0, departure: 0, side: "left" as LightSide },
      { power: 0, departure: 0, side: "right" as LightSide },
    ];
    type Bridge = ScrollBridge & {
      index: number;
      offset: number;
      requested: number;
      side: LightSide;
      departure: LightPath;
      flight: LightPath;
      arrival: LightPath;
      pageCoordinates: boolean;
      trailStart: number;
      journey?: LandingTrajectory;
      velocity: number;
      reading: boolean;
      trailOrigin?: number;
      receptionProgress?: number;
    };
    const routes = new Map<string, Omit<Bridge, "offset" | "requested" | "origin" | "velocity" | "reading">>();
    let active: Bridge | null = null;
    let previousY = scrollY,
      scrollDirection = 1;
    let magnet = false;
    let snapMotion: { from: number; started: number; to: number; duration: number } | null = null;
    let pageMotion: { index: Index; actual: number; requested: number; direction: number } | null = null;
    let lastFrameTime = 0;
    let lastInputAt = -Infinity, lastInputDirection = 0;
    let stoppedAt = -Infinity, stoppedDirection = 0;
    let barMotion: {
      index: BarIndex;
      from: number;
      to: number;
      started: number;
      side: LightSide;
    } | null = null;
    let flaskReady = false;
    let flaskFlash: { started: number } | null = null;
    let flashStrength = 0;
    function geometry() {
      const w = document.documentElement.clientWidth,
        h = innerHeight,
        mobile = innerWidth <= 760,
        header = mobile ? 68 : 76;
      const bounds = sections.map((el) => el.getBoundingClientRect());
      const starts = bounds.map((r) => r.top + scrollY - header);
      const ends = bounds.map((r, i) =>
        Math.max(starts[i], r.bottom + scrollY - h),
      );
      return { w, h, header, mobile, bounds, starts, ends };
    }
    function port(index: Index, side: LightSide, atY = scrollY) {
      const { h, header } = geometry(),
        shift = scrollY - atY;
      const r = (
        index === 0 ? vessel : bars[index - 1]
      ).getBoundingClientRect();
      const p =
        index === 0
          ? {
              x: r.left + r.width / 2,
              y: r.top + (r.height * 197) / 290 + shift,
            }
          : {
              x: side === "left" ? r.left : r.right,
              y: r.top + r.height / 2 + shift,
            };
      const neck = { x: p.x, y: r.top + (r.height * 43) / 290 + shift };
      const visible = p.y >= header + 18 && p.y <= h - (index === 0 ? 22 : 2);
      return { p, neck, visible };
    }
    function waitingPoint(index: BarIndex, side: LightSide, atY = geometry().ends[index]) {
      const g = geometry();
      const target = port(index, side, atY).p;
      const x = index === 1 && side === "left"
        ? glassLane(port(0, "left").neck.x, target.x, g.w, g.mobile)
        : side === "left" ? (g.mobile ? 18 : 34)
          : rightLane(port(1, "right").p.x, port(2, "right").p.x, g.w, g.mobile);
      const rise = Math.min(48, Math.max(24, Math.abs(x - target.x)));
      return {
        x,
        y: Math.max(g.header + 14, target.y - rise),
      };
    }
    function arrivalAt(index: BarIndex) {
      const g = geometry();
      if (index === 2) return g.ends[index];
      const target = port(index, "left").p;
      return Math.max(g.starts[index], Math.min(g.ends[index], target.y + scrollY - g.h + 120));
    }
    function paintPower(
      index: Index,
      value: number,
      side: LightSide,
      charging = false,
    ) {
      powers[index] = clamp(value);
      const name = ["vessel", "panel", "pilot"][index];
      container.style.setProperty(`--${name}-power`, String(powers[index]));
      if (index > 0) {
        const bar = bars[index - 1];
        bar.style.setProperty("--charge", String(powers[index]));
        bar.dataset.direction = side === "left" ? "ltr" : "rtl";
        bar.dataset.charging = String(charging);
      }
      if (index === 1)
        members.forEach((el, i) => {
          const order = side === "left" ? i : members.length - 1 - i;
          el.style.setProperty(
            "--member-power",
            String(ease((value - order * 0.22) / 0.56)),
          );
        });
    }
    function pageSections() {
      const g = geometry();
      const lower = g.bounds.map((r) => ({
        top: r.top + scrollY,
        bottom: r.bottom + scrollY,
      }));
      const bottom = voyage!.getBoundingClientRect().bottom + scrollY;
      return [{ top: bottom - g.h + g.header, bottom }, ...lower];
    }
    function bridge(index: number, origin: 0 | 1 = scrollDirection < 0 ? 1 : 0, receptionAt?: number): Bridge {
      const routeKey = `${index}:${receptionAt ?? "arrival"}`;
      let route = routes.get(routeKey);
      if (!route) {
        const g = geometry();
        const from = index - 1;
        const to = index as Index;
        const side: LightSide = to < 2 ? "left" : "right";
        const start = from < 0 ? pageSections()[0].bottom - g.h : g.ends[from];
        const end = to > 0 ? receptionAt ?? arrivalAt(to as BarIndex) : g.starts[to];
        const source = from < 0 ? null : port(from as Index, side, start);
        const target = port(to, side, end);
        const waiting = to > 0 ? waitingPoint(to as BarIndex, side, end) : target.p;
        const a = source?.visible ? source.p : waiting;
        const journey = to > 0
          ? landingTrajectory(a, source?.neck ?? a, target.p, g.w, g.h, g.header, side, end - start)
          : undefined;
        route = {
          index,
          start,
          end,
          side,
          exit: source?.visible ? 140 : 0,
          entry: 0,
          departure: () => target.p,
          flight: () => target.p,
          arrival: () => target.p,
          pageCoordinates: to === 2 || (to === 1 && !!source?.visible),
          trailStart: journey?.trailStart ?? 0,
          journey,
          receptionProgress: receptionAt === undefined || to === 0 ? undefined
            : clamp((receptionAt - arrivalAt(to as BarIndex)) / Math.max(1, g.ends[to] - arrivalAt(to as BarIndex))),
        };
        routes.set(routeKey, route);
      }
      return { ...route, offset: 0, requested: 0, origin, velocity: 0, reading: origin === 1 };
    }
    function bridgeLength(current: Bridge) {
      return current.journey?.length ?? legacyBridgeLength(current);
    }
    function bridgeFrame(current: Bridge, offset: number) {
      if (!current.journey) return legacyBridgeFrame(current, offset);
      const state = current.journey.at(offset);
      return { y: current.start + state.camera, phase: state.phase, amount: state.amount };
    }
    function offsetAtPage(current: Bridge, y: number) {
      return current.journey?.distanceAtPage(y - current.start) ?? current.exit + y - current.start;
    }
    function landingOffset(current: Bridge) {
      const start = geometry().starts[current.index];
      return current.journey && current.end > start + 2
        ? offsetAtPage(current, start) : bridgeLength(current);
    }
    function bridgePoint(current: Bridge, offset: number) {
      if (current.journey) {
        const p = current.journey.at(offset).point;
        const currentFrame = bridgeFrame(current, current.offset);
        const camera = current.index === 1 && currentFrame.phase === "entry" && scrollY > currentFrame.y + 1
          ? scrollY : currentFrame.y;
        return { x: p.x, y: p.y + current.start - camera };
      }
      const state = bridgeFrame(current, offset);
      const p = state.phase === "departure"
        ? current.departure(state.amount)
        : state.phase === "entry"
          ? current.arrival(state.amount)
          : current.flight(state.amount);
      return current.pageCoordinates ? { x: p.x, y: p.y + current.start - scrollY } : p;
    }
    function drawBridge(current: Bridge) {
      if (current.index === 0) {
        const vesselPort = port(0, "left");
        point = vesselPort.p;
        // The viewport clip reveals the light with the glass. A visibility
        // threshold here makes it pop in after entering the screen.
        alpha = 1;
        docked = true;
        paintPower(0, 1, "left");
        container.dataset.lightPhase = "contained";
        delete container.dataset.lightProgress;
        return 0;
      }
      const state = bridgeFrame(current, current.offset);
      point = bridgePoint(current, current.offset);
      const length = bridgeLength(current);
      trailCursor = current.offset < current.trailStart ? null : {
        key: `bridge:${current.index}`,
        value: current.offset,
        origin: current.trailOrigin ?? (current.origin === 1 ? length : current.trailStart),
        min: current.trailStart,
        max: length,
        at: (offset) => bridgePoint(current, offset),
        hold: true,
      };
      alpha = 1;
      docked = false;
      if (current.index === 1)
        paintPower(0, state.phase === "departure" ? 1 - ease(state.amount) : 0, "left");
      container.dataset.lightPhase = state.phase;
      container.dataset.lightProgress = (current.offset / bridgeLength(current)).toFixed(4);
      container.dataset.lightDistance = current.offset.toFixed(3);
      container.dataset.lightVelocity = current.velocity.toFixed(4);
      container.dataset.cruiseSpeed = (current.journey?.speed ?? 0).toFixed(4);
      container.dataset.lightRoute = String(current.index);
      container.dataset.lightRequested = current.requested.toFixed(3);
      container.dataset.lightLength = bridgeLength(current).toFixed(3);
      container.dataset.lightCamera = bridgeFrame(current, current.offset).y.toFixed(3);
      return Math.max(0, state.phase === "departure" ? current.index - 1 : current.index) as Index;
    }
    function readingLight(index: Index) {
      if (index === 0) {
        const target = port(0, "left");
        point = target.p;
        docked = true;
        alpha = 1;
        paintPower(0, 1, "left");
        container.dataset.lightPhase = "contained";
        delete container.dataset.lightProgress;
        return;
      }
      const bar = barStates[index - 1];
      const target = port(index, bar.side);
      if (bar.power === 1 || bar.departure > 0) {
        point = target.p;
        docked = bar.power === 1;
        alpha = docked ? 0 : 1;
        paintPower(index, bar.power, bar.side);
        container.dataset.lightPhase = docked ? "contained" : "departure";
        return;
      }
      const current = bridge(index);
      current.offset = offsetAtPage(current, scrollY);
      current.requested = current.offset;
      current.trailOrigin = current.offset;
      current.reading = true;
      if (!barMotion && scrollY >= current.end - 1) {
        current.offset = current.journey!.flightEnd;
        current.requested = bridgeLength(current);
        active = current;
        schedule();
      }
      drawBridge(current);
    }
    function holdGesture(direction: number) {
      stoppedAt = performance.now();
      stoppedDirection = direction;
    }
    function beginEntry(index: BarIndex, reverse = false) {
      const state = barStates[index - 1];
      if (!animated || barMotion || !port(index, state.side).visible) return;
      if (!reverse && scrollY < arrivalAt(index) - 1) return;
      const current = bridge(index, reverse ? 1 : 0,
        reverse ? Math.max(scrollY, arrivalAt(index)) : undefined);
      current.offset = reverse ? bridgeLength(current) : current.journey!.flightEnd;
      current.requested = reverse ? current.journey!.flightEnd : bridgeLength(current);
      current.trailOrigin = current.offset;
      current.reading = true;
      active = current;
      schedule();
    }
    function beginBar(index: BarIndex, to: number, direction = 0) {
      const state = barStates[index - 1];
      const side = to ? state.side : index === 1 && direction < 0 ? "left" : "right";
      if (to === 1 && scrollY < arrivalAt(index) - 1) return;
      if (barMotion || !animated || !port(index, side).visible || state.power === to) return;
      stopMagnet();
      if (!to) {
        state.departure = direction;
        pageMotion = null;
      }
      state.side = side;
      barMotion = {
        index,
        from: state.power,
        to,
        started: performance.now(),
        side,
      };
      container.dataset.motionBusy = "true";
      container.dataset.barAnimation = to ? "charge" : "discharge";
      schedule();
    }
    function animateBar(time: number) {
      const motion = barMotion;
      if (!motion) return;
      trailCursor = null;
      const target = port(motion.index, motion.side);
      if (!target.visible || !animated) {
        barMotion = null;
        container.dataset.motionBusy = "false";
        delete container.dataset.barAnimation;
        return;
      }
      const q = clamp((time - motion.started) / 340);
      const power = mix(motion.from, motion.to, ease(q));
      barStates[motion.index - 1].power = power;
      paintPower(motion.index, power, motion.side, true);
      point = target.p;
      alpha = motion.to ? 1 - ease(q) : ease(q);
      docked = false;
      container.dataset.lightPhase = motion.to ? "charge" : "discharge";
      if (q >= 1) {
        barStates[motion.index - 1].power = motion.to;
        barMotion = null;
        container.dataset.motionBusy = "false";
        delete container.dataset.barAnimation;
        if (motion.to) holdGesture(1);
        else if (barStates[motion.index - 1].departure < 0)
          beginEntry(motion.index, true);
        queueSettle();
      }
      schedule();
    }
    function beginFlaskFlash() {
      if (!animated || flaskReady || flaskFlash || barMotion || !port(0, "left").visible)
        return false;
      stopMagnet();
      active = null;
      flaskReady = true;
      flaskFlash = { started: performance.now() };
      container.dataset.motionBusy = "true";
      container.dataset.flaskFlash = "true";
      schedule();
      return true;
    }
    function animateFlaskFlash(time: number) {
      const motion = flaskFlash;
      if (!motion) return;
      const q = clamp((time - motion.started) / 900);
      const target = port(0, "left");
      if (!animated || !target.visible || q >= 1) {
        flaskFlash = null;
        flashStrength = 0;
        container.dataset.motionBusy = "false";
        delete container.dataset.flaskFlash;
        holdGesture(1);
        queueSettle();
        schedule();
        return;
      }
      point = target.p;
      alpha = 1;
      docked = true;
      trailCursor = null;
      flashStrength = Math.sin(Math.PI * q) ** 2;
      paintPower(0, 1, "left");
      container.dataset.lightPhase = "flash";
      schedule();
    }
    function render(time: number) {
      frame = 0;
      trailCursor = null;
      advance(time);
      const g = geometry(),
        rootBounds = container.getBoundingClientRect();
      if (!flaskFlash && scrollY < g.ends[0] - 48) flaskReady = false;
      container.style.setProperty("--team-top", `${g.bounds[1].top - rootBounds.top}px`);
      container.style.setProperty("--team-height", `${g.bounds[1].height}px`);
      panel.style.setProperty("--panel-light-y", "0px");
      let owner: Index = 0;
      if (!animated) {
        powers.forEach((_, i) => paintPower(i as Index, 1, "left"));
        alpha = 0;
      } else {
        paintPower(0, 0, "left");
        barStates.forEach((state, i) => paintPower((i + 1) as BarIndex, state.power, state.side));
        const transition = sectionTransition(scrollY, pageSections(), g.h, g.header);
        if (active) owner = drawBridge(active);
        else if (transition) {
          const current = bridge(transition.index);
          current.offset = offsetAtPage(current, scrollY);
          owner = drawBridge(current);
        } else {
          owner = g.starts.reduce<Index>((found, start, i) => scrollY >= start - 1 ? i as Index : found, 0);
          readingLight(owner);
        }
      }
      if (animated && !active && !barMotion && Math.abs(scrollY - g.ends[0]) < 1.5)
        beginFlaskFlash();
      if (flaskFlash) {
        owner = 0;
        animateFlaskFlash(time);
      }
      if (barMotion) {
        owner = barMotion.index;
        animateBar(time);
      }
      const inRoot = rootBounds.top < g.h && rootBounds.bottom > g.header;
      const shown = animated && inRoot ? alpha : 0;
      svg.setAttribute("viewBox", `0 0 ${g.w} ${g.h}`);
      svg.style.width = `${g.w}px`;
      svg.style.height = `${g.h}px`;
      svg.style.clipPath = `inset(${Math.max(g.header, rootBounds.top)}px 0 ${Math.max(0, g.h - rootBounds.bottom)}px 0)`;
      const flask = vessel.getBoundingClientRect();
      vesselTrailMask.current!.setAttribute(
        "transform",
        `translate(${flask.left} ${flask.top}) scale(${flask.width / 420} ${flask.height / 290})`,
      );
      star.current!.setAttribute(
        "transform",
        `translate(${point.x} ${point.y})`,
      );
      star.current!.style.filter = "";
      aura.current!.style.opacity = String(0.65 + flashStrength * 0.35);
      aura.current!.setAttribute("r", g.mobile && !flaskFlash ? "8" : "32");
      flashAura.current!.style.opacity = String(flashStrength * 0.8);
      star.current!.style.opacity = String(shown);
      const trace = curveTrail.update(shown > 0.05 && !docked ? trailCursor : null, time);
      trail.current!.setAttribute("d", trace.d);
      if (trace.points.length > 1) {
        const start = trace.points[0], end = trace.points[trace.points.length - 1];
        gradient.current!.setAttribute("x1", String(start.x));
        gradient.current!.setAttribute("y1", String(start.y));
        gradient.current!.setAttribute("x2", String(end.x));
        gradient.current!.setAttribute("y2", String(end.y));
      }
      trail.current!.style.opacity = String((inRoot ? 0.86 : 0) * trace.opacity);
      container.dataset.lightX = point.x.toFixed(2);
      container.dataset.lightY = point.y.toFixed(2);
      container.dataset.lightOwner = String(owner);
      container.dataset.lightDocked = String(docked);
      if (trace.opacity > 0 && !(trailCursor as TrailCursor | null)?.hold) schedule();
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }
    function stopMagnet() {
      clearTimeout(settleTimer);
      magnet = false;
      snapMotion = null;
      delete container.dataset.magnetTarget;
    }
    function finishBridge(current: Bridge, end: boolean) {
      const owner = end ? current.index : current.index - 1;
      active = null;
      stopMagnet();
      holdGesture(end ? 1 : -1);
      if (current.index === 0 && !end)
        window.dispatchEvent(new Event("landing-logo-return"));
      if (owner === 0) {
        flaskReady = false;
        if (current.index === 1 && !end) beginFlaskFlash();
      }
      if (owner > 0) {
        const state = barStates[owner - 1];
        state.departure = 0;
        state.side = current.side;
        beginBar(owner as BarIndex, 1);
      }
      schedule();
    }
    /** This is the only scroll writer during controlled motion. Events only
     * change requests; reaching a stop drops all excess input. */
    function advance(time: number) {
      const elapsed = lastFrameTime ? time - lastFrameTime : 16;
      lastFrameTime = time;
      if (!animated) return;
      if (active) {
        const current = active;
        if (snapMotion) {
          const u = clamp((time - snapMotion.started) / snapMotion.duration);
          const q = u ** 3 * (10 + u * (-15 + 6 * u));
          current.offset = mix(snapMotion.from, snapMotion.to, q);
          current.velocity = 0;
        } else {
          const before = current.offset;
          current.offset = followScroll(current.offset, current.requested, elapsed);
          current.velocity = (current.offset - before) / Math.max(1, elapsed);
        }
        const state = bridgeFrame(current, current.offset);
        const arriving = state.phase === "entry" &&
          (current.requested > current.offset + 0.001 || current.velocity > 0);
        if (arriving) current.requested = bridgeLength(current);
        let top = state.y;
        // Once the team entry starts its camera is at the receiver. Reading
        // may continue downward inside this section while the light arrives.
        if (state.phase === "entry" && current.origin === 0 && current.index === 1) {
          top = Math.max(top, scrollY);
          if (pageMotion) {
            pageMotion.actual = followScroll(pageMotion.actual, pageMotion.requested, elapsed);
            top = Math.max(top, pageMotion.actual);
            if (pageMotion.actual === pageMotion.requested) pageMotion = null;
          }
        }
        window.scrollTo({ top, behavior: "instant" });
        container.dataset.motionBusy = String(arriving);
        if (current.offset === current.requested &&
            (current.offset === 0 || current.offset === bridgeLength(current))) {
          container.dataset.motionBusy = "false";
          finishBridge(current, current.offset > 0);
        } else if (current.offset !== current.requested) schedule();
      } else if (pageMotion) {
        const motion = pageMotion;
        motion.actual = followScroll(motion.actual, motion.requested, elapsed);
        window.scrollTo({ top: motion.actual, behavior: "instant" });
        if (motion.actual === motion.requested) {
          pageMotion = null;
          const g = geometry();
          if (motion.direction > 0 && motion.requested >= g.ends[motion.index] - 1) {
            holdGesture(1);
            if (motion.index === 0) beginFlaskFlash();
          } else if (motion.direction < 0 && motion.requested <= g.starts[motion.index] + 1)
            holdGesture(-1);
        } else schedule();
      }
    }
    function settle() {
      clearTimeout(settleTimer);
      if (touching || barMotion || flaskFlash || media.matches ||
          voyage?.dataset.voyageCue || voyage?.dataset.voyageNavigation ||
          voyage?.dataset.landingJump) return;
      const quietFor = performance.now() - lastInputAt;
      if (quietFor < 420) {
        clearTimeout(settleTimer);
        settleTimer = window.setTimeout(settle, 420 - quietFor);
        return;
      }
      if (active && Math.abs(active.requested - active.offset) > 0.1) {
        settleTimer = window.setTimeout(settle, 80);
        return;
      }
      if (voyage?.dataset.voyageComplete !== "true" && voyage?.dataset.voyageSkip !== "true") return;
      const g = geometry();
      // The logo's hint moves native scroll without consuming input. Recover
      // only its flight coordinate, then let this same RAF supply gravity.
      if (!active) {
        const transition = sectionTransition(scrollY, pageSections(), g.h, g.header);
        if (!transition) return;
        active = bridge(transition.index);
        active.offset = offsetAtPage(active, scrollY);
        active.requested = active.offset;
      }
      const landing = g.starts[active.index];
      // Reading inside a tall section never attracts the camera to its end.
      if (active.journey && scrollY >= landing - 1) return;
      const middle = (active.start + landing) / 2;
      const acceptedY = bridgeFrame(active, active.requested).y;
      const after = acceptedY > middle + 0.5 ||
        (Math.abs(acceptedY - middle) <= 0.5 && active.origin === 1);
      active.requested = after ? landingOffset(active) : 0;
      snapMotion = { from: active.offset, to: active.requested, started: performance.now(), duration: active.index === 0 ? 1000 : 1200 };
      magnet = true;
      container.dataset.magnetTarget = String(after ? landing : active.start);
      schedule();
    }
    function queueSettle() {
      clearTimeout(settleTimer);
      if (!magnet && !touching && !voyage?.dataset.voyageCue)
        settleTimer = window.setTimeout(settle, 420);
    }
    function scroll() {
      scrollDirection = Math.sign(scrollY - previousY) || scrollDirection;
      previousY = scrollY;
      // A scroll coordinate cannot reconstruct departure/entry progress:
      // those phases intentionally keep the camera stationary.
      schedule();
    }
    function discard(event: Event) {
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
    }
    function moveBridge(delta: number, deliberate = true) {
      if (!active) return;
      const current = active;
      if (Math.sign(delta) !== Math.sign(current.requested - current.offset)) {
        current.requested = current.offset;
        if (Math.sign(delta) !== Math.sign(current.velocity)) current.velocity = 0;
      }
      const landing = landingOffset(current);
      if (delta > 0 && !current.reading && deliberate && current.requested >= landing - 0.5 &&
          scrollY >= geometry().starts[current.index] - 140) current.reading = true;
      if (delta < 0) current.reading = true;
      const limit = current.reading ? bridgeLength(current) : landing;
      current.requested = scrollTarget(current.requested, delta, 0, limit);
      schedule();
      queueSettle();
    }
    function requestReading(index: Index, delta: number) {
      const g = geometry(), direction = Math.sign(delta);
      if (pageMotion && direction !== pageMotion.direction) pageMotion = null;
      const base = pageMotion?.requested ?? scrollY;
      pageMotion = {
        index, direction, actual: pageMotion?.actual ?? scrollY,
        requested: scrollTarget(base, delta, g.starts[index], g.ends[index]),
      };
      schedule();
    }
    function consume(delta: number, event: Event) {
      if (!delta || !animated || voyage?.dataset.voyageCue || voyage?.dataset.landingJump ||
          voyage?.dataset.voyageNavigation) return;
      const now = performance.now(), direction = Math.sign(delta);
      const fresh = freshInput || (event instanceof KeyboardEvent && !event.repeat) ||
        now - lastInputAt > 180 || direction !== lastInputDirection;
      const deliberate = gesture.read(delta, now, fresh ? true : undefined);
      freshInput = false;
      lastInputAt = now;
      lastInputDirection = direction;
      const g = geometry();
      const owner = g.starts.findLastIndex((start) => scrollY >= start - 1);
      const transition = sectionTransition(scrollY, pageSections(), g.h, g.header);
      if (!active && !transition && owner < 0) return;
      discard(event);
      if (barMotion || flaskFlash) {
        // The photos may continue moving upward while their light arrives.
        // Only downward reading inside the team section is accepted.
        const teamArrival = barMotion?.index === 1 && barMotion.to === 1;
        if (teamArrival && delta > 0) requestReading(1, delta);
        return;
      }
      // Inertia cannot turn an arrival into another departure. A continued
      // deliberate gesture can resume after the short reading pause.
      if (!fresh && direction === stoppedDirection &&
          (now - stoppedAt < 350 || !deliberate)) return;
      stoppedDirection = 0;
      stopMagnet();
      if (active) {
        const state = bridgeFrame(active, active.offset);
        if (state.phase === "entry" &&
            (active.requested > active.offset + 0.001 || active.velocity > 0)) {
          if (active.index === 1 && delta > 0) requestReading(1, delta);
          return;
        }
        moveBridge(delta, deliberate);
        return;
      }
      if (transition) {
        active = bridge(transition.index, direction > 0 ? 0 : 1);
        active.offset = offsetAtPage(active, scrollY);
        active.requested = active.offset;
        moveBridge(delta, deliberate);
        return;
      }
      if (owner < 0) return;
      const index = owner as Index;
      if (index > 0) {
        const state = barStates[index - 1];
        if (state.departure && state.departure !== direction) {
          state.departure = 0;
          if (scrollY >= arrivalAt(index as BarIndex) - 1) {
            beginEntry(index as BarIndex);
            return;
          }
        }
        if (state.power > 0 && !state.departure &&
            (direction < 0 || (index < 2 && scrollY >= g.ends[index] - 1))) {
          beginBar(index as BarIndex, 0, direction);
          return;
        }
        if (state.power === 0 && state.departure <= 0) {
          const current = bridge(index, direction > 0 ? 0 : 1);
          current.offset = offsetAtPage(current, scrollY);
          current.requested = current.offset;
          current.trailOrigin = current.offset;
          current.reading = true;
          active = current;
          moveBridge(delta, deliberate);
          return;
        }
      }
      const atEdge = direction > 0 ? scrollY >= g.ends[index] - 1 : scrollY <= g.starts[index] + 1;
      if (!atEdge || pageMotion) {
        requestReading(index, delta);
        return;
      }
      if (index === 0 && direction > 0 && beginFlaskFlash()) return;
      if (index === 2 && direction > 0) return;
      const next = direction > 0 ? index + 1 : index;
      active = bridge(next, direction > 0 ? 0 : 1);
      active.offset = direction > 0 ? 0 : bridgeLength(active);
      active.requested = active.offset;
      moveBridge(delta);
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (!event.deltaY) {
        lastInputAt = performance.now();
        stopMagnet();
        queueSettle();
        return;
      }
      consume(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1), event);
    }
    function key(event: KeyboardEvent) {
      if (event.altKey || event.metaKey || event.ctrlKey ||
          (event.target instanceof HTMLElement &&
            (event.target.matches("input,textarea,select") || event.target.isContentEditable))) return;
      if (event.key === " " && event.target instanceof HTMLElement && event.target.matches("button,a")) return;
      const direction = ["ArrowDown", "PageDown", "End", " "].includes(event.key)
        ? event.shiftKey ? -1 : 1
        : ["ArrowUp", "PageUp", "Home"].includes(event.key) ? -1 : 0;
      consume(direction * (["ArrowDown", "ArrowUp"].includes(event.key) ? 70 : innerHeight * 0.8), event);
    }
    function pointerDown() {
      freshInput = true;
      touching = true;
      stopMagnet();
    }
    function touchStart(event: TouchEvent) {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      pointerDown();
    }
    function touchMove(event: TouchEvent) {
      if (touchY === null || event.touches.length !== 1) return;
      const y = event.touches[0].clientY;
      const delta = touchY - y;
      touchY = y;
      consume(delta, event);
    }
    function pointerUp() {
      touching = false;
      queueSettle();
    }
    function navigate() {
      stopMagnet();
      active = null;
      pageMotion = null;
      barMotion = null;
      container.dataset.motionBusy = "false";
      delete container.dataset.barAnimation;
      stoppedDirection = 0;
      barStates.forEach(state => {
        state.departure = 0;
        if (state.power < 1) state.power = 0;
      });
      if (flaskFlash) {
        flaskFlash = null;
        flashStrength = 0;
        container.dataset.motionBusy = "false";
        delete container.dataset.flaskFlash;
      }
      flaskReady = false;
      curveTrail.reset();
      schedule();
    }
    function resized() {
      const current = active;
      routes.clear();
      if (current) {
        const reception = current.receptionProgress === undefined || current.index === 0 ? undefined
          : mix(arrivalAt(current.index as BarIndex), geometry().ends[current.index], current.receptionProgress);
        const next = bridge(current.index, current.origin, reception);
        next.offset = current.offset / bridgeLength(current) * bridgeLength(next);
        next.requested = current.requested / bridgeLength(current) * bridgeLength(next);
        next.velocity = current.velocity;
        next.reading = current.reading;
        active = next;
      }
      if (pageMotion) {
        const g = geometry();
        pageMotion.actual = scrollY;
        pageMotion.requested = scrollTarget(pageMotion.requested, 0,
          g.starts[pageMotion.index], g.ends[pageMotion.index]);
      }
      curveTrail.reset();
      schedule();
    }
    function preference() {
      animated = !media.matches && !!voyage?.querySelector("[data-voyage-stage]");
      container.dataset.animated = String(animated);
      svg.dataset.animated = String(animated);
      if (!animated) navigate();
      resized();
    }
    const resize = new ResizeObserver(resized);
    sections.forEach((el) => {
      resize.observe(el);
      el.querySelectorAll<HTMLElement>("h2, h3, p, [data-descent-vessel], [data-descent-panel], [data-descent-bar]")
        .forEach((anchor) => resize.observe(anchor));
    });
    document.fonts.addEventListener("loadingdone", resized);
    const mode = new MutationObserver(preference);
    if (voyage) mode.observe(voyage, { childList: true });
    media.addEventListener("change", preference);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resized);
    window.addEventListener("wheel", wheel, { passive: false, capture: true });
    window.addEventListener("keydown", key, true);
    window.addEventListener("touchstart", touchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", touchMove, { passive: false, capture: true });
    window.addEventListener("touchend", pointerUp, { passive: true });
    window.addEventListener("touchcancel", pointerUp, { passive: true });
    window.addEventListener("pointerdown", pointerDown, { passive: true });
    window.addEventListener("pointerup", pointerUp, { passive: true });
    window.addEventListener("pointercancel", pointerUp, { passive: true });
    window.addEventListener("landing-navigate", navigate);
    window.addEventListener("landing-scroll-release", settle);
    preference();
    return () => {
      cancelAnimationFrame(frame);
      stopMagnet();
      container.dataset.motionBusy = "false";
      delete container.dataset.barAnimation;
      resize.disconnect();
      document.fonts.removeEventListener("loadingdone", resized);
      delete container.dataset.flaskFlash;
      mode.disconnect();
      media.removeEventListener("change", preference);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resized);
      window.removeEventListener("wheel", wheel, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("touchstart", touchStart, true);
      window.removeEventListener("touchmove", touchMove, true);
      window.removeEventListener("touchend", pointerUp);
      window.removeEventListener("touchcancel", pointerUp);
      window.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
      window.removeEventListener("landing-navigate", navigate);
      window.removeEventListener("landing-scroll-release", settle);
    };
  }, [clientReady]);
  return (
    <div ref={root} className={styles.descent} data-descent-root>
      {clientReady &&
        createPortal(
          <svg
            ref={scene}
            className={styles.sequenceScene}
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <defs>
              <mask
                id={trailMaskId}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="100%"
                height="100%"
              >
                <rect width="100%" height="100%" fill="white" />
                <path ref={vesselTrailMask} d={vesselBodyPath} fill="black" />
              </mask>
              <radialGradient id={haloId}>
                <stop stopColor="#efc852" stopOpacity=".52" />
                <stop offset=".2" stopColor="#efc852" stopOpacity=".28" />
                <stop offset=".5" stopColor="#efc852" stopOpacity=".06" />
                <stop offset="1" stopColor="#efc852" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={coreId}>
                <stop stopColor="#ffe6a6" />
                <stop offset=".5" stopColor="#f8d786" />
                <stop offset="1" stopColor="#efc465" />
              </radialGradient>
              <linearGradient
                ref={gradient}
                id={trailId}
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#e8c16a" stopOpacity="0" />
                <stop offset=".35" stopColor="#e8c16a" stopOpacity=".16" />
                <stop offset=".75" stopColor="#efcd7f" stopOpacity=".7" />
                <stop offset="1" stopColor="#f4d07b" stopOpacity="1" />
              </linearGradient>
            </defs>
            <g>
              <path
                ref={trail}
                className={styles.sequenceTrail}
                mask={`url(#${trailMaskId})`}
                stroke={`url(#${trailId})`}
                fill="none"
              />
              <g ref={star} className={styles.sequenceStar} data-sequence-star>
                <circle ref={flashAura} r="50" fill={`url(#${haloId})`} opacity="0" />
                <circle ref={aura} r="32" fill={`url(#${haloId})`} />
                <circle r="3.8" fill={`url(#${coreId})`} />
              </g>
            </g>
          </svg>,
          document.body,
        )}
      {children}
    </div>
  );
}
