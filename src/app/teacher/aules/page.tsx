import type { Metadata } from "next";
import { requireRole } from "@/server/services/route-guards";
import {
  findClassroomsByTeacher,
  toClassroomView,
} from "@/server/repositories/classroom-repository";
import { ClassroomManager } from "@/components/teacher/ClassroomManager";

export const metadata: Metadata = {
  title: "Aules — Physics Stars",
};

export default async function TeacherClassroomsPage() {
  const user = await requireRole("TEACHER");
  const classrooms = await findClassroomsByTeacher(user.id);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Les meves aules</h1>
        <p className="text-sm text-foreground-muted">
          Gestiona l&apos;alumnat de les teves aules: mou-lo entre aules i
          reinicia contrasenyes quan calgui.
        </p>
      </div>

      <ClassroomManager initialClassrooms={classrooms.map(toClassroomView)} />
    </main>
  );
}
