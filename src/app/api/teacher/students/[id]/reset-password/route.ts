import { NextRequest, NextResponse } from "next/server";
import { teacherResetStudentPassword } from "@/server/services/user-management-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/teacher/students/[id]/reset-password — genera una contrasenya
// nova per a un alumne d'una de les aules del professor i la retorna
// (només aquesta vegada: no es torna a poder consultar).
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/teacher/students/[id]/reset-password">,
) {
  try {
    const access = await requireApiAccess(request, ["TEACHER"]);
    if (!access.ok) return access.response;

    const { id } = await ctx.params;
    const plainPassword = await teacherResetStudentPassword(access.user.id, id);
    return NextResponse.json({ plainPassword });
  } catch (error) {
    return handleRouteError(error);
  }
}
