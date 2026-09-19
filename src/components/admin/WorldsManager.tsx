"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Globe2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { SectionCard } from "@/components/ui/SectionCard";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { useManagementAction } from "@/components/management/use-management-action";
import { deleteJson, patchJson, postJson } from "@/lib/utils/api-client";
import { clsx } from "@/lib/utils/clsx";
import type { WorldWithLevels } from "@/server/repositories/world-repository";
import type { LevelInput, WorldInput } from "@/lib/validation/content";

/*
 * Gestor de mons i nivells de l'administració: crear, editar, eliminar,
 * reordenar i decidir si estan disponibles globalment. El professorat
 * només pot amagar-los per aula (a la seva pàgina de contingut).
 */
interface WorldsManagerProps {
  worlds: WorldWithLevels[];
}

type Level = WorldWithLevels["levels"][number];
type Difficulty = LevelInput["difficulty"];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  FACIL: "Fàcil",
  MITJA: "Mitjà",
  DIFICIL: "Difícil",
};

type Editor =
  | { kind: "world"; world: WorldWithLevels | null }
  | { kind: "level"; world: WorldWithLevels; level: Level | null };

type Pending = { title: string; description: string; onConfirm: () => void };

function worldToInput(world: WorldWithLevels, patch: Partial<WorldInput> = {}): WorldInput {
  return {
    name: world.name,
    tagline: world.tagline,
    shortDescription: world.shortDescription,
    description: world.description,
    objectives: world.objectives,
    isAvailable: world.isAvailable,
    ...patch,
  };
}

function levelToInput(level: Level, patch: Partial<LevelInput> = {}): LevelInput {
  return {
    title: level.title,
    description: level.description,
    difficulty: level.difficulty,
    isAvailable: level.isAvailable,
    ...patch,
  };
}

