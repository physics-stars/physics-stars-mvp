"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Exo_2 } from "next/font/google";
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
    document.body.style.backgroundColor = login ? "#f2f1f8" : "#080a18";
    return () => {
      document.documentElement.lang = previous;
      document.body.style.backgroundColor = previousBackground;
    };
  }, [locale, login]);

  return (
    <LocaleContext value={locale}>
      <div
        className={`${brandFont.variable} ${styles.site} ${login ? styles.loginSite : ""}`}
        lang={locale}
      >
        <a className={styles.skip} href="#main">
          {t.nav.skip}
        </a>
        <header className={styles.header}>
          <Brand locale={locale} />
          {!login && (
            <nav className={styles.navigation} aria-label={t.nav.game}>
              <a href="#sobre">{t.nav.game}</a>
              <a href="#pilot">{t.nav.teachers}</a>
              <a href="#equip">{t.nav.team}</a>
            </nav>
          )}
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

export function Brand({ locale }: { locale: Locale }) {
  return (
    <Link
      href={`/?lang=${locale}`}
      aria-label="Physics Stars"
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
            {language === "es" ? "ESP" : language.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
