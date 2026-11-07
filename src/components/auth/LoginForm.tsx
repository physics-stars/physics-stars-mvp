"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { getHomePathForRole } from "@/lib/config/roles";
import { publicCopy } from "@/components/public-site/copy";
import { usePublicLocale } from "@/components/public-site/PublicShell";
import styles from "@/components/public-site/public.module.css";

type LoginError =
  | "required"
  | "invalid"
  | "disabled"
  | "rate"
  | "generic"
  | "network";

// Exclusive to the public login. Endpoint, payload, sessions and role routing stay unchanged.
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = usePublicLocale();
  const t = publicCopy[locale].login;
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError(null);
    if (!username.trim() || !password) {
      setError("required");
      (!username.trim() ? usernameRef : passwordRef).current?.focus();
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const reason: LoginError =
          response.status === 401
            ? "invalid"
            : response.status === 429
              ? "rate"
              : response.status === 400
                ? "required"
                : response.status === 403 &&
                    typeof data.error === "string" &&
                    data.error.includes("desactivat")
                  ? "disabled"
                  : "generic";
        setError(reason);
        usernameRef.current?.focus();
        return;
      }
      const redirectTo =
        searchParams.get("redirectTo") ?? getHomePathForRole(data.user.role);
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("network");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.loginForm}
      noValidate
      aria-busy={isSubmitting}
    >
      <div className={styles.formField}>
        <label htmlFor="username">{t.username}</label>
        <input
          ref={usernameRef}
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setError(null);
          }}
          placeholder={t.usernamePlaceholder}
          required
          aria-invalid={error === "required" || error === "invalid"}
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="password">{t.password}</label>
        <div className={styles.passwordField}>
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            required
            aria-invalid={error === "required" || error === "invalid"}
            aria-describedby={error ? "login-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? t.hide : t.show}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff size={19} aria-hidden="true" />
            ) : (
              <Eye size={19} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <div aria-live="polite">
        {error && (
          <p id="login-error" className={styles.formError}>
            {t[error]}
          </p>
        )}
      </div>
      <button
        className={styles.primaryButton}
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? t.loading : t.submit}
        {isSubmitting ? (
          <LoaderCircle
            size={19}
            className={styles.spinner}
            aria-hidden="true"
          />
        ) : (
          <ArrowRight size={19} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
