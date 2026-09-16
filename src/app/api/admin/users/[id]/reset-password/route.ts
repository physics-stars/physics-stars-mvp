import { NextRequest, NextResponse } from "next/server";
import { resetUserPassword } from "@/server/services/user-management-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/admin/users/[id]/reset-password — genera una contrasenya
// nova per a qualsevol compte (professor o alumne) i la retorna (només
// aquesta vegada).
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/users/[id]/reset-password">,
) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const { id } = await ctx.params;
    const plainPassword = await resetUserPassword(id);
    return NextResponse.json({ plainPassword });
  } catch (error) {
    return handleRouteError(error);
  }
}
