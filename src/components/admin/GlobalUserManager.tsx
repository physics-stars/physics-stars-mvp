"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordRevealBanner } from "@/components/shared/PasswordRevealBanner";
import { useStudentSelection } from "@/components/shared/use-student-selection";
import { deleteJson, patchJson, postJson } from "@/lib/utils/api-client";
import type { GlobalOverview } from "@/server/services/admin-overview-service";
import type { ManagedUserView } from "@/server/repositories/user-repository";

/*
 * Gestor global d'usuaris i aules per a l'administració (component de
 * client): crear comptes de professorat/alumnat, (des)activar-los,
 * reiniciar contrasenyes, i crear/eliminar aules i moure alumnat entre
 * qualsevol professor. Mateix patró que `ClassroomManager` (accions via
 * API + `router.refresh()`), sense la restricció de "només les meves
 * aules" que sí té el professorat.
 */
interface GlobalUserManagerProps {
  overview: GlobalOverview;
}

// Fila reutilitzada per mostrar una persona (alumne o professor) amb
// les seves accions: casella de selecció opcional, estat actiu/inactiu,
// reiniciar contrasenya i activar/desactivar.
function UserActionRow({
  user,
  selectable,
  isSelected,
  onToggleSelect,
  onResetPassword,
  onToggleActive,
  disabled,
}: {
  user: ManagedUserView;
  selectable: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onResetPassword: () => void;
  onToggleActive: () => void;
  disabled: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
      <label className="flex items-center gap-2 text-sm">
        {selectable && (
          <input type="checkbox" checked={isSelected} onChange={onToggleSelect} />
        )}
        <span>
          {user.displayName} <span className="text-foreground-muted">({user.username})</span>
        </span>
        {!user.isActive && (
          <span className="rounded-full bg-danger/20 px-2 py-0.5 text-xs text-danger">
            Desactivat
          </span>
        )}
      </label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="w-auto text-xs"
          onClick={onResetPassword}
          disabled={disabled}
        >
          Reinicia contrasenya
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-auto text-xs"
          onClick={onToggleActive}
          disabled={disabled}
        >
          {user.isActive ? "Desactiva" : "Activa"}
        </Button>
      </div>
    </li>
  );
}

