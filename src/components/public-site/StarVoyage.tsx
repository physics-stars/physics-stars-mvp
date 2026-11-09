"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
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
import { usePublicMotionSpeed } from "./use-public-motion-speed";
import { finalTextOffset, finalTextOpacity, planetTextOffset, planetTextOpacity, voyageScrollDistance, voyageScrollLength } from "./continuous-scroll";
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
  const motionSpeed = usePublicMotionSpeed();
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
  const [logoFormed, setLogoFormed] = useState(false);
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
  );
  const finalOpacity = useTransform(progress, finalTextOpacity);
  const finalY = useTransform(progress, finalTextOffset);
  const scrollHintOpacity = useTransform(progress, [0, 0.012], [1, 0]);
  useMotionValueEvent(progress, "change", (p) => {
    const formed = p >= finale.sealed;
    setLogoFormed(formed);
    const state = voyageState(p),
      chapter =
        state.phase === "hero"
          ? 0
          : state.phase === "finale"
            ? visits.length + 1
            : state.index + 1;
    const isReading =
      state.phase === "hero" || state.phase === "reading" || p >= finale.sealed;
    setActive((previous) =>
      previous.chapter === chapter && previous.reading === isReading
        ? previous
        : { chapter, reading: isReading },
    );
  });
  function seek(index: number, direct = false) {
    const element = track.current;
    if (!element) return;
    navigation.current
      ?.querySelector<HTMLButtonElement>(`[data-stop="${index}"]`)
      ?.focus({ preventScroll: true });
    if (direct) {
      navigateTo(waypointStops[index]);
      return;
    }
    const top = element.getBoundingClientRect().top + scrollY - headerHeight;
    const length = element.offsetHeight - innerHeight + headerHeight;
    prepareSeek(waypointStops[index]);
    window.scrollTo({
      top: top + length * voyageScrollDistance(waypointStops[index]) / voyageScrollLength,
      behavior: "instant",
    });
  }
  return (
    <section
      id="idea"
      ref={track}
      className={`${styles.track} ${linear ? styles.linearTrack : ""}`}
      style={{ "--voyage-scroll-length": voyageScrollLength } as CSSProperties}
      aria-label={copy.genre}
      data-voyage-complete={linear || logoFormed}
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
              style={{ opacity: finalOpacity, y: finalY }}
              inert={
                navigationTarget !== null ||
                active.chapter !== visits.length + 1 ||
                !logoFormed
              }
            >
              <p className={styles.wordmark}>
                physics<span>stars</span>
              </p>
              <h2>{copy.finalTitle}</h2>
              <p>{copy.finalBody}</p>
              <motion.a
                href="#sobre"
                className={styles.continueHint}
                data-voyage-continue
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  const section = document.getElementById("sobre");
                  if (!section) return;
                  const jump = new CustomEvent("landing-navigate", {
                    detail: { id: "sobre", behavior: "smooth" }, cancelable: true,
                  });
                  window.dispatchEvent(jump);
                }}
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: logoFormed && navigationTarget === null ? 1 : 0,
                  y: logoFormed && navigationTarget === null ? 0 : 6,
                }}
                transition={{
                  duration: 0.45 / motionSpeed,
                  ease: "easeOut",
                }}
              >
                {copy.continueScroll}
                <ArrowDown size={17} strokeWidth={1.4} aria-hidden="true" />
              </motion.a>
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
  const opacity = useTransform(progress, p => index < 0
    ? 1 - Math.max(0, Math.min(1, p / 0.018)) : planetTextOpacity(p, index));
  const y = useTransform(progress, p => index < 0 ? 0 : planetTextOffset(p, index));
  return (
    <motion.div
      data-voyage-copy={index}
      className={`${styles.frame} ${index < 0 ? styles.heroFrame : ""} ${index === 1 || index === 3 ? styles.reverseFrame : ""}`}
      style={{ opacity, y }}
      inert={!active}
    >
      {children}
    </motion.div>
  );
}
