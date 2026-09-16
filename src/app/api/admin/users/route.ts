import { NextRequest, NextResponse } from "next/server";
import { createManagedUserSchema } from "@/lib/validation/user-management";
import { adminCreateUser } from "@/server/services/user-management-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/admin/users — crea un compte de professor o alumne, amb
// usuari i contrasenya generats automàticament (es retorna la
// contrasenya en text pla NOMÉS en aquesta resposta, per mostrar-la un
// cop a la pantalla; no es torna a poder consultar).
export async function POST(request: NextRequest) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = createManagedUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Petició no vàlida." }, { status: 400 });
    }

    const created = await adminCreateUser(parsed.data);
    return NextResponse.json(created);
  } catch (error) {
    return handleRouteError(error);
  }
}
