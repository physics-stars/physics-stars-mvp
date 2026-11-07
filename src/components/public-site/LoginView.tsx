"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { contactEmail, publicCopy } from "./copy";
import { usePublicLocale } from "./PublicShell";
import styles from "./public.module.css";

export function LoginView() {
  const locale = usePublicLocale();
  const t = publicCopy[locale].login;
  return (
    <main id="main" className={styles.loginMain}>
      <div className={styles.loginArt}>
        <div className={styles.loginSculpture}>
          <Image src="/logo.svg" alt="" fill sizes="300px" />
        </div>
        <div className={styles.loginArtCopy}>
          <h2>{t.artTitle}</h2>
          <p>{t.artBody}</p>
        </div>
      </div>
      <div className={styles.loginPanel}>
        <Link className={styles.backLink} href={`/?lang=${locale}`}>
          <ArrowLeft size={17} aria-hidden="true" />
          {t.back}
        </Link>
        <div className={styles.loginFormArea}>
          <h1>{t.title}</h1>
          <p className={styles.loginSubtitle}>{t.subtitle}</p>
          <LoginForm />
          <p className={styles.loginHelp}>{t.help}</p>
          {locale !== "ca" && (
            <p className={styles.insideLanguage}>{t.inside}</p>
          )}
        </div>
        <p className={styles.loginContact}>
          {t.school}
          <a href={`mailto:${contactEmail}`}>
            {t.contact}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </p>
      </div>
    </main>
  );
}
