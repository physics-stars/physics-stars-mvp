import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config/auth";
import { isProduction } from "@/lib/config/env";
import { login } from "@/server/services/auth-service";
import { getClientIp } from "@/server/security/client-ip";
import { isTrustedOrigin } from "@/server/security/origin-check";
import { handleRouteError } from "@/server/http/handle-route-error";

/*
 * POST /api/auth/login
 *
 * Rep un nom d'usuari i contrasenya, delega la validació i comprovació
 * de credencials al servei d'autenticació i, si tot és correcte, deixa
 * el token de sessió en una cookie httpOnly.
 *
 * Els missatges d'error que es retornen al client són intencionadament
 * genèrics (mai diuen "aquest usuari no existeix" o similar) per no
 * facilitar l'enumeració de comptes vàlids.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isTrustedOrigin(request)) {
      return NextResponse.json(
        { error: "Origen de la petició no vàlid." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "La petició no té un format vàlid." },
        { status: 400 },
      );
    }

    const result = await login(body, { ipAddress: getClientIp(request) });

    if (!result.success) {
      const errorsByReason: Record<
        typeof result.reason,
        { status: number; message: string }
      > = {
        validation_error: {
          status: 400,
          message: "Comprova el nom d'usuari i la contrasenya introduïts.",
        },
        invalid_credentials: {
          status: 401,
          message: "Nom d'usuari o contrasenya incorrectes.",
        },
        rate_limited: {
          status: 429,
          message: "Massa intents. Torna-ho a provar d'aquí a uns minuts.",
        },
      };
      const { status, message } = errorsByReason[result.reason];
      return NextResponse.json({ error: message }, { status });
    }

    const response = NextResponse.json({ user: result.user });
    response.cookies.set(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      expires: result.sessionExpiresAt,
    });
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
