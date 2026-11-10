import { notFound } from "next/navigation";
import { Landing } from "@/components/public-site/Landing";
import { LandingReloadScript } from "@/components/public-site/LandingReloadScript";
import { PublicShell } from "@/components/public-site/PublicShell";
import { isLocale } from "@/components/public-site/copy";

export default async function LandingPage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      <LandingReloadScript />
      <noscript>
        <style>{'[data-landing-ready="false"] { opacity: 1 !important; }'}</style>
      </noscript>
      <PublicShell locale={lang}>
        <Landing />
      </PublicShell>
    </>
  );
}
