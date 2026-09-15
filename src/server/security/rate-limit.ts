import {
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  LOGIN_RATE_LIMIT_WINDOW_MS,
} from "@/lib/config/auth";

/*
 * Limitador de velocitat (rate limiter) senzill, en memòria, per mitigar
 * atacs de força bruta contra el login.
 *
 * IMPORTANT: aquesta implementació guarda l'estat en memòria del procés,
 * per la qual cosa NOMÉS és efectiva dins d'una mateixa instància de
 * servidor i es reinicia si la instància es reinicia (p. ex. cold start
 * a Vercel). És suficient per a l'MVP, però quan hi hagi trànsit real
 * caldrà substituir-la per un magatzem compartit (p. ex. Upstash Redis
 * amb @upstash/ratelimit) perquè el límit s'apliqui igual entre totes
 * les instàncies serverless.
 */

interface AttemptBucket {
  count: number;
  windowResetAt: number;
}

const attemptsByKey = new Map<string, AttemptBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
}

// Comprova (i registra) un intent per a una clau donada (p. ex. `ip:usuari`).
export function checkLoginRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = attemptsByKey.get(key);

  if (!bucket || bucket.windowResetAt <= now) {
    attemptsByKey.set(key, {
      count: 1,
      windowResetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remainingAttempts: LOGIN_RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }

  if (bucket.count >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remainingAttempts: 0 };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remainingAttempts: LOGIN_RATE_LIMIT_MAX_ATTEMPTS - bucket.count,
  };
}

// Neteja el comptador d'una clau (es crida després d'un login correcte).
export function resetLoginRateLimit(key: string): void {
  attemptsByKey.delete(key);
}
