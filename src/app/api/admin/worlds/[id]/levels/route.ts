import { NextRequest, NextResponse } from "next/server";
import { levelInputSchema } from "@/lib/validation/content";
import { adminCreateLevel } from "@/server/services/content-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/admin/worlds/[id]/levels — afegeix un nivell al final del món.
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/worlds/[id]/levels">,
) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = levelInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Petició no vàlida." },
        { status: 400 },
      );
    }

    const { id } = await ctx.params;
    return NextResponse.json({ level: await adminCreateLevel(id, parsed.data) });
  } catch (error) {
    return handleRouteError(error);
  }
}
