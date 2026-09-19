"use client";

import { FormEvent, useState } from "react";
import { GraduationCap, KeyRound, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { ClassroomBlock } from "@/components/management/ClassroomBlock";
import { CredentialsPanel } from "@/components/management/CredentialsPanel";
import { SelectionBar } from "@/components/management/SelectionBar";
import { useManagementAction } from "@/components/management/use-management-action";
import { useStudentSelection } from "@/components/shared/use-student-selection";
import type { CredentialRow } from "@/lib/utils/credentials-file";
import { deleteJson, postJson } from "@/lib/utils/api-client";
import type { ClassroomView } from "@/server/repositories/classroom-repository";
import type { ManagedUserView } from "@/server/repositories/user-repository";

/*
 * Gestor d'aules del professorat: crear/eliminar aules, moure alumnat
 * entre elles i reiniciar contrasenyes (que es mostren una sola vegada,
 * amb opció de descarregar-les). Mateix llenguatge visual que la vista
 * global d'administració, però limitat a les aules del propi professor.
 */
interface ClassroomManagerProps {
  initialClassrooms: ClassroomView[];
}

interface Credentials {
  title: string;
  rows: CredentialRow[];
  fileLabel: string;
}

export function ClassroomManager({ initialClassrooms }: ClassroomManagerProps) {
  const { isBusy, notice, dismissNotice, run } = useManagementAction();
  const { selectedIds, toggle, setMany, clear } = useStudentSelection();

  const [newName, setNewName] = useState("");
  const [moveTarget, setMoveTarget] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [toDelete, setToDelete] = useState<ClassroomView | null>(null);

  const totalStudents = initialClassrooms.reduce((sum, c) => sum + c.students.length, 0);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    const ok = await run(() => postJson("/api/teacher/classrooms", { name }), {
      successMessage: `Aula «${name}» creada.`,
    });
    if (ok) setNewName("");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const classroom = toDelete;
    setToDelete(null);
    await run(() => deleteJson(`/api/teacher/classrooms/${classroom.id}`), {
      successMessage: `Aula «${classroom.name}» eliminada.`,
    });
  }

  async function moveSelected() {
    const count = selectedIds.size;
    const ok = await run(
      () =>
        postJson("/api/teacher/students/move", {
          studentIds: Array.from(selectedIds),
          classroomId: moveTarget === "" ? null : moveTarget,
        }),
      { successMessage: `${count} ${count === 1 ? "alumne mogut" : "alumnes moguts"}.` },
    );
    if (ok) {
      clear();
      setMoveTarget("");
    }
  }

  function resetPassword(student: ManagedUserView) {
    void run(
      () => postJson<{ plainPassword: string }>(`/api/teacher/students/${student.id}/reset-password`),
      {
        refresh: false,
        onSuccess: (data) =>
          setCredentials({
            title: "Contrasenya reiniciada",
            rows: [{ displayName: student.displayName, username: student.username, password: data.plainPassword }],
            fileLabel: student.username,
          }),
      },
    );
  }

  function renderStudentActions(student: ManagedUserView) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth={false}
        disabled={isBusy}
        onClick={() => resetPassword(student)}
        title="Genera una contrasenya nova"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Contrasenya
      </Button>
    );
  }

  const moveOptions = initialClassrooms.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<GraduationCap className="h-5 w-5" />} value={initialClassrooms.length} label="Aules" />
        <StatCard icon={<Users className="h-5 w-5" />} value={totalStudents} label="Alumnat" />
      </div>

      {notice && <Notice notice={notice} onDismiss={dismissNotice} />}

      {credentials && (
        <CredentialsPanel
          title={credentials.title}
          rows={credentials.rows}
          classroomName={null}
          fileLabel={credentials.fileLabel}
          onClose={() => setCredentials(null)}
        />
      )}

      <SectionCard
        title="Les meves aules"
        description="Selecciona alumnes per moure'ls d'una aula a una altra."
        icon={<GraduationCap className="h-5 w-5" />}
        actions={
          <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nova aula (p. ex. 1r ESO A)"
              aria-label="Nom de la nova aula"
              required
              className="w-56 max-w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <Button type="submit" size="sm" fullWidth={false} disabled={isBusy || !newName.trim()}>
              <Plus className="h-4 w-4" />
              Crea aula
            </Button>
          </form>
        }
      >
        {initialClassrooms.length === 0 ? (
          <EmptyState
            title="Encara no tens cap aula"
            description="Crea la primera amb el camp de dalt. Després l'administració hi podrà assignar alumnat."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {initialClassrooms.map((classroom) => (
              <ClassroomBlock
                key={classroom.id}
                classroom={classroom}
                students={classroom.students}
                selectedIds={selectedIds}
                onToggleStudent={toggle}
                onSetMany={setMany}
                renderStudentActions={renderStudentActions}
                headerActions={
                  <Button
                    type="button"
                    variant="ghostDanger"
                    size="sm"
                    fullWidth={false}
                    disabled={isBusy}
                    onClick={() => setToDelete(classroom)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Elimina
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      {selectedIds.size > 0 && <div className="h-16" />}

      <SelectionBar
        count={selectedIds.size}
        options={moveOptions}
        target={moveTarget}
        onTargetChange={setMoveTarget}
        onMove={moveSelected}
        onClear={clear}
        isBusy={isBusy}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title={`Eliminar l'aula «${toDelete?.name ?? ""}»?`}
        description={
          toDelete && toDelete.students.length > 0
            ? `Els ${toDelete.students.length} alumnes quedaran «sense aula». Els comptes no s'esborren.`
            : "L'aula està buida. Aquesta acció no es pot desfer."
        }
        confirmLabel="Elimina l'aula"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
