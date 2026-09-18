import Link from "next/link";
import { Compass } from "lucide-react";

// Pàgina 404 personalitzada, amb el mateix llenguatge visual que la
// resta de l'aplicació (en lloc de la pàgina d'error genèrica de Next.js).
export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="glow-accent left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Compass className="h-10 w-10 text-brand-primary" />
        <h1 className="heading-display text-4xl font-black text-foreground">404</h1>
        <p className="max-w-sm text-foreground-muted">
          T&apos;has perdut per camins encara no explorats. Aquesta pàgina no existeix.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-parchment-ink transition-colors hover:bg-brand-primary-hover"
        >
          Torna a l&apos;inici
        </Link>
      </div>
    </main>
  );
}
