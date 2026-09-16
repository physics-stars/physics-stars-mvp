/*
 * Constants de configuració del sistema d'autenticació.
 * Centralitzar-les aquí evita "magic numbers/strings" escampats
 * pel codi i facilita ajustar-les en un sol lloc.
 */

// Nom de la cookie on es guarda el token de sessió (opac, no és un JWT).
export const SESSION_COOKIE_NAME = "physics_stars_session";

// Durada de la sessió: 14 dies des de l'últim login.
export const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

// Si a una sessió li queda menys d'aquest marge per caducar, es renova
// automàticament en validar-la (sessió "lliscant" / sliding expiration).
export const SESSION_RENEWAL_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

// Finestra i límit d'intents de login per parella IP+usuari, per mitigar
// atacs de força bruta. Vegeu server/security/rate-limit.ts per als detalls
// i les limitacions d'aquesta implementació en memòria.
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;
