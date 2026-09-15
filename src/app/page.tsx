import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Pàgina d'aterratge (landing) del joc "Physics Stars".
// Presenta breument el projecte i dona accés a l'inici de sessió.
export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        <span className="rounded-full border border-border-subtle bg-background-elevated px-3 py-1 text-xs font-medium text-foreground-muted">
          Un joc per aprendre física a 4rt d&apos;ESO
        </span>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Physics<span className="text-brand-accent">Stars</span>
        </h1>

        <p className="max-w-md text-base text-foreground-muted">
          Viu una aventura interactiva a través de l&apos;espai i resol reptes
          de física per avançar en la història. Aprèn jugant, a classe o des
          de casa.
        </p>

        <div className="mt-2 w-full max-w-xs">
          <Link href="/login">
            <Button type="button">Inicia sessió</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
