"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle2, GraduationCap, KeyRound, Search, ShieldCheck, UserX, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { CredentialsPanel } from "@/components/management/CredentialsPanel";
import { PersonRow } from "@/components/management/PersonRow";
import { SelectionBar } from "@/components/management/SelectionBar";
import { useManagementAction } from "@/components/management/use-management-action";
import { useStudentSelection } from "@/components/shared/use-student-selection";
import { CreateAccountsPanel, type CreatedCredentials } from "@/components/admin/CreateAccountsPanel";
import { TeacherCard, type VisibleClassroom } from "@/components/admin/TeacherCard";
import { deleteJson, patchJson, postJson } from "@/lib/utils/api-client";
import type { ClassroomView } from "@/server/repositories/classroom-repository";
import type { ManagedUserView } from "@/server/repositories/user-repository";
import type { GlobalOverview } from "@/server/services/admin-overview-service";

/*
 * Vista global d'administració. Estructura, de dalt a baix:
 *  1. Resum (xifres clau)
 *  2. Crear comptes (un o diversos alhora)
 *  3. Professorat → aules → alumnat (amb cerca)
 *  4. Alumnat sense aula
 *  5. Administradors (només lectura)
 * Les accions destructives demanen confirmació i les credencials
 * generades es mostren una sola vegada (amb descàrrega en .txt).
 */
interface GlobalUserManagerProps {
  overview: GlobalOverview;
}

interface PendingConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export function GlobalUserManager({ overview }: GlobalUserManagerProps) {
  const { isBusy, notice, dismissNotice, run } = useManagementAction();
  const { selectedIds, toggle, setMany, clear } = useStudentSelection();