export function GlobalUserManager({ overview }: GlobalUserManagerProps) {
  const router = useRouter();
  const { selectedIds, toggle, clear } = useStudentSelection();

  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<{
    username: string;
    plainPassword: string;
  } | null>(null);

  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [newUserClassroomId, setNewUserClassroomId] = useState("");

  const [moveTargetId, setMoveTargetId] = useState("");

  const [newClassroomNameByTeacher, setNewClassroomNameByTeacher] = useState<
    Record<string, string>
  >({});

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsBusy(true);

    const result = await postJson<{
      user: { username: string };
      plainPassword: string;
    }>("/api/admin/users", {
      displayName: newUserName,
      role: newUserRole,
      classroomId: newUserRole === "STUDENT" && newUserClassroomId ? newUserClassroomId : null,
    });
    setIsBusy(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setRevealedPassword({
      username: result.data.user.username,
      plainPassword: result.data.plainPassword,
    });
    setNewUserName("");
    setNewUserClassroomId("");
    router.refresh();
  }

  async function handleMoveSelected() {
    setErrorMessage(null);
    setIsBusy(true);

    const result = await postJson("/api/admin/students/move", {
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

  async function handleResetPassword(userId: string, username: string) {
    setErrorMessage(null);
    setIsBusy(true);

    const result = await postJson<{ plainPassword: string }>(
      `/api/admin/users/${userId}/reset-password`,
    );
    setIsBusy(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setRevealedPassword({ username, plainPassword: result.data.plainPassword });
  }

  async function handleToggleActive(userId: string, currentlyActive: boolean) {
    setErrorMessage(null);
    setIsBusy(true);

    const result = await patchJson(`/api/admin/users/${userId}/status`, {
      isActive: !currentlyActive,
    });
    setIsBusy(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    router.refresh();
  }

  async function handleCreateClassroomForTeacher(teacherId: string) {
    const name = newClassroomNameByTeacher[teacherId]?.trim();
    if (!name) return;

    setErrorMessage(null);
    setIsBusy(true);

    const result = await postJson("/api/admin/classrooms", { teacherId, name });
    setIsBusy(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setNewClassroomNameByTeacher((prev) => ({ ...prev, [teacherId]: "" }));
    router.refresh();
  }

  async function handleDeleteClassroom(classroomId: string) {
    setErrorMessage(null);
    setIsBusy(true);

    const result = await deleteJson(`/api/admin/classrooms/${classroomId}`);
    setIsBusy(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
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

      {/* Crear compte nou */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background-elevated p-5">
        <h2 className="text-lg font-semibold">+ Nou usuari</h2>
        <form onSubmit={handleCreateUser} className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Input
              id="new-user-name"
              label="Nom i cognoms"
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-user-role" className="text-sm font-medium text-foreground-muted">
              Rol
            </label>
            <select
              id="new-user-role"
              value={newUserRole}
              onChange={(event) => setNewUserRole(event.target.value as "STUDENT" | "TEACHER")}
              className="rounded-lg border border-border-subtle bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="STUDENT">Alumne</option>
              <option value="TEACHER">Professor/a</option>
            </select>
          </div>
          {newUserRole === "STUDENT" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="new-user-classroom"
                className="text-sm font-medium text-foreground-muted"
              >
                Aula (opcional)
              </label>
              <select
                id="new-user-classroom"
                value={newUserClassroomId}
                onChange={(event) => setNewUserClassroomId(event.target.value)}
                className="rounded-lg border border-border-subtle bg-background px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">Sense aula</option>
                {overview.allClassroomOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} (Prof. {option.teacherName})
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button type="submit" className="w-auto" isLoading={isBusy}>
            Crea compte
          </Button>
        </form>
      </section>

      {/* Barra de moviment d'alumnat seleccionat */}
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
            {overview.allClassroomOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} (Prof. {option.teacherName})
              </option>
            ))}
          </select>
          <Button type="button" className="w-auto" isLoading={isBusy} onClick={handleMoveSelected}>
            Mou
          </Button>
          <Button type="button" variant="ghost" className="w-auto" onClick={clear}>
            Cancel·la selecció
          </Button>
        </div>
      )}

      {/* Professorat i les seves aules */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Professorat</h2>
        {overview.teachers.length === 0 && (
          <p className="text-sm text-foreground-muted">Encara no hi ha cap professor.</p>
        )}
        {overview.teachers.map(({ teacher, classrooms }) => (
          <div
            key={teacher.id}
            className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background-elevated p-5"
          >
            <ul>
              <UserActionRow
                user={teacher}
                selectable={false}
                onResetPassword={() => handleResetPassword(teacher.id, teacher.username)}
                onToggleActive={() => handleToggleActive(teacher.id, teacher.isActive)}
                disabled={isBusy}
              />
            </ul>

            <div className="flex flex-wrap items-end gap-3 pl-3">
              <div className="w-48">
                <Input
                  id={`new-classroom-${teacher.id}`}
                  label="Nova aula per a aquest professor"
                  value={newClassroomNameByTeacher[teacher.id] ?? ""}
                  onChange={(event) =>
                    setNewClassroomNameByTeacher((prev) => ({
                      ...prev,
                      [teacher.id]: event.target.value,
                    }))
                  }
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-auto"
                disabled={isBusy}
                onClick={() => handleCreateClassroomForTeacher(teacher.id)}
              >
                + Crea aula
              </Button>
            </div>

            {classrooms.length > 0 && (
              <div className="flex flex-col gap-3 pl-3">
                {classrooms.map((classroom) => (
                  <div
                    key={classroom.id}
                    className="flex flex-col gap-2 rounded-xl border border-border-subtle p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium">
                        {classroom.name}{" "}
                        <span className="text-sm font-normal text-foreground-muted">
                          ({classroom.students.length})
                        </span>
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-auto text-xs text-danger"
                        disabled={isBusy}
                        onClick={() => handleDeleteClassroom(classroom.id)}
                      >
                        Elimina aula
                      </Button>
                    </div>
                    {classroom.students.length === 0 ? (
                      <p className="text-sm text-foreground-muted">Cap alumne en aquesta aula.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {classroom.students.map((student) => (
                          <UserActionRow
                            key={student.id}
                            user={student}
                            selectable
                            isSelected={selectedIds.has(student.id)}
                            onToggleSelect={() => toggle(student.id)}
                            onResetPassword={() => handleResetPassword(student.id, student.username)}
                            onToggleActive={() => handleToggleActive(student.id, student.isActive)}
                            disabled={isBusy}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Alumnat sense aula */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background-elevated p-5">
        <h2 className="text-lg font-semibold">
          Alumnat sense aula{" "}
          <span className="text-sm font-normal text-foreground-muted">
            ({overview.unassignedStudents.length})
          </span>
        </h2>
        {overview.unassignedStudents.length === 0 ? (
          <p className="text-sm text-foreground-muted">Tot l&apos;alumnat té aula assignada.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {overview.unassignedStudents.map((student) => (
              <UserActionRow
                key={student.id}
                user={student}
                selectable
                isSelected={selectedIds.has(student.id)}
                onToggleSelect={() => toggle(student.id)}
                onResetPassword={() => handleResetPassword(student.id, student.username)}
                onToggleActive={() => handleToggleActive(student.id, student.isActive)}
                disabled={isBusy}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Administradors: només lectura */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background-elevated p-5">
        <h2 className="text-lg font-semibold">Administradors</h2>
        <ul className="flex flex-col gap-2">
          {overview.admins.map((admin) => (
            <li key={admin.id} className="rounded-lg border border-border-subtle px-3 py-2 text-sm">
              {admin.displayName} <span className="text-foreground-muted">({admin.username})</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
