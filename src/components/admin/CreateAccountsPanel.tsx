"use client";

import { FormEvent, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { SectionCard } from "@/components/ui/SectionCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { useManagementAction } from "@/components/management/use-management-action";
import { postJson } from "@/lib/utils/api-client";
import { slugify } from "@/lib/utils/slugify";
import type { CredentialRow } from "@/lib/utils/credentials-file";
import type { ClassroomOption } from "@/server/services/admin-overview-service";
import type { BulkCreatedAccounts } from "@/server/services/user-management-service";

/*
 * Formulari per crear comptes: un de sol (a partir del nom) o diversos
 * alhora (a partir d'un prefix i una quantitat, amb número incremental).
 * En acabar retorna les credencials generades perquè es mostrin/
 * descarreguin, només aquesta vegada.
 */
export interface CreatedCredentials {
  title: string;
  rows: CredentialRow[];
  classroomName: string | null;
  fileLabel: string;
}

interface CreateAccountsPanelProps {
  classroomOptions: ClassroomOption[];
  onCreated: (credentials: CreatedCredentials) => void;
}

type Mode = "single" | "bulk";
type Role = "STUDENT" | "TEACHER";

const ROLE_LABEL: Record<Role, string> = { STUDENT: "alumnat", TEACHER: "professorat" };

export function CreateAccountsPanel({ classroomOptions, onCreated }: CreateAccountsPanelProps) {
  const { isBusy, notice, dismissNotice, run } = useManagementAction();

  const [mode, setMode] = useState<Mode>("bulk");
  const [role, setRole] = useState<Role>("STUDENT");
  const [displayName, setDisplayName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [count, setCount] = useState(10);
  const [classroomId, setClassroomId] = useState("");

  const bulkPreview = useMemo(() => {
    const cleanPrefix = prefix.trim();
    if (cleanPrefix.length < 2 || count < 1) return null;
    const base = slugify(cleanPrefix, ".") || "usuari";
    const last = Math.max(count, 1);
    return {
      firstName: `${cleanPrefix} 1`,
      lastName: `${cleanPrefix} ${last}`,
      firstUser: `${base}1`,
      lastUser: `${base}${last}`,
    };
  }, [prefix, count]);

  function reset() {
    setDisplayName("");
    setPrefix("");
    setClassroomId("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetClassroom = role === "STUDENT" && classroomId ? classroomId : null;

    if (mode === "single") {
      await run(
        () =>
          postJson<{ user: { username: string; displayName: string }; plainPassword: string }>(
            "/api/admin/users",
            { displayName, role, classroomId: targetClassroom },
          ),
        {
          onSuccess: (data) => {
            reset();
            onCreated({
              title: "Compte creat",
              rows: [
                {
                  displayName: data.user.displayName,
                  username: data.user.username,
                  password: data.plainPassword,
                },
              ],
              classroomName: classroomOptions.find((o) => o.id === targetClassroom)?.name ?? null,
              fileLabel: data.user.username,
            });
          },
        },
      );
      return;
    }

    await run(
      () =>
        postJson<BulkCreatedAccounts>("/api/admin/users/bulk", {
          role,
          prefix,
          count,
          classroomId: targetClassroom,
        }),
      {
        onSuccess: (data) => {
          reset();
          onCreated({
            title: `${data.accounts.length} comptes creats`,
            rows: data.accounts.map((account) => ({
              displayName: account.displayName,
              username: account.username,
              password: account.plainPassword,
            })),
            classroomName: data.classroomName,
            fileLabel: prefix,
          });
        },
      },
    );
  }

  return (
    <SectionCard
      id="crear"
      title="Crear comptes"
      description="Les contrasenyes es generen automàticament i es mostren una sola vegada."
      icon={<UserPlus className="h-5 w-5" />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControl
            label="Tipus de creació"
            value={mode}
            onChange={setMode}
            options={[
              { value: "bulk", label: "Diversos comptes" },
              { value: "single", label: "Un compte" },
            ]}
          />
          <SegmentedControl
            label="Rol"
            value={role}
            onChange={setRole}
            options={[
              { value: "STUDENT", label: "Alumnat" },
              { value: "TEACHER", label: "Professorat" },
            ]}
          />
        </div>

        {mode === "single" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="create-name"
              label="Nom i cognoms"
              placeholder="p. ex. Maria Garcia"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
            {role === "STUDENT" && (
              <ClassroomSelect
                id="create-classroom"
                value={classroomId}
                onChange={setClassroomId}
                options={classroomOptions}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
              <Input
                id="create-prefix"
                label="Prefix del nom"
                placeholder="p. ex. Alumne 4A"
                value={prefix}
                onChange={(event) => setPrefix(event.target.value)}
                required
              />
              <Input
                id="create-count"
                label="Quantitat"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                required
              />
            </div>
            {role === "STUDENT" && (
              <ClassroomSelect
                id="create-classroom-bulk"
                value={classroomId}
                onChange={setClassroomId}
                options={classroomOptions}
              />
            )}
            <div className="rounded-xl border border-dashed border-border-subtle bg-background/50 px-4 py-3 text-sm text-foreground-muted">
              {bulkPreview ? (
                <>
                  Es crearà {ROLE_LABEL[role]} des de{" "}
                  <strong className="text-foreground">{bulkPreview.firstName}</strong> fins a{" "}
                  <strong className="text-foreground">{bulkPreview.lastName}</strong> (usuaris{" "}
                  <code className="font-mono">{bulkPreview.firstUser}</code> …{" "}
                  <code className="font-mono">{bulkPreview.lastUser}</code>). Si ja n&apos;hi ha amb aquest
                  prefix, la numeració continua.
                </>
              ) : (
                "Escriu un prefix (p. ex. «Alumne 4A») i la quantitat: s'hi afegirà un número incremental."
              )}
            </div>
          </div>
        )}

        {notice && <Notice notice={notice} onDismiss={dismissNotice} />}

        <div>
          <Button type="submit" fullWidth={false} isLoading={isBusy}>
            {mode === "bulk" ? `Crea ${count || 0} comptes` : "Crea el compte"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function ClassroomSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: ClassroomOption[];
}) {
  return (
    <Select
      id={id}
      label="Aula (opcional)"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Sense aula</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name} — Prof. {option.teacherName}
        </option>
      ))}
    </Select>
  );
}
