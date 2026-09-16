import { NextRequest, NextResponse } from "next/server";
import { moveStudentsSchema } from "@/lib/validation/classroom";
import { adminMoveStudents } from "@/server/services/classroom-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/admin/students/move — mou qualsevol alumnat entre qualsevol
// aula (o el treu a "sense aula" si `classroomId` és `null`).
export async function POST(request: NextRequest) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = moveStudentsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Petició no vàlida." }, { status: 400 });
    }

    await adminMoveStudents(parsed.data.studentIds, parsed.data.classroomId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
