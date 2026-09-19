import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import { getTeacherContentOverview } from "@/server/services/content-visibility-service";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContentVisibilityManager } from "@/components/teacher/ContentVisibilityManager";

export const metadata: Metadata = {
  title: "Contingut — Physics Stars",
};

export default async function TeacherContentPage() {
  const user = await requireRole("TEACHER");
  const overview = await getTeacherContentOverview(user.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader
        title="Contingut per aula"
        description="Decideix quins mons i nivells veu l'alumnat de cada aula."
      />
      <ContentVisibilityManager overview={overview} />
    </main>
  );
}
