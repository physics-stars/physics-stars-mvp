import { NextRequest, NextResponse } from "next/server";
import { teacherDeleteClassroom } from "@/server/services/classroom-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// DELETE /api/teacher/classrooms/[id] — elimina una aula pròpia del professor.
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/teacher/classrooms/[id]">) {
  try {
    const access = await requireApiAccess(request, ["TEACHER"]);
    if (!access.ok) return access.response;

    const { id } = await ctx.params;
    await teacherDeleteClassroom(access.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