export function WorldsManager({ worlds }: WorldsManagerProps) {
  const { isBusy, notice, dismissNotice, run } = useManagementAction();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Pending | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const totalLevels = worlds.reduce((sum, w) => sum + w.levels.length, 0);
  const availableWorlds = worlds.filter((w) => w.isAvailable).length;

  useEffect(() => {
    if (editor) editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [editor]);

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirm(next: Pending) {
    setPending(next);
  }

  const moveWorld = (id: string, direction: "up" | "down") =>
    run(() => postJson(`/api/admin/worlds/${id}/move`, { direction }));
  const moveLevel = (id: string, direction: "up" | "down") =>
    run(() => postJson(`/api/admin/levels/${id}/move`, { direction }));

  const setWorldAvailable = (world: WorldWithLevels, isAvailable: boolean) =>
    run(() => patchJson(`/api/admin/worlds/${world.id}`, worldToInput(world, { isAvailable })));
  const setLevelAvailable = (level: Level, isAvailable: boolean) =>
    run(() => patchJson(`/api/admin/levels/${level.id}`, levelToInput(level, { isAvailable })));

  function deleteWorld(world: WorldWithLevels) {
    confirm({
      title: `Eliminar el món «${world.name}»?`,
      description: `S'eliminaran també els seus ${world.levels.length} nivells i la visibilitat configurada pel professorat. No es pot desfer.`,
      onConfirm: () =>
        run(() => deleteJson(`/api/admin/worlds/${world.id}`), {
          successMessage: `Món «${world.name}» eliminat.`,
        }),
    });
  }

  function deleteLevel(level: Level) {
    confirm({
      title: `Eliminar el nivell «${level.title}»?`,
      description: "Els nivells següents es renumeraran. No es pot desfer.",
      onConfirm: () =>
        run(() => deleteJson(`/api/admin/levels/${level.id}`), {
          successMessage: `Nivell «${level.title}» eliminat.`,
        }),
    });
  }

  async function saveWorld(current: WorldWithLevels | null, input: WorldInput) {
    return run(
      () =>
        current
          ? patchJson(`/api/admin/worlds/${current.id}`, input)
          : postJson("/api/admin/worlds", input),
      { successMessage: current ? "Món actualitzat." : `Món «${input.name}» creat.` },
    );
  }

  async function saveLevel(world: WorldWithLevels, current: Level | null, input: LevelInput) {
    return run(
      () =>
        current
          ? patchJson(`/api/admin/levels/${current.id}`, input)
          : postJson(`/api/admin/worlds/${world.id}/levels`, input),
      { successMessage: current ? "Nivell actualitzat." : `Nivell «${input.title}» creat.` },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Globe2 className="h-5 w-5" />} value={worlds.length} label="Mons" />
        <StatCard icon={<Globe2 className="h-5 w-5" />} value={availableWorlds} label="Disponibles" />
        <StatCard icon={<Globe2 className="h-5 w-5" />} value={totalLevels} label="Nivells" />
      </div>

      {notice && <Notice notice={notice} onDismiss={dismissNotice} />}

      {editor && (
        <div ref={editorRef}>
          {editor.kind === "world" ? (
            <WorldForm
              key={editor.world?.id ?? "new-world"}
              world={editor.world}
              isBusy={isBusy}
              onCancel={() => setEditor(null)}
              onSubmit={async (input) => {
                if (await saveWorld(editor.world, input)) setEditor(null);
              }}
            />
          ) : (
            <LevelForm
              key={editor.level?.id ?? `new-level-${editor.world.id}`}
              worldName={editor.world.name}
              level={editor.level}
              isBusy={isBusy}
              onCancel={() => setEditor(null)}
              onSubmit={async (input) => {
                if (await saveLevel(editor.world, editor.level, input)) setEditor(null);
              }}
            />
          )}
        </div>
      )}

      <SectionCard
        title="Mons i nivells"
        description="L'ordre d'aquesta llista és l'ordre del camí que veu l'alumnat."
        icon={<Globe2 className="h-5 w-5" />}
        actions={
          <Button type="button" size="sm" fullWidth={false} onClick={() => setEditor({ kind: "world", world: null })}>
            <Plus className="h-4 w-4" />
            Nou món
          </Button>
        }
      >
        {worlds.length === 0 ? (
          <EmptyState title="Encara no hi ha cap món" description="Crea el primer amb el botó «Nou món»." />
        ) : (
          <div className="flex flex-col gap-4">
            {worlds.map((world, worldIndex) => {
              const isOpen = !collapsed.has(world.id);
              return (
                <div
                  key={world.id}
                  className={clsx(
                    "overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated/60",
                    !world.isAvailable && "opacity-90",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-3 bg-background-elevated px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(world.id)}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? `Plega ${world.name}` : `Desplega ${world.name}`}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <ChevronDown
                        className={clsx("h-5 w-5 shrink-0 text-foreground-muted transition-transform", !isOpen && "-rotate-90")}
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wood text-sm font-bold text-parchment">
                        {worldIndex + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="heading-display truncate text-base font-bold text-foreground">
                            {world.name}
                          </span>
                          <Badge tone={world.isAvailable ? "success" : "neutral"}>
                            {world.isAvailable ? "Disponible" : "Properament"}
                          </Badge>
                        </span>
                        <span className="block truncate text-xs text-foreground-muted">
                          {world.tagline} · {world.levels.length} {world.levels.length === 1 ? "nivell" : "nivells"}
                        </span>
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Switch
                        checked={world.isAvailable}
                        onChange={(value) => setWorldAvailable(world, value)}
                        label={`Disponibilitat de ${world.name}`}
                        disabled={isBusy}
                      />
                      <MoveButtons
                        disabledUp={isBusy || worldIndex === 0}
                        disabledDown={isBusy || worldIndex === worlds.length - 1}
                        onUp={() => moveWorld(world.id, "up")}
                        onDown={() => moveWorld(world.id, "down")}
                        name={world.name}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        fullWidth={false}
                        disabled={isBusy}
                        onClick={() => setEditor({ kind: "world", world })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edita
                      </Button>
                      <Button
                        type="button"
                        variant="ghostDanger"
                        size="sm"
                        fullWidth={false}
                        disabled={isBusy}
                        onClick={() => deleteWorld(world)}
                        aria-label={`Elimina ${world.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="flex flex-col gap-2 border-t border-border-subtle p-4">
                      {world.levels.length === 0 ? (
                        <EmptyState title="Aquest món no té nivells" description="Afegeix-ne un amb el botó de sota." />
                      ) : (
                        <ol className="flex flex-col gap-2">
                          {world.levels.map((level, levelIndex) => (
                            <li
                              key={level.id}
                              className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-background/60 px-3 py-2.5"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wood/15 text-xs font-bold text-wood">
                                {level.levelNumber}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="truncate font-medium text-foreground">{level.title}</span>
                                  <Badge tone="accent">{DIFFICULTY_LABEL[level.difficulty]}</Badge>
                                  {!level.isAvailable && <Badge>Properament</Badge>}
                                </div>
                                <p className="line-clamp-1 text-xs text-foreground-muted">{level.description}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Switch
                                  checked={level.isAvailable}
                                  onChange={(value) => setLevelAvailable(level, value)}
                                  label={`Disponibilitat de ${level.title}`}
                                  disabled={isBusy}
                                />
                                <MoveButtons
                                  disabledUp={isBusy || levelIndex === 0}
                                  disabledDown={isBusy || levelIndex === world.levels.length - 1}
                                  onUp={() => moveLevel(level.id, "up")}
                                  onDown={() => moveLevel(level.id, "down")}
                                  name={level.title}
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  fullWidth={false}
                                  disabled={isBusy}
                                  onClick={() => setEditor({ kind: "level", world, level })}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edita
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghostDanger"
                                  size="sm"
                                  fullWidth={false}
                                  disabled={isBusy}
                                  onClick={() => deleteLevel(level)}
                                  aria-label={`Elimina ${level.title}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                      <div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          fullWidth={false}
                          onClick={() => setEditor({ kind: "level", world, level: null })}
                        >
                          <Plus className="h-4 w-4" />
                          Afegeix un nivell
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel="Elimina"
        onConfirm={() => {
          const action = pending?.onConfirm;
          setPending(null);
          action?.();
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function MoveButtons({
  disabledUp,
  disabledDown,
  onUp,
  onDown,
  name,
}: {
  disabledUp: boolean;
  disabledDown: boolean;
  onUp: () => void;
  onDown: () => void;
  name: string;
}) {
  return (
    <span className="inline-flex">
      <Button type="button" variant="ghost" size="sm" fullWidth={false} disabled={disabledUp} onClick={onUp} aria-label={`Puja ${name}`}>
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="sm" fullWidth={false} disabled={disabledDown} onClick={onDown} aria-label={`Baixa ${name}`}>
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
    </span>
  );
}

function WorldForm({
  world,
  isBusy,
  onSubmit,
  onCancel,
}: {
  world: WorldWithLevels | null;
  isBusy: boolean;
  onSubmit: (input: WorldInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(world?.name ?? "");
  const [tagline, setTagline] = useState(world?.tagline ?? "");
  const [shortDescription, setShortDescription] = useState(world?.shortDescription ?? "");
  const [description, setDescription] = useState(world?.description ?? "");
  const [objectives, setObjectives] = useState((world?.objectives ?? []).join("\n"));
  const [isAvailable, setIsAvailable] = useState(world?.isAvailable ?? false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      name,
      tagline,
      shortDescription,
      description,
      objectives: objectives.split("\n").map((line) => line.trim()).filter(Boolean),
      isAvailable,
    });
  }

  return (
    <SectionCard
      title={world ? `Edita el món «${world.name}»` : "Nou món"}
      icon={<Globe2 className="h-5 w-5" />}
      className="border-brand-primary"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="world-name" label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input id="world-tagline" label="Etiqueta curta" value={tagline} onChange={(e) => setTagline(e.target.value)} required />
        </div>
        <Input
          id="world-short"
          label="Descripció curta (targeta)"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          required
        />
        <Textarea id="world-desc" label="Descripció" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
        <Textarea
          id="world-objectives"
          label="Objectius"
          hint="Un objectiu per línia (màxim 10)."
          rows={4}
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
        />
        <label className="flex items-center gap-3 text-sm text-foreground">
          <Switch checked={isAvailable} onChange={setIsAvailable} label="Món disponible" />
          Disponible per a l&apos;alumnat
        </label>
        <div className="flex gap-2">
          <Button type="submit" fullWidth={false} isLoading={isBusy}>
            {world ? "Desa els canvis" : "Crea el món"}
          </Button>
          <Button type="button" variant="ghost" fullWidth={false} onClick={onCancel}>
            Cancel·la
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function LevelForm({
  worldName,
  level,
  isBusy,
  onSubmit,
  onCancel,
}: {
  worldName: string;
  level: Level | null;
  isBusy: boolean;
  onSubmit: (input: LevelInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(level?.title ?? "");
  const [description, setDescription] = useState(level?.description ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(level?.difficulty ?? "FACIL");
  const [isAvailable, setIsAvailable] = useState(level?.isAvailable ?? false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ title, description, difficulty, isAvailable });
  }

  return (
    <SectionCard
      title={level ? `Edita el nivell «${level.title}»` : `Nou nivell a «${worldName}»`}
      icon={<Globe2 className="h-5 w-5" />}
      className="border-brand-primary"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Input id="level-title" label="Títol" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Select id="level-difficulty" label="Dificultat" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((key) => (
              <option key={key} value={key}>
                {DIFFICULTY_LABEL[key]}
              </option>
            ))}
          </Select>
        </div>
        <Textarea id="level-desc" label="Descripció" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
        <label className="flex items-center gap-3 text-sm text-foreground">
          <Switch checked={isAvailable} onChange={setIsAvailable} label="Nivell disponible" />
          Disponible per a l&apos;alumnat
        </label>
        <div className="flex gap-2">
          <Button type="submit" fullWidth={false} isLoading={isBusy}>
            {level ? "Desa els canvis" : "Crea el nivell"}
          </Button>
          <Button type="button" variant="ghost" fullWidth={false} onClick={onCancel}>
            Cancel·la
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
