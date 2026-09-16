import { NextRequest, NextResponse } from "next/server";
import { createClassroomSchema } from "@/lib/validation/classroom";
import { teacherCreateClassroom } from "@/server/services/classroom-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/teacher/classrooms — un professor crea una aula pròpia.
export async function POST(request: NextRequest) {
  try {
    const access = await requireApiAccess(request, ["TEACHER"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = createClassroomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "El nom de l'aula no és vàlid." },
        { status: 400 },
      );
    }

    const classroom = await teacherCreateClassroom(access.user.id, parsed.data.name);
    return NextResponse.json({ classroom });
  } catch (error) {
    return handleRouteError(error);
  }
}
