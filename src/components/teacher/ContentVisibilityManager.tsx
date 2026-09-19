"use client";

import { useState } from "react";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { SectionCard } from "@/components/ui/SectionCard";
import { Switch } from "@/components/ui/Switch";
import { useManagementAction } from "@/components/management/use-management-action";
import { patchJson } from "@/lib/utils/api-client";
import { clsx } from "@/lib/utils/clsx";
import type { TeacherContentOverview } from "@/server/services/content-visibility-service";

/*
 * El professorat tria una aula i decideix quins mons i nivells veu el
 * seu alumnat. No pot crear ni editar contingut (això és de
 * l'administració): només mostrar-lo o amagar-lo. El que l'administració
 * ha marcat com a «Properament» no es pot activar des d'aquí.
 */
interface ContentVisibilityManagerProps {
  overview: TeacherContentOverview;
}

export function ContentVisibilityManager({ overview }: ContentVisibilityManagerProps) {
  const { isBusy, notice, dismissNotice, run } = useManagementAction();
  const [selectedId, setSelectedId] = useState(overview.classrooms[0]?.id ?? "");

  if (overview.classrooms.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-6 w-6" />}
        title="Primer necessites una aula"
        description="Crea una aula a la secció «Aules» per poder decidir què hi pot veure l'alumnat."
      />
    );
  }

  const classroom = overview.classrooms.find((c) => c.id === selectedId) ?? overview.classrooms[0];
  const hiddenWorlds = new Set(overview.hidden[classroom.id]?.worldIds ?? []);
  const hiddenLevels = new Set(overview.hidden[classroom.id]?.levelIds ?? []);

  function setVisible(kind: "world" | "level", targetId: string, visible: boolean) {
    return run(() =>
      patchJson(`/api/teacher/classrooms/${classroom.id}/visibility`, { kind, targetId, visible }),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Aula"
        description="Tria l'aula a la qual vols aplicar els canvis."
        icon={<GraduationCap className="h-5 w-5" />}
      >
        <div role="tablist" aria-label="Aules" className="flex flex-wrap gap-2">
          {overview.classrooms.map((item) => {
            const active = item.id === classroom.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedId(item.id)}
                className={clsx(
                  "rounded-xl border px-4 py-2 text-left text-sm transition-colors",
                  active
                    ? "border-wood bg-wood text-parchment"
                    : "border-border-subtle bg-background/60 text-foreground hover:border-brand-primary",
                )}
              >
                <span className="block font-semibold">{item.name}</span>
                <span className={clsx("block text-xs", active ? "text-parchment/80" : "text-foreground-muted")}>
                  {item.studentCount} {item.studentCount === 1 ? "alumne" : "alumnes"}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {notice && <Notice notice={notice} onDismiss={dismissNotice} />}

      <SectionCard
        title={`Contingut visible per a «${classroom.name}»`}
        description="Desactiva un món o un nivell per amagar-lo a l'alumnat d'aquesta aula."
        icon={<Eye className="h-5 w-5" />}
      >
        {overview.worlds.length === 0 ? (
          <EmptyState title="Encara no hi ha mons" description="L'administració encara no n'ha creat cap." />
        ) : (
          <div className="flex flex-col gap-4">
            {overview.worlds.map((world) => {
              const worldHidden = hiddenWorlds.has(world.id);
              return (
                <div
                  key={world.id}
                  className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated/60"
                >
                  <div className="flex flex-wrap items-center gap-3 bg-background-elevated px-4 py-3">
                    <span
                      className={clsx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        worldHidden || !world.isAvailable ? "bg-foreground/10 text-foreground-muted" : "bg-wood text-parchment",
                      )}
                    >
                      {worldHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="heading-display truncate text-base font-bold text-foreground">{world.name}</span>
                        {!world.isAvailable && <Badge>Properament (admin)</Badge>}
                        {world.isAvailable && worldHidden && <Badge tone="danger">Amagat</Badge>}
                      </div>
                      <span className="text-xs text-foreground-muted">{world.tagline}</span>
                    </div>
                    <Switch
                      checked={!worldHidden}
                      onChange={(value) => setVisible("world", world.id, value)}
                      label={`Mostra ${world.name} a ${classroom.name}`}
                      disabled={isBusy || !world.isAvailable}
                    />
                  </div>

                  {world.levels.length > 0 && (
                    <ul className="flex flex-col gap-2 border-t border-border-subtle p-3">
                      {world.levels.map((level) => {
                        const levelHidden = hiddenLevels.has(level.id);
                        return (
                          <li
                            key={level.id}
                            className={clsx(
                              "flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-background/60 px-3 py-2",
                              (worldHidden || !world.isAvailable) && "opacity-60",
                            )}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wood/15 text-xs font-bold text-wood">
                              {level.levelNumber}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                              {level.title}
                            </span>
                            {!level.isAvailable && <Badge>Properament (admin)</Badge>}
                            {level.isAvailable && levelHidden && <Badge tone="danger">Amagat</Badge>}
                            <Switch
                              checked={!levelHidden}
                              onChange={(value) => setVisible("level", level.id, value)}
                              label={`Mostra ${level.title} a ${classroom.name}`}
                              disabled={isBusy || !level.isAvailable}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
