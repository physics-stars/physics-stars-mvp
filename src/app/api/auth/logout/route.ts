import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config/auth";
import { logout } from "@/server/services/auth-service";
import { isTrustedOrigin } from "@/server/security/origin-check";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/auth/logout — esborra la sessió actual (a la base de dades i a la cookie).
export async function POST(request: NextRequest) {
  try {
    if (!isTrustedOrigin(request)) {
      return NextResponse.json(
        { error: "Origen de la petició no vàlid." },
        { status: 403 },
      );
    }

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      await logout(sessionToken);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
