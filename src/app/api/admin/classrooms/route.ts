import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClassroomSchema } from "@/lib/validation/classroom";
import { adminCreateClassroom } from "@/server/services/classroom-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

const bodySchema = createClassroomSchema.extend({
  teacherId: z.string().min(1),
});

// POST /api/admin/classrooms — l'admin crea una aula per a un professor.
export async function POST(request: NextRequest) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Petició no vàlida." }, { status: 400 });
    }

    const classroom = await adminCreateClassroom(parsed.data.teacherId, parsed.data.name);
    return NextResponse.json({ classroom });
  } catch (error) {
    return handleRouteError(error);
  }
}
