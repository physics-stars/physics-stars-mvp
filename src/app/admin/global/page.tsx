import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import { getGlobalOverview } from "@/server/services/admin-overview-service";
import { PageHeader } from "@/components/shared/PageHeader";
import { GlobalUserManager } from "@/components/admin/GlobalUserManager";

export const metadata: Metadata = {
  title: "Vista global — Physics Stars",
};

export default async function AdminGlobalPage() {
  await requireRole("ADMIN");
  const overview = await getGlobalOverview();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader
        title="Usuaris i aules"
        description="Crea comptes (un o diversos alhora), organitza el professorat, les aules i l'alumnat."
      />

      <GlobalUserManager overview={overview} />
    </main>
  );
}
