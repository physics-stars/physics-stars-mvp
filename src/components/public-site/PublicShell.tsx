"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Exo_2 } from "next/font/google";
import localFont from "next/font/local";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { languageNames, locales, publicCopy, type Locale } from "./copy";
import styles from "./public.module.css";

const brandFont = Exo_2({
  subsets: ["latin"],
  style: "normal",
  display: "swap",
  variable: "--font-physics-brand",
});

const readingFont = localFont({
  src: [
    { path: "./fonts/barlow-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/barlow-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/barlow-600.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-public-reading",
});

const displayFont = localFont({
  src: [
    { path: "./fonts/barlow-semi-condensed-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/barlow-semi-condensed-600.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-public-display",
});

const LocaleContext = createContext<Locale>("ca");
export const usePublicLocale = () => useContext(LocaleContext);

export function PublicShell({
  locale,
  children,
  login = false,
}: {
  locale: Locale;
  children: ReactNode;
  login?: boolean;
}) {
  const t = publicCopy[locale];
  useEffect(() => {
    const previous = document.documentElement.lang;
    const previousBackground = document.body.style.backgroundColor;
    document.documentElement.lang = locale;
    document.body.style.backgroundColor = login ? "#f5f3f9" : "#080a18";
    return () => {
      document.documentElement.lang = previous;
      document.body.style.backgroundColor = previousBackground;
    };
  }, [locale, login]);

  return (
    <LocaleContext value={locale}>
      <div
        className={`${brandFont.variable} ${readingFont.variable} ${displayFont.variable} ${styles.site} ${login ? styles.loginSite : ""}`}
        lang={locale}
      >
        <a className={styles.skip} href="#main">
          {t.nav.skip}
        </a>
        <header className={styles.header}>
          <Brand locale={locale} />
          {!login && <LandingNavigation locale={locale} />}
          <div className={styles.headerActions}>
            <LanguageSwitch />
            {!login && (
              <Link className={styles.loginLink} href={`/login?lang=${locale}`}>
                {t.nav.login}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        </header>
        {children}
      </div>
    </LocaleContext>
  );
}

function LandingNavigation({ locale }: { locale: Locale }) {
  const [active, setActive] = useState("idea");
  const jumpFrame = useRef(0);
  const t = publicCopy[locale].nav;
  const links = [
    ["idea", t.home],
    ["sobre", t.game],
    ["equip", t.team],
    ["pilot", t.teachers],
  ];
  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const header =
        document.querySelector("header")?.getBoundingClientRect().height ?? 76;
      const current = ["sobre", "equip", "pilot"].findLast(
        (id) =>
          (document.getElementById(id)?.getBoundingClientRect().top ??
            Infinity) <=
          header + 40,
      );
      setActive(current ?? "idea");
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(jumpFrame.current);
      const journey = document.getElementById("idea");
      if (journey) delete journey.dataset.landingJump;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return (
    <nav className={styles.navigation} aria-label={t.game}>
      {links.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          data-landing-nav
          aria-current={active === id ? "location" : undefined}
          onClick={(event) => {
            if (
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            const target = document.getElementById(id);
            if (!target) return;
            const jump = new CustomEvent("landing-navigate", {
              detail: id,
              cancelable: true,
            });
            if (!window.dispatchEvent(jump)) return;
            const header = event.currentTarget
              .closest("header")!
              .getBoundingClientRect().height;
            // Direct navigation replaces the current scroll position.
            const journey = document.getElementById("idea");
            if (journey) journey.dataset.landingJump = "true";
            cancelAnimationFrame(jumpFrame.current);
            window.scrollTo({
              top:
                id === "idea"
                  ? 0
                  : target.getBoundingClientRect().top + scrollY - header,
              behavior: "instant",
            });
            jumpFrame.current = requestAnimationFrame(() => {
              jumpFrame.current = requestAnimationFrame(() => {
                if (journey) delete journey.dataset.landingJump;
              });
            });
            // Section jumps share one URL and never add a history entry.
            if (location.hash)
              history.replaceState(
                history.state,
                "",
                location.pathname + location.search,
              );
            setActive(id);
          }}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

export function Brand({ locale }: { locale: Locale }) {
  return (
    <Link
      href={`/?lang=${locale}`}
      aria-label="Physics Stars"
      translate="no"
      className={styles.brand}
    >
      <Image src="/logo.svg" alt="" width={36} height={36} />
      <span>
        physics<span className={styles.brandSecond}>stars</span>
      </span>
    </Link>
  );
}

function LanguageSwitch() {
  const locale = usePublicLocale();
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <nav
      className={styles.languages}
      aria-label={publicCopy[locale].nav.language}
    >
      {locales.map((language) => {
        const params = new URLSearchParams(search.toString());
        params.set("lang", language);
        return (
          <Link
            key={language}
            href={`${pathname}?${params}`}
            prefetch={false}
            scroll={false}
            hrefLang={language}
            aria-label={languageNames[language]}
            aria-current={language === locale ? "true" : undefined}
            onClick={() => {
              document.cookie = `physics-stars-public-language=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
            }}
          >
            {language.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
