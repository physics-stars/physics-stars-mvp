"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { publicCopy, contactEmail } from "./copy";
import { voyageCopy } from "./voyage-copy";
import { usePublicLocale } from "./PublicShell";
import { StarVoyage } from "./StarVoyage";
import { LandingDescent } from "./LandingDescent";
import { GlassVessel } from "./GlassVessel";
import styles from "./landing.module.css";

const team = [
  { name: "David Diestre", photo: "/team/david.jpg", position: "70% 50%", scale: 1, origin: "center" },
  { name: "Juan Roset", photo: "/team/juan.jpeg", position: "50% 65%", scale: 1.12, origin: "100% 50%" },
  { name: "Aissam Khadraoui", photo: "/team/aissam.jpeg", position: "50% 50%", scale: 1.4, origin: "50% 0%" },
];

const desktopTeamQuery = "(min-width: 761px) and (hover: hover) and (pointer: fine)";
const desktopTeamSnapshot = () => window.matchMedia(desktopTeamQuery).matches;
const serverTeamSnapshot = () => false;
function subscribeDesktopTeam(callback: () => void) {
  const media = window.matchMedia(desktopTeamQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function Landing() {
  const locale = usePublicLocale(),
    t = publicCopy[locale],
    copy = voyageCopy[locale];
  const contact = `mailto:${contactEmail}?subject=${encodeURIComponent(t.pilot.subject)}`;
  const [landingReady, setLandingReady] = useState(false);
  const [revealedMember, setRevealedMember] = useState<number | null>(null);
  const [memeUnlocked, setMemeUnlocked] = useState(false);
  const [memeFailed, setMemeFailed] = useState(false);
  const juanClicks = useRef(0);
  const desktopTeam = useSyncExternalStore(
    subscribeDesktopTeam,
    desktopTeamSnapshot,
    serverTeamSnapshot,
  );

  function toggleMember(index: number) {
    setRevealedMember((current) => current === index ? null : index);
    if (index !== 1) {
      juanClicks.current = 0;
      return;
    }
    juanClicks.current += 1;
    if (juanClicks.current >= 5) setMemeUnlocked(true);
  }

  useLayoutEffect(() => {
    const storageKey = "physics-stars:landing-scroll:v1";
    let disposed = false, frame = 0;
    let savedPosition: { x: number; y: number } | null = null;
    history.scrollRestoration = "auto";
    const navigation = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navigation?.type === "reload") {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
        if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
          savedPosition = saved;
        }
      } catch {
        // Native restoration remains available when browser storage is blocked.
      }
    }
    const observer = new MutationObserver(revealWhenReady);
    function revealWhenReady() {
      if (disposed) return;
      const stage = document.querySelector<HTMLElement>("[data-voyage-stage]");
      const voyage = document.getElementById("idea");
      const inVoyage = voyage && voyage.getBoundingClientRect().bottom > innerHeight;
      if (inVoyage && stage?.dataset.sceneState === "loading") {
        observer.observe(voyage, { attributes: true, childList: true, subtree: true, attributeFilter: ["data-scene-state"] });
        return;
      }
      observer.disconnect();
      setLandingReady(true);
      // Keep the saved backdrop and header indicator through the short fade.
      const reloadStyle = document.getElementById("landing-reload-style");
      if (reloadStyle) window.setTimeout(() => reloadStyle.remove(), 200);
    }
    function restorePosition() {
      if (savedPosition) {
        window.scrollTo({ left: savedPosition.x, top: savedPosition.y, behavior: "instant" });
        window.dispatchEvent(new Event("scroll"));
      }
    }
    // Fonts and mobile hydration can change section heights. Settle that geometry
    // before restoring, then let the scroll controllers adopt the restored camera.
    void document.fonts.ready.then(() => {
      if (disposed) return;
      frame = requestAnimationFrame(() => {
        restorePosition();
        frame = requestAnimationFrame(() => {
          restorePosition();
          revealWhenReady();
        });
      });
    });
    function savePosition() {
      try {
        const header = document.querySelector("header")?.getBoundingClientRect().height ?? 76;
        const section = ["sobre", "equip", "pilot"].findLast((id) =>
          (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= header + 40,
        ) ?? "idea";
        sessionStorage.setItem(storageKey, JSON.stringify({ x: scrollX, y: scrollY, section }));
      } catch {
        // Storage is optional, including in private browsing modes.
      }
    }
    window.addEventListener("pagehide", savePosition);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pagehide", savePosition);
      queueMicrotask(() => {
        if (!document.querySelector("main[data-landing-ready]")) {
          document.getElementById("landing-reload-style")?.remove();
        }
      });
    };
  }, []);

  useLayoutEffect(() => {
    function resetTeam() {
      setRevealedMember(null);
      setMemeUnlocked(false);
      setMemeFailed(false);
      juanClicks.current = 0;
    }
    // A browser back/forward cache restore must start a fresh landing visit too.
    window.addEventListener("pagehide", resetTeam);
    function allowMessageScroll(event: WheelEvent | KeyboardEvent) {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLElement>('[data-team-toggle][aria-expanded="true"]');
      if (!button || button.scrollHeight <= button.clientHeight) return;
      if (event instanceof KeyboardEvent &&
        !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) return;
      // Let a long message scroll without advancing the landing's light sequence.
      event.stopImmediatePropagation();
    }
    window.addEventListener("wheel", allowMessageScroll, { capture: true, passive: true });
    window.addEventListener("keydown", allowMessageScroll, true);
    return () => {
      window.removeEventListener("pagehide", resetTeam);
      window.removeEventListener("wheel", allowMessageScroll, true);
      window.removeEventListener("keydown", allowMessageScroll, true);
    };
  }, []);
  return (
    <main id="main" className={styles.landing} data-landing-ready={landingReady} aria-busy={!landingReady}>
      <StarVoyage />
      <LandingDescent key={locale}>
        <section
          id="sobre"
          className={styles.overview}
          aria-labelledby="overview-title"
          data-snap-section
        >
          <div className={styles.overviewIntro}>
            <p className={styles.sectionLabel}>{copy.overview.label}</p>
            <h2 id="overview-title">{copy.overview.title}</h2>
            <p>{copy.overview.body}</p>
          </div>
          <div className={styles.overviewMethod}>
            <ol className={styles.overviewSteps} role="list">
              {copy.overview.steps.map((step, index) => (
                <li key={step.title}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <aside className={styles.teacherNote}>
              <h3>{copy.overview.teacherTitle}</h3>
              <p>{copy.overview.teacherBody}</p>
            </aside>
          </div>
          <GlassVessel />
        </section>
        <section
          id="equip"
          className={styles.about}
          aria-labelledby="about-title"
          data-snap-section
        >
          <div className={styles.aboutHeading}>
            <p className={styles.sectionLabel}>{t.nav.team}</p>
            <h2 id="about-title">
              {copy.aboutTitleLines.map((line, index) => (
                <span key={line}>{index > 0 ? " " : ""}{line}</span>
              ))}
            </h2>
          </div>
          <div className={styles.aboutBody}>
            <p>{copy.aboutBody}</p>
            <p>{copy.aboutSecond}</p>
          </div>
          <div
            className={styles.team}
            aria-label={copy.teamLabel}
            data-descent-panel
          >
            {team.map((member, index) => {
              const shown = desktopTeam && revealedMember === index;
              const showMeme = desktopTeam && index === 1 && memeUnlocked && !memeFailed;
              return (
                <article key={member.name} data-descent-member>
                  <div
                    className={styles.teamPhoto}
                    data-descent-photo
                    data-revealed={shown}
                  >
                    <div className={styles.teamPortrait} aria-hidden={shown}>
                      <Image
                        src={showMeme ? "/team/juan-meme.png" : member.photo}
                        alt={showMeme ? t.about.memeAlt : member.name}
                        fill
                        sizes="(max-width:760px) 29vw, 17vw"
                        style={showMeme ? { objectPosition: "center" } : {
                          objectPosition: member.position,
                          transform: `scale(${member.scale})`,
                          transformOrigin: member.origin,
                        }}
                        onError={showMeme ? () => setMemeFailed(true) : undefined}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.teamPhotoToggle}
                      data-team-toggle
                      aria-label={`${shown ? t.about.showPhoto : t.about.showMessage}: ${member.name}`}
                      aria-expanded={shown}
                      aria-controls={`team-message-${index}`}
                      aria-describedby={shown ? `team-message-${index}` : undefined}
                      onClick={(event) => {
                        event.currentTarget.scrollTop = 0;
                        toggleMember(index);
                      }}
                    >
                      <span
                        id={`team-message-${index}`}
                        className={styles.teamMessage}
                        aria-hidden={!shown}
                      >
                        <span>{t.about.messages[index]}</span>
                        {index === 0 && <small>{t.about.juanHint}</small>}
                      </span>
                    </button>
                  </div>
                  <div className={styles.teamCaption}>
                    <h3>{member.name}</h3>
                    <span>{t.about.roles[index]}</span>
                  </div>
                </article>
              );
            })}
            <span
              className={styles.energyBar}
              data-descent-bar="team"
              aria-hidden="true"
            >
              <i />
            </span>
          </div>
        </section>
        <section
          id="pilot"
          className={styles.outroScreen}
          aria-labelledby="pilot-title"
          data-snap-section
        >
          <div className={styles.pilot}>
            <div className={styles.pilotContent}>
              <p className={styles.pilotStatus}>{copy.prototype}</p>
              <h2 id="pilot-title">{copy.pilotTitle}</h2>
              <p>{copy.pilotBody}</p>
            </div>
            <div className={styles.pilotAction}>
              <p className={styles.pilotNote}>{copy.pilotNote}</p>
              <a
                className={styles.primaryButton}
                href={contact}
                data-pilot-action
              >
                <span className={styles.buttonLabel}>{copy.pilotCta}</span>
                <ArrowUpRight
                  className={styles.buttonArrow}
                  size={27}
                  aria-hidden="true"
                />
                <span
                  className={styles.energyBar}
                  data-descent-bar="pilot"
                  aria-hidden="true"
                >
                  <i />
                </span>
              </a>
            </div>
          </div>
          <footer className={styles.footer}>
            <div>
              <a
                href={`/?lang=${locale}`}
                aria-label="Physics Stars"
                translate="no"
                className={styles.footerBrand}
              >
                <Image src="/logo-on-light.svg" width={30} height={30} alt="" />
                <span>
                  physics<span>stars</span>
                </span>
              </a>
              <p>{t.footer.line}</p>
            </div>
            <div className={styles.footerNotes}>
              <p>{t.footer.rights}</p>
            </div>
            <a href={contact}>
              {t.footer.contact}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </footer>
        </section>
      </LandingDescent>
    </main>
  );
}
