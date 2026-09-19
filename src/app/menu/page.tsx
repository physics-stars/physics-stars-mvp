import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import { listWorldsForStudent } from "@/server/services/content-visibility-service";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { WorldExplorer } from "@/components/menu/WorldExplorer";

/*
 * Menú principal de l'alumnat: mostra els "mons" (blocs temàtics de
 * física) disponibles, llegits directament de la base de dades.
 */
export const metadata: Metadata = {
  title: "Menú — Physics Stars",
};

export default async function MenuPage() {
  const user = await requireRole("STUDENT");
  const worlds = await listWorldsForStudent(user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-2xl font-bold text-foreground sm:text-3xl">
            Benvingut/da, {user.displayName}
          </h1>
          <p className="text-sm text-foreground-muted">
            Tria un món per començar a jugar i aprendre física.
          </p>
        </div>
        <div className="w-40">
          <LogoutButton />
        </div>
      </div>

      <WorldExplorer worlds={worlds} />
    </main>
  );
}
