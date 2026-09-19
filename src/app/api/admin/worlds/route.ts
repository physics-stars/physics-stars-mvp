import { NextRequest, NextResponse } from "next/server";
import { worldInputSchema } from "@/lib/validation/content";
import { adminCreateWorld } from "@/server/services/content-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/admin/worlds — crea un món nou (al final de la llista).
export async function POST(request: NextRequest) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = worldInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Petició no vàlida." },
        { status: 400 },
      );
    }

    return NextResponse.json({ world: await adminCreateWorld(parsed.data) });
  } catch (error) {
    return handleRouteError(error);
  }
}
