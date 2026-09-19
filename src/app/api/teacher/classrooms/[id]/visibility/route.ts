import { NextRequest, NextResponse } from "next/server";
import { setVisibilitySchema } from "@/lib/validation/content";
import { teacherSetVisibility } from "@/server/services/content-visibility-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// PATCH /api/teacher/classrooms/[id]/visibility — el professor amaga o
// mostra un món/nivell a l'alumnat d'una de les seves aules.
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/teacher/classrooms/[id]/visibility">,
) {
  try {
    const access = await requireApiAccess(request, ["TEACHER"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = setVisibilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Petició no vàlida." }, { status: 400 });
    }

    const { id } = await ctx.params;
    await teacherSetVisibility(access.user.id, id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
