"use client";

import { FormEvent, ReactNode, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClassroomBlock } from "@/components/management/ClassroomBlock";
import { clsx } from "@/lib/utils/clsx";
import type { ClassroomView } from "@/server/repositories/classroom-repository";
import type { ManagedUserView } from "@/server/repositories/user-repository";

/*
 * Targeta d'un professor a la vista global: capçalera amb les seves dades
 * i accions, i (desplegable) les seves aules amb l'alumnat. Reflecteix la
 * jerarquia real: professor → aules → alumnes.
 */
export interface VisibleClassroom {
  classroom: ClassroomView;
  students: ManagedUserView[];
}

interface TeacherCardProps {
  teacher: ManagedUserView;
  classrooms: VisibleClassroom[];
  totalStudents: number;
  forceOpen: boolean;
  isBusy: boolean;
  selectedIds: Set<string>;
  onToggleStudent: (id: string) => void;
  onSetMany: (ids: string[], selected: boolean) => void;
  renderPersonActions: (user: ManagedUserView) => ReactNode;
  onCreateClassroom: (teacherId: string, name: string) => Promise<boolean>;
  onDeleteClassroom: (classroom: ClassroomView) => void;
}

export function TeacherCard({
  teacher,
  classrooms,
  totalStudents,
  forceOpen,
  isBusy,
  selectedIds,
  onToggleStudent,
  onSetMany,
  renderPersonActions,
  onCreateClassroom,
  onDeleteClassroom,
}: TeacherCardProps) {
  const [open, setOpen] = useState(true);
  const [newName, setNewName] = useState("");
  const isOpen = open || forceOpen;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onCreateClassroom(teacher.id, newName)) setNewName("");
  }

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated/60",
        !teacher.isActive && "opacity-80",
      )}
    >
      <div className="flex flex-wrap items-center gap-3 bg-background-elevated px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Plega ${teacher.displayName}` : `Desplega ${teacher.displayName}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChevronDown
            className={clsx("h-5 w-5 shrink-0 text-foreground-muted transition-transform", !isOpen && "-rotate-90")}
          />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wood text-sm font-bold text-parchment">
            {teacher.displayName.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="heading-display truncate text-base font-bold text-foreground">
                {teacher.displayName}
              </span>
              <Badge tone={teacher.isActive ? "success" : "danger"}>
                {teacher.isActive ? "Actiu" : "Desactivat"}
              </Badge>
            </span>
            <span className="block text-xs text-foreground-muted">
              <span className="font-mono">{teacher.username}</span> · {classrooms.length}{" "}
              {classrooms.length === 1 ? "aula" : "aules"} · {totalStudents} alumnes
            </span>
          </span>
        </button>
        <div className="flex flex-wrap items-center gap-1.5">{renderPersonActions(teacher)}</div>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-4 border-t border-border-subtle p-4">
          <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nova aula per a aquest professor…"
              aria-label={`Nom de la nova aula de ${teacher.displayName}`}
              className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary sm:max-w-xs"
            />
            <Button type="submit" variant="secondary" size="sm" fullWidth={false} disabled={isBusy || !newName.trim()}>
              <Plus className="h-4 w-4" />
              Crea aula
            </Button>
          </form>

          {classrooms.length === 0 ? (
            <EmptyState
              title="Aquest professor encara no té aules"
              description="Crea'n una amb el camp de dalt per poder-hi assignar alumnat."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {classrooms.map(({ classroom, students }) => (
                <ClassroomBlock
                  key={classroom.id}
                  classroom={classroom}
                  students={students}
                  selectedIds={selectedIds}
                  onToggleStudent={onToggleStudent}
                  onSetMany={onSetMany}
                  renderStudentActions={renderPersonActions}
                  headerActions={
                    <Button
                      type="button"
                      variant="ghostDanger"
                      size="sm"
                      fullWidth={false}
                      disabled={isBusy}
                      onClick={() => onDeleteClassroom(classroom)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Elimina
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
