import {
  SESSION_DURATION_MS,
  SESSION_RENEWAL_THRESHOLD_MS,
} from "@/lib/config/auth";
import { loginSchema } from "@/lib/validation/auth";
import { getDummyHash, hashPassword, verifyPassword } from "@/server/security/password";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/server/security/rate-limit";
import { generateSessionToken, hashSessionToken } from "@/server/security/session-tokens";
import {
  createSession,
  deleteSession,
  findSessionWithUser,
  updateSessionExpiry,
} from "@/server/repositories/session-repository";
import {
  createUser,
  findUserByUsername,
  toPublicUser,
  type PublicUser,
} from "@/server/repositories/user-repository";

/*
 * Servei d'autenticació: aquí viu tota la lògica de negoci del login,
 * logout i validació de sessió. Les rutes d'API (`app/api/auth/...`)
 * només s'ocupen de parlar HTTP (llegir el body, posar cookies...) i
 * deleguen tota la resta a aquestes funcions, que no saben res de
 * `Request`/`Response`. Això permet, per exemple, reutilitzar la mateixa
 * lògica des d'un futur endpoint per al joc de Unity sense duplicar-la.
 */

export type LoginFailureReason =
  | "validation_error"
  | "invalid_credentials"
  | "rate_limited";

export type LoginResult =
  | {
      success: true;
      sessionToken: string;
      sessionExpiresAt: Date;
      user: PublicUser;
    }
  | { success: false; reason: LoginFailureReason };

interface LoginContext {
  // Adreça IP de qui fa la petició, usada com a part de la clau del rate limit.
  ipAddress: string;
}

// Intenta iniciar sessió amb un nom d'usuari i contrasenya.
export async function login(
  rawInput: unknown,
  context: LoginContext,
): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, reason: "validation_error" };
  }
  const { username, password } = parsed.data;

  // Clau de rate limit combinant IP + usuari: limita tant els atacs de
  // força bruta contra un sol compte com els fets des d'una mateixa IP.
  const rateLimitKey = `${context.ipAddress}:${username.toLowerCase()}`;
  const rateLimit = checkLoginRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return { success: false, reason: "rate_limited" };
  }

  const user = await findUserByUsername(username);

  // Si l'usuari no existeix, igualment verifiquem contra un hash fictici
  // perquè el temps de resposta sigui semblant en tots dos casos i no
  // es pugui deduir l'existència d'un compte mesurant la latència.
  const passwordIsValid = await verifyPassword(
    user?.passwordHash ?? (await getDummyHash()),
    password,
  );

  if (!user || !passwordIsValid) {
    return { success: false, reason: "invalid_credentials" };
  }

  resetLoginRateLimit(rateLimitKey);

  const sessionToken = generateSessionToken();
  const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await createSession({
    tokenHash: hashSessionToken(sessionToken),
    userId: user.id,
    expiresAt: sessionExpiresAt,
  });

  return {
    success: true,
    sessionToken,
    sessionExpiresAt,
    user: toPublicUser(user),
  };
}

// Tanca la sessió associada a un token (esborra el registre de la base de dades).
export async function logout(sessionToken: string): Promise<void> {
  await deleteSession(hashSessionToken(sessionToken));
}

export interface ValidatedSession {
  user: PublicUser;
  expiresAt: Date;
}

// Valida un token de sessió (procedent de la cookie) i, si és vàlid,
// retorna l'usuari corresponent. Si la sessió està a punt de caducar,
// se li allarga la vida automàticament (sessió "lliscant").
export async function validateSessionToken(
  sessionToken: string,
): Promise<ValidatedSession | null> {
  const tokenHash = hashSessionToken(sessionToken);
  const session = await findSessionWithUser(tokenHash);

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await deleteSession(tokenHash);
    return null;
  }

  let expiresAt = session.expiresAt;
  const timeUntilExpiry = expiresAt.getTime() - Date.now();
  if (timeUntilExpiry < SESSION_RENEWAL_THRESHOLD_MS) {
    expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await updateSessionExpiry(tokenHash, expiresAt);
  }

  return { user: toPublicUser(session.user), expiresAt };
}

// Registra un nou usuari. De moment no hi ha una pantalla de registre
// pública: aquesta funció es farà servir des d'un script de seed o, en
// el futur, des d'un panell d'administració per al professorat.
export async function registerUser(input: {
  username: string;
  password: string;
  displayName: string;
}): Promise<PublicUser> {
  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    username: input.username,
    passwordHash,
    displayName: input.displayName,
  });
  return toPublicUser(user);
}
