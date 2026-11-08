"use client";

import { useLayoutEffect } from "react";
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
  { name: "David Diestre", photo: "/team/david.jpg" },
  { name: "Juan Roset", photo: "/team/juan.png" },
  { name: "Aissam Khadraoui", photo: "/team/aissam.jpg" },
];

export function Landing() {
  const locale = usePublicLocale(),
    t = publicCopy[locale],
    copy = voyageCopy[locale];
  const contact = `mailto:${contactEmail}?subject=${encodeURIComponent(t.pilot.subject)}`;
  useLayoutEffect(() => {
    // Keep this history entry manual before the next reload can capture it.
    // The inline landing bootstrap also runs before hydration on a full load.
    history.scrollRestoration = "manual";
    const navigation = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navigation?.type === "reload")
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return () => {
      history.scrollRestoration = "auto";
    };
  }, []);
  return (
    <main id="main">
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
            <h2 id="about-title">{copy.aboutTitle}</h2>
          </div>
          <div className={styles.aboutBody}>
            <p>{copy.aboutBody}</p>
          </div>
          <div
            className={styles.team}
            aria-label={copy.teamLabel}
            data-descent-panel
          >
            {team.map((member, index) => (
              <article key={member.name} data-descent-member>
                <div className={styles.teamPhoto} data-descent-photo>
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    sizes="(max-width:480px) calc(100vw - 48px),28vw"
                  />
                </div>
                <div className={styles.teamCaption}>
                  <h3>{member.name}</h3>
                  <span>{t.about.roles[index]}</span>
                </div>
              </article>
            ))}
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
              <a className={styles.emailLink} href={contact}>
                {contactEmail}
              </a>
            </div>
          </div>
          <footer className={styles.footer}>
            <div>
              <a
                href={`/?lang=${locale}`}
                aria-label="Physics Stars"
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
          </footer>
        </section>
      </LandingDescent>
    </main>
  );
}
