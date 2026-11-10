import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-site/PublicShell";
import { ComingSoon } from "@/components/public-site/ComingSoon";
import { isLocale, publicCopy } from "@/components/public-site/copy";
import { appAccessEnabled } from "@/lib/config/site";

// El proxy reescriu aquí qualsevol ruta que no sigui la landing mentre
// l'accés està tancat. Amb l'accés obert, aquesta pàgina no existeix.
export async function generateMetadata({
  params,
}: PageProps<"/[lang]/coming-soon">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return {
    title: publicCopy[lang].soon.meta,
    robots: { index: false, follow: false },
  };
}

export default async function ComingSoonPage({
  params,
}: PageProps<"/[lang]/coming-soon">) {
  const { lang } = await params;
  if (appAccessEnabled || !isLocale(lang)) notFound();
  return (
    <PublicShell locale={lang} navigation={false}>
      <ComingSoon />
    </PublicShell>
  );
}
