import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import { getGlobalOverview } from "@/server/services/admin-overview-service";
import { GlobalUserManager } from "@/components/admin/GlobalUserManager";

export const metadata: Metadata = {
  title: "Vista global — Physics Stars",
};

export default async function AdminGlobalPage() {
  await requireRole("ADMIN");
  const overview = await getGlobalOverview();

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="heading-display text-2xl font-bold text-foreground">Vista global</h1>
        <p className="text-sm text-foreground-muted">
          Professorat, alumnat i aules de tot el centre.
        </p>
      </div>

      <GlobalUserManager overview={overview} />
    </main>
  );
}
