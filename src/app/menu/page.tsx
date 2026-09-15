import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/server/services/current-user";
import { LogoutButton } from "@/components/auth/LogoutButton";

/*
 * Pàgina de menú (àrea protegida). Encara és un esquelet mínim: el seu
 * propòsit ara mateix és demostrar el circuit complet d'autenticació
 * (login -> sessió vàlida -> accés) i servir de punt de partida per a
 * les futures seccions (partides, capítols de la història, etc.).
 */
export const metadata: Metadata = {
  title: "Menú — Physics Stars",
};

export default async function MenuPage() {
  const user = await getCurrentUser();

  // Comprovació real d'autenticació (a diferència del middleware, aquí
  // sí que es valida la sessió contra la base de dades).
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        Benvingut/da, {user.displayName}
      </h1>
      <p className="max-w-md text-foreground-muted">
        Aquest és el menú principal del joc. Aviat hi trobaràs les teves
        partides, el progrés de la història i els reptes disponibles.
      </p>
      <div className="w-full max-w-xs">
        <LogoutButton />
      </div>
    </main>
  );
}
