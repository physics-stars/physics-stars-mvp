"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import { finale, smoothRange, visits, waypointStops } from "./voyage-timeline";
import { ScrollGesture } from "./scroll-gesture";

const checkpoints = waypointStops.slice(1);
export type VoyageNavigationFlight = {
  id: number;
  from: number;
  to: number;
  amount: number;
};
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
  const navigationOpacity = useMotionValue(1);
  const navigationFlight = useMotionValue<VoyageNavigationFlight | null>(null);
  const navigationSequence = useRef(0);
  const headerRef = useRef(header);
  useEffect(() => { headerRef.current = header; }, [header]);
  const [navigationTarget, setNavigationTarget] = useState<number | null>(null);
  const finalReadyRef = useRef(finalReady);
  const cueIssued = useRef(false);
  const startCueRef = useRef<() => void>(() => {});
  const stopCueRef = useRef<() => void>(() => {});
  useEffect(() => {
    finalReadyRef.current = finalReady;
    if (!finalReady) {
      cueIssued.current = false;
      stopCueRef.current();
    } else if (enabled && !cueIssued.current) {
      cueIssued.current = true;
      startCueRef.current();
    }
  }, [finalReady, enabled]);
  const seekRef = useRef<(p: number) => void>(() => {});
  const prepareSeek = useCallback((p: number) => seekRef.current(p), []);
  const navigateRef = useRef<(p: number) => void>(() => {});
  const navigateTo = useCallback((p: number) => navigateRef.current(p), []);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0,
      previousTime = 0,
      velocity = 0,
      lastIntent = 0;
    const gesture = new ScrollGesture();
    let directSeek: {
      id: number;
      point: number;
      from: number;
      started: number;
      fadeFrom: number;
      fadeDuration: number;
      travelDuration: number;
      revealDelay: number;
      revealDuration: number;
      arrived: boolean;
    } | null = null;
    let gate: {
      point: number;
      arrived: number;
      returned: boolean;
    } | null = null;
    let nativeExit = false;
    let cue: { from: number; distance: number; started: number } | null = null;
    let cueFrame = 0;
    let previousBounds: { start: number; length: number } | null = null;
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
      const start = element.getBoundingClientRect().top + scrollY - headerRef.current;
      return { start, length: element.offsetHeight - innerHeight + headerRef.current };
    }
    function inside() {
      const b = bounds();
      return (
        !nativeExit && !!b &&
        scrollY >= b.start - 2 && scrollY <= b.start + b.length + 2
      );
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
    function canRelease(deliberate: boolean) {
      if (!gate) return true;
      const age = performance.now() - gate.arrived,
        final = gate.point === waypointStops.at(-1);
      // The hint, unlock and physical scroll cue begin together after the
      // final text has settled. Input ignored before then is never replayed.
      if (final && !finalReadyRef.current) return false;
      if ((!final || gate.returned) && age < 350) return false;
      return deliberate;
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
    function arrive(point: number, returned = false) {
      gate = {
        point,
        arrived: performance.now(),
        returned,
      };
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
    function stopCue() {
      cancelAnimationFrame(cueFrame);
      cueFrame = 0;
      cue = null;
      if (trackElement) delete trackElement.dataset.voyageCue;
    }
    function followCue(time: number) {
      cueFrame = 0;
      const current = cue;
      if (!current) return;
      const amount = smoothRange(0, 360, Math.max(0, time - current.started));
      window.scrollTo({
        top: current.from + current.distance * amount,
        behavior: "instant",
      });
      if (amount < 1) cueFrame = requestAnimationFrame(followCue);
      else {
        stopCue();
        // Explicitly let go: one gravity controller now owns the return.
        window.dispatchEvent(new Event("landing-scroll-release"));
      }
    }
    startCueRef.current = () => {
      const b = bounds();
      if (!b || directSeek || progress.get() < finale.sealed) return;
      const end = b.start + b.length;
      if (Math.abs(scrollY - end) > 2) return;
      cue = {
        from: scrollY,
        distance: Math.min(28, Math.max(18, (innerHeight - headerRef.current) * 0.03)),
        started: performance.now(),
      };
      if (trackElement) trackElement.dataset.voyageCue = "peek";
      nativeExit = true;
      gate = null;
      pending = null;
      bypass = null;
      velocity = 0;
      progress.set(1);
      mark();
      cueFrame = requestAnimationFrame(followCue);
    };
    stopCueRef.current = stopCue;
    function clearDirectSeek() {
      directSeek = null;
      navigationFlight.set(null);
      navigationOpacity.set(1);
      setNavigationTarget(null);
      if (track.current) delete track.current.dataset.voyageNavigation;
    }
    function followDirectSeek(time: number) {
      const seek = directSeek;
      if (!seek) return;
      const elapsed = time - seek.started;
      const travelEnd = seek.fadeDuration + seek.travelDuration;
      if (elapsed < seek.fadeDuration) {
        navigationOpacity.set(
          seek.fadeFrom * (1 - smoothRange(0, seek.fadeDuration, elapsed)),
        );
      } else if (elapsed < travelEnd) {
        navigationOpacity.set(0);
        if (track.current) track.current.dataset.voyageNavigation = "travel";
        const t = Math.max(
          0,
          Math.min(1, (elapsed - seek.fadeDuration) / seek.travelDuration),
        );
        const amount = t * t * (3 - 2 * t);
        navigationFlight.set({
          id: seek.id,
          from: seek.from,
          to: seek.point,
          amount,
        });
        progress.set(seek.from + (seek.point - seek.from) * amount);
      } else {
        if (!seek.arrived) {
          seek.arrived = true;
          navigationFlight.set({
            id: seek.id,
            from: seek.from,
            to: seek.point,
            amount: 1,
          });
          arrive(seek.point);
          if (seek.point === 0) {
            gate = null;
            mark();
          }
          if (track.current) track.current.dataset.voyageNavigation = "reveal";
        }
        const revealStart = travelEnd + seek.revealDelay;
        navigationOpacity.set(
          smoothRange(revealStart, revealStart + seek.revealDuration, elapsed),
        );
        if (elapsed >= revealStart + seek.revealDuration) {
          clearDirectSeek();
          previousTime = 0;
          return;
        }
      }
      schedule();
    }
    function leaveVoyage(delta: number) {
      // Hand over only this event's distance. The following sections use native
      // scrolling and an interruptible magnet; there is no landing lock.
      nativeExit = true;
      gate = null;
      pending = null;
      bypass = null;
      velocity = 0;
      progress.set(1);
      mark();
      window.scrollTo({ top: scrollY + delta, behavior: "instant" });
    }
    function release(direction: number, delta: number) {
      if (!gate) return;
      lastIntent = performance.now();
      const point = gate.point,
        index = checkpoints.indexOf(point),
        visit = visits[index];
      ignored = index >= visits.length && direction < 0 ? null : point;
      gate = null;
      bypass = null;
      pending = null;
      velocity = 0;
      mark();
      if (!visit && direction > 0) {
        leaveVoyage(delta);
        return;
      }
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
      if (directSeek) {
        frame = 0;
        followDirectSeek(time);
        return;
      }
      if (nativeExit) {
        progress.set(1);
        frame = 0;
        previousTime = 0;
        return;
      }
      const dt = Math.min(
        previousTime ? (time - previousTime) / 1000 : 1 / 60,
        0.032,
      );
      previousTime = time;
      const current = progress.get();
      let raw = target.get();
      const b = bounds();
      const settling = gesture.settling(time);
      if (inside() && !gate && pending === null && b && settling &&
          Math.abs(velocity) * b.length < 90) {
        const distance = (p: number, start: number, end: number) =>
          Math.max(start - p, p - end, 0) * b.length;
        const near = visits.find(visit =>
          distance(current, visit.parked, visit.departure) <= 24 &&
          distance(raw, visit.parked, visit.departure) <= 24);
        if (near) {
          // Re-enter the reading pose even if the reverse gesture ended before
          // the light caught up. No discarded input is replayed.
          pending = waypointStops[near.index + 1];
          ignored = null;
          bypass = null;
          target.set(pending);
          raw = pending;
          scrollToPoint(pending);
        }
      }
      if (
        inside() && !gate && current >= finale.sealed && raw >= current &&
        current < waypointStops.at(-1)! && pending !== waypointStops.at(-1)
      ) {
        // Finish the stationary logo view before its text appears. Its final
        // reading anchor is also the exact start of the first slide boundary.
        pending = waypointStops.at(-1)!;
        target.set(pending);
        scrollToPoint(pending);
      }
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
      const nearRest = (pending !== null || gate !== null) && settling && b && Math.abs(delta) * b.length <= 24 &&
        Math.abs(velocity) * b.length < 90;
      if ((Math.abs(delta) < 0.000008 && Math.abs(velocity) < 0.00004) ||
          (pending !== null && nearRest && Math.abs(delta) * b!.length < 1)) {
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
      const frequency = nearRest ? 14 : 12,
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
        leaveVoyage(delta);
        return;
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
      gesture.absorbInertia(performance.now());
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      velocity = 0;
      ignored = null;
      pending = null;
      bypass = null;
      wasBelow = false;
      if (track.current) delete track.current.dataset.voyageSkip;
      nativeExit = false;
      arrive(waypointStops.at(-1)!, true);
      previousNativeY = scrollY;
    }
    function navigation(event: MouseEvent) {
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
          : null;
      if (anchor && ["#sobre", "#equip", "#pilot"].includes(anchor.hash)) {
        if (directSeek) clearDirectSeek();
        allowNativeJumpUntil = performance.now() + 1200;
        if (track.current) track.current.dataset.voyageSkip = "true";
      }
    }
    function navigate(event: Event) {
      stopCue();
      const home = (event as CustomEvent<string>).detail === "idea";
      clearDirectSeek();
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      velocity = 0;
      gate = null;
      ignored = null;
      pending = null;
      bypass = null;
      allowNativeJumpUntil = performance.now() + 1200;
      wasBelow = !home;
      nativeExit = !home;
      if (track.current) {
        if (home) delete track.current.dataset.voyageSkip;
        else track.current.dataset.voyageSkip = "true";
      }
      progress.set(home ? 0 : 1);
      target.set(home ? 0 : 1);
      previousNativeY = home ? 0 : scrollY;
      mark();
    }
    function nativeScroll() {
      if (directSeek) {
        previousNativeY = scrollY;
        return;
      }
      const b = bounds();
      if (!b) return;
      const y = scrollY,
        end = b.start + b.length;
      const finalY = b.start + b.length * waypointStops.at(-1)!;
      if (nativeExit && previousNativeY > finalY + 1 && y <= finalY + 1 && y >= b.start - 2) {
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
      if (wasBelow && (finalReadyRef.current || performance.now() <= allowNativeJumpUntil))
        nativeExit = true;
      previousNativeY = y;
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
        return;
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const deliberate = gesture.read(delta, performance.now());
      if (cue) {
        if (!deliberate) {
          if (event.cancelable) event.preventDefault();
          return;
        }
        stopCue();
      }
      if (directSeek) {
        if (event.cancelable) event.preventDefault();
        return;
      }
      if (!inside()) return;
      if (!delta) return;
      if (gate) {
        event.preventDefault();
        if (canRelease(deliberate)) release(Math.sign(delta), delta);
        else scrollToPoint(gate.point);
        return;
      }
      bypass = null;
      lastIntent = performance.now();
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
      const deliberate = gesture.read(delta, performance.now(), !event.repeat);
      if (cue) stopCue();
      if (directSeek) {
        if (event.cancelable) event.preventDefault();
        return;
      }
      if (!inside()) return;
      if (gate) {
        event.preventDefault();
        if (canRelease(deliberate))
          release(direction, delta);
      } else {
        lastIntent = performance.now();
        consumeDelta(delta, event);
      }
    }
    function touchStart(event: TouchEvent) {
      stopCue();
      if (event.touches.length !== 1) {
        touchY = null;
        newTouch = false;
        return;
      }
      touchY = event.touches[0]?.clientY ?? 0;
      newTouch = true;
    }
    function touchMove(event: TouchEvent) {
      if (touchY === null || event.touches.length !== 1) {
        touchY = null;
        return;
      }
      const y = event.touches[0].clientY;
      const delta = touchY - y;
      touchY = y;
      const deliberate = gesture.read(delta, performance.now(), newTouch);
      if (delta) newTouch = false;
      if (directSeek && event.touches.length === 1) {
        if (event.cancelable) event.preventDefault();
        return;
      }
      if (!inside()) return;
      if (gate) {
        event.preventDefault();
        if (canRelease(deliberate) && delta !== 0) {
          newTouch = false;
          release(Math.sign(delta), delta);
        }
      } else {
        lastIntent = performance.now();
        consumeDelta(delta, event);
      }
    }
    seekRef.current = (point) => {
      stopCue();
      if (directSeek) clearDirectSeek();
      if (track.current) delete track.current.dataset.voyageSkip;
      nativeExit = false;
      gate = null;
      ignored = null;
      pending = null;
      bypass = point;
      velocity = 0;
      mark();
      schedule();
    };
    navigateRef.current = (point) => {
      stopCue();
      if (directSeek?.point === point) return;
      if (!directSeek && Math.abs(progress.get() - point) < 0.00001) return;
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      if (track.current) {
        delete track.current.dataset.voyageSkip;
        track.current.dataset.voyageNavigation = "fade";
      }
      gate = null;
      ignored = null;
      pending = null;
      bypass = null;
      velocity = 0;
      nativeExit = false;
      const from = progress.get();
      const fadeFrom = navigationOpacity.get();
      directSeek = {
        id: ++navigationSequence.current,
        point,
        from,
        fadeFrom,
        started: performance.now(),
        fadeDuration: 110 * fadeFrom,
        travelDuration: 750 + 1450 * Math.abs(point - from),
        revealDelay: point === 0 || point >= finale.sealed ? 140 : 0,
        revealDuration: point === 0 || point >= finale.sealed ? 480 : 150,
        arrived: false,
      };
      navigationFlight.set({ id: directSeek.id, from, to: point, amount: 0 });
      setNavigationTarget(point);
      mark();
      schedule();
    };
    const unsubscribe = target.on("change", schedule);
    function revealClearedEndpoint(event: Event) {
      if (
        !directSeek ||
        (event as CustomEvent<number>).detail !== directSeek.id
      )
        return;
      // There is no reason to keep travelling across an empty screen once the
      // final visible planet has left the frame on a direct endpoint jump.
      directSeek.travelDuration = Math.min(
        directSeek.travelDuration,
        Math.max(
          0,
          performance.now() - directSeek.started - directSeek.fadeDuration,
        ),
      );
      schedule();
    }
    function resized() {
      stopCue();
      const wasInside = !nativeExit && previousBounds &&
        previousNativeY >= previousBounds.start - 2 &&
        previousNativeY <= previousBounds.start + previousBounds.length + 2;
      // Resize changes the track's physical length, not the narrative position.
      // Use the new header immediately, before React's media subscription runs.
      headerRef.current = innerWidth <= 760 ? 68 : 76;
      if (wasInside) {
        const p = progress.get();
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        velocity = 0;
        pending = null;
        target.set(p);
        scrollToPoint(p);
        previousNativeY = scrollY;
        wasBelow = false;
        schedule();
      }
      previousBounds = bounds();
    }
    trackElement?.addEventListener(
      "voyage-endpoint-clear",
      revealClearedEndpoint,
    );
    const initialBounds = bounds();
    previousBounds = initialBounds;
    wasBelow =
      !!initialBounds &&
      scrollY > initialBounds.start + initialBounds.length + 2;
    nativeExit = wasBelow;
    window.addEventListener("scroll", nativeScroll, { passive: true });
    window.addEventListener("pointerdown", stopCue, { passive: true });
    window.addEventListener("resize", resized);
    window.addEventListener("click", navigation);
    window.addEventListener("landing-navigate", navigate);
    window.addEventListener("landing-logo-return", reenterFinal);
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: false });
    schedule();
    return () => {
      stopCue();
      startCueRef.current = () => {};
      stopCueRef.current = () => {};
      unsubscribe();
      trackElement?.removeEventListener(
        "voyage-endpoint-clear",
        revealClearedEndpoint,
      );
      cancelAnimationFrame(frame);
      seekRef.current = () => {};
      navigateRef.current = () => {};
      clearDirectSeek();
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("scroll", nativeScroll);
      window.removeEventListener("pointerdown", stopCue);
      window.removeEventListener("resize", resized);
      window.removeEventListener("click", navigation);
      window.removeEventListener("landing-navigate", navigate);
      window.removeEventListener("landing-logo-return", reenterFinal);
      if (trackElement) delete trackElement.dataset.scrollCheckpoint;
    };
  }, [
    target,
    progress,
    navigationOpacity,
    navigationFlight,
    track,
    enabled,
  ]);
  return {
    progress,
    prepareSeek,
    navigateTo,
    navigationOpacity,
    navigationTarget,
    navigationFlight,
  };
}
