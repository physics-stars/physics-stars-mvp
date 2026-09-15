"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/*
 * Formulari de login. Envia el nom d'usuari i la contrasenya a
 * `/api/auth/login`: tota la lògica d'autenticació (comprovar
 * credencials, crear la sessió...) viu al backend, aquí només es
 * gestiona l'estat de la interfície (càrrega, errors) i la redirecció
 * un cop la sessió s'ha creat correctament.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data.error ?? "Hi ha hagut un error. Torna-ho a provar.");
        return;
      }

      const redirectTo = searchParams.get("redirectTo") ?? "/menu";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setErrorMessage("No s'ha pogut contactar amb el servidor. Comprova la connexió.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      <Input
        id="username"
        name="username"
        label="Nom d'usuari"
        type="text"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="p. ex. maria.garcia"
        required
      />
      <Input
        id="password"
        name="password"
        label="Contrasenya"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="••••••••"
        required
      />

      <Button type="submit" isLoading={isSubmitting}>
        Inicia sessió
      </Button>

      {errorMessage && (
        <p role="alert" className="text-center text-sm text-danger">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
