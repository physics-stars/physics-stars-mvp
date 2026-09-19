import { NextRequest, NextResponse } from "next/server";
import { moveDirectionSchema } from "@/lib/validation/content";
import { adminMoveLevel } from "@/server/services/content-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// POST /api/admin/levels/[id]/move — puja o baixa un nivell una posició.
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/levels/[id]/move">) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = moveDirectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Petició no vàlida." }, { status: 400 });
    }

    const { id } = await ctx.params;
    await adminMoveLevel(id, parsed.data.direction);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
