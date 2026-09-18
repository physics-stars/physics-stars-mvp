import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/server/services/current-user";
import { getHomePathForRole } from "@/lib/config/roles";

// Pàgina d'inici de sessió. Mostra el formulari dins un panell de
// pergamí centrat, amb un enllaç de tornada a la pàgina d'inici.
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
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow-accent left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="" width={36} height={36} />
            <span className="heading-display text-2xl font-bold tracking-wide text-foreground">
              Physics Stars
            </span>
          </Link>
          <p className="text-sm text-foreground-muted">
            Inicia sessió per continuar la teva aventura per la física.
          </p>
        </div>

        <div className="panel-parchment p-6 sm:p-8">
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
