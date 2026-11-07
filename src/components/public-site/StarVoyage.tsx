"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
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
import styles from "./voyage.module.css";

const Scene = dynamic(() => import("./StarVoyageScene"), { ssr: false });
const reducedQuery = "(prefers-reduced-motion: reduce), (max-height: 620px)";
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
    navigation = useRef<HTMLElement>(null),
    finalePanel = useRef<HTMLDivElement>(null),
    finaleFocus = useRef(false);
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const headerHeight = useSyncExternalStore(
    subscribeWidth,
    headerSnapshot,
    serverHeader,
  );
  const [reading, setReading] = useState(false),
    [active, setActive] = useState({ chapter: 0, reading: true });
  const [logoFormed, setLogoFormed] = useState(false),
    [finalTextReady, setFinalTextReady] = useState(false);
  const linear = reduced || reading;
  const { scrollYProgress: scrollTarget } = useScroll({
    target: track,
    offset: [`start ${headerHeight}px`, "end end"],
  });
  const { progress, prepareSeek } = useVoyageProgress(
    scrollTarget,
    track,
    headerHeight,
    !linear,
    finalTextReady,
  );
  useMotionValueEvent(progress, "change", (p) => {
    const formed = p >= finale.sealed;
    if (formed !== logoFormed) {
      finaleFocus.current =
        formed && !!navigation.current?.contains(document.activeElement);
      setLogoFormed(formed);
      if (!formed) setFinalTextReady(false);
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
  function seek(index: number) {
    const element = track.current;
    if (!element) return;
    navigation.current
      ?.querySelector<HTMLButtonElement>(`[data-stop="${index}"]`)
      ?.focus({ preventScroll: true });
    const top = element.getBoundingClientRect().top + scrollY - headerHeight;
    const length = element.offsetHeight - innerHeight + headerHeight;
    prepareSeek(waypointStops[index]);
    window.scrollTo({
      top: top + length * waypointStops[index],
      behavior: "instant",
    });
  }
  function switchToReading() {
    setReading(true);
    track.current?.scrollIntoView({ behavior: "instant", block: "start" });
  }
  return (
    <section
      id="idea"
      ref={track}
      className={`${styles.track} ${linear ? styles.linearTrack : ""}`}
      aria-label={copy.genre}
      data-voyage-complete={linear || finalTextReady}
    >
      {!linear && (
        <div className={styles.stage} data-voyage-stage>
          <div className={styles.starfield} aria-hidden="true" />
          <div className={styles.cosmos} aria-hidden="true">
            <Scene key={locale} progress={progress} />
          </div>
          <div className={styles.readingSpotlight} aria-hidden="true" />
          <div className={styles.topControls}>
            <button onClick={switchToReading}>{copy.readStory}</button>
            <a href="#pilot">
              {copy.skip}
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </div>
          <VoyageFrame
            progress={progress}
            index={-1}
            active={active.chapter === 0 && active.reading}
          >
            <p className={styles.genre}>{copy.genre}</p>
            <h1>{copy.heroTitle}</h1>
            <p className={styles.description}>{copy.heroBody}</p>
            <button className={styles.departure} onClick={() => seek(1)}>
              {copy.start}
              <ArrowDownRight size={17} aria-hidden="true" />
            </button>
            <p className={styles.prototype}>{copy.prototype}</p>
          </VoyageFrame>
          {copy.planets.map((planet, index) => (
            <VoyageFrame
              progress={progress}
              index={index}
              active={active.chapter === index + 1 && active.reading}
              key={planet.name}
            >
              <h2>{planet.title}</h2>
              <p className={styles.description}>{planet.body}</p>
            </VoyageFrame>
          ))}
          <motion.div
            ref={finalePanel}
            data-voyage-final
            className={styles.finale}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: logoFormed ? 1 : 0, y: logoFormed ? 0 : 14 }}
            transition={{
              duration: logoFormed ? 1.35 : 0.16,
              delay: logoFormed ? 0.14 : 0,
              ease: [0.45, 0, 0.25, 1],
            }}
            onAnimationComplete={() => {
              setFinalTextReady(logoFormed);
              if (
                logoFormed &&
                finaleFocus.current &&
                document.activeElement === document.body
              ) {
                finalePanel.current
                  ?.querySelector<HTMLAnchorElement>("a")
                  ?.focus({ preventScroll: true });
              }
              finaleFocus.current = false;
            }}
            inert={active.chapter !== visits.length + 1 || !finalTextReady}
          >
            <p className={styles.wordmark}>
              physics<span>stars</span>
            </p>
            <h2>{copy.finalTitle}</h2>
            <p>{copy.finalBody}</p>
            <a href="#sobre">
              {copy.overview.label}
              <ArrowDownRight size={15} aria-hidden="true" />
            </a>
          </motion.div>
          <div
            className={styles.bottomControls}
            inert={logoFormed}
            style={{
              opacity: logoFormed ? 0 : 1,
              pointerEvents: logoFormed ? "none" : undefined,
            }}
          >
            <span className={styles.scrollHint}>
              <i />
              {copy.scroll}
            </span>
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
                  onClick={() => seek(index)}
                  aria-label={label}
                  aria-current={active.chapter === index ? "step" : undefined}
                >
                  <span />
                </button>
              ))}
            </nav>
            <span className={styles.destination}>Physics Stars</span>
          </div>
        </div>
      )}
      {linear && (
        <div className={styles.reading}>
          <div className={styles.readingIntro}>
            <Image src="/logo.svg" width={100} height={100} alt="" />
            <p className={styles.genre}>{copy.genre}</p>
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
