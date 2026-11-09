"use client";

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { clamp, ease, type LightSide } from "./descent-motion";
import styles from "./landing.module.css";
import { vesselBodyPath } from "./GlassVessel";
import { CurveTrail, type TrailCursor } from "./curve-trail";
import { followScroll, scrollHandoffEvent, type ScrollHandoff } from "./descent-controller";
import { scrollInputTarget, gravityTarget, maximumInputLag, slideGravityDelay, slideScrollSpeed, TouchMomentum } from "./continuous-scroll";
import { barIllumination, createDescentTimeline, type DescentTimeline, type DescentGeometry } from "./continuous-descent";

const subscribeClient = () => () => {};
/** One continuous scroll coordinate drives camera, light and illumination. */
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
    const container = root.current, svg = scene.current;
    const starNode = star.current!, auraNode = aura.current!, flashNode = flashAura.current!;
    const trailNode = trail.current!, gradientNode = gradient.current!, maskNode = vesselTrailMask.current!;
    const sections = Array.from(container.querySelectorAll<HTMLElement>("[data-snap-section]"));
    const vessel = container.querySelector<HTMLElement>("[data-descent-vessel]")!;
    const bars = Array.from(container.querySelectorAll<HTMLElement>("[data-descent-bar]"));
    const members = Array.from(container.querySelectorAll<HTMLElement>("[data-descent-member]"));
    const panel = container.querySelector<HTMLElement>("[data-descent-panel]")!;
    const voyage = document.getElementById("idea")!;
    if (sections.length !== 3 || bars.length !== 2 || !vessel || !starNode || !maskNode) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const curveTrail = new CurveTrail(), touch = new TouchMomentum();
    const sides: LightSide[] = ["left", "left", "right"];
    let geometry: DescentGeometry, timeline: DescentTimeline;
    let forwardTimeline: DescentTimeline, returnTimeline: DescentTimeline;
    let travelDirection = 1;
    let disposed = false, animated = !media.matches, driving = false;
    let frame = 0, navigationFrame = 0, previousTime = 0, lastInputAt = -Infinity;
    let position = 0, requested = 0, lastWrittenY = NaN, previousPosition = 0;
    let touchY: number | null = null, flashed = false, flashAt = -Infinity;

    function measure() {
      const old = timeline?.at(position), backlog = requested - position;
      const returning = timeline !== undefined && timeline === returnTimeline;
      const header = innerWidth <= 760 ? 68 : 76;
      const measured = sections.map((section, index) => {
        const r = section.getBoundingClientRect();
        const port = (index === 0 ? vessel : bars[index - 1]).getBoundingClientRect();
        const bodyY = port.top + scrollY + (index === 0 ? port.height * 197 / 290 : port.height / 2);
        return { start: r.top + scrollY - header,
          end: Math.max(r.top + scrollY - header, r.bottom + scrollY - innerHeight),
          left: { x: index === 0 ? port.left + port.width / 2 : port.left, y: bodyY },
          right: { x: index === 0 ? port.left + port.width / 2 : port.right, y: bodyY },
          neck: { x: port.left + port.width / 2, y: port.top + scrollY + port.height * 43 / 290 } };
      });
      geometry = { width: document.documentElement.clientWidth, height: innerHeight, header,
        logoEnd: voyage.getBoundingClientRect().bottom + scrollY - innerHeight,
        footerTop: container.querySelector("footer")!.getBoundingClientRect().top + scrollY, sections: measured };
      forwardTimeline = createDescentTimeline(geometry);
      returnTimeline = createDescentTimeline(geometry, true);
      timeline = returning ? returnTimeline : forwardTimeline;
      container.dataset.scrollLength = String(timeline.length);
      if (driving && old) {
        const replacement = timeline.segments.find(s => s.kind === old.segment.kind && s.index === old.segment.index)!;
        const ratio = old.local / Math.max(1, old.segment.to - old.segment.from);
        position = replacement.from + ratio * (replacement.to - replacement.from);
        requested = Math.max(-voyage.offsetHeight, Math.min(timeline.length, position + backlog));
      } else {
        position = timeline.positionAtPage(scrollY);
        requested = position;
      }
      curveTrail.reset();
      schedule();
    }
    function selectTravelTimeline() {
      const next = travelDirection < 0 ? returnTimeline : forwardTimeline;
      if (next === timeline) return;
      const before = timeline.at(position).segment, after = next.at(position).segment;
      // Change reception timing only while the light is hidden in the same
      // fully illuminated bar. Reversing a visible curve keeps its exact pose.
      if (before.kind !== "resident" || after.kind !== "resident" || before.index !== after.index) return;
      timeline = next;
      curveTrail.reset();
    }
    function schedule() {
      if (!disposed && !frame) frame = requestAnimationFrame(render);
    }
    function port(index: number, side: LightSide, page = scrollY) {
      const p = geometry.sections[index][side];
      return { x: p.x, y: p.y - page };
    }
    function paintPower(index: number, value: number, side: LightSide) {
      const power = clamp(value), name = ["vessel", "panel", "pilot"][index];
      container.style.setProperty(`--${name}-power`, String(power));
      if (index > 0) {
        bars[index - 1].style.setProperty("--charge", String(power));
        bars[index - 1].dataset.direction = side === "left" ? "ltr" : "rtl";
        bars[index - 1].dataset.charging = String(power > 0 && power < 1);
      }
      if (index === 1) members.forEach((member, i) => {
        const order = side === "left" ? i : members.length - 1 - i;
        member.style.setProperty("--member-power", String(ease((power - order * 0.22) / 0.56)));
      });
    }
    function render(time: number) {
      frame = 0;
      if (disposed || !timeline) return;
      const elapsed = Math.min(32, previousTime ? time - previousTime : 16);
      previousTime = time;
      selectTravelTimeline();
      if (driving && animated) {
        const center = timeline.gravityCenter(requested);
        requested = gravityTarget(position, requested, center, elapsed, time - lastInputAt, 64);
        position = followScroll(position, requested, elapsed, slideScrollSpeed);
        if (position <= 0 && requested < 0) {
          driving = false;
          const delta = requested;
          position = 0; requested = 0;
          window.dispatchEvent(new CustomEvent("landing-logo-return", { detail: { delta } }));
        } else {
          lastWrittenY = timeline.at(position).page;
          window.scrollTo({ top: lastWrittenY, behavior: "instant" });
        }
        if (center !== null && time - lastInputAt >= slideGravityDelay)
          container.dataset.gravityTarget = center.toFixed(3);
        else delete container.dataset.gravityTarget;
      }
      const state = timeline.at(position), { segment, distance, local } = state;
      const rootBounds = container.getBoundingClientRect(), g = geometry;
      const teamBounds = sections[1].getBoundingClientRect();
      container.style.setProperty("--team-top", `${teamBounds.top - rootBounds.top}px`);
      container.style.setProperty("--team-height", `${teamBounds.height}px`);
      panel.style.setProperty("--panel-light-y", "0px");
      const powers = [0, 0, 0];
      let owner = segment.index, point = port(owner, sides[owner]);
      let alpha = owner === 0 ? 1 : 0, docked = true;
      let cursor: TrailCursor | null = null;
      let phase = "contained";
      if (segment.journey && state.frame) {
        const curve = segment.journey;
        const route = state.frame;
        const side: LightSide = segment.index === 1 ? "left" : "right";
        phase = route.phase;
        docked = false;
        point = { x: route.point.x, y: route.point.y + segment.pageStart - scrollY };
        alpha = 1;
        if (route.phase === "departure") {
          owner = segment.index - 1;
          sides[owner] = side;
          powers[owner] = owner === 0 ? 1 - ease(route.amount) : 0;
        } else if (route.phase === "entry") {
          sides[owner] = side;
          powers[owner] = 0;
        }
        if (distance >= curve.trailStart) cursor = {
          key: `journey:${segment.index}`, value: distance,
          origin: position >= previousPosition ? curve.trailStart : curve.length,
          min: curve.trailStart, max: curve.length, hold: true,
          at: offset => {
            const p = curve.at(offset).point;
            return { x: p.x, y: p.y + segment.pageStart - scrollY };
          },
        };
        container.dataset.lightProgress = (distance / curve.length).toFixed(4);
        container.dataset.lightRoute = String(segment.index);
      } else if (segment.kind === "charge" || segment.kind === "discharge") {
        const bar = barIllumination(segment, local);
        powers[owner] = bar.power;
        sides[owner] = bar.side;
        point = port(owner, bar.side);
        alpha = 0; docked = true; phase = segment.kind;
        delete container.dataset.lightProgress;
        delete container.dataset.lightRoute;
      } else {
        powers[owner] = 1;
        delete container.dataset.lightProgress;
        delete container.dataset.lightRoute;
      }
      if (!animated) {
        powers.fill(1); alpha = 0;
      }
      powers.forEach((power, index) => paintPower(index, power, sides[index]));
      const nearFlask = segment.kind === "resident" && owner === 0 &&
        Math.abs(scrollY - (g.sections[0].start + g.sections[0].end) / 2) < 80;
      if (!nearFlask) flashed = false;
      if (nearFlask && !flashed) { flashed = true; flashAt = time; }
      const flashAge = time - flashAt;
      const flash = animated && nearFlask && flashAge < 300 ? Math.sin(Math.PI * flashAge / 300) ** 2 : 0;
      if (flash > 0) container.dataset.flaskFlash = "true";
      else delete container.dataset.flaskFlash;
      const shown = animated && rootBounds.top < g.height && rootBounds.bottom > g.header;
      const trace = curveTrail.update(shown && alpha > 0.01 ? cursor : null, time);
      svg.setAttribute("viewBox", `0 0 ${g.width} ${g.height}`);
      svg.style.width = `${g.width}px`; svg.style.height = `${g.height}px`;
      svg.style.clipPath = `inset(${Math.max(g.header, rootBounds.top)}px 0 ${Math.max(0, g.height - rootBounds.bottom)}px 0)`;
      const flask = vessel.getBoundingClientRect();
      maskNode.setAttribute("transform", `translate(${flask.left} ${flask.top}) scale(${flask.width / 420} ${flask.height / 290})`);
      starNode.setAttribute("transform", `translate(${point.x} ${point.y})`);
      starNode.style.opacity = String(shown ? alpha : 0);
      auraNode.style.opacity = String(0.65 + flash * 0.35);
      auraNode.setAttribute("r", innerWidth <= 760 && !flash ? "8" : "32");
      flashNode.style.opacity = String(flash * 0.8);
      trailNode.setAttribute("d", trace.d);
      trailNode.style.opacity = String(shown ? trace.opacity * alpha * 0.86 : 0);
      if (trace.points.length > 1) {
        const a = trace.points[0], b = trace.points.at(-1)!;
        gradientNode.setAttribute("x1", String(a.x)); gradientNode.setAttribute("y1", String(a.y));
        gradientNode.setAttribute("x2", String(b.x)); gradientNode.setAttribute("y2", String(b.y));
      }
      Object.assign(container.dataset, { lightPhase: phase, lightOwner: String(owner),
        lightDirection: timeline === returnTimeline ? "return" : "forward",
        lightDocked: String(docked), lightX: point.x.toFixed(3), lightY: point.y.toFixed(3),
        motionBusy: "false", scrollPosition: position.toFixed(3), scrollRequested: requested.toFixed(3),
        lightVelocity: ((position - previousPosition) / elapsed).toFixed(5),
        lightCamera: scrollY.toFixed(3) });
      previousPosition = position;
      const center = timeline.gravityCenter(requested);
      if ((driving && (Math.abs(position - requested) > 0.001 ||
        (center !== null && Math.abs(requested - center) > 0.01))) ||
        (animated && nearFlask && flashAge >= 0 && flashAge < 300)) schedule();
    }
    function consume(delta: number, input?: Event) {
      if (!delta || !animated || !driving) return;
      if (input?.cancelable) input.preventDefault();
      travelDirection = Math.sign(delta);
      selectTravelTimeline();
      requested = scrollInputTarget(position, requested, delta, -voyage.offsetHeight, timeline.length,
        slideScrollSpeed * maximumInputLag);
      lastInputAt = performance.now();
      schedule();
    }
    function handoff(event: Event) {
      if (!animated) return;
      const { delta, input, quietSince } = (event as CustomEvent<ScrollHandoff>).detail;
      driving = true;
      position = timeline.positionAtPage(scrollY);
      travelDirection = Math.sign(delta) || travelDirection;
      selectTravelTimeline();
      const lead = slideScrollSpeed * maximumInputLag;
      requested = Math.max(-voyage.offsetHeight, position - lead,
        Math.min(timeline.length, position + lead, position + delta));
      lastInputAt = quietSince ?? performance.now();
      if (input?.cancelable) input.preventDefault();
      event.preventDefault();
      schedule();
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      consume(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1), event);
    }
    function key(event: KeyboardEvent) {
      if (event.altKey || event.metaKey || event.ctrlKey ||
        (event.target instanceof HTMLElement && (event.target.matches("input,textarea,select") || event.target.isContentEditable))) return;
      if (event.key === " " && event.target instanceof HTMLElement && event.target.matches("button,a")) return;
      const down = ["ArrowDown", "PageDown", "End", " "].includes(event.key);
      const up = ["ArrowUp", "PageUp", "Home"].includes(event.key);
      if (!down && !up) return;
      if (["End", "Home"].includes(event.key)) {
        if (!animated || !driving) return;
        event.preventDefault();
        const id = event.key === "Home" ? "idea" : "pilot";
        window.dispatchEvent(new CustomEvent("landing-navigate", { detail: id }));
        const top = id === "idea" ? 0 : document.getElementById(id)!.getBoundingClientRect().top + scrollY - geometry.header;
        window.scrollTo({ top, behavior: "instant" });
        return;
      }
      const direction = up || (event.key === " " && event.shiftKey) ? -1 : 1;
      consume(direction * (["End", "Home"].includes(event.key) ? document.documentElement.scrollHeight * 2
        : event.key.startsWith("Arrow") ? 70 : innerHeight * 0.8), event);
    }
    function touchStart(event: TouchEvent) {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      touch.start(performance.now());
    }
    function touchMove(event: TouchEvent) {
      if (touchY === null || event.touches.length !== 1) return;
      const y = event.touches[0].clientY, delta = touchY - y;
      touchY = y; touch.move(delta, performance.now()); consume(delta, event);
    }
    function touchEnd() { touchY = null; consume(touch.release(performance.now())); }
    function adopt() {
      navigationFrame = 0;
      driving = animated && voyage.dataset.scrollOwner !== "voyage" && scrollY >= geometry.logoEnd - 1;
      position = timeline.positionAtPage(scrollY); requested = position;
      previousPosition = position;
      schedule();
    }
    function navigate() {
      driving = false;
      travelDirection = 1;
      timeline = forwardTimeline;
      cancelAnimationFrame(navigationFrame);
      navigationFrame = requestAnimationFrame(adopt);
    }
    function voyageNavigation() { driving = false; schedule(); }
    function nativeScroll() {
      if (Math.abs(scrollY - lastWrittenY) <= 2) return;
      if (voyage.dataset.scrollOwner === "voyage" || voyage.dataset.voyageNavigation) {
        driving = false;
        position = timeline.positionAtPage(scrollY); requested = position;
        schedule(); return;
      }
      if (!driving && scrollY > geometry.logoEnd + 1) adopt();
    }
    function preference() {
      animated = !media.matches;
      container.dataset.animated = String(animated);
      svg.dataset.animated = String(animated);
      if (!animated) driving = false;
      measure();
      if (animated) adopt();
    }
    measure();
    container.dataset.animated = String(animated);
    svg.dataset.animated = String(animated);
    adopt();
    const resize = new ResizeObserver(measure);
    sections.forEach(section => resize.observe(section));
    resize.observe(vessel); bars.forEach(bar => resize.observe(bar));
    document.fonts.addEventListener("loadingdone", measure);
    media.addEventListener("change", preference);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", nativeScroll, { passive: true });
    window.addEventListener("wheel", wheel, { passive: false, capture: true });
    window.addEventListener("keydown", key, true);
    window.addEventListener("touchstart", touchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", touchMove, { passive: false, capture: true });
    window.addEventListener("touchend", touchEnd, { passive: true, capture: true });
    window.addEventListener("touchcancel", touchEnd, { passive: true, capture: true });
    window.addEventListener("landing-navigate", navigate);
    window.addEventListener("landing-voyage-navigation", voyageNavigation);
    window.addEventListener(scrollHandoffEvent, handoff);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame); cancelAnimationFrame(navigationFrame);
      resize.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
      media.removeEventListener("change", preference);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", nativeScroll);
      window.removeEventListener("wheel", wheel, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("touchstart", touchStart, true);
      window.removeEventListener("touchmove", touchMove, true);
      window.removeEventListener("touchend", touchEnd, true);
      window.removeEventListener("touchcancel", touchEnd, true);
      window.removeEventListener("landing-navigate", navigate);
      window.removeEventListener("landing-voyage-navigation", voyageNavigation);
      window.removeEventListener(scrollHandoffEvent, handoff);
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
