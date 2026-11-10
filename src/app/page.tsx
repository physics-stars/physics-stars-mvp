import { redirect } from "next/navigation";
import {
  getPublicLocale,
  type PublicSearchParams,
} from "@/components/public-site/locale.server";

// La landing viu a /ca, /es i /en. L'arrel respecta l'idioma desat
// (o l'antic `?lang=`) i, si no n'hi ha cap, porta a /ca.
export default async function RootPage({
  searchParams,
}: {
  searchParams: PublicSearchParams;
}) {
  redirect(`/${await getPublicLocale(searchParams)}`);
}
