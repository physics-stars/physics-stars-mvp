"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordRevealBanner } from "@/components/shared/PasswordRevealBanner";
import { useStudentSelection } from "@/components/shared/use-student-selection";
import { deleteJson, postJson } from "@/lib/utils/api-client";
import type { ClassroomView } from "@/server/repositories/classroom-repository";

/*
 * Gestor d'aules del professorat (component de client): crear/eliminar
 * aules pròpies, moure alumnat entre elles (selecció múltiple) i
 * reiniciar contrasenyes. Cada acció crida la ruta API corresponent i
 * refresca les dades del servidor amb `router.refresh()` en lloc de
 * mantenir un estat local complex sincronitzat a mà.
 */
interface ClassroomManagerProps {
  initialClassrooms: ClassroomView[];
}

export function ClassroomManager({ initialClassrooms }: ClassroomManagerProps) {
  const router = useRouter();
  const { selectedIds, toggle, clear } = useStudentSelection();

  const [newClassroomName, setNewClassroomName] = useState("");
  const [moveTargetId, setMoveTargetId] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<{
    username: string;
    plainPassword: string;
  } | null>(null);

  const classrooms = initialClassrooms;

  async function handleCreateClassroom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsBusy(true);

    const result = await postJson("/api/teacher/classrooms", { name: newClassroomName });
    setIsBusy(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setNewClassroomName("");
    router.refresh();
  }

  async function handleDeleteClassroom(classroomId: string) {
    setErrorMessage(null);
    setIsBusy(true);

    const result = await deleteJson(`/api/teacher/classrooms/${classroomId}`);
    setIsBusy(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    router.refresh();
  }

  async function handleMoveSelected() {
    setErrorMessage(null);
    setIsBusy(true);

    const result = await postJson("/api/teacher/students/move", {
      studentIds: Array.from(selectedIds),
      classroomId: moveTargetId === "" ? null : moveTargetId,
    });
    setIsBusy(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    clear();
    setMoveTargetId("");
    router.refresh();
  }

  async function handleResetPassword(studentId: string, username: string) {
    setErrorMessage(null);
    setIsBusy(true);

    const result = await postJson<{ plainPassword: string }>(
      `/api/teacher/students/${studentId}/reset-password`,
    );
    setIsBusy(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setRevealedPassword({ username, plainPassword: result.data.plainPassword });
  }

  return (
    <div className="flex flex-col gap-6">
      {errorMessage && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {revealedPassword && (
        <PasswordRevealBanner
          username={revealedPassword.username}
          plainPassword={revealedPassword.plainPassword}
          onClose={() => setRevealedPassword(null)}
        />
      )}

      <form onSubmit={handleCreateClassroom} className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Input
            id="new-classroom-name"
            label="Nova aula"
            placeholder="p. ex. 1r ESO A"
            value={newClassroomName}
            onChange={(event) => setNewClassroomName(event.target.value)}
            required
          />
        </div>
        <Button type="submit" fullWidth={false} isLoading={isBusy}>
          + Crea aula
        </Button>
      </form>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-primary bg-background-elevated p-4">
          <span className="text-sm text-foreground">
            {selectedIds.size} alumne(s) seleccionat(s)
          </span>
          <select
            value={moveTargetId}
            onChange={(event) => setMoveTargetId(event.target.value)}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Sense aula</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
          <Button type="button" fullWidth={false} isLoading={isBusy} onClick={handleMoveSelected}>
            Mou
          </Button>
          <Button type="button" variant="ghost" fullWidth={false} onClick={clear}>
            Cancel·la selecció
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {classrooms.map((classroom) => (
          <section key={classroom.id} className="panel-glass flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="heading-display text-lg font-bold text-foreground">
                {classroom.name}{" "}
                <span className="text-sm font-normal text-foreground-muted">
                  ({classroom.students.length})
                </span>
              </h2>
              <Button
                type="button"
                variant="ghost"
                fullWidth={false}
                className="text-danger"
                onClick={() => handleDeleteClassroom(classroom.id)}
                disabled={isBusy}
              >
                Elimina aula
              </Button>
            </div>

            {classroom.students.length === 0 ? (
              <p className="text-sm text-foreground-muted">Cap alumne en aquesta aula.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {classroom.students.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggle(student.id)}
                      />
                      <span>
                        {student.displayName}{" "}
                        <span className="text-foreground-muted">({student.username})</span>
                      </span>
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth={false}
                      className="text-xs"
                      onClick={() => handleResetPassword(student.id, student.username)}
                      disabled={isBusy}
                    >
                      Reinicia contrasenya
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
