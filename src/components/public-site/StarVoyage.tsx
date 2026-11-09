"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { usePublicLocale } from "./PublicShell";
import { voyageCopy } from "./voyage-copy";
import { finale, visits, voyageState, waypointStops } from "./voyage-timeline";
import { useVoyageProgress } from "./voyage-progress";
import { VoyageLoader, type VoyageSceneState } from "./VoyageLoader";
import { VoyageStarfield } from "./VoyageStarfield";
import styles from "./voyage.module.css";

const Scene = dynamic(() => import("./StarVoyageScene"), {
  ssr: false,
});
const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function snapshot() {
  return window.matchMedia(reducedQuery).matches;
}
function serverSnapshot() {
  return false;
}
function subscribeWidth(callback: () => void) {
  const media = window.matchMedia("(max-width:760px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function headerSnapshot() {
  return window.matchMedia("(max-width:760px)").matches ? 68 : 76;
}
function serverHeader() {
  return 76;
}

export function StarVoyage() {
  const locale = usePublicLocale(),
    copy = voyageCopy[locale];
  const track = useRef<HTMLElement>(null),
    navigation = useRef<HTMLElement>(null);
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const headerHeight = useSyncExternalStore(
    subscribeWidth,
    headerSnapshot,
    serverHeader,
  );
  const [active, setActive] = useState({ chapter: 0, reading: true });
  const [logoFormed, setLogoFormed] = useState(false),
    [finalTextReady, setFinalTextReady] = useState(false);
  const [finalExitReady, setFinalExitReady] = useState(false);
  const [directFinal, setDirectFinal] = useState(false);
  const [sceneState, setSceneState] = useState<VoyageSceneState>("loading");
  const linear = reduced;
  const { scrollYProgress: scrollTarget } = useScroll({
    target: track,
    offset: [`start ${headerHeight}px`, "end end"],
  });
  const {
    progress,
    prepareSeek,
    navigateTo,
    navigationOpacity,
    navigationTarget,
    navigationFlight,
  } = useVoyageProgress(
    scrollTarget,
    track,
    headerHeight,
    !linear,
    finalExitReady,
  );
  useEffect(() => {
    if (linear || !finalTextReady || navigationTarget !== null) return;
    const timer = window.setTimeout(() => setFinalExitReady(true), 450);
    return () => window.clearTimeout(timer);
  }, [linear, finalTextReady, navigationTarget]);
  const scrollHintOpacity = useTransform(progress, [0, 0.012], [1, 0]);
  useMotionValueEvent(progress, "change", (p) => {
    const formed = p >= finale.sealed;
    setLogoFormed(formed);
    if (!formed) {
      setFinalTextReady(false);
      setFinalExitReady(false);
      setDirectFinal(false);
    }
    const state = voyageState(p),
      chapter =
        state.phase === "hero"
          ? 0
          : state.phase === "finale"
            ? visits.length + 1
            : state.index + 1;
    const isReading =
      state.phase === "hero" || state.phase === "reading" || p >= 0.982;
    setActive((previous) =>
      previous.chapter === chapter && previous.reading === isReading
        ? previous
        : { chapter, reading: isReading },
    );
  });
  function seek(index: number, direct = false) {
    if (
      document.querySelector<HTMLElement>("[data-descent-root]")?.dataset
        .motionBusy === "true"
    )
      return;
    const element = track.current;
    if (!element) return;
    navigation.current
      ?.querySelector<HTMLButtonElement>(`[data-stop="${index}"]`)
      ?.focus({ preventScroll: true });
    setDirectFinal(direct && index === waypointStops.length - 1);
    if (direct) {
      navigateTo(waypointStops[index]);
      return;
    }
    const top = element.getBoundingClientRect().top + scrollY - headerHeight;
    const length = element.offsetHeight - innerHeight + headerHeight;
    prepareSeek(waypointStops[index]);
    window.scrollTo({
      top: top + length * waypointStops[index],
      behavior: "instant",
    });
  }
  return (
    <section
      id="idea"
      ref={track}
      className={`${styles.track} ${linear ? styles.linearTrack : ""}`}
      aria-label={copy.genre}
      data-voyage-complete={linear || finalExitReady}
    >
      {!linear && (
        <div
          className={styles.stage}
          data-voyage-stage
          data-scene-state={sceneState}
        >
          <VoyageStarfield />
          <div className={styles.cosmos} aria-hidden="true">
            <Scene
              key={locale}
              progress={progress}
              navigationOpacity={navigationOpacity}
              navigationFlight={navigationFlight}
              onStateChange={setSceneState}
            />
          </div>
          <VoyageLoader state={sceneState} />
          <div className={styles.readingSpotlight} aria-hidden="true" />
          <motion.div
            className={styles.copyLayer}
            style={{ opacity: navigationOpacity }}
          >
            <motion.span
              className={styles.scrollHint}
              style={{ opacity: scrollHintOpacity }}
              aria-hidden={active.chapter !== 0 || navigationTarget !== null}
            >
              <i aria-hidden="true" />
              {copy.scroll}
            </motion.span>
            <VoyageFrame
              progress={progress}
              index={-1}
              active={
                navigationTarget === null &&
                active.chapter === 0 &&
                active.reading
              }
            >
              <h1>{copy.heroTitle}</h1>
              <p className={styles.description}>{copy.heroBody}</p>
            </VoyageFrame>
            {copy.planets.map((planet, index) => (
              <VoyageFrame
                progress={progress}
                index={index}
                active={
                  navigationTarget === null &&
                  active.chapter === index + 1 &&
                  active.reading
                }
                key={planet.name}
              >
                <h2>{planet.title}</h2>
                <p className={styles.description}>{planet.body}</p>
              </VoyageFrame>
            ))}
            <motion.div
              data-voyage-final
              className={styles.finale}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: logoFormed ? 1 : 0, y: logoFormed ? 0 : 14 }}
              transition={{
                duration: logoFormed ? (directFinal ? 0.55 : 1.35) : 0.16,
                delay: logoFormed ? 0.14 : 0,
                ease: [0.45, 0, 0.25, 1],
              }}
              onAnimationComplete={() => {
                setFinalTextReady(logoFormed);
              }}
              inert={
                navigationTarget !== null ||
                active.chapter !== visits.length + 1 ||
                !finalTextReady
              }
            >
              <p className={styles.wordmark}>
                physics<span>stars</span>
              </p>
              <h2>{copy.finalTitle}</h2>
              <p>{copy.finalBody}</p>
              <motion.div
                className={styles.continueHint}
                data-voyage-continue
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: finalExitReady && navigationTarget === null ? 1 : 0,
                  y: finalExitReady && navigationTarget === null ? 0 : 6,
                }}
                transition={{
                  duration: 0.45,
                  ease: "easeOut",
                }}
                aria-hidden="true"
              >
                {copy.continueScroll}
                <ArrowDown size={17} strokeWidth={1.4} />
              </motion.div>
            </motion.div>
          </motion.div>
          <div className={styles.bottomControls}>
            <nav
              ref={navigation}
              className={styles.stops}
              aria-label={copy.navigation}
            >
              {[
                copy.genre,
                ...copy.planets.map((p) => p.name),
                "Physics Stars",
              ].map((label, index) => (
                <button
                  data-stop={index}
                  key={index}
                  onClick={() => seek(index, true)}
                  aria-label={label}
                  aria-current={
                    (
                      navigationTarget === null
                        ? active.chapter === index
                        : waypointStops[index] === navigationTarget
                    )
                      ? "step"
                      : undefined
                  }
                >
                  <span />
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
      {linear && (
        <div className={styles.reading}>
          <div className={styles.readingIntro}>
            <Image src="/logo.svg" width={100} height={100} alt="" />
            <h1>{copy.heroTitle}</h1>
            <p>{copy.heroBody}</p>
          </div>
          <p className={styles.stationary}>{copy.stationary}</p>
          {copy.planets.map((planet) => (
            <article key={planet.name}>
              <h2>{planet.title}</h2>
              <p>{planet.body}</p>
            </article>
          ))}
          <div className={styles.readingFinal}>
            <Image
              src="/logo.svg"
              width={130}
              height={130}
              alt="Physics Stars"
            />
            <h2>{copy.finalTitle}</h2>
            <p>{copy.finalBody}</p>
          </div>
        </div>
      )}
    </section>
  );
}
function VoyageFrame({
  progress,
  index,
  active,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  active: boolean;
  children: ReactNode;
}) {
  const visit = visits[Math.max(0, index)];
  const opacity = useTransform(
    progress,
    index < 0
      ? [0, 0.018]
      : [visit.parked, visit.textIn + 0.004, visit.textOut, visit.departure],
    index < 0 ? [1, 0] : [0, 1, 1, 0],
  );
  return (
    <motion.div
      data-voyage-copy={index}
      className={`${styles.frame} ${index < 0 ? styles.heroFrame : ""} ${index === 1 || index === 3 ? styles.reverseFrame : ""}`}
      style={{ opacity }}
      inert={!active}
    >
      {children}
    </motion.div>
  );
}
