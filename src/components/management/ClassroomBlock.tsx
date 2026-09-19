import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PersonRow } from "@/components/management/PersonRow";
import type { ClassroomView } from "@/server/repositories/classroom-repository";
import type { ManagedUserView } from "@/server/repositories/user-repository";

/*
 * Bloc d'una aula: capçalera (nom, nombre d'alumnes, "selecciona tot" i
 * accions com eliminar-la) i la llista d'alumnat. El fan servir tant el
 * panell de professorat com el d'administració, amb les accions per
 * alumne que cada un necessiti.
 */
interface ClassroomBlockProps {
  classroom: ClassroomView;
  // Alumnat a mostrar (pot ser un subconjunt si hi ha un filtre de cerca).
  students: ManagedUserView[];
  selectedIds: Set<string>;
  onToggleStudent: (id: string) => void;
  onSetMany: (ids: string[], selected: boolean) => void;
  renderStudentActions: (student: ManagedUserView) => ReactNode;
  headerActions?: ReactNode;
}

export function ClassroomBlock({
  classroom,
  students,
  selectedIds,
  onToggleStudent,
  onSetMany,
  renderStudentActions,
  headerActions,
}: ClassroomBlockProps) {
  const ids = students.map((student) => student.id);
  const selectedCount = ids.filter((id) => selectedIds.has(id)).length;
  const allSelected = ids.length > 0 && selectedCount === ids.length;

  return (
    <div className="rounded-xl border border-border-subtle bg-background-elevated/70">
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3">
        <h4 className="font-semibold text-foreground">{classroom.name}</h4>
        <Badge>
          <Users className="h-3 w-3" />
          {classroom.students.length}
        </Badge>
        {ids.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onSetMany(ids, !allSelected)}
              className="h-3.5 w-3.5 accent-[var(--wood)]"
            />
            Selecciona tot
          </label>
        )}
        {headerActions && <div className="ml-auto flex items-center gap-1.5">{headerActions}</div>}
      </div>

      <div className="p-3">
        {students.length === 0 ? (
          <EmptyState
            title="Cap alumne en aquesta aula"
            description="Mou-hi alumnat des d'altres aules o crea'n de nou."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {students.map((student) => (
              <PersonRow
                key={student.id}
                user={student}
                selectable
                selected={selectedIds.has(student.id)}
                onToggleSelect={() => onToggleStudent(student.id)}
                actions={renderStudentActions(student)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
