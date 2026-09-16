import { NextRequest, NextResponse } from "next/server";
import { moveStudentsSchema } from "@/lib/validation/classroom";
import { teacherMoveStudents } from "@/server/services/classroom-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/teacher/students/move — mou alumnat entre aules del professor
// (o el treu a "sense aula" si `classroomId` és `null`).
export async function POST(request: NextRequest) {
  try {
    const access = await requireApiAccess(request, ["TEACHER"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = moveStudentsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Petició no vàlida." }, { status: 400 });
    }

    await teacherMoveStudents(access.user.id, parsed.data.studentIds, parsed.data.classroomId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
