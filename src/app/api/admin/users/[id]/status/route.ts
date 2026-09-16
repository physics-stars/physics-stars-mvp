import { NextRequest, NextResponse } from "next/server";
import { setActiveSchema } from "@/lib/validation/user-management";
import { setUserActive } from "@/server/services/user-management-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// PATCH /api/admin/users/[id]/status — activa o desactiva un compte
// (professor o alumne; els comptes ADMIN no es poden tocar des d'aquí).
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/users/[id]/status">,
) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = setActiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Petició no vàlida." }, { status: 400 });
    }

    const { id } = await ctx.params;
    const user = await setUserActive(access.user.id, id, parsed.data.isActive);
    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
