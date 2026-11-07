import "server-only";
import { cookies } from "next/headers";
import { isLocale, type Locale } from "./copy";

export type PublicSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export async function getPublicLocale(
  searchParams: PublicSearchParams,
): Promise<Locale> {
  const params = await searchParams;
  if (isLocale(params.lang)) return params.lang;
  const saved = (await cookies()).get("physics-stars-public-language")?.value;
  return isLocale(saved) ? saved : "ca";
}
