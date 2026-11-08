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
  flightPath,
  mix,
  glassRoute,
  rightRoute,
  byDistance,
  quintic,
  type LightPath,
  type LightPoint,
  type LightSide,
} from "./descent-motion";
import styles from "./landing.module.css";
import { vesselBodyPath } from "./GlassVessel";
import { sectionTransition } from "./section-magnet";
import {
  bridgeFrame,
  bridgeLength,
  bridgeStop,
  type ScrollBridge,
} from "./descent-scroll";
import { CurveTrail, type TrailCursor } from "./curve-trail";
import { ScrollGesture } from "./scroll-gesture";

type Index = 0 | 1 | 2;
type BarIndex = 1 | 2;
const subscribeClient = () => () => {};
/** Scroll controls the light and the section magnet. Visible bar effects and
 * the flask's reading flash briefly own the scroll; offscreen targets wait. */
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
      settleTimer = 0,
      magnetFrame = 0;
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
    const approaches = new Map<string, { start: number; end: number; at: LightPath }>();
    const powers = [0, 0, 0];
    const barStates = [
      { power: 0, departure: 0, side: "left" as LightSide },
      { power: 0, departure: 0, side: "right" as LightSide },
    ];
    type Bridge = ScrollBridge & {
      index: number;
      offset: number;
      side: LightSide;
      departure: LightPath;
      flight: LightPath;
      arrival: LightPath;
      pageCoordinates: boolean;
      trailStart: number;
    };
    const routes = new Map<number, Omit<Bridge, "offset">>();
    let active: Bridge | null = null;
    let previousY = scrollY,
      scrollDirection = 1;
    let magnet: {
      from: number;
      to: number;
      started: number;
      bridge: Bridge;
      duration: number;
    } | null = null;
    let barMotion: {
      index: BarIndex;
      from: number;
      to: number;
      started: number;
      top: number;
      side: LightSide;
    } | null = null;
    let flaskReady = false;
    let flaskFlash: { started: number; top: number } | null = null;
    let flashStrength = 0;
    function geometry() {
      const w = innerWidth,
        h = innerHeight,
        header = w <= 760 ? 68 : 76;
      const bounds = sections.map((el) => el.getBoundingClientRect());
      const starts = bounds.map((r) => r.top + scrollY - header);
      const ends = bounds.map((r, i) =>
        Math.max(starts[i], r.bottom + scrollY - h),
      );
      return { w, h, header, bounds, starts, ends };
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
    function bridge(index: number, origin: 0 | 1 = scrollDirection < 0 ? 1 : 0): Bridge {
      let route = routes.get(index);
      if (!route) {
        const g = geometry();
        const from = index - 1;
        const to = index as Index;
        const side: LightSide = to < 2 ? "left" : "right";
        const start = from < 0 ? pageSections()[0].bottom - g.h : g.ends[from];
        const end = g.starts[to];
        const waiting = { x: side === "left" ? 34 : g.w - 34, y: g.h - 84 };
        const source = from < 0 ? null : port(from as Index, side, start);
        const target = port(to, side, end);
        const a = source?.visible ? source.p : waiting;
        const b = target.visible ? target.p : waiting;
        let parts: { departure: LightPath; flight: LightPath; entry: LightPath; trailStart?: number };
        if (to === 0)
          parts = { departure: () => target.p, flight: () => target.p, entry: () => target.p };
        else if (to === 1 && source?.visible)
          parts = glassRoute(source.p, source.neck, b, g.w, g.h, g.header, false, target.visible, end - start);
        else if (to === 2)
          parts = rightRoute(a, b, g.w, g.h, g.header, false, target.visible, end - start);
        else {
          const path = flightPath(a, b, side, g.w, g.header, 140);
          parts = {
            departure: (q: number) => path(q * 0.16),
            flight: (q: number) => path(0.16 + q * 0.68),
            entry: (q: number) => path(0.84 + q * 0.16),
          };
        }
        route = {
          index,
          start,
          end,
          side,
          exit: source?.visible ? 140 : 0,
          entry: to > 0 && target.visible ? 100 : 0,
          departure: parts.departure,
          flight: parts.flight,
          arrival: parts.entry,
          pageCoordinates: to === 2 || (to === 1 && !!source?.visible),
          trailStart: (parts.trailStart ?? 0) * (source?.visible ? 140 : 0),
        };
        routes.set(index, route);
      }
      return { ...route, offset: 0, origin };
    }
    function bridgePoint(current: Bridge, offset: number) {
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
        alpha = vesselPort.visible ? 1 : 0;
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
        origin: current.origin === 1 ? length : current.trailStart,
        min: current.trailStart,
        max: length,
        at: (offset) => bridgePoint(current, offset),
      };
      alpha = 1;
      docked = false;
      if (current.index === 1)
        paintPower(0, state.phase === "departure" ? 1 - ease(state.amount) : 0, "left");
      container.dataset.lightPhase = state.phase;
      container.dataset.lightProgress = (current.offset / bridgeLength(current)).toFixed(4);
      return Math.max(0, state.phase === "departure" ? current.index - 1 : current.index) as Index;
    }
    function readingLight(index: Index) {
      const g = geometry();
      if (index === 0) {
        const vesselPort = port(0, "left");
        point = vesselPort.p;
        docked = true;
        alpha = vesselPort.visible ? 1 : 0;
        paintPower(0, 1, "left");
        container.dataset.lightPhase = "contained";
        delete container.dataset.lightProgress;
        return;
      }
      const bar = index > 0 ? barStates[index - 1] : null;
      const side = bar?.side ?? "left";
      const target = port(index, side);
      const waiting = { x: side === "left" ? 34 : g.w - 34, y: g.h - 84 };
      const key = `reading:${index}:${side}`;
      let approach = approaches.get(key);
      if (!approach) {
        const endPoint = { x: target.p.x, y: target.p.y + scrollY };
        const start = endPoint.y - g.h - 100;
        // Finish when the bar itself is visible, without reserving an extra
        // halo-sized strip that can leave a slightly taller mobile slide stuck.
        const end = start + 102;
        const startPoint = { x: waiting.x, y: start + waiting.y };
        const sign = side === "left" ? -1 : 1;
        const handle = Math.min(40, Math.abs(waiting.x - endPoint.x) * 0.65);
        const path = byDistance(quintic(
          startPoint,
          { x: startPoint.x, y: startPoint.y + 60 },
          { x: startPoint.x, y: startPoint.y + 120 },
          { x: endPoint.x + sign * handle, y: endPoint.y },
          { x: endPoint.x + sign * handle / 2, y: endPoint.y },
          endPoint,
        ));
        approach = { start, end, at: (y) => path(clamp((y - start) / (end - start))) };
        approaches.set(key, approach);
      }
      const p = approach.at(scrollY);
      point = scrollY < approach.start ? waiting : { x: p.x, y: p.y - scrollY };
      if (scrollY > approach.start && scrollY < approach.end) {
        const current = approach;
        trailCursor = {
          key, value: scrollY,
          origin: scrollDirection > 0 ? current.start : current.end,
          min: current.start, max: current.end,
          at: (y) => {
            const value = current.at(y);
            return { x: value.x, y: value.y - scrollY };
          },
        };
      }
      if (bar && !bar.departure && target.visible && bar.power < 1)
        beginBar(index as BarIndex, 1);
      docked = bar?.power === 1;
      if (docked) point = target.p;
      alpha = docked ? 0 : 1;
      paintPower(index, bar?.power ?? 0, side);
      container.dataset.lightPhase = docked ? "contained" : "approach";
      delete container.dataset.lightProgress;
    }
    function beginBar(index: BarIndex, to: number, direction = 0) {
      const state = barStates[index - 1];
      const side = to ? state.side : index === 1 && direction < 0 ? "left" : "right";
      if (barMotion || !animated || !port(index, side).visible || state.power === to) return;
      stopMagnet();
      if (!to) state.departure = direction;
      state.side = side;
      barMotion = {
        index,
        from: state.power,
        to,
        started: performance.now(),
        top: scrollY,
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
      if (Math.abs(scrollY - motion.top) > 0.5)
        window.scrollTo({ top: motion.top, behavior: "instant" });
      if (q >= 1) {
        barStates[motion.index - 1].power = motion.to;
        barMotion = null;
        container.dataset.motionBusy = "false";
        delete container.dataset.barAnimation;
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
      flaskFlash = { started: performance.now(), top: geometry().ends[0] };
      window.scrollTo({ top: flaskFlash.top, behavior: "instant" });
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
      if (Math.abs(scrollY - motion.top) > 0.5)
        window.scrollTo({ top: motion.top, behavior: "instant" });
      schedule();
    }
    function render(time: number) {
      frame = 0;
      trailCursor = null;
      const g = geometry(),
        rootBounds = container.getBoundingClientRect();
      const team = panel.getBoundingClientRect();
      if (!flaskFlash && scrollY < g.ends[0] - 48) flaskReady = false;
      container.style.setProperty("--team-top", `${g.bounds[1].top - rootBounds.top}px`);
      container.style.setProperty("--team-height", `${g.bounds[1].height}px`);
      panel.style.setProperty("--panel-light-y", `${team.height}px`);
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
          current.offset = current.exit + scrollY - current.start;
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
      if (trace.opacity > 0) schedule();
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }
    function stopMagnet() {
      cancelAnimationFrame(magnetFrame);
      clearTimeout(settleTimer);
      magnetFrame = 0;
      magnet = null;
      delete container.dataset.magnetTarget;
    }
    function applyOffset(current: Bridge, offset: number) {
      current.offset = clamp(offset / bridgeLength(current)) * bridgeLength(current);
      window.scrollTo({ top: bridgeFrame(current, current.offset).y, behavior: "instant" });
      schedule();
    }
    function finishBridge(current: Bridge, end: boolean) {
      const owner = end ? current.index : current.index - 1;
      active = null;
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
    function attract(time: number) {
      magnetFrame = 0;
      const current = magnet;
      if (!current) return;
      const q = clamp((time - current.started) / current.duration);
      applyOffset(current.bridge, mix(current.from, current.to, ease(q)));
      if (q < 1 && Math.abs(current.bridge.offset - current.to) > 0.5)
        magnetFrame = requestAnimationFrame(attract);
      else {
        applyOffset(current.bridge, current.to);
        magnet = null;
        delete container.dataset.magnetTarget;
        finishBridge(current.bridge, current.to > 0);
      }
    }
    function settle() {
      clearTimeout(settleTimer);
      if (
        magnet || touching || barMotion || flaskFlash || media.matches ||
        voyage?.dataset.voyageCue || voyage?.dataset.voyageNavigation ||
        voyage?.dataset.landingJump
      ) return;
      if (voyage?.dataset.voyageComplete !== "true" && voyage?.dataset.voyageSkip !== "true") return;
      if (!active) {
        const g = geometry();
        const transition = sectionTransition(scrollY, pageSections(), g.h, g.header);
        if (!transition) {
          // A discharge can outlast the gesture that started it. If the light
          // is still at its visible bar, let it re-enter without another event.
          barStates.forEach((state, i) => {
            const index = (i + 1) as BarIndex;
            const target = port(index, state.side);
            if (state.departure && state.power === 0 && target.visible &&
                Math.hypot(point.x - target.p.x, point.y - target.p.y) < 18) {
              state.departure = 0;
              beginBar(index, 1);
            }
          });
          return;
        }
        active = bridge(transition.index);
        active.offset = active.exit + scrollY - active.start;
      }
      const to = bridgeStop(active, active.offset, scrollY);
      if (Math.abs(to - active.offset) < 0.01) {
        finishBridge(active, to > 0);
        return;
      }
      magnet = { from: active.offset, to, started: performance.now(), bridge: active,
        duration: Math.abs(to - active.offset) < 36 ? 270 : 360 };
      container.dataset.magnetTarget = String(to ? active.end : active.start);
      magnetFrame = requestAnimationFrame(attract);
    }
    function queueSettle() {
      clearTimeout(settleTimer);
      if (!magnet && !touching && !voyage?.dataset.voyageCue)
        settleTimer = window.setTimeout(settle, 180);
    }
    function scroll() {
      scrollDirection = Math.sign(scrollY - previousY) || scrollDirection;
      previousY = scrollY;
      if (active && !magnet && !barMotion) {
        const expected = bridgeFrame(active, active.offset).y;
        if (Math.abs(scrollY - expected) > 2) {
          if (scrollY >= active.start - 1 && scrollY <= active.end + 1)
            active.offset = active.exit + scrollY - active.start;
          else active = null;
        }
      }
      schedule();
      if (!magnet) queueSettle();
    }
    function discard(event: Event) {
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
    }
    function moveBridge(delta: number) {
      const current = active;
      if (!current) return;
      const before = current.offset;
      applyOffset(current, before + delta);
      const overflow = delta - (current.offset - before);
      if (current.offset <= 0 || current.offset >= bridgeLength(current)) {
        finishBridge(current, current.offset > 0);
        if (!(current.index === 0 && current.offset === 0) &&
            !barMotion && !flaskFlash && Math.abs(overflow) > 0.01)
          window.scrollTo({ top: scrollY + overflow, behavior: "instant" });
      }
      queueSettle();
      if (active && gesture.settling(performance.now())) {
        const to = bridgeStop(active, active.offset, scrollY);
        if (Math.abs(to - active.offset) < 28 && Math.sign(to - active.offset) === Math.sign(delta))
          settle();
      }
    }
    function consume(delta: number, event: Event) {
      if (!delta) return;
      const deliberate = gesture.read(delta, performance.now(),
        freshInput || (event instanceof KeyboardEvent && !event.repeat) ? true : undefined);
      freshInput = false;
      // The intro owns its one-off hint nudge and lets a fresh gesture cancel
      // it before native scrolling. Its return uses this same section magnet.
      if (voyage?.dataset.voyageCue) return;
      if (magnet && !deliberate && Math.abs(delta) <= 3 &&
          Math.sign(delta) === Math.sign(magnet.to - magnet.bridge.offset)) {
        discard(event);
        return;
      }
      stopMagnet();
      if (barMotion || flaskFlash) {
        discard(event);
        return;
      }
      if (!animated) return;
      // Always leave an idle check, including input that cannot move the page.
      queueSettle();
      const direction = Math.sign(delta);
      barStates.forEach((state) => {
        if (state.departure && state.departure !== direction) state.departure = 0;
      });
      if (active) {
        discard(event);
        moveBridge(delta);
        return;
      }
      const g = geometry();
      const owner = g.starts.findLastIndex((start) => scrollY >= start - 1);
      if (owner === 0 && flaskReady && !deliberate && scrollY >= g.ends[0] - 1) {
        discard(event);
        return;
      }
      if (owner > 0) {
        const state = barStates[owner - 1];
        if (!deliberate && Math.abs(delta) <= 3 && state.power === 1 &&
            port(owner as BarIndex, state.side).visible) {
          discard(event);
          return;
        }
        if (state.power > 0 && !state.departure &&
            (delta < 0 || (owner < sections.length - 1 && scrollY + delta > g.ends[owner])))
          beginBar(owner as BarIndex, 0, direction);
        if (barMotion) {
          discard(event);
          return;
        }
      }
      const transition = sectionTransition(scrollY, pageSections(), g.h, g.header);
      if (transition) {
        if (transition.index === 1 && delta > 0 && !flaskReady) {
          window.scrollTo({ top: g.ends[0], behavior: "instant" });
          if (beginFlaskFlash()) {
            discard(event);
            return;
          }
        }
        active = bridge(transition.index, direction > 0 ? 0 : 1);
        active.offset = active.exit + scrollY - active.start;
        discard(event);
        moveBridge(delta);
        return;
      }
      if (owner < 0 || (direction > 0 && owner === sections.length - 1)) return;
      const index = direction > 0 ? owner + 1 : owner;
      const current = bridge(index, direction > 0 ? 0 : 1);
      const edge = direction > 0 ? current.start : current.end;
      const crosses = direction > 0
        ? scrollY <= edge + 1 && scrollY + delta >= edge
        : scrollY >= edge - 1 && scrollY + delta <= edge;
      if (!crosses) return;
      discard(event);
      const remaining = delta - (edge - scrollY);
      window.scrollTo({ top: edge, behavior: "instant" });
      if (owner === 0 && direction > 0 && beginFlaskFlash()) return;
      if (owner > 0 && barStates[owner - 1].power > 0 && !barStates[owner - 1].departure) {
        beginBar(owner as BarIndex, 0, direction);
        if (barMotion) return;
      }
      active = current;
      active.offset = direction > 0 ? 0 : bridgeLength(current);
      moveBridge(remaining);
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
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
      navigate();
      routes.clear();
      approaches.clear();
    }
    function preference() {
      animated = !media.matches && !!voyage?.querySelector("[data-voyage-stage]");
      container.dataset.animated = String(animated);
      svg.dataset.animated = String(animated);
      resized();
    }
    const resize = new ResizeObserver(resized);
    sections.forEach((el) => resize.observe(el));
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
