import { NextRequest, NextResponse } from "next/server";
import { createBulkUsersSchema } from "@/lib/validation/user-management";
import { adminCreateUsersBulk } from "@/server/services/user-management-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/admin/users/bulk — crea diversos comptes alhora a partir d'un
// prefix i una quantitat. La resposta inclou les contrasenyes en text pla
// NOMÉS aquesta vegada (per mostrar-les/descarregar-les; no es tornen a
// poder consultar).
export async function POST(request: NextRequest) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = createBulkUsersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Petició no vàlida." },
        { status: 400 },
      );
    }

    return NextResponse.json(await adminCreateUsersBulk(parsed.data));
  } catch (error) {
    return handleRouteError(error);
  }
}
