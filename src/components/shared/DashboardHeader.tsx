import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

/*
 * Capçalera senzilla compartida pels panells de professorat i
 * d'administració: nom de l'app, nom de qui ha entrat i botó de
 * tancar sessió. Purament visual (l'autorització real ja s'ha fet a
 * la pàgina abans de renderitzar aquest component). Mateixa franja de
 * fusta que la barra de navegació de la landing, per coherència visual
 * a tota l'aplicació.
 */
interface DashboardHeaderProps {
  displayName: string;
  homeHref: string;
}

export function DashboardHeader({ displayName, homeHref }: DashboardHeaderProps) {
  return (
    <header className="band-wood flex flex-wrap items-center justify-between gap-4 px-6 py-3.5">
      <Link href={homeHref} className="flex items-center gap-2.5">
        <Image src="/logo.svg" alt="" width={26} height={26} />
        <span className="heading-display text-lg font-bold tracking-wide text-parchment">
          Physics Stars
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-parchment/70">
          {displayName}
        </span>
        <div className="w-40">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