  const [query, setQuery] = useState("");
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);
  const [moveTarget, setMoveTarget] = useState("");

  const q = query.trim().toLowerCase();
  const matches = (user: ManagedUserView) =>
    !q || user.displayName.toLowerCase().includes(q) || user.username.toLowerCase().includes(q);

  const totalClassrooms = overview.teachers.reduce((sum, t) => sum + t.classrooms.length, 0);
  const studentsInClassrooms = overview.teachers.reduce(
    (sum, t) => sum + t.classrooms.reduce((inner, c) => inner + c.students.length, 0),
    0,
  );

  // Jerarquia visible un cop aplicada la cerca: professor → aules → alumnat.
  const visibleTeachers = useMemo(() => {
    return overview.teachers
      .map(({ teacher, classrooms }) => {
        const teacherMatches = matches(teacher);
        const visibleClassrooms: VisibleClassroom[] = classrooms
          .map((classroom) => {
            const classroomMatches = classroom.name.toLowerCase().includes(q);
            const students =
              !q || teacherMatches || classroomMatches
                ? classroom.students
                : classroom.students.filter(matches);
            return { classroom, students };
          })
          .filter(({ classroom, students }) => !q || teacherMatches || students.length > 0 || classroom.name.toLowerCase().includes(q));

        const total = classrooms.reduce((sum, c) => sum + c.students.length, 0);
        return { teacher, visibleClassrooms, total, show: !q || teacherMatches || visibleClassrooms.length > 0 };
      })
      .filter((entry) => entry.show);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview.teachers, q]);

  const visibleUnassigned = overview.unassignedStudents.filter(matches);

  const moveOptions = overview.allClassroomOptions.map((option) => ({
    value: option.id,
    label: `${option.name} — Prof. ${option.teacherName}`,
  }));

  // --- Accions ---

  function askConfirmation(pending: PendingConfirmation) {
    setConfirmation(pending);
  }

  function resetPassword(user: ManagedUserView) {
    askConfirmation({
      title: `Reiniciar la contrasenya de ${user.displayName}?`,
      description:
        "Se'n generarà una de nova i la contrasenya actual deixarà de funcionar. Es tancaran les seves sessions obertes.",
      confirmLabel: "Reinicia",
      onConfirm: async () => {
        setConfirmation(null);
        await run(() => postJson<{ plainPassword: string }>(`/api/admin/users/${user.id}/reset-password`), {
          refresh: false,
          onSuccess: (data) =>
            setCredentials({
              title: "Contrasenya reiniciada",
              rows: [{ displayName: user.displayName, username: user.username, password: data.plainPassword }],
              classroomName: null,
              fileLabel: user.username,
            }),
        });
      },
    });
  }

  function toggleActive(user: ManagedUserView) {
    void run(() => patchJson(`/api/admin/users/${user.id}/status`, { isActive: !user.isActive }), {
      successMessage: user.isActive
        ? `${user.displayName} ja no pot iniciar sessió.`
        : `${user.displayName} torna a poder iniciar sessió.`,
    });
  }

  function deleteClassroom(classroom: ClassroomView) {
    askConfirmation({
      title: `Eliminar l'aula «${classroom.name}»?`,
      description:
        classroom.students.length > 0
          ? `Els ${classroom.students.length} alumnes que hi ha quedaran «sense aula». Els comptes no s'esborren.`
          : "L'aula està buida. Aquesta acció no es pot desfer.",
      confirmLabel: "Elimina l'aula",
      onConfirm: async () => {
        setConfirmation(null);
        await run(() => deleteJson(`/api/admin/classrooms/${classroom.id}`), {
          successMessage: `Aula «${classroom.name}» eliminada.`,
        });
      },
    });
  }

  async function createClassroom(teacherId: string, name: string): Promise<boolean> {
    return run(() => postJson("/api/admin/classrooms", { teacherId, name: name.trim() }), {
      successMessage: `Aula «${name.trim()}» creada.`,
    });
  }

  async function moveSelected() {
    const count = selectedIds.size;
    const ok = await run(
      () =>
        postJson("/api/admin/students/move", {
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

  function renderPersonActions(user: ManagedUserView) {
    return (
      <>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={false}
          disabled={isBusy}
          onClick={() => resetPassword(user)}
          title="Genera una contrasenya nova"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Contrasenya
        </Button>
        <Button
          type="button"
          variant={user.isActive ? "ghostDanger" : "ghost"}
          size="sm"
          fullWidth={false}
          disabled={isBusy}
          onClick={() => toggleActive(user)}
          title={user.isActive ? "Impedeix que iniciï sessió" : "Permet que torni a iniciar sessió"}
        >
          {user.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {user.isActive ? "Desactiva" : "Activa"}
        </Button>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} value={overview.teachers.length} label="Professorat" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} value={totalClassrooms} label="Aules" />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          value={studentsInClassrooms + overview.unassignedStudents.length}
          label="Alumnat"
        />
        <StatCard icon={<UserX className="h-5 w-5" />} value={overview.unassignedStudents.length} label="Sense aula" />
      </div>

      {notice && <Notice notice={notice} onDismiss={dismissNotice} />}

      {credentials && (
        <CredentialsPanel
          title={credentials.title}
          rows={credentials.rows}
          classroomName={credentials.classroomName}
          fileLabel={credentials.fileLabel}
          onClose={() => setCredentials(null)}
        />
      )}

      <CreateAccountsPanel classroomOptions={overview.allClassroomOptions} onCreated={setCredentials} />

      <SectionCard
        id="professorat"
        title="Professorat i aules"
        description="Cada professor amb les seves aules i el seu alumnat. Selecciona alumnes per moure'ls."
        icon={<GraduationCap className="h-5 w-5" />}
        actions={
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca per nom, usuari o aula…"
              aria-label="Cerca persones i aules"
              className="w-64 max-w-full rounded-lg border border-border-subtle bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>
        }
      >
        {visibleTeachers.length === 0 ? (
          <EmptyState
            title={q ? "Cap resultat" : "Encara no hi ha professorat"}
            description={q ? "Prova amb un altre nom, usuari o aula." : "Crea el primer professor amb el formulari de dalt."}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {visibleTeachers.map(({ teacher, visibleClassrooms, total }) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                classrooms={visibleClassrooms}
                totalStudents={total}
                forceOpen={Boolean(q)}
                isBusy={isBusy}
                selectedIds={selectedIds}
                onToggleStudent={toggle}
                onSetMany={setMany}
                renderPersonActions={renderPersonActions}
                onCreateClassroom={createClassroom}
                onDeleteClassroom={deleteClassroom}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        id="sense-aula"
        title="Alumnat sense aula"
        description="Alumnes que encara no són a cap aula. Selecciona'ls per assignar-los-en una."
        icon={<UserX className="h-5 w-5" />}
        actions={<Badge tone={overview.unassignedStudents.length > 0 ? "accent" : "neutral"}>{overview.unassignedStudents.length}</Badge>}
      >
        {visibleUnassigned.length === 0 ? (
          <EmptyState
            title={q ? "Cap resultat" : "Tot l'alumnat té aula"}
            description={q ? undefined : "Quan creïs comptes sense aula, apareixeran aquí."}
          />
        ) : (
          <>
            <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-foreground-muted">
              <input
                type="checkbox"
                checked={visibleUnassigned.every((s) => selectedIds.has(s.id))}
                onChange={(event) => setMany(visibleUnassigned.map((s) => s.id), event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--wood)]"
              />
              Selecciona tot
            </label>
            <ul className="flex flex-col gap-2">
              {visibleUnassigned.map((student) => (
                <PersonRow
                  key={student.id}
                  user={student}
                  selectable
                  selected={selectedIds.has(student.id)}
                  onToggleSelect={() => toggle(student.id)}
                  actions={renderPersonActions(student)}
                />
              ))}
            </ul>
          </>
        )}
      </SectionCard>

      <SectionCard
        id="administradors"
        title="Administradors"
        description="Només lectura: els comptes d'administració no es gestionen des d'aquí."
        icon={<ShieldCheck className="h-5 w-5" />}
      >
        <ul className="flex flex-col gap-2">
          {overview.admins.map((admin) => (
            <PersonRow key={admin.id} user={admin} />
          ))}
        </ul>
      </SectionCard>

      {/* Espai perquè la barra flotant no tapi l'últim contingut. */}
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
        open={confirmation !== null}
        title={confirmation?.title ?? ""}
        description={confirmation?.description ?? ""}
        confirmLabel={confirmation?.confirmLabel}
        onConfirm={() => confirmation?.onConfirm()}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
}
