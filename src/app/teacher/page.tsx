import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import { OptionCard } from "@/components/shared/OptionCard";

export const metadata: Metadata = {
  title: "Professorat — Physics Stars",
};

export default async function TeacherHomePage() {
  const user = await requireRole("TEACHER");

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Hola, {user.displayName}
        </h1>
        <p className="max-w-md text-foreground-muted">
          Des d&apos;aquí pots gestionar les teves aules i el seu alumnat.
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <OptionCard
          title="Aules"
          description="Consulta l'alumnat de cada aula, mou-lo entre aules i reinicia contrasenyes."
          href="/teacher/aules"
        />
        <OptionCard
          title="Progrés de l'alumnat"
          description="Segueix com avança cada alumne pels mons del joc."
        />
        <OptionCard
          title="Assignació de reptes"
          description="Tria quins reptes ha de completar cada aula."
        />
      </div>
    </main>
  );
}
