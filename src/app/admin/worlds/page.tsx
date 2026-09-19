import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import { adminListContent } from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorldsManager } from "@/components/admin/WorldsManager";

export const metadata: Metadata = {
  title: "Mons i nivells — Physics Stars",
};

export default async function AdminWorldsPage() {
  await requireRole("ADMIN");
  const worlds = await adminListContent();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader
        title="Mons i nivells"
        description="Crea, edita i ordena els mons i els nivells del joc, i decideix quins estan disponibles."
      />
      <WorldsManager worlds={worlds} />
    </main>
  );
}
