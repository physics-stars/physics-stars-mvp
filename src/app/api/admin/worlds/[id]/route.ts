import { NextRequest, NextResponse } from "next/server";
import { worldInputSchema } from "@/lib/validation/content";
import { adminDeleteWorld, adminUpdateWorld } from "@/server/services/content-service";
import { requireApiAccess } from "@/server/http/require-role";
import { handleRouteError } from "@/server/http/handle-route-error";

// PATCH /api/admin/worlds/[id] — edita un món (dades i disponibilitat).
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/worlds/[id]">) {
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

    const { id } = await ctx.params;
    return NextResponse.json({ world: await adminUpdateWorld(id, parsed.data) });
  } catch (error) {
    return handleRouteError(error);
  }
}

// DELETE /api/admin/worlds/[id] — elimina un món i els seus nivells.
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/admin/worlds/[id]">) {
  try {
    const access = await requireApiAccess(request, ["ADMIN"]);
    if (!access.ok) return access.response;

    const { id } = await ctx.params;
    await adminDeleteWorld(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
