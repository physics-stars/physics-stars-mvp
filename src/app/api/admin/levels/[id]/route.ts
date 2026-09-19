import { NextRequest, NextResponse } from "next/server";
import { levelInputSchema } from "@/lib/validation/content";
import { adminDeleteLevel, adminUpdateLevel } from "@/server/services/content-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// PATCH /api/admin/levels/[id] — edita un nivell (dades i disponibilitat).
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/levels/[id]">) {
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
    return NextResponse.json({ level: await adminUpdateLevel(id, parsed.data) });
  } catch (error) {
    return handleRouteError(error);
  }
}

// DELETE /api/admin/levels/[id] — elimina un nivell (i renumera la resta).
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/admin/levels/[id]">) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const { id } = await ctx.params;
    await adminDeleteLevel(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
