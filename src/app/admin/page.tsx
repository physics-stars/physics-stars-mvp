import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import { OptionCard } from "@/components/shared/OptionCard";

export const metadata: Metadata = {
  title: "Administració — Physics Stars",
};

export default async function AdminHomePage() {
  const user = await requireRole("ADMIN");

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="heading-display text-3xl font-bold text-foreground">
          Hola, {user.displayName}
        </h1>
        <p className="max-w-md text-foreground-muted">
          Des d&apos;aquí pots gestionar tot el professorat, l&apos;alumnat i les aules.
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <OptionCard
          title="Vista global"
          description="Usuaris i aules de tot el centre: crea comptes, gestiona aules i mou alumnat."
          href="/admin/global"
        />
      </div>
    </main>
  );
}
