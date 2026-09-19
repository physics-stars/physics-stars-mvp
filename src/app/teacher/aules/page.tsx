import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import {
  findClassroomsByTeacher,
  toClassroomView,
} from "@/server/repositories/classroom-repository";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClassroomManager } from "@/components/teacher/ClassroomManager";

export const metadata: Metadata = {
  title: "Aules — Physics Stars",
};

export default async function TeacherClassroomsPage() {
  const user = await requireRole("TEACHER");
  const classrooms = await findClassroomsByTeacher(user.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader
        title="Les meves aules"
        description="Gestiona l'alumnat de les teves aules: mou-lo entre aules i reinicia contrasenyes quan calgui."
      />

      <ClassroomManager initialClassrooms={classrooms.map(toClassroomView)} />
    </main>
  );
}
