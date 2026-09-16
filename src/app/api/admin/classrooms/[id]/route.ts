import { NextRequest, NextResponse } from "next/server";
import { adminDeleteClassroom } from "@/server/services/classroom-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// DELETE /api/admin/classrooms/[id] — elimina qualsevol aula.
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/admin/classrooms/[id]">) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const { id } = await ctx.params;
    await adminDeleteClassroom(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
