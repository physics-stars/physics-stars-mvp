import {
  findAllClassroomsWithDetails,
  toClassroomView,
  type ClassroomView,
} from "@/server/repositories/classroom-repository";
import {
  findUnassignedStudents,
  findUsersByRole,
  toManagedUserView,
  type ManagedUserView,
} from "@/server/repositories/user-repository";

/*
 * Model de lectura per a la vista global d'administració: agrupa
 * professorat amb les seves aules, alumnat sense aula i administradors,
 * a més d'una llista plana de totes les aules (per al desplegable "mou
 * a..." de qualsevol alumne, independentment del professor).
 *
 * És una funció de "lectura agregada", no una regla de negoci: viu al
 * servei perquè combina diversos repositoris, però no valida ni muta res.
 */

export interface TeacherOverview {
  teacher: ManagedUserView;
  classrooms: ClassroomView[];
}

export interface ClassroomOption {
  id: string;
  name: string;
  teacherName: string;
}

export interface GlobalOverview {
  teachers: TeacherOverview[];
  unassignedStudents: ManagedUserView[];
  admins: ManagedUserView[];
  allClassroomOptions: ClassroomOption[];
}

export async function getGlobalOverview(): Promise<GlobalOverview> {
  const [teachers, classrooms, unassignedStudents, admins] = await Promise.all([
    findUsersByRole("TEACHER"),
    findAllClassroomsWithDetails(),
    findUnassignedStudents(),
    findUsersByRole("ADMIN"),
  ]);

  const classroomsByTeacherId = new Map<string, ClassroomView[]>();
  for (const classroom of classrooms) {
    const list = classroomsByTeacherId.get(classroom.teacherId) ?? [];
    list.push(toClassroomView(classroom));
    classroomsByTeacherId.set(classroom.teacherId, list);
  }

  return {
    teachers: teachers.map((teacher) => ({
      teacher: toManagedUserView(teacher),
      classrooms: classroomsByTeacherId.get(teacher.id) ?? [],
    })),
    unassignedStudents: unassignedStudents.map(toManagedUserView),
    admins: admins.map(toManagedUserView),
    allClassroomOptions: classrooms.map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      teacherName: classroom.teacher.displayName,
    })),
  };
}
