import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/server/services/route-guards";
import { getCurrentUser } from "@/server/services/current-user";
import { getWorldForStudent } from "@/server/services/content-visibility-service";
import { LevelExplorer } from "@/components/menu/LevelExplorer";

/*
 * Menú de nivells d'un món concret. Un sol query recupera el món i els
 * seus nivells ja ordenats (vegeu `findWorldBySlugWithLevels`), així que
 * mai es poden mostrar nivells d'un altre món per error.
 */
export async function generateMetadata({
  params,
}: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const user = await getCurrentUser();
  const world = user ? await getWorldForStudent(user.id, slug) : null;
  return { title: world ? `${world.name} — Physics Stars` : "Món no trobat — Physics Stars" };
}

export default async function LevelMenuPage({ params }: PageProps<"/menu/[slug]">) {
  const user = await requireRole("STUDENT");
  const { slug } = await params;
  const world = await getWorldForStudent(user.id, slug);

  if (!world) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-12 sm:px-8">
      <div>
        <h1 className="heading-display text-2xl font-bold text-foreground sm:text-3xl">
          {world.name}
        </h1>
        <p className="text-sm text-foreground-muted">{world.tagline}</p>
      </div>

      {world.levels.length > 0 ? (
        <LevelExplorer worldName={world.name} levels={world.levels} />
      ) : (
        <div className="panel-glass p-8 text-center text-foreground-muted">
          Encara no hi ha nivells publicats en aquest món. Torna aviat!
        </div>
      )}
    </main>
  );
}
