"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import { finale, smoothRange, visits, waypointStops } from "./voyage-timeline";

const checkpoints = waypointStops.slice(1);
const longerFlights = [
  [0, visits[0].parked],
  [visits[1].departure, visits[2].parked],
  [visits[2].departure, visits[3].parked],
  [visits.at(-1)!.departure, finale.settled],
];
function speedLimit(p: number) {
  // Raise cruising speed without a step at either end of the longer flights.
  const longerFlight = Math.max(
    ...longerFlights.map(
      ([start, end]) =>
        smoothRange(start, start + 0.012, p) *
        (1 - smoothRange(end - 0.012, end, p)),
    ),
  );
  const flight = 0.06 + 0.006 * longerFlight;
  const visit = visits.find(
    (visit) => p >= visit.parked && p <= visit.departure,
  );
  if (visit) {
    const reading =
      smoothRange(visit.parked, visit.parked + 0.01, p) *
      (1 - smoothRange(visit.departure - 0.01, visit.departure, p));
    return flight + 0.27 * reading;
  }
  return flight + 0.2 * smoothRange(finale.settled, finale.sealed, p);
}

/** Native scroll drives a speed-limited playhead. Reading checkpoints consume inertia. */
export function useVoyageProgress(
  target: MotionValue<number>,
  track: RefObject<HTMLElement | null>,
  header: number,
  enabled: boolean,
  finalReady: boolean,
) {
  const progress = useMotionValue(0);
  const finalReadyRef = useRef(finalReady);
  useEffect(() => {
    finalReadyRef.current = finalReady;
  }, [finalReady]);
  const seekRef = useRef<(p: number) => void>(() => {});
  const prepareSeek = useCallback((p: number) => seekRef.current(p), []);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0,
      previousTime = 0,
      velocity = 0,
      lastIntent = 0,
      lastGesture = 0;
    let gate: { point: number; arrived: number } | null = null;
    let overviewLandingAt: number | null = null;
    let overviewLastInputAt = 0;
    let overviewTransition: { top: number; started: number } | null = null;
    let overviewFrame = 0;
    const trackElement = track.current;
    let wasBelow = false,
      previousNativeY = scrollY;
    let allowNativeJumpUntil =
      location.hash && location.hash !== "#main" ? performance.now() + 1200 : 0;
    let ignored: number | null = null,
      bypass: number | null = null,
      pending: number | null = null,
      touchY: number | null = 0,
      newTouch = false;
    function bounds() {
      const element = track.current;
      if (!element) return null;
      const start = element.getBoundingClientRect().top + scrollY - header;
      return { start, length: element.offsetHeight - innerHeight + header };
    }
    function inside() {
      const b = bounds();
      return !!b && scrollY >= b.start - 2 && scrollY <= b.start + b.length + 2;
    }
    function scrollToPoint(p: number) {
      const b = bounds();
      if (b)
        window.scrollTo({ top: b.start + b.length * p, behavior: "instant" });
    }
    function mark() {
      if (track.current)
        track.current.dataset.scrollCheckpoint = gate ? "reading" : "flight";
    }
    function canRelease(fresh: boolean, direction: number) {
      if (!gate) return true;
      const age = performance.now() - gate.arrived,
        final = gate.point === waypointStops.at(-1);
      if (final && direction > 0 && !finalReadyRef.current) return false;
      return age > 350 || (fresh && age > 200);
    }
    function nextPoint(current: number, destination: number) {
      const direction = Math.sign(destination - current);
      const candidates = checkpoints.filter(
        (point) =>
          point !== ignored &&
          (bypass === null || Math.abs(point - bypass) < 0.00001),
      );
      return direction >= 0
        ? candidates.find(
            (point) =>
              point > current + 0.000005 && point <= destination + 0.0002,
          )
        : candidates
            .toReversed()
            .find(
              (point) =>
                point < current - 0.000005 && point >= destination - 0.0002,
            );
    }
    function arrive(point: number) {
      gate = { point, arrived: performance.now() };
      lastGesture = performance.now();
      bypass = null;
      pending = null;
      newTouch = false;
      velocity = 0;
      previousTime = 0;
      frame = 0;
      progress.set(point);
      scrollToPoint(point);
      mark();
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(tick);
    }
    function clearOverviewTransition() {
      cancelAnimationFrame(overviewFrame);
      overviewFrame = 0;
      overviewTransition = null;
      if (track.current) delete track.current.dataset.voyageLeaving;
    }
    function followOverview(time: number) {
      overviewFrame = 0;
      if (!overviewTransition) return;
      const arrived = Math.abs(scrollY - overviewTransition.top) < 1.5;
      if (arrived || time - overviewTransition.started > 1500) {
        clearOverviewTransition();
        overviewLandingAt = arrived ? time : null;
        return;
      }
      overviewFrame = requestAnimationFrame(followOverview);
    }
    function enterOverview() {
      const section = document.getElementById("sobre");
      if (!section) return false;
      const top = section.getBoundingClientRect().top + scrollY - header;
      clearOverviewTransition();
      overviewLandingAt = null;
      overviewLastInputAt = performance.now();
      overviewTransition = { top, started: performance.now() };
      if (track.current) track.current.dataset.voyageLeaving = "true";
      progress.set(1);
      window.scrollTo({
        top,
        behavior: "smooth",
      });
      overviewFrame = requestAnimationFrame(followOverview);
      schedule();
      return true;
    }
    function holdOverview(delta: number, event: Event) {
      const now = performance.now();
      const freshGesture =
        event.type === "keydown"
          ? !(event as KeyboardEvent).repeat
          : now - overviewLastInputAt > 160;
      overviewLastInputAt = now;
      if (overviewTransition) {
        if (delta < 0) {
          clearOverviewTransition();
          if (event.cancelable) event.preventDefault();
          window.scrollTo({ top: scrollY + delta, behavior: "instant" });
          return true;
        }
        if (delta > 0) {
          if (event.cancelable) event.preventDefault();
          return true;
        }
      }
      if (overviewLandingAt === null) return false;
      if (delta < 0 || (now - overviewLandingAt >= 350 && freshGesture)) {
        overviewLandingAt = null;
        return false;
      }
      if (!delta) return false;
      // Momentum belongs to the gesture that left the voyage, even after the
      // reading pause. Only a fresh gesture advances beyond the first section.
      if (event.cancelable) event.preventDefault();
      return true;
    }
    function release(direction: number, delta: number) {
      if (!gate) return;
      const point = gate.point,
        index = checkpoints.indexOf(point),
        visit = visits[index];
      ignored = index >= visits.length && direction < 0 ? null : point;
      gate = null;
      bypass = null;
      pending = null;
      velocity = 0;
      mark();
      if (!visit && direction > 0 && enterOverview()) return;
      const b = bounds();
      const edge = visit
        ? direction > 0
          ? visit.departure
          : visit.parked
        : direction > 0
          ? 1
          : finale.sealed;
      const proposed = edge + (b ? delta / b.length : direction * 0.004);
      const following = nextPoint(edge, proposed);
      pending = following ?? null;
      scrollToPoint(following ?? proposed);
      schedule();
    }
    function tick(time: number) {
      const dt = Math.min(
        previousTime ? (time - previousTime) / 1000 : 1 / 60,
        0.032,
      );
      previousTime = time;
      const current = progress.get(),
        raw = target.get();
      if (!inside()) {
        gate = null;
        pending = null;
        mark();
      }
      if (
        pending !== null &&
        Math.abs(raw - pending) > 0.0005 &&
        (raw - current) * (pending - current) < 0
      )
        pending = null;
      if (ignored !== null) {
        const visit = visits[checkpoints.indexOf(ignored)];
        if (
          visit
            ? current < visit.parked - 0.004 ||
              current > visit.departure + 0.004
            : current < finale.settled
        )
          ignored = null;
      }
      const canStop =
        inside() &&
        (pending !== null ||
          bypass !== null ||
          (lastIntent > 0 && performance.now() - lastIntent < 1800));
      const checkpoint = canStop && !gate ? nextPoint(current, raw) : undefined;
      if (checkpoint !== undefined) pending = checkpoint;
      const destination = gate?.point ?? pending ?? raw,
        delta = destination - current;
      if (Math.abs(delta) < 0.000008 && Math.abs(velocity) < 0.00004) {
        if (pending !== null) {
          arrive(pending);
          return;
        }
        progress.set(destination);
        frame = 0;
        previousTime = 0;
        velocity = 0;
        if (bypass !== null && Math.abs(destination - bypass) < 0.0002)
          bypass = null;
        return;
      }
      const frequency = 12,
        decay = Math.exp(-frequency * dt),
        coefficient = velocity - frequency * delta;
      let next = destination + (-delta + coefficient * dt) * decay;
      velocity = (velocity - frequency * coefficient * dt) * decay;
      const maximum = speedLimit(current);
      if (Math.abs(velocity) > maximum) {
        velocity = Math.sign(velocity) * maximum;
        next = current + velocity * dt;
      }
      if (pending !== null && (next - pending) * (current - pending) <= 0) {
        arrive(pending);
        return;
      }
      progress.set(Math.max(0, Math.min(1, next)));
      frame = requestAnimationFrame(tick);
    }
    function consumeDelta(delta: number, event: Event) {
      if (!delta) return;
      const b = bounds();
      if (!b) return;
      const current = progress.get(),
        backlog = target.get() - current;
      const reversed =
        Math.abs(backlog) > 0.001 && Math.sign(backlog) !== Math.sign(delta);
      if (reversed) {
        pending = null;
        bypass = null;
      }
      const base = reversed ? current : (scrollY - b.start) / b.length;
      const canLeave =
        finalReadyRef.current && current >= checkpoints.at(-1)! - 0.00001;
      if (canLeave && delta > 0) {
        if (event.cancelable) event.preventDefault();
        if (enterOverview()) return;
      }
      const proposed = Math.min(
          canLeave ? Infinity : checkpoints.at(-1)!,
          base + delta / b.length,
        ),
        point = nextPoint(current, proposed);
      const capped =
        point !== undefined &&
        ((delta > 0 && proposed > point) || (delta < 0 && proposed < point));
      // Own the native target while the stage is active. Letting a touch gesture
      // start native momentum and correcting it after scroll caused a tug of war
      // with section snapping at the final boundary.
      if (event.cancelable) event.preventDefault();
      scrollToPoint(capped && point !== undefined ? point : proposed);
      schedule();
    }
    function reenterFinal() {
      clearOverviewTransition();
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      velocity = 0;
      ignored = null;
      pending = null;
      bypass = null;
      wasBelow = false;
      overviewLandingAt = null;
      if (track.current) delete track.current.dataset.voyageSkip;
      arrive(waypointStops.at(-1)!);
      previousNativeY = scrollY;
    }
    function navigation(event: MouseEvent) {
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
          : null;
      if (anchor && ["#sobre", "#equip", "#pilot"].includes(anchor.hash)) {
        clearOverviewTransition();
        overviewLandingAt = null;
        allowNativeJumpUntil = performance.now() + 1200;
        if (track.current) track.current.dataset.voyageSkip = "true";
      }
    }
    function nativeScroll() {
      const b = bounds();
      if (!b) return;
      const y = scrollY,
        end = b.start + b.length;
      if (wasBelow && y <= end + 2 && y >= b.start - 2) {
        reenterFinal();
        return;
      }
      if (
        y > end + 2 &&
        previousNativeY <= end + 2 &&
        performance.now() > allowNativeJumpUntil &&
        !finalReadyRef.current
      ) {
        gate = null;
        ignored = null;
        bypass = waypointStops.at(-1)!;
        pending = bypass;
        wasBelow = false;
        scrollToPoint(bypass);
        previousNativeY = scrollY;
        mark();
        schedule();
        return;
      }
      wasBelow = y > end + 2;
      previousNativeY = y;
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
        return;
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (holdOverview(delta, event) || !inside()) return;
      const now = performance.now(),
        quiet = now - lastGesture;
      lastGesture = now;
      lastIntent = now;
      if (!delta) return;
      if (gate) {
        event.preventDefault();
        if (canRelease(quiet > 140, Math.sign(delta)))
          release(Math.sign(delta), delta);
        else scrollToPoint(gate.point);
        return;
      }
      bypass = null;
      consumeDelta(delta, event);
    }
    function key(event: KeyboardEvent) {
      if (event.altKey || event.metaKey) return;
      if (event.ctrlKey && !["End", "Home"].includes(event.key)) return;
      if (
        event.target instanceof HTMLElement &&
        (event.target.matches("input,textarea,select") ||
          event.target.isContentEditable)
      )
        return;
      if (
        event.key === " " &&
        event.target instanceof HTMLElement &&
        event.target.matches("button,a")
      )
        return;
      const direction = ["ArrowDown", "PageDown", "End", " "].includes(
        event.key,
      )
        ? event.shiftKey
          ? -1
          : 1
        : ["ArrowUp", "PageUp", "Home"].includes(event.key)
          ? -1
          : 0;
      if (!direction) return;
      const b = bounds();
      if (!b) return;
      const delta =
        direction *
        (["End", "Home"].includes(event.key)
          ? b.length
          : ["PageDown", "PageUp", " "].includes(event.key)
            ? innerHeight * 0.8
            : 70);
      if (holdOverview(delta, event) || !inside()) return;
      lastIntent = performance.now();
      if (gate) {
        event.preventDefault();
        if (canRelease(!event.repeat, direction)) release(direction, delta);
      } else {
        consumeDelta(delta, event);
      }
    }
    function touchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        touchY = null;
        newTouch = false;
        return;
      }
      touchY = event.touches[0]?.clientY ?? 0;
      newTouch = !!gate && performance.now() - gate.arrived > 400;
    }
    function touchMove(event: TouchEvent) {
      if (
        (overviewTransition !== null || overviewLandingAt !== null) &&
        touchY !== null &&
        event.touches.length === 1 &&
        holdOverview(touchY - event.touches[0].clientY, event)
      ) {
        touchY = event.touches[0].clientY;
        return;
      }
      if (!inside()) return;
      if (event.touches.length !== 1) {
        touchY = null;
        return;
      }
      const y = event.touches[0].clientY;
      if (touchY === null) {
        touchY = y;
        return;
      }
      const delta = touchY - y;
      touchY = y;
      lastIntent = performance.now();
      if (gate) {
        event.preventDefault();
        if (canRelease(newTouch, Math.sign(delta)) && delta !== 0) {
          newTouch = false;
          release(Math.sign(delta), delta);
        }
      } else {
        consumeDelta(delta, event);
      }
    }
    seekRef.current = (point) => {
      clearOverviewTransition();
      overviewLandingAt = null;
      if (track.current) delete track.current.dataset.voyageSkip;
      gate = null;
      ignored = null;
      pending = null;
      bypass = point;
      velocity = 0;
      mark();
      schedule();
    };
    const unsubscribe = target.on("change", schedule);
    const initialBounds = bounds();
    wasBelow =
      !!initialBounds &&
      scrollY > initialBounds.start + initialBounds.length + 2;
    window.addEventListener("scroll", nativeScroll, { passive: true });
    window.addEventListener("click", navigation);
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: false });
    schedule();
    return () => {
      clearOverviewTransition();
      unsubscribe();
      cancelAnimationFrame(frame);
      seekRef.current = () => {};
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("scroll", nativeScroll);
      window.removeEventListener("click", navigation);
      if (trackElement) delete trackElement.dataset.scrollCheckpoint;
    };
  }, [target, progress, track, header, enabled]);
  return { progress, prepareSeek };
}
