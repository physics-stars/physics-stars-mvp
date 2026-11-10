"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { contactEmail, publicCopy } from "./copy";
import { usePublicLocale } from "./PublicShell";
import { VoyageStarfield } from "./VoyageStarfield";
import publicStyles from "./public.module.css";
import styles from "./soon.module.css";

export function ComingSoon() {
  const locale = usePublicLocale();
  const t = publicCopy[locale].soon;
  return (
    <main id="main" className={styles.main}>
      <VoyageStarfield />
      {/* La llum s'atura a mig camí: la ruta encara s'està traçant. */}
      <svg className={styles.route} viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
        <path className={styles.travelled} d="M-40 520 C 220 500, 420 380, 640 250" />
        <path className={styles.pending} d="M640 250 C 800 160, 920 120, 1060 90" />
      </svg>
      <span className={styles.light} aria-hidden="true" />
      <div className={styles.copy}>
        <p className={styles.label}>{t.label}</p>
        <h1>{t.title}</h1>
        <p className={styles.body}>{t.body}</p>
        <div className={styles.actions}>
          <Link className={publicStyles.primaryButton} href={`/${locale}`}>
            <ArrowLeft size={18} aria-hidden="true" />
            {t.back}
          </Link>
          <a className={styles.contact} href={`mailto:${contactEmail}`}>
            {t.contact}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </main>
  );
}
