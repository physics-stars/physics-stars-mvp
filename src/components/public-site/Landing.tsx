"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowDownRight, ArrowUp, ArrowUpRight } from "lucide-react";
import { publicCopy, contactEmail } from "./copy";
import { voyageCopy } from "./voyage-copy";
import { Brand, usePublicLocale } from "./PublicShell";
import { StarVoyage } from "./StarVoyage";
import styles from "./public.module.css";

const team = [
  { name: "David Diestre", photo: "/team/david.jpg" },
  { name: "Juan Roset", photo: "/team/juan.png" },
  { name: "Aissam Khadraoui", photo: "/team/aissam.jpg" },
];

export function Landing() {
  const locale = usePublicLocale(),
    t = publicCopy[locale],
    copy = voyageCopy[locale];
  const overview = useRef<HTMLElement>(null);
  const contact = `mailto:${contactEmail}?subject=${encodeURIComponent(t.pilot.subject)}`;
  useEffect(() => {
    const root = document.documentElement;
    const journey = document.getElementById("idea");
    const previousSnap = root.style.scrollSnapType,
      previousPadding = root.style.scrollPaddingTop;
    let enabled = false;
    function update() {
      if (!overview.current) return;
      const header = innerWidth <= 760 ? 68 : 76;
      const boundary =
        overview.current.getBoundingClientRect().top + scrollY - header;
      const complete =
        journey?.dataset.voyageComplete === "true" ||
        journey?.dataset.voyageSkip === "true";
      const next =
        complete &&
        journey?.dataset.voyageLeaving !== "true" &&
        scrollY >= boundary - 36;
      if (next === enabled) return;
      enabled = next;
      root.style.scrollSnapType = next ? "y mandatory" : previousSnap;
      root.style.scrollPaddingTop = next ? `${header}px` : previousPadding;
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new MutationObserver(update);
    if (journey)
      observer.observe(journey, {
        attributes: true,
        attributeFilter: [
          "data-voyage-complete",
          "data-voyage-skip",
          "data-voyage-leaving",
        ],
      });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
      root.style.scrollSnapType = previousSnap;
      root.style.scrollPaddingTop = previousPadding;
    };
  }, []);
  return (
    <main id="main">
      <StarVoyage />
      <section
        id="sobre"
        ref={overview}
        className={styles.overview}
        aria-labelledby="overview-title"
        data-snap-section
      >
        <div className={styles.overviewIntro}>
          <p className={styles.sectionLabel}>{copy.overview.label}</p>
          <h2 id="overview-title">{copy.overview.title}</h2>
          <p>{copy.overview.body}</p>
          <a href="#equip">
            {t.nav.team}
            <ArrowDownRight size={17} aria-hidden="true" />
          </a>
        </div>
        <div className={styles.overviewSteps}>
          {copy.overview.steps.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
          <aside>
            <h3>{copy.overview.teacherTitle}</h3>
            <p>{copy.overview.teacherBody}</p>
          </aside>
        </div>
      </section>
      <section
        id="equip"
        className={styles.about}
        aria-labelledby="about-title"
        data-snap-section
      >
        <div className={styles.aboutHeading}>
          <p className={styles.sectionLabel}>{t.nav.team}</p>
          <h2 id="about-title">{copy.aboutTitle}</h2>
        </div>
        <div className={styles.aboutBody}>
          <p>{copy.aboutBody}</p>
        </div>
        <div className={styles.team} aria-label={copy.teamLabel}>
          {team.map((member, index) => (
            <article key={member.name}>
              <div className={styles.teamPhoto}>
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  sizes="(max-width:600px) 85vw,28vw"
                />
              </div>
              <div className={styles.teamCaption}>
                <h3>{member.name}</h3>
                <span>{t.about.roles[index]}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section
        id="pilot"
        className={styles.outroScreen}
        aria-labelledby="pilot-title"
        data-snap-section
      >
        <div className={styles.pilot}>
          <div className={styles.pilotArt} aria-hidden="true">
            <Image src="/logo.svg" alt="" fill sizes="500px" />
          </div>
          <div className={styles.pilotContent}>
            <p className={styles.pilotStatus}>{copy.prototype}</p>
            <h2 id="pilot-title">{copy.pilotTitle}</h2>
            <p>{copy.pilotBody}</p>
            <a className={styles.primaryButton} href={contact}>
              {copy.pilotCta}
              <ArrowUpRight size={19} aria-hidden="true" />
            </a>
            <a className={styles.emailLink} href={contact}>
              {contactEmail}
            </a>
          </div>
        </div>
        <footer className={styles.footer}>
          <div>
            <Brand locale={locale} />
            <p>{t.footer.line}</p>
          </div>
          <div className={styles.footerNotes}>
            <p>{t.footer.rights}</p>
            <p>
              <a href="https://www.solarsystemscope.com/textures/">
                Solar System Scope
              </a>{" "}
              /{" "}
              <a href="https://creativecommons.org/licenses/by/4.0/">
                CC BY 4.0
              </a>
            </p>
          </div>
          <a href="#main">
            {t.footer.top}
            <ArrowUp size={15} aria-hidden="true" />
          </a>
        </footer>
      </section>
    </main>
  );
}
