import type { Metadata } from "next";
import { Suspense } from "react";
import { Landing } from "@/components/public-site/Landing";
import { PublicShell } from "@/components/public-site/PublicShell";
import {
  getPublicLocale,
  type PublicSearchParams,
} from "@/components/public-site/locale.server";
import { publicCopy } from "@/components/public-site/copy";

type Props = { searchParams: PublicSearchParams };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const locale = await getPublicLocale(searchParams);
  return { title: "Physics Stars", description: publicCopy[locale].meta };
}

export default async function LandingPage({ searchParams }: Props) {
  const locale = await getPublicLocale(searchParams);
  return (
    <Suspense>
      <PublicShell locale={locale}>
        <Landing />
      </PublicShell>
    </Suspense>
  );
}
