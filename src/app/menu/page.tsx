import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { WORLDS } from "@/lib/config/worlds";

/*
 * Menú principal de l'alumnat: mostra els "mons" (blocs temàtics de
 * física) disponibles. Encara no hi ha progrés ni desbloqueig — és el
 * punt de partida sobre el qual s'anirà construint el joc.
 */
export const metadata: Metadata = {
  title: "Menú — Physics Stars",
};

export default async function MenuPage() {
  const user = await requireRole("STUDENT");

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Benvingut/da, {user.displayName}
        </h1>
        <p className="max-w-md text-foreground-muted">
          Tria un món per començar a jugar i aprendre física.
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WORLDS.map((world) => (
          <div
            key={world.slug}
            className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-background-elevated p-5"
          >
            <h2 className="text-lg font-semibold text-brand-accent">{world.name}</h2>
            <p className="text-sm text-foreground-muted">{world.description}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-xs">
        <LogoutButton />
      </div>
    </main>
  );
}
