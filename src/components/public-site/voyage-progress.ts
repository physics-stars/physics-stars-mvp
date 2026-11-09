"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import { finale, smoothRange, visits } from "./voyage-timeline";
import { scrollHandoffEvent, type ScrollHandoff } from "./descent-controller";
import { scrollInputTarget, scrollSensitivity, followVoyage, PlanetGravity, planetReadingCenter, TouchMomentum,
  voyageInputLead, voyageProgressAt, voyageScrollDistance, voyageScrollLength } from "./continuous-scroll";
import { MOBILE_MOTION_QUERY, motionSpeed, LOGO_GRAVITY_DELAY_MS, LOGO_GRAVITY_DURATION_MS } from "./motion-settings";

export type VoyageNavigationFlight = { id: number; from: number; to: number; amount: number };

/** The voyage responds to smaller gestures with a short bounded destination.
 * Gravity is independent of animations and reading gates. */
export function useVoyageProgress(target: MotionValue<number>, track: RefObject<HTMLElement | null>,
  header: number, enabled: boolean) {
  const progress = useMotionValue(0);
  const navigationOpacity = useMotionValue(1);
  const navigationFlight = useMotionValue<VoyageNavigationFlight | null>(null);
  const navigationSequence = useRef(0);
  const headerRef = useRef(header);
  useEffect(() => { headerRef.current = header; }, [header]);
  const [navigationTarget, setNavigationTarget] = useState<number | null>(null);
  const seekRef = useRef<(p: number) => void>(() => {});
  const navigateRef = useRef<(p: number) => void>(() => {});
  const prepareSeek = useCallback((p: number) => seekRef.current(p), []);
  const navigateTo = useCallback((p: number) => navigateRef.current(p), []);

  useEffect(() => {
    const element = document.getElementById("idea");
    if (!enabled || !element || element !== track.current) return;
    let disposed = false, frame = 0, previousTime = 0, velocity = 0;
    let followingSectionScroll = false;
    let lastInputAt = -Infinity, lastWrittenY = NaN;
    const touch = new TouchMomentum();
    const gravity = new PlanetGravity();
    const logoGravity = new PlanetGravity(LOGO_GRAVITY_DELAY_MS, LOGO_GRAVITY_DURATION_MS);
    let logoReadyAt: number | null = null;
    function resetGravity() {
      gravity.reset(); logoGravity.reset(); logoReadyAt = null;
    }
    const mobileInput = matchMedia(MOBILE_MOTION_QUERY);
    const inputSpeed = (point = progress.get()) => motionSpeed(mobileInput.matches,
      point >= finale.sealed || visits.some(visit => point >= visit.parked && point <= visit.departure)
        ? "planet-text" : "travel");
    let touchY: number | null = null;
    function measureBounds() {
      const start = element!.getBoundingClientRect().top + scrollY - headerRef.current;
      const total = element!.offsetHeight - innerHeight + headerRef.current;
      return { start, total, length: total / voyageScrollLength };
    }
    let measuredBounds = measureBounds();
    const bounds = () => measuredBounds;
    const boundsObserver = new ResizeObserver(() => { measuredBounds = measureBounds(); });
    boundsObserver.observe(element);
    const initial = bounds();
    let nativeExit = scrollY > initial.start + initial.total + 2;
    let requested = Math.max(0, Math.min(1, voyageProgressAt((scrollY - initial.start) / initial.length)));
    progress.set(nativeExit ? 1 : requested);
    let directSeek: {
      id: number; point: number; from: number; fadeFrom: number; started: number;
      fadeDuration: number; travelDuration: number; revealDelay: number; revealDuration: number;
    } | null = null;
    function visiblePlanet() {
      const value = element!.querySelector<HTMLCanvasElement>("canvas[data-engine]")?.dataset.fullyVisiblePlanet;
      return value === undefined || value === "-1" ? null : Number(value);
    }
    function mark() {
      const p = progress.get();
      element!.dataset.scrollCheckpoint = planetReadingCenter(p, p, visiblePlanet()) !== null || p >= finale.sealed ? "reading" : "flight";
      element!.dataset.voyageRequested = requested.toFixed(6);
      element!.dataset.scrollOwner = nativeExit ? "descent" : "voyage";
      if (planetReadingCenter(p, p, visiblePlanet()) === null) delete element!.dataset.voyageGravity;
    }
    function schedule() {
      if (!disposed && !frame) frame = requestAnimationFrame(tick);
    }
    function write(p: number) {
      progress.set(p);
      target.set(voyageScrollDistance(p) / voyageScrollLength);
      const b = bounds();
      lastWrittenY = b.start + b.length * voyageScrollDistance(p);
      window.scrollTo({ top: lastWrittenY, behavior: "instant" });
      mark();
    }
    function clearDirectSeek() {
      directSeek = null;
      navigationFlight.set(null);
      navigationOpacity.set(1);
      setNavigationTarget(null);
      delete element!.dataset.voyageNavigation;
    }
    function followDirectSeek(time: number) {
      const seek = directSeek!;
      const elapsed = time - seek.started;
      const travelEnd = seek.fadeDuration + seek.travelDuration;
      if (elapsed < seek.fadeDuration) {
        navigationOpacity.set(seek.fadeFrom * (1 - smoothRange(0, seek.fadeDuration, elapsed)));
      } else if (elapsed < travelEnd) {
        navigationOpacity.set(0);
        element!.dataset.voyageNavigation = "travel";
        const t = Math.max(0, Math.min(1, (elapsed - seek.fadeDuration) / seek.travelDuration));
        const amount = t * t * (3 - 2 * t);
        navigationFlight.set({ id: seek.id, from: seek.from, to: seek.point, amount });
        write(seek.from + (seek.point - seek.from) * amount);
      } else {
        navigationFlight.set({ id: seek.id, from: seek.from, to: seek.point, amount: 1 });
        write(seek.point);
        element!.dataset.voyageNavigation = "reveal";
        const revealStart = travelEnd + seek.revealDelay;
        navigationOpacity.set(smoothRange(revealStart, revealStart + seek.revealDuration, elapsed));
        if (elapsed >= revealStart + seek.revealDuration) {
          requested = seek.point;
          clearDirectSeek();
          previousTime = 0;
          schedule();
          return;
        }
      }
      schedule();
    }
    function handoff() {
      const b = bounds();
      write(1);
      const accepted = !window.dispatchEvent(new CustomEvent<ScrollHandoff>(scrollHandoffEvent,
        { detail: { delta: Math.max(0, (requested - 1) * b.length), quietSince: lastInputAt,
          inertiaVelocity: touch.coastVelocity }, cancelable: true }));
      if (accepted) {
        touch.cancelCoast();
        nativeExit = true;
        requested = 1;
        mark();
      } else schedule();
    }
    function tick(time: number) {
      frame = 0;
      if (disposed || nativeExit) return;
      if (directSeek) { followDirectSeek(time); return; }
      const dt = Math.min(previousTime ? time - previousTime : 16, 32);
      previousTime = time;
      const inertia = touch.step(dt);
      if (inertia) consume(inertia, undefined, true);
      const current = progress.get();
      const center = planetReadingCenter(current, requested, visiblePlanet());
      const logoReady = current >= finale.start && current < 1 && requested <= 1 &&
        touchY === null && !touch.coasting &&
        element!.querySelector<HTMLCanvasElement>("canvas[data-engine]")?.dataset.logoGravityReady === "true";
      if (logoReady) logoReadyAt ??= time;
      else if (logoGravity.destination === null) logoReadyAt = null;
      const logoCenter = logoReady || logoGravity.destination !== null ? 1 : null;
      const activeGravity = logoCenter !== null ? logoGravity : gravity;
      if (logoCenter !== null) gravity.reset();
      const quietFor = logoCenter !== null ? Math.min(time - lastInputAt, time - (logoReadyAt ?? time)) : time - lastInputAt;
      requested = activeGravity.target(current, requested, logoCenter ?? center, dt, quietFor);
      const attracting = activeGravity.destination !== null;
      if (attracting)
        element!.dataset.voyageGravity = activeGravity.destination!.toFixed(6);
      else delete element!.dataset.voyageGravity;
      if (current >= 1 - 0.0000001 && requested > 1) { handoff(); return; }
      const destination = Math.max(0, requested);
      const delta = destination - current;
      if (Math.abs(delta) < 0.0000001 && Math.abs(velocity) < 0.000001) {
        velocity = 0;
        write(destination);
        const attractionCenter = activeGravity.destination ?? logoCenter ?? center;
        if (touch.coasting || (attractionCenter !== null && Math.abs(requested - attractionCenter) > 0.0000001)) schedule();
        return;
      }
      // Gravity already supplies a timed C2 curve. A second follower and the
      // flight/reading speed caps would brake and accelerate it at boundaries.
      const next = attracting
        ? { position: destination, unbounded: destination, velocity: (destination - current) / (dt / 1000) }
        : followVoyage(current, destination, velocity, dt, inputSpeed());
      velocity = next.velocity;
      if (next.unbounded >= 1 && requested > 1) { handoff(); return; }
      write(next.position);
      schedule();
    }
    function consume(delta: number, input?: Event, inertial = false) {
      if (!delta || nativeExit) return;
      if (!inertial) touch.cancelCoast();
      if (input?.cancelable) input.preventDefault();
      if (directSeek) { clearDirectSeek(); requested = progress.get(); }
      const b = bounds();
      const descentLength = Number(document.querySelector<HTMLElement>("[data-descent-root]")?.dataset.scrollLength) || innerHeight * 4;
      const current = progress.get();
      const lead = voyageInputLead(current, inputSpeed());
      requested = voyageProgressAt(scrollInputTarget(voyageScrollDistance(current), voyageScrollDistance(requested),
        delta / b.length, 0, voyageScrollLength + descentLength / b.length, lead,
        scrollSensitivity * inputSpeed()));
      lastInputAt = performance.now();
      resetGravity();
      delete element!.dataset.voyageGravity;
      schedule();
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      consume(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1), event);
    }
    function key(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey ||
        (event.target instanceof HTMLElement && (event.target.matches("input,textarea,select") || event.target.isContentEditable))) return;
      if (event.key === " " && event.target instanceof HTMLElement && event.target.matches("button,a")) return;
      const down = ["ArrowDown", "PageDown", "End", " "].includes(event.key);
      const up = ["ArrowUp", "PageUp", "Home"].includes(event.key);
      if (!down && !up) return;
      if (["End", "Home"].includes(event.key)) {
        if (nativeExit) return;
        event.preventDefault();
        const id = event.key === "Home" ? "idea" : "pilot";
        window.dispatchEvent(new CustomEvent("landing-navigate", { detail: id }));
        const top = id === "idea" ? 0 : document.getElementById(id)!.getBoundingClientRect().top + scrollY - headerRef.current;
        window.scrollTo({ top, behavior: "instant" });
        return;
      }
      const direction = up || (event.key === " " && event.shiftKey) ? -1 : 1;
      const distance = ["End", "Home"].includes(event.key) ? document.documentElement.scrollHeight * 2
        : event.key.startsWith("Arrow") ? 70 : innerHeight * 0.8;
      consume(direction * distance, event);
    }
    function touchStart(event: TouchEvent) {
      if (touch.coasting && !nativeExit) { requested = progress.get(); velocity = 0; }
      if (!nativeExit) { lastInputAt = performance.now(); resetGravity(); }
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      touch.start(performance.now());
    }
    function touchMove(event: TouchEvent) {
      if (touchY === null || event.touches.length !== 1) return;
      const y = event.touches[0].clientY, delta = touchY - y;
      touchY = y;
      touch.move(delta, performance.now());
      consume(delta, event);
    }
    function touchEnd() {
      touchY = null;
      if (mobileInput.matches && !nativeExit) { touch.beginCoast(performance.now()); schedule(); }
      else consume(touch.release(performance.now()));
    }
    function touchCancel() { touchY = null; touch.cancelCoast(); }
    function resume(event: Event) {
      const detail = (event as CustomEvent<{ delta?: number; inertiaVelocity?: number }>).detail;
      touch.cancelCoast();
      if (mobileInput.matches) touch.resumeCoast(detail?.inertiaVelocity ?? 0);
      followingSectionScroll = false;
      resetGravity();
      clearDirectSeek();
      nativeExit = false;
      const delta = detail?.delta ?? 0;
      requested = Math.max(0, voyageProgressAt(voyageScrollLength + delta / bounds().length));
      velocity = 0;
      previousTime = 0;
      lastInputAt = performance.now();
      write(1);
      schedule();
    }
    function navigate(event: Event) {
      touch.cancelCoast();
      resetGravity();
      clearDirectSeek();
      const detail = (event as CustomEvent<string | { id: string; behavior?: string }>).detail;
      const home = (typeof detail === "string" ? detail : detail.id) === "idea";
      followingSectionScroll = typeof detail === "object" && detail.behavior === "smooth";
      nativeExit = !home;
      requested = followingSectionScroll ? progress.get() : home ? 0 : 1;
      velocity = 0;
      previousTime = 0;
      progress.set(requested);
      mark();
      if (home) schedule();
    }
    function nativeScroll() {
      if (followingSectionScroll) {
        // The section transition owns the page; finish the title's rise from
        // its current pose using that same scroll, without jumping to p = 1.
        const b = bounds();
        const p = Math.max(0, Math.min(1, voyageProgressAt((scrollY - b.start) / b.length)));
        requested = p;
        progress.set(p);
        target.set(voyageScrollDistance(p) / voyageScrollLength);
        mark();
        if (p >= 1) followingSectionScroll = false;
        return;
      }
      if (nativeExit || directSeek || Math.abs(scrollY - lastWrittenY) <= 2) return;
      const b = bounds();
      const p = voyageProgressAt((scrollY - b.start) / b.length);
      if (p > 1.0005) { nativeExit = true; progress.set(1); mark(); return; }
      requested = Math.max(0, p);
      progress.set(Math.max(0, Math.min(1, p)));
      velocity = 0;
      lastInputAt = performance.now();
      resetGravity();
      schedule();
    }
    function resized() {
      headerRef.current = innerWidth <= 760 ? 68 : 76;
      measuredBounds = measureBounds();
      if (!nativeExit) { write(progress.get()); schedule(); }
    }
    seekRef.current = (point) => {
      touch.cancelCoast();
      followingSectionScroll = false;
      resetGravity();
      clearDirectSeek(); nativeExit = false; requested = point; velocity = 0;
      write(point); schedule();
    };
    navigateRef.current = (point) => {
      touch.cancelCoast();
      followingSectionScroll = false;
      resetGravity();
      if (directSeek?.point === point) return;
      const from = progress.get(), fadeFrom = navigationOpacity.get();
      nativeExit = false; requested = point; velocity = 0; previousTime = 0;
      window.dispatchEvent(new Event("landing-voyage-navigation"));
      directSeek = { id: ++navigationSequence.current, point, from, fadeFrom, started: performance.now(),
        fadeDuration: 110 * fadeFrom / inputSpeed(from),
        travelDuration: (750 + 1450 * Math.abs(point - from)) / motionSpeed(mobileInput.matches),
        revealDelay: point === 0 || point >= finale.sealed ? 140 / motionSpeed(mobileInput.matches) : 0,
        revealDuration: (point === 0 || point >= finale.sealed ? 480 : 150) / inputSpeed(point) };
      navigationFlight.set({ id: directSeek.id, from, to: point, amount: 0 });
      setNavigationTarget(point);
      element.dataset.voyageNavigation = "fade";
      write(from);
      schedule();
    };
    function revealClearedEndpoint(event: Event) {
      if (!directSeek || (event as CustomEvent<number>).detail !== directSeek.id) return;
      directSeek.travelDuration = Math.min(directSeek.travelDuration,
        Math.max(0, performance.now() - directSeek.started - directSeek.fadeDuration));
    }
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("touchend", touchEnd, { passive: true });
    window.addEventListener("touchcancel", touchCancel, { passive: true });
    window.addEventListener("scroll", nativeScroll, { passive: true });
    window.addEventListener("resize", resized);
    window.addEventListener("landing-navigate", navigate);
    window.addEventListener("landing-logo-return", resume);
    element.addEventListener("voyage-endpoint-clear", revealClearedEndpoint);
    element.addEventListener("voyage-visibility-change", schedule);
    mark(); schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      boundsObserver.disconnect();
      seekRef.current = () => {}; navigateRef.current = () => {};
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", touchEnd);
      window.removeEventListener("touchcancel", touchCancel);
      window.removeEventListener("scroll", nativeScroll);
      window.removeEventListener("resize", resized);
      window.removeEventListener("landing-navigate", navigate);
      window.removeEventListener("landing-logo-return", resume);
      element.removeEventListener("voyage-endpoint-clear", revealClearedEndpoint);
      element.removeEventListener("voyage-visibility-change", schedule);
      delete element.dataset.voyageNavigation;
      delete element.dataset.scrollOwner;
    };
  }, [target, progress, navigationOpacity, navigationFlight, track, enabled]);
  return { progress, prepareSeek, navigateTo, navigationOpacity, navigationTarget, navigationFlight };
}
