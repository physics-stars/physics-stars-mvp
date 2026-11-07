import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/server/services/current-user";
import { getHomePathForRole } from "@/lib/config/roles";
import { PublicShell } from "@/components/public-site/PublicShell";
import { LoginView } from "@/components/public-site/LoginView";
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
  return {
    title: `${publicCopy[locale].login.meta} — Physics Stars`,
    description: publicCopy[locale].login.subtitle,
  };
}

export default async function LoginPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (user) redirect(getHomePathForRole(user.role));
  const locale = await getPublicLocale(searchParams);
  return (
    <Suspense>
      <PublicShell locale={locale} login>
        <LoginView />
      </PublicShell>
    </Suspense>
  );
}
