import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/server/services/current-user";
import { getHomePathForRole } from "@/lib/config/roles";

// Pàgina d'inici de sessió. Mostra el formulari dins una targeta centrada,
// amb un enllaç de tornada a la pàgina d'inici.
export const metadata: Metadata = {
  title: "Inicia sessió — Physics Stars",
};

export default async function LoginPage() {
  // Si ja hi ha una sessió vàlida, aquesta pàgina no s'ha de poder veure:
  // es redirigeix directament a la pàgina d'inici del seu rol.
  const user = await getCurrentUser();
  if (user) {
    redirect(getHomePathForRole(user.role));
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-foreground">
            Physics<span className="text-brand-accent">Stars</span>
          </Link>
          <p className="text-sm text-foreground-muted">
            Inicia sessió per continuar la teva aventura per la física.
          </p>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-background-elevated p-6 shadow-lg shadow-black/20">
          {/* Suspense obligatori: LoginForm usa useSearchParams (redirectTo). */}
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-foreground-muted">
          Ets docent i necessites un compte per al teu alumnat?{" "}
          <span className="text-foreground">Contacta amb el centre educatiu.</span>
        </p>
      </div>
    </main>
  );
}
